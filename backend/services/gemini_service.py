import json
import logging
import os
from typing import Any

import google.generativeai as genai
from pydantic import ValidationError

from backend.models.schemas import ClinicalSummary
from backend.utils.exceptions import AppError, ConfigurationError


logger = logging.getLogger(__name__)

SUMMARY_FIELDS = [
    "patient_name",
    "age",
    "gender",
    "chief_complaint",
    "symptoms",
    "medical_history",
    "medications",
    "clinical_observations",
    "diagnosis",
    "treatment_plan",
    "follow_up",
    "final_summary",
]


def _get_model() -> genai.GenerativeModel:
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise ConfigurationError("GEMINI_API_KEY is not configured")

    model_name = os.getenv("GEMINI_MODEL", "gemini-3.5-flash")
    genai.configure(api_key=api_key)
    return genai.GenerativeModel(
        model_name=model_name,
        generation_config={
            "temperature": 0,
            "top_p": 0.1,
            "response_mime_type": "application/json",
        },
    )


def _summary_schema_instruction() -> str:
    return json.dumps({field: "string" for field in SUMMARY_FIELDS}, indent=2)


def _build_prompt(transcript: str) -> str:
    schema = _summary_schema_instruction()
    return f"""
You are a clinical information extraction assistant.

Extract ONLY facts explicitly present in the doctor-patient transcript.
Never infer, assume, diagnose, embellish, or add external medical knowledge.
If a field is unavailable, use exactly "Not Mentioned".
Diagnosis must be filled only if the transcript explicitly states a diagnosis.
Return only valid JSON matching this schema:

{schema}

Rules:
- Use concise clinical language.
- Keep every value as a string.
- For lists such as symptoms or medications, use comma-separated text.
- Do not include markdown, commentary, citations, or extra keys.

Transcript:
\"\"\"{transcript}\"\"\"
""".strip()


def _repair_truncated_json(s: str, start: int) -> str | None:
    """Extract and repair a JSON object that may be missing closing braces.

    Walks the string with string-awareness (respects quotes and backslash
    escapes) so braces inside string values are not miscounted. If the text
    ends while the object is still open, appends the missing closing braces
    after removing any trailing comma.
    """
    depth = 0
    in_string = False
    escaped = False
    last_non_space = -1

    for i in range(start, len(s)):
        ch = s[i]
        if in_string:
            if escaped:
                escaped = False
            elif ch == "\\":
                escaped = True
            elif ch == '"':
                in_string = False
                last_non_space = i
            continue

        if ch == '"':
            in_string = True
        elif ch == "{":
            depth += 1
            last_non_space = i
        elif ch == "}":
            depth -= 1
            if depth <= 0:
                return s[start : i + 1]
            last_non_space = i
        elif ch not in " \t\r\n":
            last_non_space = i

    # If the text ends inside an unterminated string, the object cannot be repaired.
    if in_string or depth <= 0:
        return None

    body = s[start : last_non_space + 1].rstrip()
    while body.endswith(","):
        body = body[:-1].rstrip()
    return body + "}" * depth


def _strip_trailing_commas_in_object(s: str) -> str:
    """Remove trailing commas before every closing brace in a JSON object text."""
    out = []
    i = 0
    n = len(s)
    in_string = False
    escaped = False
    while i < n:
        ch = s[i]
        if in_string:
            out.append(ch)
            if escaped:
                escaped = False
            elif ch == "\\":
                escaped = True
            elif ch == '"':
                in_string = False
            i += 1
            continue

        if ch == '"':
            in_string = True
            out.append(ch)
        elif ch == "{":
            out.append(ch)
        elif ch == "}":
            out.append(ch)
        elif ch == ",":
            # Peek ahead: if only whitespace until a '}' then this is a trailing comma.
            j = i + 1
            while j < n and s[j] in " \t\r\n":
                j += 1
            if j < n and s[j] == "}":
                i = j
                continue
            out.append(ch)
        else:
            out.append(ch)
        i += 1
    return "".join(out)


def _extract_json_object(s: str) -> dict[str, Any] | None:
    """Return the first valid JSON object in *s*, repairing truncation if needed."""
    decoder = json.JSONDecoder()

    # Pass 1: strict decode at each '{' (handles trailing noise after a valid object).
    start = s.find("{")
    while start != -1:
        try:
            data, _end = decoder.raw_decode(s, start)
            if isinstance(data, dict):
                return data
        except json.JSONDecodeError:
            pass
        start = s.find("{", start + 1)

    # Pass 2: repair truncated JSON (missing closing braces) and trailing commas.
    start = s.find("{")
    while start != -1:
        repaired = _repair_truncated_json(s, start)
        if repaired is not None:
            repaired = _strip_trailing_commas_in_object(repaired)
            try:
                data = json.loads(repaired)
                if isinstance(data, dict):
                    return data
            except json.JSONDecodeError:
                pass
        start = s.find("{", start + 1)

    return None


def _parse_json_response(text: str) -> dict[str, Any]:
    """Parse the first valid JSON object from Gemini response text.

    Handles:
    - Markdown code fences.
    - Trailing noise (e.g. an extra '}' after a valid object).
    - Truncated responses missing the final closing brace.
    - Braces inside string values.
    """
    cleaned = text.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.removeprefix("```json").removeprefix("```").removesuffix("```").strip()

    decoder = json.JSONDecoder()

    # Try 1: direct top-level parse.
    try:
        data = decoder.decode(cleaned)
        if isinstance(data, dict):
            return data
    except Exception:
        logger.debug("Direct JSON parse failed, attempting extraction")

    # Try 2: locate / repair a JSON object anywhere in the text.
    data = _extract_json_object(cleaned)
    if data is not None:
        return data

    logger.error("Gemini returned invalid JSON: %s", cleaned)
    raise AppError("Gemini returned an invalid summary format", status_code=502)


def _normalize_missing_fields(data: dict[str, Any]) -> dict[str, str]:
    normalized: dict[str, str] = {}
    for field in SUMMARY_FIELDS:
        value = data.get(field, "Not Mentioned")
        if value is None:
            normalized[field] = "Not Mentioned"
        elif isinstance(value, (list, tuple)):
            normalized[field] = ", ".join(str(item).strip() for item in value if str(item).strip()) or "Not Mentioned"
        else:
            normalized[field] = str(value).strip() or "Not Mentioned"
    return normalized


def generate_summary(transcript: str) -> ClinicalSummary:
    cleaned_transcript = transcript.strip()
    if not cleaned_transcript:
        raise AppError("Transcript cannot be empty", status_code=422)

    try:
        model = _get_model()
        response = model.generate_content(_build_prompt(cleaned_transcript))
    except ConfigurationError:
        raise
    except Exception as exc:
        logger.exception("Gemini API request failed; using fallback summary")
        return _fallback_summary(cleaned_transcript)

    try:
        text = getattr(response, "text", "").strip()
    except Exception as exc:
        logger.exception("Unable to read Gemini response text; using fallback summary")
        return _fallback_summary(cleaned_transcript)

    if not text:
        return _fallback_summary(cleaned_transcript)

    try:
        data = _normalize_missing_fields(_parse_json_response(text))
    except Exception as exc:
        logger.exception("Gemini summary parsing failed; using fallback summary")
        return _fallback_summary(cleaned_transcript)

    try:
        return ClinicalSummary.model_validate(data)
    except ValidationError as exc:
        logger.error("Gemini summary failed validation: %s", exc)
        return _fallback_summary(cleaned_transcript)


def _fallback_summary(transcript: str) -> ClinicalSummary:
    return ClinicalSummary(
        patient_name="Not Mentioned",
        age="Not Mentioned",
        gender="Not Mentioned",
        chief_complaint="Not Mentioned",
        symptoms="Not Mentioned",
        medical_history="Not Mentioned",
        medications="Not Mentioned",
        clinical_observations="Not Mentioned",
        diagnosis="Not Mentioned",
        treatment_plan="Not Mentioned",
        follow_up="Not Mentioned",
        final_summary=transcript or "Not Mentioned",
    )
