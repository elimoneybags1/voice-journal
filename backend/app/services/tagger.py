import json
import logging
import re

import httpx

from app.config import settings

logger = logging.getLogger(__name__)

GROQ_CHAT_URL = "https://api.groq.com/openai/v1/chat/completions"

SYSTEM_PROMPT = """You are a journal entry analyzer. Given a voice transcript, extract structured metadata.

Return ONLY valid JSON with these fields:
{
  "title": "short descriptive title (5-10 words)",
  "summary": "1-2 sentence summary",
  "tags": ["tag1", "tag2", ...],
  "mood": "one of: positive, negative, neutral, mixed, reflective, anxious, excited, tired",
  "category": "one of: Trading, Projects, Health, People, Ideas, Daily Life",
  "subcategory": "specific subcategory within the category (e.g. Futures / MNQ, Gold Bot, Polymarket, Voice Journal, TradeFlow, Sleep, Exercise, Family, Friends, Product Ideas, Reflections)",
  "people": ["names mentioned"],
  "action_items": ["things to do mentioned"]
}

Rules:
- Tags should be lowercase, max 5 tags
- If no people or action items, use empty arrays
- Keep summary concise and in first person
- Pick the most specific subcategory you can infer from context"""

DEFAULT_METADATA = {
    "title": "Untitled Entry",
    "summary": "",
    "tags": [],
    "mood": "neutral",
    "category": "Daily Life",
    "subcategory": "",
    "people": [],
    "action_items": [],
}


def _extract_json(content: str) -> dict:
    """Extract JSON from a response that may be wrapped in markdown fences."""
    content = content.strip()

    # Try to extract from markdown fences
    fence_match = re.search(r"```(?:json)?\s*(.*?)\s*```", content, re.DOTALL)
    if fence_match:
        content = fence_match.group(1)

    return json.loads(content)


async def tag_transcript(transcript: str) -> dict:
    """Use Groq Llama to extract structured metadata from a transcript."""
    try:
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(
                GROQ_CHAT_URL,
                headers={
                    "Authorization": f"Bearer {settings.groq_api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": "llama-3.3-70b-versatile",
                    "messages": [
                        {"role": "system", "content": SYSTEM_PROMPT},
                        {"role": "user", "content": transcript},
                    ],
                    "temperature": 0.1,
                    "max_tokens": 500,
                    "response_format": {"type": "json_object"},
                },
            )
            resp.raise_for_status()
            data = resp.json()
            content = data["choices"][0]["message"]["content"]
            result = _extract_json(content)

            # Merge with defaults so missing keys don't break things
            return {**DEFAULT_METADATA, **result}

    except (httpx.HTTPStatusError, httpx.TimeoutException) as e:
        logger.error("Tagger API error: %s", e)
        return {**DEFAULT_METADATA, "title": transcript[:50].strip() + "..."}
    except (json.JSONDecodeError, KeyError, IndexError) as e:
        logger.error("Tagger JSON parse error: %s", e)
        return {**DEFAULT_METADATA, "title": transcript[:50].strip() + "..."}
    except Exception as e:
        logger.error("Tagger unexpected error: %s", e)
        return {**DEFAULT_METADATA, "title": transcript[:50].strip() + "..."}
