from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from supabase import create_client

from app.config import settings
from app.deps import get_current_user

router = APIRouter()


def _get_supabase():
    return create_client(settings.supabase_url, settings.supabase_service_key)


@router.get("/")
async def list_folders(user: dict = Depends(get_current_user)):
    """List user's custom folders."""
    supabase = _get_supabase()
    result = (
        supabase.table("folders")
        .select("*")
        .eq("user_id", user["id"])
        .order("sort_order")
        .order("name")
        .execute()
    )
    return {"folders": result.data}


class FolderCreate(BaseModel):
    name: str
    parent_id: str | None = None
    icon: str = "folder"


@router.post("/")
async def create_folder(
    body: FolderCreate,
    user: dict = Depends(get_current_user),
):
    """Create a new folder."""
    supabase = _get_supabase()
    data = {
        "user_id": user["id"],
        "name": body.name.strip(),
        "icon": body.icon,
    }
    if body.parent_id:
        data["parent_id"] = body.parent_id

    result = supabase.table("folders").insert(data).execute()
    if not result.data:
        raise HTTPException(status_code=400, detail="Failed to create folder")
    return {"folder": result.data[0]}


class FolderUpdate(BaseModel):
    name: str | None = None
    icon: str | None = None
    sort_order: int | None = None


@router.patch("/{folder_id}")
async def update_folder(
    folder_id: str,
    body: FolderUpdate,
    user: dict = Depends(get_current_user),
):
    """Rename or update a folder."""
    supabase = _get_supabase()
    updates = body.model_dump(exclude_none=True)
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")

    result = (
        supabase.table("folders")
        .update(updates)
        .eq("id", folder_id)
        .eq("user_id", user["id"])
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Folder not found")
    return {"folder": result.data[0]}


@router.delete("/{folder_id}")
async def delete_folder(
    folder_id: str,
    user: dict = Depends(get_current_user),
):
    """Delete a folder. Entries in it get folder_id set to null."""
    supabase = _get_supabase()
    result = (
        supabase.table("folders")
        .delete()
        .eq("id", folder_id)
        .eq("user_id", user["id"])
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Folder not found")
    return {"deleted": True}
