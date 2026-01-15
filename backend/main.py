from datetime import datetime, timedelta, timezone
import os

from dotenv import load_dotenv
from fastapi import FastAPI, Header, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from passlib.context import CryptContext
from pymongo import MongoClient
from pymongo.errors import DuplicateKeyError
import jwt
from bson import ObjectId

from models import (
    DatasetRow,
    QueryRequest,
    QueryResponse,
    SourceMetadata,
    TokenResponse,
    UserCreate,
    UserLogin,
    UserPublic,
)


load_dotenv()


def _get_frontend_origins() -> list[str]:
    raw = os.getenv("FRONTEND_ORIGINS", "http://localhost:3000")
    return [origin.strip() for origin in raw.split(",") if origin.strip()]


frontend_origins = _get_frontend_origins()
mongo_uri = os.getenv("MONGODB_URI")
mongo_db_name = os.getenv("MONGODB_DB", "data_visualization")
jwt_secret = os.getenv("JWT_SECRET")
jwt_expires_minutes = int(os.getenv("JWT_EXPIRES_MINUTES", "120"))

if not mongo_uri:
    raise RuntimeError("MONGODB_URI is required for auth.")
if not jwt_secret:
    raise RuntimeError("JWT_SECRET is required for auth.")

mongo_client = MongoClient(mongo_uri)
db = mongo_client[mongo_db_name]
users_collection = db["users"]
users_collection.create_index("email", unique=True)

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
