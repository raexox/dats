from __future__ import annotations

import argparse
import json
from datetime import date
from pathlib import Path
import random


TOPICS = [
    {
        "name": "Population",
        "tags": ["population", "demographics"],
        "metrics": ["population", "growth_rate"],
    },
    {
        "name": "Income",
        "tags": ["income", "economy", "wages"],
        "metrics": ["median_income", "household_income"],
    },
    {
        "name": "Housing",
        "tags": ["housing", "rent", "ownership"],
        "metrics": ["median_rent", "home_value"],
    },
    {
        "name": "Employment",
        "tags": ["employment", "labor", "jobs"],
        "metrics": ["unemployment_rate", "labor_participation"],
    },
    {
        "name": "Education",
        "tags": ["education", "schools"],
        "metrics": ["graduation_rate", "college_attainment"],
    },
    {
        "name": "Health",
        "tags": ["health", "public_health"],
        "metrics": ["life_expectancy", "mortality_rate"],
    },
    {
        "name": "Crime",
        "tags": ["crime", "safety"],
        "metrics": ["crime_rate", "violent_crime_rate"],
    },
    {
        "name": "Transportation",
        "tags": ["transportation", "commute"],
        "metrics": ["average_commute_time", "transit_ridership"],
    },
    {
        "name": "Energy",
        "tags": ["energy", "consumption"],
        "metrics": ["electric_usage", "renewable_share"],
    },
    {
        "name": "Agriculture",
        "tags": ["agriculture", "farms", "production"],
        "metrics": ["crop_yield", "farm_count"],
    },
]

PROVIDERS = [
    "census",
    "bls",
    "cdc",
    "dot",
    "eia",
]

GEOS = ["state", "county", "city", "metro"]


def build_entry(index: int, topic: dict, provider: str, geo: str) -> dict:
    year_start = 2020 + (index % 5)
    year_end = year_start + 2 + (index % 3)
    name = f"{topic['name']} {geo.title()} Trends {year_start}-{year_end}"
    description = (
        f"{topic['name']} indicators for {geo} geographies, spanning {year_start} through {year_end}."
    )
    slug = f"{topic['name'].lower().replace(' ', '_')}_{geo}_{index:02d}"
    return {
        "dataset_id": f"local:csv/{slug}.csv",
        "provider_id": provider,
        "name": name,
        "description": description,
        "tags": topic["tags"] + [geo],
        "supported_geos": [geo],
        "min_date": date(year_start, 1, 1).isoformat(),
        "max_date": date(year_end, 12, 31).isoformat(),
        "metrics": topic["metrics"],
        "source": f"{provider.upper()} open data program",
    }


def generate_entries(count: int, seed: int) -> list[dict]:
    random.seed(seed)
    entries: list[dict] = []
    for i in range(count):
        topic = TOPICS[i % len(TOPICS)]
        provider = PROVIDERS[i % len(PROVIDERS)]
        geo = GEOS[i % len(GEOS)]
        entries.append(build_entry(i, topic, provider, geo))
    entries.append(_broken_entry())
    return entries


def _broken_entry() -> dict:
    return {
        "dataset_id": "missing:csv/broken_population.csv",
        "provider_id": "broken",
        "name": "Population State Trends (Missing Source)",
        "description": "Intentional missing dataset to exercise error handling.",
        "tags": ["population", "missing", "debug"],
        "supported_geos": ["state"],
        "min_date": date(2020, 1, 1).isoformat(),
        "max_date": date(2024, 12, 31).isoformat(),
        "metrics": ["population"],
        "source": "Simulated failure",
    }


def write_catalog(entries: list[dict], output_path: Path) -> None:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with output_path.open("w", encoding="utf-8") as handle:
        json.dump(entries, handle, indent=2)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Generate catalog seed data.")
    parser.add_argument("--count", type=int, default=60)
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--output", type=Path, default=Path("catalog/catalog_seed.json"))
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    entries = generate_entries(args.count, args.seed)
    write_catalog(entries, args.output)
    print(f"Wrote {len(entries)} catalog entries to {args.output}")


if __name__ == "__main__":
    main()
