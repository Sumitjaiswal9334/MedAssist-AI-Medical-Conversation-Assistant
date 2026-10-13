import logging
import os
import shutil
import subprocess
import tempfile
from functools import lru_cache
from pathlib import Path

import av
import numpy as np
from faster_whisper import WhisperModel

from backend.utils.exceptions import AppError, ConfigurationError


logger = logging.getLogger(__name__)


@lru_cache(maxsize=1)
def _load_model() -> WhisperModel:
    model_name = os.getenv("WHISPER_MODEL", "base")
    device = os.getenv("WHISPER_DEVICE", "cpu")
    compute_type = os.getenv("WHISPER_COMPUTE_TYPE", "int8")

    try:
        logger.info("Loading faster-whisper model=%s device=%s compute_type=%s", model_name, device, compute_type)
        return WhisperModel(model_name, device=device, compute_type=compute_type)
    except Exception as exc:
        logger.exception("Failed to load Whisper model")
        raise ConfigurationError("Failed to load Whisper model") from exc


def _require_ffmpeg() -> None:
    if shutil.which("ffmpeg") is None:
        raise ConfigurationError("FFmpeg is not installed or is not available on PATH")


def _convert_to_wav(input_path: Path) -> Path:
    _require_ffmpeg()
    output_fd, output_name = tempfile.mkstemp(suffix=".wav")
    os.close(output_fd)
    output = Path(output_name)
    command = [
        "ffmpeg",
        "-hide_banner",
        "-loglevel",
        "error",
        "-y",
        "-i",
        str(input_path),
        "-ac",
        "1",
        "-ar",
        "16000",
        "-vn",
        str(output),
    ]

    try:
        completed = subprocess.run(
            command,
            capture_output=True,
            text=True,
            check=False,
            timeout=int(os.getenv("FFMPEG_TIMEOUT_SECONDS", "120")),
        )
    except subprocess.TimeoutExpired as exc:
        output.unlink(missing_ok=True)
        raise AppError("Audio conversion timed out", status_code=408) from exc
    except OSError as exc:
        output.unlink(missing_ok=True)
        raise ConfigurationError("Unable to execute FFmpeg") from exc

    if completed.returncode != 0:
        output.unlink(missing_ok=True)
        logger.error("FFmpeg conversion failed: %s", completed.stderr)
        raise AppError("Invalid or unsupported audio file", status_code=400)

    return output


def _load_wav_samples(wav_path: Path) -> np.ndarray:
    with av.open(str(wav_path), mode="r") as container:
        frames = [frame.to_ndarray() for frame in container.decode(audio=0)]

    if not frames:
        return np.empty(0, dtype=np.float32)

    samples = np.concatenate(frames, axis=-1).reshape(-1)
    return samples.astype(np.float32) / 32768.0


def transcribe_audio(audio_path: str | Path) -> str:
    source_path = Path(audio_path)
    if not source_path.exists():
        raise AppError("Audio file not found", status_code=400)

    wav_path: Path | None = None
    try:
        wav_path = _convert_to_wav(source_path)
        model = _load_model()
        audio_samples = _load_wav_samples(wav_path)
        language = os.getenv("WHISPER_LANGUAGE") or None

        segments, _info = model.transcribe(
            audio_samples,
            language=language,
            vad_filter=True,
            vad_parameters={
                "min_silence_duration_ms": int(os.getenv("VAD_MIN_SILENCE_DURATION_MS", "500")),
                "speech_pad_ms": int(os.getenv("VAD_SPEECH_PAD_MS", "400")),
            },
            beam_size=int(os.getenv("WHISPER_BEAM_SIZE", "5")),
        )

        transcript = " ".join(segment.text.strip() for segment in segments if segment.text.strip()).strip()
        if not transcript:
            raise AppError("No speech detected in audio", status_code=422)

        return transcript
    except AppError:
        raise
    except ConfigurationError:
        raise
    except Exception as exc:
        logger.exception("Whisper transcription failed")
        raise AppError("Whisper transcription failed", status_code=500) from exc
    finally:
        if wav_path and wav_path.exists():
            wav_path.unlink(missing_ok=True)
