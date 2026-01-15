from __future__ import annotations

from typing import Protocol

from models import DatasetQueryParams, DatasetResult


class DataProvider(Protocol):
    def supports(self, dataset_id: str) -> bool:
        ...

    def fetch(self, dataset_id: str, params: DatasetQueryParams | None) -> DatasetResult:
        ...
