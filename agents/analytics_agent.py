"""
Analytics Agent — Daily briefing on voice journal usage.

Queries Supabase for key metrics, then uses Gemini 2.0 Flash
to format a concise daily briefing.

Usage:
    python agents/analytics_agent.py
"""

import asyncio
from datetime import datetime, timedelta

import httpx

from config import supabase, GEMINI_API_KEY, GEMINI_BASE_URL


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


# ---- Data queries ----

def get_metrics() -> dict:
    """Pull key metrics from Supabase."""
    now = datetime.utcnow()
    week_ago = (now - timedelta(days=7)).isoformat()

    # Total users
    total_users = supabase.table("profiles").select("id", count="exact").execute()

    # New signups this week
    new_users = (
        supabase.table("profiles")
        .select("id", count="exact")
        .gte("created_at", week_ago)
        .execute()
    )

    # Total entries
    total_entries = supabase.table("entries").select("id", count="exact").execute()

    # Entries this week
    weekly_entries = (
        supabase.table("entries")
        .select("id", count="exact")
        .gte("created_at", week_ago)
        .execute()
    )

    # Most active users (top 5 by entry count this week)
    active_users = (
        supabase.table("entries")
        .select("user_id")
        .gte("created_at", week_ago)
        .execute()
    )
    user_counts = {}
    for row in active_users.data:
        uid = row["user_id"]
        user_counts[uid] = user_counts.get(uid, 0) + 1
    top_users = sorted(user_counts.items(), key=lambda x: x[1], reverse=True)[:5]

    # Top moods this week
    mood_entries = (
        supabase.table("entries")
        .select("mood")
        .gte("created_at", week_ago)
        .not_.is_("mood", "null")
        .execute()
    )
    mood_counts = {}
    for row in mood_entries.data:
        m = row["mood"]
        if m:
            mood_counts[m] = mood_counts.get(m, 0) + 1
    top_moods = sorted(mood_counts.items(), key=lambda x: x[1], reverse=True)[:5]

    # Top categories this week
    cat_entries = (
        supabase.table("entries")
        .select("category")
        .gte("created_at", week_ago)
        .not_.is_("category", "null")
        .execute()
    )
    cat_counts = {}
    for row in cat_entries.data:
        c = row["category"]
        if c:
            cat_counts[c] = cat_counts.get(c, 0) + 1
    top_categories = sorted(cat_counts.items(), key=lambda x: x[1], reverse=True)[:5]

    return {
        "date": now.strftime("%Y-%m-%d"),
        "total_users": total_users.count or 0,
        "new_users_this_week": new_users.count or 0,
        "total_entries": total_entries.count or 0,
        "entries_this_week": weekly_entries.count or 0,
        "top_users": top_users,
        "top_moods": top_moods,
        "top_categories": top_categories,
    }


# ---- Main ----

async def run():
    metrics = get_metrics()

    prompt = f"""Here are the Voice Journal app metrics for {metrics['date']}:

- Total users: {metrics['total_users']}
- New signups this week: {metrics['new_users_this_week']}
- Total entries: {metrics['total_entries']}
- Entries this week: {metrics['entries_this_week']}
- Most active users (user_id, count): {metrics['top_users']}
- Top moods: {metrics['top_moods']}
- Top categories: {metrics['top_categories']}

Write a concise daily briefing (5-8 bullet points) summarizing these metrics.
Highlight anything notable — growth trends, engagement patterns, popular moods/categories.
Keep it actionable and direct. No fluff."""

    system = "You are an analytics assistant for a voice journaling app. Write concise, data-driven briefings for the founder."

    briefing = await gemini_chat(prompt, system)

    print("=" * 60)
    print(f"  VOICE JOURNAL — DAILY BRIEFING ({metrics['date']})")
    print("=" * 60)
    print()
    print(briefing)
    print()
    print("=" * 60)


if __name__ == "__main__":
    asyncio.run(run())
