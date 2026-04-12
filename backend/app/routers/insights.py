from datetime import date, timedelta

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from supabase import create_client

from app.config import settings
from app.deps import get_current_user
from app.services.summarizer import ask_journal, generate_weekly_summary

router = APIRouter()


def _get_supabase():
    return create_client(settings.supabase_url, settings.supabase_service_key)


@router.get("/weekly")
async def weekly_summary(
    week_of: date | None = None,
    user: dict = Depends(get_current_user),
):
    """Get or generate weekly summary."""
    supabase = _get_supabase()

    if week_of is None:
        today = date.today()
        week_of = today - timedelta(days=today.weekday())

    week_end = week_of + timedelta(days=6)

    # Check for cached summary
    cached = (
        supabase.table("weekly_summaries")
        .select("*")
        .eq("user_id", user["id"])
        .eq("week_start", week_of.isoformat())
        .execute()
    )
    if cached.data:
        return {"summary": cached.data[0]}

    # Fetch entries for the week
    entries = (
        supabase.table("entries")
        .select("*")
        .eq("user_id", user["id"])
        .gte("created_at", week_of.isoformat())
        .lte("created_at", week_end.isoformat() + "T23:59:59")
        .order("created_at")
        .execute()
    )

    if not entries.data:
        return {"summary": None, "message": "No entries for this week"}

    # Generate summary
    summary_data = await generate_weekly_summary(entries.data, week_of)

    # Cache it
    record = {
        "user_id": user["id"],
        "week_start": week_of.isoformat(),
        "week_end": week_end.isoformat(),
        **summary_data,
    }
    result = supabase.table("weekly_summaries").insert(record).execute()

    return {"summary": result.data[0] if result.data else record}


class AskRequest(BaseModel):
    question: str


@router.post("/ask")
async def ask_journal_endpoint(
    body: AskRequest,
    days: int = Query(default=30, le=90),
    user: dict = Depends(get_current_user),
):
    """Ask a question about your journal entries."""
    supabase = _get_supabase()

    # Fetch recent entries for context
    cutoff = (date.today() - timedelta(days=days)).isoformat()
    entries = (
        supabase.table("entries")
        .select("id, title, transcript, summary, tags, mood, created_at")
        .eq("user_id", user["id"])
        .gte("created_at", cutoff)
        .order("created_at", desc=True)
        .limit(50)
        .execute()
    )

    # Get conversation history
    history_result = (
        supabase.table("ask_journal_messages")
        .select("role, content")
        .eq("user_id", user["id"])
        .order("created_at", desc=True)
        .limit(10)
        .execute()
    )
    history = list(reversed(history_result.data)) if history_result.data else []

    answer = await ask_journal(body.question, entries.data or [], history)

    # Save conversation
    supabase.table("ask_journal_messages").insert([
        {"user_id": user["id"], "role": "user", "content": body.question},
        {"user_id": user["id"], "role": "assistant", "content": answer},
    ]).execute()

    return {"answer": answer, "entries_used": len(entries.data or [])}
