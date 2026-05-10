import httpx
import logging
from fastapi import HTTPException, Header
from app.db import get_conn
import os
import time

# إعداد logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SECRET_KEY = os.getenv("SUPABASE_SECRET_KEY")
AUTH_CACHE_TTL_SECONDS = int(os.getenv("AUTH_CACHE_TTL_SECONDS", "60"))
_auth_cache = {}


def _get_cached_user(token: str):
    cached = _auth_cache.get(token)

    if not cached:
        return None

    expires_at, user = cached

    if expires_at <= time.monotonic():
        _auth_cache.pop(token, None)
        return None

    return dict(user)


def _cache_user(token: str, user: dict):
    _auth_cache[token] = (
        time.monotonic() + AUTH_CACHE_TTL_SECONDS,
        dict(user),
    )

async def get_current_user(authorization: str | None = Header(default=None)):
    logger.debug(f"Authorization header received: {authorization[:20] if authorization else 'None'}...")
    
    if not authorization:
        logger.warning("No authorization header")
        raise HTTPException(status_code=401, detail="Missing authorization header")

    if not authorization.startswith("Bearer "):
        logger.warning("Invalid authorization header format")
        raise HTTPException(status_code=401, detail="Invalid authorization header")

    token = authorization.replace("Bearer ", "").strip()
    logger.debug(f"Token extracted (first 20 chars): {token[:20]}...")

    cached_user = _get_cached_user(token)
    if cached_user:
        return cached_user

    # التحقق من التوكن مع Supabase Auth
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{SUPABASE_URL}/auth/v1/user", 
            headers={
                "Authorization": f"Bearer {token}",
                "apikey": SUPABASE_SECRET_KEY  # أضف هذا
            },
        )
    
    logger.debug(f"Supabase Auth response status: {response.status_code}")
    
    if response.status_code != 200:
        logger.error(f"Auth failed: {response.status_code} - {response.text}")
        raise HTTPException(status_code=401, detail="Invalid session")

    user_data = response.json()
    logger.debug(f"User data from Supabase: {user_data.get('id') if user_data else 'None'}")

    if not user_data or "id" not in user_data:
        raise HTTPException(status_code=401, detail="Invalid token payload")

    user_id = user_data["id"]
    email = user_data.get("email")

    # التحقق من قاعدة البيانات
    try:
        with get_conn() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    SELECT
                        p.id,
                        p.full_name,
                        p.email,
                        p.phone_number,
                        p.preferred_language,
                        p.is_active,
                        r.name AS role
                    FROM profiles p
                    LEFT JOIN roles r ON r.id = p.role_id
                    WHERE p.id = %s
                    """,
                    (user_id,),
                )
                
                user = cur.fetchone()
                logger.debug(f"Database query result: {'Found' if user else 'Not found'}")
                
                if not user:
                    raise HTTPException(status_code=401, detail="User profile not found")
                
                if not user.get("is_active", True):
                    raise HTTPException(status_code=403, detail="Account is disabled")
                
                if not user.get("email") and email:
                    user["email"] = email
                    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Database error: {str(e)}")
        raise HTTPException(status_code=500, detail="Database connection error")
    
    _cache_user(token, user)
    return user
