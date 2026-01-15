from __future__ import annotations

from datetime import date
import importlib
from pathlib import Path
import sys
import threading
import time
import types

sys.path.append(str(Path(__file__).resolve().parents[1]))

try:
    import pymongo
except ModuleNotFoundError:  # pragma: no cover - allow test runs without pymongo installed
    import types

    pymongo = types.SimpleNamespace()
from fastapi.testclient import TestClient

from catalog.models import CatalogEntry
from models import DatasetQueryParams, DatasetResult
from providers.registry import ProviderRegistry


class FakeCollection:
    def create_index(self, *args, **kwargs) -> None:
        return None


class FakeDB:
    def __getitem__(self, name: str) -> FakeCollection:
        return FakeCollection()


class FakeMongoClient:
    def __init__(self, *args, **kwargs) -> None:
        pass

    def __getitem__(self, name: str) -> FakeDB:
        return FakeDB()


def build_client(monkeypatch) -> tuple[TestClient, object]:
    fake_passlib = types.ModuleType("passlib")
    fake_passlib_context = types.ModuleType("passlib.context")
    class _FakeCryptContext:
        def __init__(self, *args, **kwargs) -> None:
            pass

        def hash(self, value: str) -> str:
            return value

        def verify(self, plain: str, hashed: str) -> bool:
            return plain == hashed

    fake_passlib_context.CryptContext = _FakeCryptContext
    sys.modules.setdefault("passlib", fake_passlib)
    sys.modules.setdefault("passlib.context", fake_passlib_context)
    sys.modules.setdefault("jwt", types.ModuleType("jwt"))
    fake_pymongo = types.ModuleType("pymongo")
    fake_pymongo.MongoClient = FakeMongoClient
    fake_pymongo_errors = types.ModuleType("pymongo.errors")
    fake_pymongo_errors.DuplicateKeyError = RuntimeError
    sys.modules.setdefault("pymongo", fake_pymongo)
    sys.modules.setdefault("pymongo.errors", fake_pymongo_errors)
    sys.modules.setdefault("bson", types.ModuleType("bson"))
    sys.modules["bson"].ObjectId = lambda value: value
    monkeypatch.setattr(pymongo, "MongoClient", FakeMongoClient, raising=False)
    monkeypatch.setenv("MONGODB_URI", "mongodb://example")
    monkeypatch.setenv("JWT_SECRET", "test")
    module = importlib.import_module("main")
    importlib.reload(module)
    client = TestClient(module.app)
    module.app.state.catalog_store = types.SimpleNamespace(entries=[])
    module.app.state.provider_registry = ProviderRegistry([])
    return client, module


def make_entry(dataset_id: str, name: str) -> CatalogEntry:
    return CatalogEntry(
        dataset_id=dataset_id,
        provider_id="test",
        name=name,
        description="Population dataset",
        tags=["population"],
        supported_geos=["state"],
        min_date=date(2020, 1, 1),
        max_date=date(2024, 12, 31),
        metrics=["population"],
        source="test",
    )


class FakeProvider:
    def supports(self, dataset_id: str) -> bool:
        return dataset_id.startswith("local:csv/")

    def fetch(self, dataset_id: str, params: DatasetQueryParams | None) -> DatasetResult:
        if dataset_id.endswith("no_data.csv"):
            return DatasetResult(
                dataset_id=dataset_id,
                row_count=0,
                rows_preview=[],
                metadata={"provider": "fake"},
                no_data=True,
            )
        if dataset_id.endswith("error.csv"):
            raise RuntimeError("Simulated failure")
        return DatasetResult(
            dataset_id=dataset_id,
            row_count=3,
            rows_preview=[{"geo_level": "state"}],
            metadata={"provider": "fake"},
            no_data=False,
        )


def test_run_auto_rejects_pre_2020(monkeypatch):
    client, _ = build_client(monkeypatch)
    payload = {
        "query": {
            "text": "population",
            "geo_level": "state",
            "start_date": "2019-12-31",
            "end_date": "2020-01-02",
            "metric_hint": "population",
        },
        "k": 3,
        "concurrency": 2,
        "timeout_ms": 1000,
    }
    response = client.post("/query/run-auto", json=payload)
    assert response.status_code == 400


def test_run_auto_mixed_outcomes(monkeypatch):
    client, module = build_client(monkeypatch)
    entries = [
        make_entry("local:csv/success.csv", "Population State Success"),
        make_entry("local:csv/no_data.csv", "Population State No Data"),
        make_entry("missing:csv/error.csv", "Population State Missing"),
    ]
    module.app.state.catalog_store.entries = entries
    module.app.state.provider_registry = ProviderRegistry([FakeProvider()])

    payload = {
        "query": {
            "text": "population",
            "geo_level": "state",
            "start_date": "2020-01-01",
            "end_date": "2020-12-31",
            "metric_hint": "population",
        },
        "k": 3,
        "concurrency": 2,
        "timeout_ms": 1000,
    }
    response = client.post("/query/run-auto", json=payload)
    assert response.status_code == 200
    body = response.json()
    statuses = {item["status"] for item in body["results"]}
    assert {"success", "no_data", "error"}.issubset(statuses)


class SlowProvider:
    def __init__(self) -> None:
        self.lock = threading.Lock()
        self.active = 0
        self.max_active = 0

    def supports(self, dataset_id: str) -> bool:
        return dataset_id.startswith("local:csv/")

    def fetch(self, dataset_id: str, params: DatasetQueryParams | None) -> DatasetResult:
        with self.lock:
            self.active += 1
            self.max_active = max(self.max_active, self.active)
        time.sleep(0.1)
        with self.lock:
            self.active -= 1
        return DatasetResult(
            dataset_id=dataset_id,
            row_count=1,
            rows_preview=[{"geo_level": "state"}],
            metadata={"provider": "slow"},
            no_data=False,
        )


def test_run_auto_concurrency_limit(monkeypatch):
    client, module = build_client(monkeypatch)
    entries = [make_entry(f"local:csv/ds_{idx}.csv", f"Dataset {idx}") for idx in range(5)]
    provider = SlowProvider()
    module.app.state.catalog_store.entries = entries
    module.app.state.provider_registry = ProviderRegistry([provider])

    payload = {
        "query": {
            "text": "population",
            "geo_level": "state",
            "start_date": "2020-01-01",
            "end_date": "2020-12-31",
            "metric_hint": "population",
        },
        "k": 5,
        "concurrency": 2,
        "timeout_ms": 2000,
    }
    response = client.post("/query/run-auto", json=payload)
    assert response.status_code == 200
    assert provider.max_active <= 2
