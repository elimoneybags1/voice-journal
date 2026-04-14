import logging
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Form, HTTPException, UploadFile
from supabase import create_client

from app.config import settings
from app.deps import get_current_user
from app.services.command_executor import execute_command
from app.services.intent_classifier import classify_intent
from app.services.tagger import tag_transcript
from app.services.transcription import transcribe_audio

logger = logging.getLogger(__name__)

router = APIRouter()

MAX_FILE_SIZE = 25 * 1024 * 1024  # 25MB


def _get_supabase():
    return create_client(settings.supabase_url, settings.supabase_service_key)


@router.post("/upload")
async def upload_recording(
    file: UploadFile,
    duration_seconds: int | None = Form(default=None),
    user: dict = Depends(get_current_user),
):
    """Upload audio → store → transcribe → tag → save entry."""
    if not file.content_type or not file.content_type.startswith("audio/"):
        raise HTTPException(status_code=400, detail="File must be audio")

    audio_bytes = await file.read()
    if len(audio_bytes) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File too large (max 25MB)")

    if len(audio_bytes) < 1000:
        raise HTTPException(status_code=400, detail="Recording too short")

    supabase = _get_supabase()
    entry_id = str(uuid.uuid4())
    user_id = user["id"]

    # 1. Store audio in Supabase Storage
    ext = file.filename.rsplit(".", 1)[-1] if file.filename and "." in file.filename else "webm"
    storage_path = f"{user_id}/{entry_id}.{ext}"
    supabase.storage.from_("recordings").upload(
        storage_path,
        audio_bytes,
        {"content-type": file.content_type or "audio/webm"},
    )
    audio_url = f"{settings.supabase_url}/storage/v1/object/public/recordings/{storage_path}"

    # 2. Transcribe with Groq Whisper
    try:
        transcript = await transcribe_audio(audio_bytes, file.filename or "recording.webm")
    except RuntimeError as e:
        logger.error("Transcription failed for entry %s: %s", entry_id, e)
        raise HTTPException(status_code=503, detail=f"Transcription failed: {e}. Try again.")

    if not transcript or transcript.strip() in (".", ""):
        raise HTTPException(status_code=422, detail="Could not detect any speech. Try speaking louder or longer.")

    # 3. Classify intent — is this a journal entry or a command?
    intent_result = await classify_intent(transcript)

    if intent_result["intent"] == "command":
        # Execute the command, skip storing audio as an entry
        command_result = await execute_command(
            intent_result["command_type"], intent_result["params"], user_id
        )
        # Clean up the uploaded audio since it's not an entry
        try:
            supabase.storage.from_("recordings").remove([storage_path])
        except Exception:
            pass  # Non-critical cleanup
        return {"type": "command", "command_result": command_result}

    # 4. Tag with Groq Llama (graceful degradation — save entry even if tagging fails)
    metadata = await tag_transcript(transcript)

    # 5. Save to database
    entry = {
        "id": entry_id,
        "user_id": user_id,
        "transcript": transcript,
        "title": metadata.get("title", "Untitled"),
        "summary": metadata.get("summary", ""),
        "tags": metadata.get("tags", []),
        "mood": metadata.get("mood", "neutral"),
        "category": metadata.get("category", "Daily Life"),
        "subcategory": metadata.get("subcategory", ""),
        "people": metadata.get("people", []),
        "action_items": metadata.get("action_items", []),
        "audio_url": audio_url,
        "duration_seconds": duration_seconds,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }

    result = supabase.table("entries").insert(entry).execute()

    return {"type": "entry", "entry": result.data[0] if result.data else entry}
