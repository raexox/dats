from datetime import date, datetime, timedelta, timezone
import json
import asyncio
import os
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, Header, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from passlib.context import CryptContext
from pymongo import MongoClient
from pymongo.errors import DuplicateKeyError
import jwt
from bson import ObjectId

from models import (
    DatasetRow,
    DatasetFetchRequest,
    DatasetResult,
    AutoRunRequest,
    AutoRunResponse,
    AutoRunSummary,
    PlannerResponse,
    UserQuery,
    QueryHistoryItem,
    QueryRequest,
    QueryResponse,
    SourceMetadata,
    TokenResponse,
    UserCreate,
    UserLogin,
    UserPublic,
)
from catalog.models import CatalogSearchResult
from catalog.search import parse_date_param
from catalog.store import CatalogStore
from providers.local_csv import LocalCsvProvider
from providers.registry import ProviderRegistry
from planner.planner import DatasetPlanner
from executor.runner import AutoRunConfig, as_response, run_auto
from executor.stream_runner import StreamConfig, run_streaming
from streaming.store import JobStore


load_dotenv()


def _get_frontend_origins() -> list[str]:
    raw = os.getenv("FRONTEND_ORIGINS", "http://localhost:3000")
    return [origin.strip() for origin in raw.split(",") if origin.strip()]


frontend_origins = _get_frontend_origins()
mongo_uri = os.getenv("MONGODB_URI")
mongo_db_name = os.getenv("MONGODB_DB", "data_visualization")
jwt_secret = os.getenv("JWT_SECRET")
jwt_expires_minutes = int(os.getenv("JWT_EXPIRES_MINUTES", "120"))
_backend_root = Path(__file__).resolve().parent
_catalog_env = os.getenv("CATALOG_DIR")
if _catalog_env:
    _catalog_path = Path(_catalog_env)
    if not _catalog_path.is_absolute():
        _catalog_path = (_backend_root / _catalog_path).resolve()
    catalog_dir = _catalog_path
else:
    catalog_dir = (_backend_root / ".." / "catalog").resolve()
data_dir = Path(os.getenv("DATA_DIR", _backend_root / ".." / "data")).resolve()
catalog_dev_reload = os.getenv("CATALOG_DEV_RELOAD", "0").lower() in {"1", "true", "yes"}

if not mongo_uri:
    raise RuntimeError("MONGODB_URI is required for auth.")
if not jwt_secret:
    raise RuntimeError("JWT_SECRET is required for auth.")

mongo_client = MongoClient(mongo_uri)
db = mongo_client[mongo_db_name]
users_collection = db["users"]
users_collection.create_index("email", unique=True)
queries_collection = db["queries"]
queries_collection.create_index([("user_id", 1), ("created_at", -1)])

pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")

app = FastAPI(
    title="Data Visualization Platform Backend",
    version="0.1.0",
    description="Scaffold for health checks and future services",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=frontend_origins,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
    allow_credentials=True,
)


@app.on_event("startup")
def load_catalog() -> None:
    store = CatalogStore(catalog_dir)
    store.load()
    app.state.catalog_store = store
    app.state.provider_registry = ProviderRegistry([LocalCsvProvider(data_dir)])
    app.state.job_store = JobStore()


@app.get("/health")
def health():
    now = datetime.now(timezone.utc)
    return {"status": "ok", "time": now.isoformat()}


def _user_to_public(user: dict) -> UserPublic:
    return UserPublic(
        id=str(user["_id"]),
        email=user["email"],
        name=user.get("name"),
        createdAt=user["created_at"],
    )


def _create_access_token(user: dict) -> str:
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=jwt_expires_minutes)
    payload = {
        "sub": str(user["_id"]),
        "email": user["email"],
        "name": user.get("name"),
        "exp": expires_at,
    }
    return jwt.encode(payload, jwt_secret, algorithm="HS256")


def _get_user_by_email(email: str) -> dict | None:
    return users_collection.find_one({"email": email.lower()})


def _get_current_user(authorization: str | None) -> dict:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing access token.")
    token = authorization.split(" ", 1)[1].strip()
    try:
        payload = jwt.decode(token, jwt_secret, algorithms=["HS256"])
    except jwt.PyJWTError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid access token.") from exc

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid access token.")
    try:
        object_id = ObjectId(user_id)
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid access token.") from exc
    user = users_collection.find_one({"_id": object_id})
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")
    return user


@app.post("/auth/register", response_model=UserPublic, status_code=status.HTTP_201_CREATED)
def register_user(payload: UserCreate):
    email = payload.email.lower().strip()
    if not email or not payload.password:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email and password are required.")
    hashed_password = pwd_context.hash(payload.password)
    now = datetime.now(timezone.utc)
    user_doc = {
        "email": email,
        "name": payload.name,
        "password_hash": hashed_password,
        "created_at": now,
    }
    try:
        result = users_collection.insert_one(user_doc)
    except DuplicateKeyError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered.") from exc
    user_doc["_id"] = result.inserted_id
    return _user_to_public(user_doc)


@app.post("/auth/login", response_model=TokenResponse)
def login_user(payload: UserLogin):
    user = _get_user_by_email(payload.email)
    if not user or not pwd_context.verify(payload.password, user["password_hash"]):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials.")
    token = _create_access_token(user)
    return TokenResponse(access_token=token, user=_user_to_public(user))


@app.get("/auth/me", response_model=UserPublic)
def get_me(authorization: str | None = Header(default=None)):
    user = _get_current_user(authorization)
    return _user_to_public(user)


@app.post("/api/query/preview", response_model=QueryResponse)
def preview_query(payload: QueryRequest):
    now = datetime.now(timezone.utc)
    rows = [
        DatasetRow(
            id="ca",
            location="California",
            value=1245000,
            perCapitaValue=31.2 if payload.perCapita else None,
            changePercent=2.5,
        ),
        DatasetRow(
            id="tx",
            location="Texas",
            value=892000,
            perCapitaValue=28.9 if payload.perCapita else None,
            changePercent=1.8,
        ),
        DatasetRow(
            id="fl",
            location="Florida",
            value=756000,
            perCapitaValue=34.5 if payload.perCapita else None,
            changePercent=3.2,
        ),
        DatasetRow(
            id="ny",
            location="New York",
            value=654000,
            perCapitaValue=32.1 if payload.perCapita else None,
            changePercent=0.9,
        ),
    ]
    source = SourceMetadata(
        name="Mock Census API",
        updatedAt=now,
        notes=f"Preview for {payload.geography} geography and {payload.metric} metric.",
    )
    return QueryResponse(request=payload, rows=rows, source=source)


@app.post("/queries", response_model=QueryHistoryItem, status_code=status.HTTP_201_CREATED)
def save_query(payload: QueryRequest, authorization: str | None = Header(default=None)):
    user = _get_current_user(authorization)
    now = datetime.now(timezone.utc)
    record = {
        "user_id": user["_id"],
        "request": payload.model_dump(),
        "created_at": now,
    }
    result = queries_collection.insert_one(record)
    return QueryHistoryItem(id=str(result.inserted_id), request=payload, createdAt=now)


@app.get("/queries", response_model=list[QueryHistoryItem])
def list_queries(limit: int = 20, authorization: str | None = Header(default=None)):
    user = _get_current_user(authorization)
    safe_limit = max(1, min(limit, 50))
    cursor = (
        queries_collection.find({"user_id": user["_id"]})
        .sort("created_at", -1)
        .limit(safe_limit)
    )
    items: list[QueryHistoryItem] = []
    for item in cursor:
        items.append(
            QueryHistoryItem(
                id=str(item["_id"]),
                request=QueryRequest(**item["request"]),
                createdAt=item["created_at"],
            )
        )
    return items


@app.get("/catalog/search", response_model=list[CatalogSearchResult])
def search_catalog(
    q: str | None = None,
    geo: str | None = None,
    start: str | None = None,
    end: str | None = None,
    limit: int = 20,
):
    try:
        start_date = parse_date_param(start)
        end_date = parse_date_param(end)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid date format.") from exc
    if start_date and end_date and start_date > end_date:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="start must be <= end.")
    safe_limit = max(1, min(limit, 100))
    store: CatalogStore = app.state.catalog_store
    return store.search(q, geo, start_date, end_date, safe_limit)


@app.post("/catalog/reload")
def reload_catalog():
    if not catalog_dev_reload:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Catalog reload disabled.")
    store: CatalogStore = app.state.catalog_store
    store.load()
    return {"status": "ok", "count": len(store.entries)}


@app.post("/datasets/fetch-one", response_model=DatasetResult)
def fetch_one_dataset(payload: DatasetFetchRequest):
    registry: ProviderRegistry = app.state.provider_registry
    provider = registry.get_provider(payload.dataset_id)
    if not provider:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No provider found.")
    return provider.fetch(payload.dataset_id, payload.params)


@app.post("/planner/plan", response_model=PlannerResponse)
def plan_datasets(payload: UserQuery, top_k: int = 25):
    if payload.start_date < date(2020, 1, 1):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="start_date must be on or after 2020-01-01.",
        )
    if payload.end_date < payload.start_date:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="end_date must be >= start_date.")
    store: CatalogStore = app.state.catalog_store
    planner = DatasetPlanner(store.entries)
    safe_top_k = max(1, min(top_k, 100))
    candidates = planner.plan(payload, safe_top_k)
    return PlannerResponse(top_k=safe_top_k, candidates=candidates)


@app.post("/query/run-auto", response_model=AutoRunResponse)
async def run_auto_query(payload: AutoRunRequest):
    if payload.query.start_date < date(2020, 1, 1):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="start_date must be on or after 2020-01-01.",
        )
    if payload.query.end_date < payload.query.start_date:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="end_date must be >= start_date.")
    store: CatalogStore = app.state.catalog_store
    registry: ProviderRegistry = app.state.provider_registry
    safe_k = max(1, min(payload.k, 100))
    safe_concurrency = max(1, min(payload.concurrency, 10))
    safe_timeout = max(100, min(payload.timeout_ms, 30_000))
    config = AutoRunConfig(k=safe_k, concurrency=safe_concurrency, timeout_ms=safe_timeout)
    result = await run_auto(payload.query, config, store, registry)
    return as_response(result)


@app.post("/query/start-auto")
async def start_auto_query(payload: AutoRunRequest):
    if payload.query.start_date < date(2020, 1, 1):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="start_date must be on or after 2020-01-01.",
        )
    if payload.query.end_date < payload.query.start_date:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="end_date must be >= start_date.")
    store: CatalogStore = app.state.catalog_store
    registry: ProviderRegistry = app.state.provider_registry
    job_store: JobStore = app.state.job_store
    safe_k = max(1, min(payload.k, 100))
    safe_concurrency = max(1, min(payload.concurrency, 10))
    safe_timeout = max(100, min(payload.timeout_ms, 30_000))
    config = StreamConfig(k=safe_k, concurrency=safe_concurrency, timeout_ms=safe_timeout)
    job = job_store.create_job()

    def on_planned(planned):
        job.planned = planned
        _enqueue_event(job, "planned", planned)

    def on_result(result):
        job.results.append(result)
        _enqueue_event(job, "result", result)

    def on_done(summary):
        job.summary = summary
        job.done = True
        _enqueue_event(job, "done", summary)

    async def run_job():
        await run_streaming(payload.query, config, store, registry, on_planned, on_result, on_done)

    async def safe_run():
        try:
            await run_job()
        except Exception:
            job.summary = AutoRunSummary(
                success=0,
                no_data=0,
                error=len(job.results),
                total_runtime_ms=0,
            )
            job.done = True
            _enqueue_event(job, "done", job.summary)

    asyncio.create_task(safe_run())
    return {"query_id": job.query_id}


@app.get("/query/stream/{query_id}")
async def stream_query_results(query_id: str):
    job_store: JobStore = app.state.job_store
    job = job_store.get_job(query_id)
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Query not found.")

    async def event_generator():
        try:
            if job.planned:
                yield _sse_event("planned", job.planned)
            for result in job.results:
                yield _sse_event("result", result)
            if job.done and job.summary:
                yield _sse_event("done", job.summary)
                return
            while True:
                try:
                    item = await asyncio.wait_for(job.queue.get(), timeout=30.0)
                except asyncio.TimeoutError:
                    yield _sse_event("keepalive", {"query_id": query_id})
                    continue
                event_type = item["type"]
                payload = item["payload"]
                yield _sse_event(event_type, payload)
                if event_type == "done":
                    return
        except asyncio.CancelledError:
            return

    return StreamingResponse(event_generator(), media_type="text/event-stream")


def _sse_event(event_type: str, payload) -> str:
    serialized = _serialize_payload(payload)
    return f"event: {event_type}\ndata: {json.dumps(serialized, default=str)}\n\n"


def _enqueue_event(job, event_type: str, payload) -> None:
    try:
        job.queue.put_nowait({"type": event_type, "payload": payload})
    except asyncio.QueueFull:
        pass


def _serialize_payload(payload):
    if hasattr(payload, "model_dump"):
        return payload.model_dump()
    if isinstance(payload, list):
        return [_serialize_payload(item) for item in payload]
    return payload
