from __future__ import annotations

from pathlib import Path
import json

from catalog.models import CatalogEntry


def load_catalog_entries(catalog_dir: Path) -> list[CatalogEntry]:
    if not catalog_dir.exists():
        return []

    entries: list[CatalogEntry] = []
    for file_path in sorted(catalog_dir.glob("*.json")):
        entries.extend(_load_catalog_file(file_path))
    return entries


def _load_catalog_file(file_path: Path) -> list[CatalogEntry]:
    with file_path.open("r", encoding="utf-8") as handle:
        payload = json.load(handle)

    if isinstance(payload, dict):
        raw_entries = [payload]
    elif isinstance(payload, list):
        raw_entries = payload
    else:
        raise ValueError(f"Unsupported catalog payload in {file_path}.")

    entries: list[CatalogEntry] = []
    for raw in raw_entries:
        entries.append(CatalogEntry(**raw))
    return entries
