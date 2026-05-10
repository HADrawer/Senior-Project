# Backend/app/dependencies.py

import httpx
import logging
from fastapi import HTTPException, Header
from app.db import get_conn
import os
import time

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


def invalidate_auth_cache_for_user(user_id: str):
    stale_tokens = [
        token
        for token, (_, user) in _auth_cache.items()
        if str(user.get("id")) == str(user_id)
    ]

    for token in stale_tokens:
        _auth_cache.pop(token, None)


async def get_current_user(authorization: str | None = Header(default=None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing authorization header")

    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization header")

    token = authorization.replace("Bearer ", "").strip()

    cached_user = _get_cached_user(token)
    if cached_user:
        return cached_user

    # Verify token with Supabase Auth
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{SUPABASE_URL}/auth/v1/user",
            headers={
                "Authorization": f"Bearer {token}",
                "apikey": SUPABASE_SECRET_KEY,
            },
        )

    if response.status_code != 200:
        raise HTTPException(status_code=401, detail="Invalid session")

    user_data = response.json()

    if not user_data or "id" not in user_data:
        raise HTTPException(status_code=401, detail="Invalid token payload")

    user_id = user_data["id"]
    email = user_data.get("email", "")
    metadata = user_data.get("user_metadata", {})

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

                # Auto-create profile if it doesn't exist yet
                # (happens after email confirmation before trigger runs)
                if not user:
                    logger.info(f"Profile not found for {user_id}, creating one.")

                    cur.execute(
                        "SELECT id FROM roles WHERE name = 'user'"
                    )
                    role_row = cur.fetchone()

                    if not role_row:
                        raise HTTPException(status_code=500, detail="Default role not found")

                    full_name = metadata.get("full_name", email.split("@")[0])
                    phone_number = metadata.get("phone_number", "")
                    preferred_language = metadata.get("preferred_language", "en")

                    cur.execute(
                        """
                        INSERT INTO profiles (
                            id, full_name, email, phone_number,
                            role_id, preferred_language, is_active
                        )
                        VALUES (%s, %s, %s, %s, %s, %s, TRUE)
                        ON CONFLICT (id) DO NOTHING
                        RETURNING id
                        """,
                        (
                            user_id,
                            full_name,
                            email,
                            phone_number,
                            role_row["id"],
                            preferred_language,
                        ),
                    )
                    conn.commit()

                    # Fetch the newly created profile
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

                if not user:
                    raise HTTPException(status_code=500, detail="Failed to create user profile")

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
