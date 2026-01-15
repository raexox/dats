from __future__ import annotations

from datetime import date, datetime, timezone
from pathlib import Path

from catalog.loader import load_catalog_entries
from catalog.models import CatalogEntry, CatalogSearchResult
from catalog.search import search_catalog


class CatalogStore:
    def __init__(self, catalog_dir: Path) -> None:
        self.catalog_dir = catalog_dir
        self.entries: list[CatalogEntry] = []
        self.last_loaded_at: datetime | None = None

    def load(self) -> None:
        self.entries = load_catalog_entries(self.catalog_dir)
        self.last_loaded_at = datetime.now(timezone.utc)

    def search(
        self,
        query: str | None,
        geo: str | None,
        start: date | None,
        end: date | None,
        limit: int,
    ) -> list[CatalogSearchResult]:
        return search_catalog(self.entries, query, geo, start, end, limit)
