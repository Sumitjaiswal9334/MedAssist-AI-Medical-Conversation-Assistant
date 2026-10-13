import logging
from pathlib import Path

from fastapi import APIRouter, File, HTTPException, UploadFile, status
from starlette.concurrency import run_in_threadpool

from backend.models.schemas import (
    ClinicalSummary,
    GenerateSummaryRequest,
    GenerateSummaryResponse,
    ProcessAudioResponse,
    TranscriptionResponse,
)
from backend.services.gemini_service import generate_summary
from backend.services.whisper_service import transcribe_audio
from backend.utils.audio import save_upload_to_temp_file, validate_audio_upload
from backend.utils.exceptions import AppError


logger = logging.getLogger(__name__)
router = APIRouter(tags=["Medical Assistant"])


@router.post(
    "/transcribe",
    response_model=TranscriptionResponse,
    status_code=status.HTTP_200_OK,
)
async def transcribe(file: UploadFile = File(...)) -> TranscriptionResponse:
    temp_path: Path | None = None
    try:
        validate_audio_upload(file)
        temp_path = await save_upload_to_temp_file(file)
        transcript = await run_in_threadpool(transcribe_audio, temp_path)
        return TranscriptionResponse(transcript=transcript)
    except AppError:
        raise
    except Exception as exc:
        logger.exception("Audio transcription failed")
        raise HTTPException(status_code=500, detail="Audio transcription failed") from exc
    finally:
        if temp_path and temp_path.exists():
            temp_path.unlink(missing_ok=True)


@router.post(
    "/generate-summary",
    response_model=GenerateSummaryResponse,
    status_code=status.HTTP_200_OK,
)
async def summarize(payload: GenerateSummaryRequest) -> GenerateSummaryResponse:
    try:
        summary = await run_in_threadpool(generate_summary, payload.transcript)
        return GenerateSummaryResponse(summary=summary)
    except AppError:
        raise
    except Exception as exc:
        logger.exception("Clinical summary generation failed")
        raise HTTPException(status_code=500, detail="Clinical summary generation failed") from exc


@router.post(
    "/process-audio",
    response_model=ProcessAudioResponse,
    status_code=status.HTTP_200_OK,
)
async def process_audio(file: UploadFile = File(...)) -> ProcessAudioResponse:
    temp_path: Path | None = None
    try:
        validate_audio_upload(file)
        temp_path = await save_upload_to_temp_file(file)
        transcript = await run_in_threadpool(transcribe_audio, temp_path)
        summary: ClinicalSummary = await run_in_threadpool(generate_summary, transcript)
        return ProcessAudioResponse(transcript=transcript, summary=summary)
    except AppError:
        raise
    except Exception as exc:
        logger.exception("Audio processing pipeline failed")
        raise HTTPException(status_code=500, detail="Audio processing pipeline failed") from exc
    finally:
        if temp_path and temp_path.exists():
            temp_path.unlink(missing_ok=True)
