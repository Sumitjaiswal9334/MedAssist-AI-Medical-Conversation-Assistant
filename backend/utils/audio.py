import os
import tempfile
from pathlib import Path

from fastapi import UploadFile

from backend.utils.exceptions import AppError


DEFAULT_ALLOWED_AUDIO_TYPES = {
    "audio/mpeg",
    "audio/mp3",
    "audio/mp4",
    "audio/m4a",
    "audio/x-m4a",
    "audio/wav",
    "audio/wave",
    "audio/x-wav",
    "audio/webm",
    "audio/ogg",
    "audio/flac",
    "audio/aac",
    "video/mp4",
    "application/octet-stream",
}


def _max_upload_bytes() -> int:
    try:
        max_upload_mb = int(os.getenv("MAX_UPLOAD_MB", "100"))
    except ValueError as exc:
        raise AppError("MAX_UPLOAD_MB must be a valid integer", status_code=500) from exc

    if max_upload_mb <= 0:
        raise AppError("MAX_UPLOAD_MB must be greater than zero", status_code=500)

    return max_upload_mb * 1024 * 1024


def _normalize_content_type(content_type: str | None) -> str | None:
    if not content_type:
        return None
    # Strip parameters such as ";codecs=opus" -> "audio/webm"
    return content_type.split(";", 1)[0].strip().lower()


def validate_audio_upload(file: UploadFile) -> None:
    if not file.filename:
        raise AppError("Audio file is required", status_code=400)

    allowed_types = {
        value.strip()
        for value in os.getenv("ALLOWED_AUDIO_TYPES", ",".join(DEFAULT_ALLOWED_AUDIO_TYPES)).split(",")
        if value.strip()
    }

    normalized = _normalize_content_type(file.content_type)
    if normalized and normalized not in allowed_types:
        raise AppError(f"Unsupported audio content type: {file.content_type}", status_code=415)


async def save_upload_to_temp_file(file: UploadFile) -> Path:
    suffix = Path(file.filename or "upload").suffix or ".audio"
    temp = tempfile.NamedTemporaryFile(delete=False, suffix=suffix)
    temp_path = Path(temp.name)
    max_bytes = _max_upload_bytes()
    bytes_written = 0

    try:
        with temp:
            while chunk := await file.read(1024 * 1024):
                bytes_written += len(chunk)
                if bytes_written > max_bytes:
                    raise AppError(f"Audio file exceeds {os.getenv('MAX_UPLOAD_MB', '100')} MB limit", status_code=413)
                temp.write(chunk)
    except Exception:
        temp_path.unlink(missing_ok=True)
        raise
    finally:
        await file.close()

    if bytes_written == 0:
        temp_path.unlink(missing_ok=True)
        raise AppError("Audio file is empty", status_code=400)

    return temp_path
