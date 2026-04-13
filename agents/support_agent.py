"""
Support Agent — Answers user questions about the Voice Journal app.

Uses Gemini 2.0 Flash with a product FAQ system prompt to generate
helpful, accurate responses.

Usage:
    python agents/support_agent.py "How do I record a voice note?"
    python agents/support_agent.py "What does the free plan include?"
"""

import asyncio
import sys

import httpx

from config import GEMINI_API_KEY, GEMINI_BASE_URL


# ---- Gemini helper ----

async def gemini_chat(prompt: str, system: str = "") -> str:
    url = f"{GEMINI_BASE_URL}?key={GEMINI_API_KEY}"
    body = {
        "contents": [{"parts": [{"text": prompt}]}],
        "systemInstruction": {"parts": [{"text": system}]} if system else None,
    }
    body = {k: v for k, v in body.items() if v is not None}
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post(url, json=body)
        resp.raise_for_status()
        data = resp.json()
        return data["candidates"][0]["content"]["parts"][0]["text"]


FAQ_SYSTEM_PROMPT = """You are a friendly support agent for Voice Journal — a voice-first journaling app.

Answer user questions accurately based on the product FAQ below. If a question is outside
what you know, say so honestly and suggest they email support@voicejournal.app.

Keep responses concise (2-4 paragraphs max). Use a warm, helpful tone.

---

PRODUCT FAQ:

**What is Voice Journal?**
Voice Journal is a voice-first journaling app. You record voice notes from your phone or
laptop browser, and AI automatically transcribes them and organizes everything for you.

**How does it work?**
1. Tap the mic button to record a voice note (any length)
2. AI transcribes your recording in seconds
3. AI extracts: title, summary, tags, mood, category, people mentioned, and action items
4. Your entry appears in your journal feed, organized by date and category
5. Search across all your entries with full-text search
6. Get weekly AI summaries of your journal activity
7. Ask your journal questions in natural language ("What did I say about my project last week?")

**What devices does it work on?**
Voice Journal is a Progressive Web App (PWA). It works in any modern browser — Chrome, Safari,
Firefox — on phones, tablets, and desktops. On mobile, you can add it to your home screen
for an app-like experience.

**Is my data private?**
Yes. Your recordings and transcripts are stored securely in your personal account.
We use industry-standard encryption. Your data is never shared with third parties
or used to train AI models.

**How much does it cost?**
Voice Journal is currently free during early access. We plan to offer:
- Free tier: Up to 30 entries/month, basic features
- Pro ($9/mo): Unlimited entries, weekly summaries, Ask Your Journal, priority support
- Premium ($19/mo): Everything in Pro + pattern detection, commitment tracking, proactive nudges

**What if my recording doesn't transcribe correctly?**
AI transcription is very accurate but not perfect. You can edit any transcript after it's
created. Accuracy improves with clear audio — try to record in a quiet environment.

**Can I export my data?**
Yes, you can export all your entries as JSON or plain text at any time.

**How do I delete my account?**
Go to Settings > Account > Delete Account. This permanently deletes all your data
including recordings and transcripts.

**Common issues:**
- Microphone not working: Make sure you've granted browser microphone permissions
- Recording too short: Minimum recording length is 2 seconds
- App not loading: Try clearing your browser cache or using an incognito window
- Entries not showing: Pull to refresh, or check your internet connection"""


async def answer_question(question: str) -> str:
    prompt = f"User question: {question}"
    return await gemini_chat(prompt, FAQ_SYSTEM_PROMPT)


async def run(question: str):
    print(f"Question: {question}\n")
    print("-" * 40)
    print()

    response = await answer_question(question)
    print(response)
    print()


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python agents/support_agent.py \"Your question here\"")
        print("Example: python agents/support_agent.py \"How do I record a voice note?\"")
        sys.exit(1)

    question = sys.argv[1]
    asyncio.run(run(question))
