from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from supabase import create_client

from app.config import settings
from app.deps import get_current_user

router = APIRouter()


def _get_supabase():
    return create_client(settings.supabase_url, settings.supabase_service_key)


@router.get("/")
async def list_entries(
    limit: int = Query(default=20, le=100),
    offset: int = Query(default=0, ge=0),
    tag: str | None = None,
    mood: str | None = None,
    user: dict = Depends(get_current_user),
):
    """List journal entries with optional filters."""
    supabase = _get_supabase()
    query = (
        supabase.table("entries")
        .select("*")
        .eq("user_id", user["id"])
        .order("created_at", desc=True)
        .range(offset, offset + limit - 1)
    )

    if tag:
        query = query.contains("tags", [tag])
    if mood:
        query = query.eq("mood", mood)

    result = query.execute()
    return {"entries": result.data, "count": len(result.data)}


@router.get("/{entry_id}")
async def get_entry(
    entry_id: str,
    user: dict = Depends(get_current_user),
):
    """Get a single journal entry."""
    supabase = _get_supabase()
    result = (
        supabase.table("entries")
        .select("*")
        .eq("id", entry_id)
        .eq("user_id", user["id"])
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Entry not found")
    return {"entry": result.data[0]}


class EntryUpdate(BaseModel):
    title: str | None = None
    transcript: str | None = None
    tags: list[str] | None = None
    mood: str | None = None
    category: str | None = None
    action_items: list[str] | None = None


@router.patch("/{entry_id}")
async def update_entry(
    entry_id: str,
    body: EntryUpdate,
    user: dict = Depends(get_current_user),
):
    """Update an entry's metadata."""
    supabase = _get_supabase()
    updates = body.model_dump(exclude_none=True)
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")

    result = (
        supabase.table("entries")
        .update(updates)
        .eq("id", entry_id)
        .eq("user_id", user["id"])
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Entry not found")
    return {"entry": result.data[0]}


@router.delete("/{entry_id}")
async def delete_entry(
    entry_id: str,
    user: dict = Depends(get_current_user),
):
    """Delete a journal entry."""
    supabase = _get_supabase()
    result = (
        supabase.table("entries")
        .delete()
        .eq("id", entry_id)
        .eq("user_id", user["id"])
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Entry not found")
    return {"deleted": True}
