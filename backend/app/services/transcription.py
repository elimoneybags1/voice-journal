import logging

import httpx

from app.config import settings

logger = logging.getLogger(__name__)

GROQ_TRANSCRIPTION_URL = "https://api.groq.com/openai/v1/audio/transcriptions"

MAX_RETRIES = 2


async def transcribe_audio(audio_bytes: bytes, filename: str) -> str:
    """Transcribe audio using Groq Whisper API with retry logic."""
    last_error = None

    for attempt in range(MAX_RETRIES + 1):
        try:
            async with httpx.AsyncClient(timeout=120) as client:
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
                if resp.status_code == 429:
                    logger.warning("Groq rate limited (attempt %d)", attempt + 1)
                    if attempt < MAX_RETRIES:
                        import asyncio
                        await asyncio.sleep(2 ** attempt)
                        continue
                resp.raise_for_status()
                return resp.text.strip()
        except httpx.TimeoutException:
            last_error = "Transcription timed out"
            logger.warning("Transcription timeout (attempt %d)", attempt + 1)
        except httpx.HTTPStatusError as e:
            last_error = f"Transcription API error: {e.response.status_code}"
            logger.error("Groq API error: %s", e.response.text[:200])
            if e.response.status_code != 429:
                break  # Don't retry non-rate-limit errors
        except Exception as e:
            last_error = str(e)
            logger.error("Transcription failed: %s", e)
            break

    raise RuntimeError(last_error or "Transcription failed")
