import json
import logging
import re

import httpx

from app.config import settings

logger = logging.getLogger(__name__)

GROQ_CHAT_URL = "https://api.groq.com/openai/v1/chat/completions"

SYSTEM_PROMPT = """You classify voice journal transcripts as either a journal entry or a command.

Return ONLY valid JSON with this structure:
{
  "intent": "journal_entry" or "command",
  "confidence": 0.0 to 1.0,
  "command_type": null or one of: "create_folder", "delete_entry", "move_entry",
  "params": null or object with command parameters
}

Command examples and their params:
- "make a folder called BTC Trading" → {"intent":"command","confidence":0.95,"command_type":"create_folder","params":{"folder_name":"BTC Trading"}}
- "create a new folder for health stuff" → {"intent":"command","confidence":0.9,"command_type":"create_folder","params":{"folder_name":"Health"}}
- "delete my last entry" → {"intent":"command","confidence":0.9,"command_type":"delete_entry","params":{"target":"last"}}
- "delete the entry about morning walk" → {"intent":"command","confidence":0.85,"command_type":"delete_entry","params":{"target":"morning walk"}}
- "move my last entry to the Trading folder" → {"intent":"command","confidence":0.9,"command_type":"move_entry","params":{"target":"last","folder_name":"Trading"}}

Rules:
- Default to journal_entry when unsure (confidence < 0.7)
- Commands are short, imperative instructions about organizing the journal itself
- Journal entries are personal reflections, notes, thoughts, updates about life/work
- If the transcript is about events, feelings, plans, ideas — it's a journal_entry
- Only classify as command when the user is clearly giving an instruction to the app"""

DESTRUCTIVE_COMMANDS = {"delete_entry"}
DESTRUCTIVE_THRESHOLD = 0.85
DEFAULT_THRESHOLD = 0.7


def _extract_json(content: str) -> dict:
    """Extract JSON from a response that may be wrapped in markdown fences."""
    content = content.strip()
    fence_match = re.search(r"```(?:json)?\s*(.*?)\s*```", content, re.DOTALL)
    if fence_match:
        content = fence_match.group(1)
    return json.loads(content)


async def classify_intent(transcript: str) -> dict:
    """Classify a transcript as journal_entry or command.

    Returns dict with keys: intent, confidence, command_type, params.
    Defaults to journal_entry on any error.
    """
    default = {
        "intent": "journal_entry",
        "confidence": 1.0,
        "command_type": None,
        "params": None,
    }

    try:
        async with httpx.AsyncClient(timeout=15) as client:
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
                    "max_tokens": 200,
                    "response_format": {"type": "json_object"},
                },
            )
            resp.raise_for_status()
            data = resp.json()
            content = data["choices"][0]["message"]["content"]
            result = _extract_json(content)

            intent = result.get("intent", "journal_entry")
            confidence = float(result.get("confidence", 0))
            command_type = result.get("command_type")

            # Apply thresholds
            if intent == "command":
                threshold = (
                    DESTRUCTIVE_THRESHOLD
                    if command_type in DESTRUCTIVE_COMMANDS
                    else DEFAULT_THRESHOLD
                )
                if confidence < threshold:
                    logger.info(
                        "Intent confidence %.2f below threshold %.2f, defaulting to journal_entry",
                        confidence,
                        threshold,
                    )
                    return default

            return {
                "intent": intent,
                "confidence": confidence,
                "command_type": command_type,
                "params": result.get("params"),
            }

    except Exception as e:
        logger.error("Intent classification failed: %s", e)
        return default
