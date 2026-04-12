import httpx

from app.config import settings

GROQ_TRANSCRIPTION_URL = "https://api.groq.com/openai/v1/audio/transcriptions"


async def transcribe_audio(audio_bytes: bytes, filename: str) -> str:
    """Transcribe audio using Groq Whisper API."""
    async with httpx.AsyncClient(timeout=60) as client:
        resp = await client.post(
            GROQ_TRANSCRIPTION_URL,
            headers={"Authorization": f"Bearer {settings.groq_api_key}"},
            files={"file": (filename, audio_bytes, "audio/webm")},
            data={
                "model": "whisper-large-v3",
                "response_format": "text",
                "language": "en",
            },
        )
        resp.raise_for_status()
        return resp.text.strip()
