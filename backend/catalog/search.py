from __future__ import annotations

from datetime import date

from catalog.models import CatalogEntry, CatalogSearchResult


def parse_date_param(value: str | None) -> date | None:
    if not value:
        return None
    return date.fromisoformat(value)


def search_catalog(
    entries: list[CatalogEntry],
    query: str | None,
    geo: str | None,
    start: date | None,
    end: date | None,
    limit: int,
) -> list[CatalogSearchResult]:
    normalized_geo = geo.lower().strip() if geo else None
    terms = _tokenize_query(query)

    matches: list[CatalogSearchResult] = []
    for entry in entries:
        if not _geo_compatible(entry, normalized_geo):
            continue
        if not _date_compatible(entry, start, end):
            continue

        score = _score_entry(entry, terms)
        if terms and score <= 0:
            continue
        matches.append(CatalogSearchResult(dataset_id=entry.dataset_id, name=entry.name, score=score))

    matches.sort(key=lambda item: (-item.score, item.name.lower(), item.dataset_id))
    return matches[:limit]


def _tokenize_query(query: str | None) -> list[str]:
    if not query:
        return []
    return [term for term in query.lower().split() if term]


def _geo_compatible(entry: CatalogEntry, geo: str | None) -> bool:
    if not geo:
        return True
    return geo in {value.lower() for value in entry.supported_geos}


def _date_compatible(entry: CatalogEntry, start: date | None, end: date | None) -> bool:
    if not start and not end:
        return True
    effective_start = start or entry.min_date
    effective_end = end or entry.max_date
    return entry.min_date <= effective_end and entry.max_date >= effective_start


def _score_entry(entry: CatalogEntry, terms: list[str]) -> float:
    if not terms:
        return 0.0
    name = entry.name.lower()
    description = entry.description.lower()
    tags = [tag.lower() for tag in entry.tags]

    score = 0
    for term in terms:
        if term in name:
            score += 3
        if term in description:
            score += 2
        if any(term in tag for tag in tags):
            score += 1
    return float(score)
