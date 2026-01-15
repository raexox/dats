from datetime import date

from pydantic import BaseModel, Field


class CatalogEntry(BaseModel):
    dataset_id: str = Field(min_length=1)
    provider_id: str = Field(min_length=1)
    name: str
    description: str
    tags: list[str] = Field(default_factory=list)
    supported_geos: list[str] = Field(default_factory=list)
    min_date: date
    max_date: date
    metrics: list[str] = Field(default_factory=list)
    source: str


class CatalogSearchResult(BaseModel):
    dataset_id: str
    name: str
    score: float
