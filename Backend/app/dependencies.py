from fastapi import Cookie, HTTPException
from app.db import get_conn

COOKIE_NAME = "session_token"

def get_current_user(session_token: str | None = Cookie(default=None, alias=COOKIE_NAME)):
    if not session_token:
        raise HTTPException(status_code=401, detail="Not authenticated")

    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT u.id, u.full_name, u.email, u.phone_number, r.name AS role
                FROM user_sessions s
                JOIN users u ON u.id = s.user_id
                JOIN roles r ON r.id = u.role_id
                WHERE s.session_token = %s
                  AND s.is_active = TRUE
                  AND s.expires_at > NOW()
                  AND u.is_active = TRUE
                """,
                (session_token,)
            )
            user = cur.fetchone()

            if not user:
                raise HTTPException(status_code=401, detail="Session expired or invalid")

            cur.execute(
                """
                UPDATE user_sessions
                SET last_used_at = NOW()
                WHERE session_token = %s
                """,
                (session_token,)
            )
            conn.commit()

    return user