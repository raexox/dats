from __future__ import annotations

from dataclasses import dataclass
from datetime import date

from catalog.models import CatalogEntry
from models import PlannerCandidate, PlannerScoreBreakdown, UserQuery


@dataclass(frozen=True)
class DatasetPlanner:
    entries: list[CatalogEntry]

    def plan(self, query: UserQuery, top_k: int) -> list[PlannerCandidate]:
        candidates: list[PlannerCandidate] = []
        for entry in self.entries:
            score = _score_entry(entry, query)
            candidates.append(
                PlannerCandidate(
                    dataset_id=entry.dataset_id,
                    name=entry.name,
                    score=score,
                )
            )

        candidates.sort(
            key=lambda item: (
                -item.score.total,
                -item.score.keyword,
                -item.score.geo,
                -item.score.time,
                -item.score.metric,
                item.name.lower(),
                item.dataset_id,
            )
        )
        return candidates[:top_k]


def _score_entry(entry: CatalogEntry, query: UserQuery) -> PlannerScoreBreakdown:
    keyword_score = _keyword_score(entry, query.text)
    geo_score = _geo_score(entry, query.geo_level)
    time_score = _time_score(entry, query.start_date, query.end_date)
    metric_score = _metric_score(entry, query.metric_hint)
    total = keyword_score + geo_score + time_score + metric_score
    return PlannerScoreBreakdown(
        keyword=keyword_score,
        geo=geo_score,
        time=time_score,
        metric=metric_score,
        total=total,
    )


def _keyword_score(entry: CatalogEntry, text: str) -> float:
    terms = _tokenize(text)
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


def _geo_score(entry: CatalogEntry, geo_level: str) -> float:
    supported = {geo.lower() for geo in entry.supported_geos}
    return 2.0 if geo_level.lower() in supported else 0.0


def _time_score(entry: CatalogEntry, start_date: date, end_date: date) -> float:
    if end_date < entry.min_date or start_date > entry.max_date:
        return 0.0
    overlap_start = max(start_date, entry.min_date)
    overlap_end = min(end_date, entry.max_date)
    overlap_days = (overlap_end - overlap_start).days + 1
    total_days = max((end_date - start_date).days + 1, 1)
    return float(overlap_days / total_days)


def _metric_score(entry: CatalogEntry, metric_hint: str | None) -> float:
    if not metric_hint:
        return 0.0
    hint = metric_hint.lower()
    metrics = [metric.lower() for metric in entry.metrics]
    if any(hint in metric for metric in metrics):
        return 2.0
    name = entry.name.lower()
    description = entry.description.lower()
    tags = [tag.lower() for tag in entry.tags]
    if hint in name or hint in description or any(hint in tag for tag in tags):
        return 1.0
    return 0.0


def _tokenize(text: str) -> list[str]:
    return [term for term in text.lower().split() if term]
