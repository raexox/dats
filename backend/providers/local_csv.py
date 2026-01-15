from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
import csv

from models import DatasetQueryParams, DatasetResult


@dataclass(frozen=True)
class LocalCsvProvider:
    data_dir: Path

    def supports(self, dataset_id: str) -> bool:
        return dataset_id.startswith("local:csv/") or self._dataset_path(dataset_id).exists()

    def fetch(self, dataset_id: str, params: DatasetQueryParams | None) -> DatasetResult:
        params = params or DatasetQueryParams()
        csv_path = self._dataset_path(dataset_id)
        if not csv_path.exists():
            return DatasetResult(
                dataset_id=dataset_id,
                row_count=0,
                rows_preview=[],
                metadata={"provider": "local_csv", "path": str(csv_path)},
                no_data=True,
            )

        rows: list[dict] = []
        with csv_path.open("r", encoding="utf-8") as handle:
            reader = csv.DictReader(handle)
            for row in reader:
                if not _row_matches(row, params):
                    continue
                rows.append(_normalize_row(row))

        preview = rows[:50]
        return DatasetResult(
            dataset_id=dataset_id,
            row_count=len(rows),
            rows_preview=preview,
            metadata={
                "provider": "local_csv",
                "path": str(csv_path),
                "applied_filters": _filters_metadata(params),
            },
            no_data=len(rows) == 0,
        )

    def _dataset_path(self, dataset_id: str) -> Path:
        normalized = dataset_id.replace("\\", "/")
        if normalized.startswith("local:csv/"):
            normalized = normalized[len("local:csv/") :]
        if normalized.lower().endswith(".csv"):
            normalized = normalized[:-4]
        return self.data_dir / f"{normalized}.csv"


def _row_matches(row: dict, params: DatasetQueryParams) -> bool:
    if params.geo_level and row.get("geo_level") != params.geo_level:
        return False
    if params.geo_id and row.get("geo_id") != params.geo_id:
        return False
    if params.metric and row.get("metric") != params.metric:
        return False
    if params.start_date or params.end_date:
        raw_date = row.get("date")
        if not raw_date:
            return False
        row_date = datetime.fromisoformat(raw_date)
        if params.start_date and row_date < params.start_date:
            return False
        if params.end_date and row_date > params.end_date:
            return False
    return True


def _normalize_row(row: dict) -> dict:
    return {
        "geo_level": row.get("geo_level"),
        "geo_id": row.get("geo_id"),
        "geo_name": row.get("geo_name"),
        "date": row.get("date"),
        "metric": row.get("metric"),
        "value": float(row.get("value", 0) or 0),
    }


def _filters_metadata(params: DatasetQueryParams) -> dict:
    return {
        "geo_level": params.geo_level,
        "geo_id": params.geo_id,
        "metric": params.metric,
        "start_date": params.start_date.isoformat() if params.start_date else None,
        "end_date": params.end_date.isoformat() if params.end_date else None,
    }
