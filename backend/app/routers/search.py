from fastapi import APIRouter, Depends, Query
from supabase import create_client

from app.config import settings
from app.deps import get_current_user

router = APIRouter()


def _get_supabase():
    return create_client(settings.supabase_url, settings.supabase_service_key)


@router.get("/")
async def search_entries(
    q: str = Query(min_length=1),
    limit: int = Query(default=20, le=100),
    user: dict = Depends(get_current_user),
):
    """Full-text search across journal entries using Postgres tsvector."""
    supabase = _get_supabase()
    result = supabase.rpc(
        "search_entries",
        {"search_query": q, "user_id_param": user["id"], "result_limit": limit},
    ).execute()
    return {"entries": result.data, "query": q}
