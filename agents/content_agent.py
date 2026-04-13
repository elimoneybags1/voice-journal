"""
Content Agent — Generates Twitter/X threads and blog posts about voice journaling.

Uses Gemini 2.0 Flash to create marketing content for the Voice Journal app.

Usage:
    python agents/content_agent.py
    python agents/content_agent.py "voice journaling for entrepreneurs"
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


SYSTEM_PROMPT = """You are a content marketer for Voice Journal — a voice-first journaling app.
The app lets you record voice notes from your phone or laptop, which get transcribed and
automatically organized by AI (mood, category, tags, action items, people mentioned).
It has weekly AI summaries, full-text search, and an "Ask Your Journal" chat feature.

Target audience: busy professionals, ADHD individuals, people who hate typing,
self-improvement enthusiasts, therapists recommending journaling to clients.

Voice: authentic, relatable, practical. Not corporate. Think indie maker on Twitter."""


async def generate_twitter_thread(topic: str) -> str:
    prompt = f"""Write a Twitter/X thread (3-5 tweets) about: {topic}

Rules:
- First tweet should be a hook that stops the scroll
- Each tweet under 280 characters
- Use line breaks within tweets for readability
- Last tweet should be a soft CTA (not salesy)
- Number each tweet (1/, 2/, etc.)
- No hashtags in the first tweet, max 2 hashtags in the last tweet"""

    return await gemini_chat(prompt, SYSTEM_PROMPT)


async def generate_blog_post(topic: str) -> str:
    prompt = f"""Write a short blog post (~500 words) about: {topic}

Requirements:
- SEO-optimized title with the main keyword
- Opening paragraph that hooks the reader with a relatable problem
- 3-4 subheadings (H2) breaking up the content
- Practical tips, not generic advice
- Natural mention of voice journaling as a solution (not pushy)
- End with a brief conclusion and soft CTA
- Write in first person, conversational tone"""

    return await gemini_chat(prompt, SYSTEM_PROMPT)


async def run(topic: str):
    print("Generating content...\n")

    # Run both in parallel
    thread, blog = await asyncio.gather(
        generate_twitter_thread(topic),
        generate_blog_post(topic),
    )

    print("=" * 60)
    print(f"  TWITTER/X THREAD — {topic}")
    print("=" * 60)
    print()
    print(thread)
    print()

    print("=" * 60)
    print(f"  BLOG POST — {topic}")
    print("=" * 60)
    print()
    print(blog)
    print()
    print("=" * 60)


if __name__ == "__main__":
    topic = sys.argv[1] if len(sys.argv) > 1 else "voice journaling for ADHD"
    asyncio.run(run(topic))
