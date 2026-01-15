from datetime import datetime, timezone
import os

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware


load_dotenv()


def _get_frontend_origins() -> list[str]:
    raw = os.getenv("FRONTEND_ORIGINS", "http://localhost:3000")
    return [origin.strip() for origin in raw.split(",") if origin.strip()]


frontend_origins = _get_frontend_origins()

app = FastAPI(
    title="Data Visualization Platform Backend",
    version="0.1.0",
    description="Scaffold for health checks and future services",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=frontend_origins,
    allow_methods=["GET"],
    allow_headers=["*"],
    allow_credentials=True,
)


@app.get("/health")
def health():
    now = datetime.now(timezone.utc)
    return {"status": "ok", "time": now.isoformat()}
