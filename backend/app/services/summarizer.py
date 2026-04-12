import json
from datetime import date

import httpx

from app.config import settings

GROQ_CHAT_URL = "https://api.groq.com/openai/v1/chat/completions"


async def _groq_chat(system: str, user: str, max_tokens: int = 1000) -> str:
    """Call Groq chat API."""
    async with httpx.AsyncClient(timeout=60) as client:
        resp = await client.post(
            GROQ_CHAT_URL,
            headers={
                "Authorization": f"Bearer {settings.groq_api_key}",
                "Content-Type": "application/json",
            },
            json={
                "model": "llama-3.3-70b-versatile",
                "messages": [
                    {"role": "system", "content": system},
                    {"role": "user", "content": user},
                ],
                "temperature": 0.3,
                "max_tokens": max_tokens,
            },
        )
        resp.raise_for_status()
        data = resp.json()
        return data["choices"][0]["message"]["content"]


async def generate_weekly_summary(entries: list[dict], week_start: date) -> dict:
    """Generate a weekly digest from journal entries."""
    entries_text = "\n\n---\n\n".join(
        f"**{e['title']}** ({e['created_at'][:10]})\n{e['summary']}\nTags: {', '.join(e.get('tags', []))}\nMood: {e.get('mood', 'unknown')}"
        for e in entries
    )

    system = """You are a thoughtful journal assistant. Given a week's journal entries, write a weekly summary.

Return ONLY valid JSON:
{
  "summary": "2-3 paragraph narrative of the week",
  "themes": ["recurring theme 1", "theme 2"],
  "mood_trend": "overall mood trajectory",
  "highlights": ["key moment 1", "key moment 2"],
  "open_action_items": ["unresolved items"]
}"""

    content = await _groq_chat(system, f"Week of {week_start}:\n\n{entries_text}")
    content = content.strip()
    if content.startswith("```"):
        content = content.split("\n", 1)[1]
        content = content.rsplit("```", 1)[0]
    return json.loads(content)


async def ask_journal(question: str, entries: list[dict], history: list[dict] | None = None) -> str:
    """Answer a question about the user's journal entries."""
    entries_text = "\n\n---\n\n".join(
        f"**{e['title']}** ({e['created_at'][:10]})\n{e['transcript']}"
        for e in entries
    )

    system = f"""You are a personal journal assistant. The user is asking about their own journal entries.

Here are their recent journal entries:

{entries_text}

Answer their question based on the entries. Be personal, insightful, and reference specific entries when relevant. If you can't find relevant info, say so honestly."""

    messages_text = question
    if history:
        messages_text = "\n".join(
            f"{'User' if m['role'] == 'user' else 'Assistant'}: {m['content']}"
            for m in history
        ) + f"\nUser: {question}"

    return await _groq_chat(system, messages_text, max_tokens=1500)
