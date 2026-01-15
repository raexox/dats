from __future__ import annotations

from datetime import datetime
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
