from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from supabase import create_client

from app.config import settings
from app.deps import get_current_user

router = APIRouter()


def _get_supabase():
    return create_client(settings.supabase_url, settings.supabase_service_key)


@router.get("/me")
async def get_profile(user: dict = Depends(get_current_user)):
    """Fetch the current user's profile."""
    supabase = _get_supabase()
    result = (
        supabase.table("profiles")
        .select("*")
        .eq("id", user["id"])
        .execute()
    )
    if not result.data:
        # Auto-create profile if missing
        result = (
            supabase.table("profiles")
            .insert({"id": user["id"]})
            .execute()
        )
    return {"profile": result.data[0]}


class ProfileUpdate(BaseModel):
    timezone: str | None = None
    preferences: dict | None = None


@router.patch("/me")
async def update_profile(
    body: ProfileUpdate,
    user: dict = Depends(get_current_user),
):
    """Update the current user's profile."""
    supabase = _get_supabase()
    updates = body.model_dump(exclude_none=True)
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")

    # If updating preferences, merge with existing
    if "preferences" in updates:
        existing = (
            supabase.table("profiles")
            .select("preferences")
            .eq("id", user["id"])
            .execute()
        )
        current_prefs = (existing.data[0]["preferences"] or {}) if existing.data else {}
        current_prefs.update(updates["preferences"])
        updates["preferences"] = current_prefs

    result = (
        supabase.table("profiles")
        .update(updates)
        .eq("id", user["id"])
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Profile not found")
    return {"profile": result.data[0]}
