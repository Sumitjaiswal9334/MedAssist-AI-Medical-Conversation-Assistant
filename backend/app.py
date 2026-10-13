import logging
import os
from contextlib import asynccontextmanager
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from backend.routers.audio import router as audio_router
from backend.utils.exceptions import AppError
from backend.utils.logging import configure_logging




load_dotenv(dotenv_path=Path(__file__).resolve().parents[1] / ".env")
configure_logging()
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting AI Medical Conversation Assistant")
    yield
    logger.info("Shutting down AI Medical Conversation Assistant")


app = FastAPI(
    title="AI Medical Conversation Assistant",
    description="Transcribes doctor-patient conversations and generates structured clinical summaries.",
    version="1.0.0",
    lifespan=lifespan,
)


def _cors_origins() -> list[str]:
    raw_origins = os.getenv("CORS_ORIGINS", "*")
    origins = [origin.strip() for origin in raw_origins.split(",") if origin.strip()]
    return origins or ["*"]


def _cors_allow_credentials(origins: list[str]) -> bool:
    if "*" in origins:
        return False
    return os.getenv("CORS_ALLOW_CREDENTIALS", "true").lower() == "true"


cors_origins = _cors_origins()
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=_cors_allow_credentials(cors_origins),
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(audio_router)


@app.get("/health", tags=["Health"])
async def health_check() -> dict[str, str]:
    return {"status": "ok"}


@app.exception_handler(AppError)
async def app_error_handler(request: Request, exc: AppError) -> JSONResponse:
    logger.warning("%s %s failed: %s", request.method, request.url.path, exc.message)
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.message},
    )


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    logger.exception("Unhandled error during %s %s", request.method, request.url.path)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"},
    )
