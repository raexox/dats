from __future__ import annotations

import asyncio
from dataclasses import dataclass
from datetime import date, datetime
import time

from catalog.store import CatalogStore
from models import AutoRunSummary, DatasetQueryParams, DatasetRunResult, PlannerCandidate, UserQuery
from planner.planner import DatasetPlanner
from providers.registry import ProviderRegistry


@dataclass(frozen=True)
class StreamConfig:
    k: int
    concurrency: int
    timeout_ms: int


async def run_streaming(
    query: UserQuery,
    config: StreamConfig,
    store: CatalogStore,
    registry: ProviderRegistry,
    on_planned,
    on_result,
    on_done,
) -> None:
    started = time.perf_counter()
    planner = DatasetPlanner(store.entries)
    planned = planner.plan(query, config.k)
    on_planned(planned)

    params = _query_to_params(query)
    semaphore = asyncio.Semaphore(config.concurrency)
    tasks = [
        asyncio.create_task(
            _run_candidate(candidate, params, registry, semaphore, config.timeout_ms, on_result)
        )
        for candidate in planned
    ]
    results = await asyncio.gather(*tasks)
    summary = _build_summary(results, _elapsed_ms(started))
    on_done(summary)


async def _run_candidate(
    candidate: PlannerCandidate,
    params: DatasetQueryParams,
    registry: ProviderRegistry,
    semaphore: asyncio.Semaphore,
    timeout_ms: int,
    on_result,
) -> DatasetRunResult:
    async with semaphore:
        started = time.perf_counter()
        try:
            provider = registry.get_provider(candidate.dataset_id)
            if not provider:
                return _error_result(candidate.dataset_id, started, "No provider available.")
            result = await asyncio.wait_for(
                asyncio.to_thread(provider.fetch, candidate.dataset_id, params),
                timeout=timeout_ms / 1000,
            )
            status = "no_data" if result.no_data else "success"
            result_payload = DatasetRunResult(
                dataset_id=candidate.dataset_id,
                status=status,
                row_count=result.row_count,
                preview=result.rows_preview[:50],
                metadata=result.metadata,
                timing_ms=_elapsed_ms(started),
            )
            on_result(result_payload)
            return result_payload
        except asyncio.TimeoutError:
            error_payload = _error_result(candidate.dataset_id, started, "Timeout.")
            on_result(error_payload)
            return error_payload
        except Exception as exc:
            error_payload = _error_result(candidate.dataset_id, started, str(exc))
            on_result(error_payload)
            return error_payload


def _query_to_params(query: UserQuery) -> DatasetQueryParams:
    return DatasetQueryParams(
        geo_level=query.geo_level,
        metric=query.metric_hint,
        start_date=_date_to_datetime(query.start_date),
        end_date=_date_to_datetime(query.end_date),
    )


def _date_to_datetime(value: date):
    return datetime.combine(value, datetime.min.time())


def _error_result(dataset_id: str, started: float, reason: str) -> DatasetRunResult:
    return DatasetRunResult(
        dataset_id=dataset_id,
        status="error",
        row_count=0,
        preview=[],
        metadata={},
        timing_ms=_elapsed_ms(started),
        error_reason=reason,
    )


def _elapsed_ms(started: float) -> float:
    return (time.perf_counter() - started) * 1000


def _build_summary(results: list[DatasetRunResult], total_runtime_ms: float) -> AutoRunSummary:
    success = sum(1 for result in results if result.status == "success")
    no_data = sum(1 for result in results if result.status == "no_data")
    error = sum(1 for result in results if result.status == "error")
    return AutoRunSummary(
        success=success,
        no_data=no_data,
        error=error,
        total_runtime_ms=total_runtime_ms,
    )
