import json

import httpx

from app.config import settings

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


async def tag_transcript(transcript: str) -> dict:
    """Use Groq Llama to extract structured metadata from a transcript."""
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

        # Parse JSON from response, stripping markdown fences if present
        content = content.strip()
        if content.startswith("```"):
            content = content.split("\n", 1)[1]
            content = content.rsplit("```", 1)[0]

        return json.loads(content)
