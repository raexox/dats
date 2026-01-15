from __future__ import annotations

import argparse
import csv
from dataclasses import dataclass
from datetime import date, timedelta
import json
from pathlib import Path
import random


@dataclass(frozen=True)
class CatalogEntry:
    dataset_id: str
    supported_geos: list[str]
    min_date: date
    max_date: date
    metrics: list[str]


GEO_SAMPLES = {
    "state": [("CA", "California"), ("TX", "Texas"), ("NY", "New York")],
    "county": [("06037", "Los Angeles County"), ("17031", "Cook County"), ("36061", "New York County")],
    "city": [("0667000", "Los Angeles"), ("4819000", "Dallas"), ("3651000", "New York City")],
    "metro": [("31080", "Los Angeles-Long Beach-Anaheim"), ("19100", "Dallas-Fort Worth"), ("35620", "New York-Newark")],
}


def parse_catalog_entries(catalog_dir: Path) -> list[CatalogEntry]:
    entries: list[CatalogEntry] = []
    for file_path in sorted(catalog_dir.glob("*.json")):
        with file_path.open("r", encoding="utf-8") as handle:
            payload = json.load(handle)
        raw_entries = payload if isinstance(payload, list) else [payload]
        for raw in raw_entries:
            entries.append(
                CatalogEntry(
                    dataset_id=raw["dataset_id"],
                    supported_geos=raw["supported_geos"],
                    min_date=date.fromisoformat(raw["min_date"]),
                    max_date=date.fromisoformat(raw["max_date"]),
                    metrics=raw["metrics"],
                )
            )
    return entries


def dataset_to_filename(dataset_id: str) -> str:
    normalized = dataset_id.replace("\\", "/")
    if normalized.startswith("local:csv/"):
        normalized = normalized[len("local:csv/") :]
    if normalized.lower().endswith(".csv"):
        normalized = normalized[:-4]
    return f"{normalized}.csv"


def generate_rows(entry: CatalogEntry, seed: int) -> list[dict]:
    random.seed(seed)
    rows: list[dict] = []
    metrics = entry.metrics or ["value"]
    days_span = (entry.max_date - entry.min_date).days
    step_days = max(30, days_span // 6) if days_span > 0 else 30
    current_date = entry.min_date

    while current_date <= entry.max_date:
        for geo_level in entry.supported_geos:
            samples = GEO_SAMPLES.get(geo_level, [])
            for geo_id, geo_name in samples:
                for metric in metrics:
                    value = round(random.uniform(10, 5000), 2)
                    rows.append(
                        {
                            "geo_level": geo_level,
                            "geo_id": geo_id,
                            "geo_name": geo_name,
                            "date": current_date.isoformat(),
                            "metric": metric,
                            "value": value,
                        }
                    )
        current_date = current_date + timedelta(days=step_days)
    return rows


def write_csv(file_path: Path, rows: list[dict]) -> None:
    file_path.parent.mkdir(parents=True, exist_ok=True)
    with file_path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(
            handle,
            fieldnames=["geo_level", "geo_id", "geo_name", "date", "metric", "value"],
        )
        writer.writeheader()
        writer.writerows(rows)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Generate local CSV dataset files.")
    parser.add_argument("--catalog-dir", type=Path, default=Path("catalog"))
    parser.add_argument("--data-dir", type=Path, default=Path("data"))
    parser.add_argument("--count", type=int, default=50)
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    entries = parse_catalog_entries(args.catalog_dir)
    selected = entries[: args.count]
    for entry in selected:
        file_name = dataset_to_filename(entry.dataset_id)
        seed = _stable_seed(entry.dataset_id)
        rows = generate_rows(entry, seed)
        write_csv(args.data_dir / file_name, rows)
    print(f"Wrote {len(selected)} CSV datasets to {args.data_dir}")


def _stable_seed(value: str) -> int:
    seed = 0
    for char in value:
        seed = (seed * 31 + ord(char)) % (2**32)
    return seed


if __name__ == "__main__":
    main()
