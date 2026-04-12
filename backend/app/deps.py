from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from supabase import create_client

from app.config import settings

security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> dict:
    """Verify Supabase token by calling auth.get_user()."""
    try:
        supabase = create_client(settings.supabase_url, settings.supabase_service_key)
        resp = supabase.auth.get_user(credentials.credentials)
        if not resp or not resp.user:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED)
        return {"id": resp.user.id, "email": resp.user.email}
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
        )
