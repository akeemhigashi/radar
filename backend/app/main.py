from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import get_settings
from .database import create_db_and_tables
from .routers import brief


@asynccontextmanager
async def lifespan(app: FastAPI):
    create_db_and_tables()
    yield


settings = get_settings()

app = FastAPI(
    title="Radar",
    description=(
        "PM interview prep tool. "
        "Enter a company and role — four parallel agents research it — "
        "a structured brief streams back in under 90 seconds."
    ),
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(brief.router)


@app.get("/health", tags=["meta"])
def health():
    return {"status": "ok"}
