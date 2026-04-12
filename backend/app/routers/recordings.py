import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, UploadFile
from supabase import create_client

from app.config import settings
from app.deps import get_current_user
from app.services.tagger import tag_transcript
from app.services.transcription import transcribe_audio

router = APIRouter()

MAX_FILE_SIZE = 25 * 1024 * 1024  # 25MB


def _get_supabase():
    return create_client(settings.supabase_url, settings.supabase_service_key)


@router.post("/upload")
async def upload_recording(
    file: UploadFile,
    user: dict = Depends(get_current_user),
):
    """Upload audio → store → transcribe → tag → save entry."""
    if not file.content_type or not file.content_type.startswith("audio/"):
        raise HTTPException(status_code=400, detail="File must be audio")

    audio_bytes = await file.read()
    if len(audio_bytes) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File too large (max 25MB)")

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
    transcript = await transcribe_audio(audio_bytes, file.filename or "recording.webm")

    if not transcript:
        raise HTTPException(status_code=422, detail="Could not transcribe audio")

    # 3. Tag with MiniMax
    metadata = await tag_transcript(transcript)

    # 4. Save to database
    entry = {
        "id": entry_id,
        "user_id": user_id,
        "transcript": transcript,
        "title": metadata.get("title", "Untitled"),
        "summary": metadata.get("summary", ""),
        "tags": metadata.get("tags", []),
        "mood": metadata.get("mood", "neutral"),
        "category": metadata.get("category", "other"),
        "subcategory": metadata.get("subcategory", ""),
        "people": metadata.get("people", []),
        "action_items": metadata.get("action_items", []),
        "audio_url": audio_url,
        "duration_seconds": None,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }

    result = supabase.table("entries").insert(entry).execute()

    return {"entry": result.data[0] if result.data else entry}
