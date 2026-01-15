from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone
import asyncio
import uuid

from models import AutoRunSummary, DatasetRunResult, PlannerCandidate


@dataclass
class QueryJob:
    query_id: str
    created_at: datetime
    queue: asyncio.Queue[dict]
    planned: list[PlannerCandidate] = field(default_factory=list)
    results: list[DatasetRunResult] = field(default_factory=list)
    summary: AutoRunSummary | None = None
    done: bool = False


class JobStore:
    def __init__(self) -> None:
        self._jobs: dict[str, QueryJob] = {}

    def create_job(self) -> QueryJob:
        query_id = uuid.uuid4().hex
        job = QueryJob(
            query_id=query_id,
            created_at=datetime.now(timezone.utc),
            queue=asyncio.Queue(maxsize=500),
        )
        self._jobs[query_id] = job
        return job

    def get_job(self, query_id: str) -> QueryJob | None:
        return self._jobs.get(query_id)
