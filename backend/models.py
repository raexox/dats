from __future__ import annotations

from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, Field

MapGeoLevel = Literal["state", "county"]


class QueryRequest(BaseModel):
    phrase: str
    metric: str
    geography: MapGeoLevel
    timeRange: tuple[int, int]
    perCapita: bool


class DatasetRow(BaseModel):
    id: str
    location: str
    value: float
    perCapitaValue: float | None = None
    changePercent: float | None = None


class SourceMetadata(BaseModel):
    name: str
    updatedAt: datetime
    notes: str | None = None


class QueryResponse(BaseModel):
    request: QueryRequest
    rows: list[DatasetRow]
    source: SourceMetadata


class NoDataResponse(BaseModel):
    status: Literal["no_data"] = "no_data"
    message: str


class ErrorResponse(BaseModel):
    status: Literal["error"] = "error"
    message: str
    code: str | None = None


class UserCreate(BaseModel):
    email: str
    password: str = Field(min_length=8)
    name: str | None = None


class UserLogin(BaseModel):
    email: str
    password: str = Field(min_length=8)


class UserPublic(BaseModel):
    id: str
    email: str
    name: str | None = None
    createdAt: datetime


class TokenResponse(BaseModel):
    access_token: str
    token_type: Literal["bearer"] = "bearer"
    user: UserPublic


class QueryHistoryItem(BaseModel):
    id: str
    request: QueryRequest
    createdAt: datetime


class DatasetQueryParams(BaseModel):
    geo_level: str | None = None
    geo_id: str | None = None
    metric: str | None = None
    start_date: datetime | None = None
    end_date: datetime | None = None


class DatasetFetchRequest(BaseModel):
    dataset_id: str
    params: DatasetQueryParams | None = None


class DatasetResult(BaseModel):
    dataset_id: str
    row_count: int
    rows_preview: list[dict]
    metadata: dict
    no_data: bool = False


class UserQuery(BaseModel):
    text: str
    geo_level: str
    start_date: date
    end_date: date
    metric_hint: str | None = None


class PlannerScoreBreakdown(BaseModel):
    keyword: float
    geo: float
    time: float
    metric: float
    total: float


class PlannerCandidate(BaseModel):
    dataset_id: str
    name: str
    score: PlannerScoreBreakdown


class PlannerResponse(BaseModel):
    top_k: int
    candidates: list[PlannerCandidate]


class AutoRunRequest(BaseModel):
    query: UserQuery
    k: int = 25
    concurrency: int = 5
    timeout_ms: int = 2000


class DatasetRunResult(BaseModel):
    dataset_id: str
    status: Literal["success", "no_data", "error"]
    row_count: int
    preview: list[dict]
    metadata: dict
    timing_ms: float
    error_reason: str | None = None


class AutoRunSummary(BaseModel):
    success: int
    no_data: int
    error: int
    total_runtime_ms: float


class AutoRunResponse(BaseModel):
    planned: list[PlannerCandidate]
    results: list[DatasetRunResult]
    summary: AutoRunSummary
