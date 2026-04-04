import os
from datetime import datetime, timedelta, timezone

from fastapi import FastAPI, HTTPException, Response, Cookie
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from app.db import get_conn
from app.security import hash_password, verify_password, generate_session_token
from app.schemas import RegisterRequest, LoginRequest

load_dotenv()

app = FastAPI()

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")
SESSION_HOURS = int(os.getenv("SESSION_HOURS", "24"))

app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

COOKIE_NAME = "session_token"

@app.post("/auth/register")
def register(data: RegisterRequest):
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT id FROM users WHERE email = %s",
                (data.email,)
            )
            existing_user = cur.fetchone()

            if existing_user:
                raise HTTPException(status_code=400, detail="Email already exists")

            cur.execute(
                "SELECT id FROM roles WHERE name = 'user'"
            )
            role = cur.fetchone()

            if not role:
                raise HTTPException(status_code=500, detail="Default role not found")

            cur.execute(
                """
                INSERT INTO users (
                    full_name, email, password_hash, phone_number, role_id
                )
                VALUES (%s, %s, %s, %s, %s)
                RETURNING id, full_name, email, phone_number
                """,
                (
                    data.full_name,
                    data.email,
                    hash_password(data.password),
                    data.phone_number,
                    role["id"],
                )
            )
            user = cur.fetchone()
            conn.commit()

    return {
        "message": "Registered successfully",
        "user": {
            "id": user["id"],
            "full_name": user["full_name"],
            "email": user["email"],
            "phone_number": user["phone_number"],
            "role": "user",
        },
    }

@app.post("/auth/login")
def login(data: LoginRequest, response: Response):
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT u.id, u.full_name, u.email, u.phone_number, u.password_hash, r.name AS role
                FROM users u
                JOIN roles r ON r.id = u.role_id
                WHERE u.email = %s AND u.is_active = TRUE
                """,
                (data.email,)
            )
            user = cur.fetchone()

            if not user or not verify_password(data.password, user["password_hash"]):
                raise HTTPException(status_code=401, detail="Invalid email or password")

            token = generate_session_token()
            now = datetime.now(timezone.utc)
            expires_at = now + timedelta(hours=SESSION_HOURS)

            cur.execute(
                """
                INSERT INTO user_sessions (user_id, session_token, expires_at, is_active)
                VALUES (%s, %s, %s, TRUE)
                """,
                (user["id"], token, expires_at)
            )
            conn.commit()

    response.set_cookie(
        key=COOKIE_NAME,
        value=token,
        httponly=True,
        secure=False,  # True in production with HTTPS
        samesite="lax",
        max_age=SESSION_HOURS * 3600,
        path="/",
    )

    return {
        "message": "Logged in successfully",
        "user": {
            "id": user["id"],
            "full_name": user["full_name"],
            "email": user["email"],
            "phone_number": user["phone_number"],
            "role": user["role"],
        },
    }

@app.get("/auth/me")
def me(session_token: str | None = Cookie(default=None, alias=COOKIE_NAME)):
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

    return {
        "id": user["id"],
        "full_name": user["full_name"],
        "email": user["email"],
        "phone_number": user["phone_number"],
        "role": user["role"],
    }

@app.post("/auth/logout")
def logout(response: Response, session_token: str | None = Cookie(default=None, alias=COOKIE_NAME)):
    if session_token:
        with get_conn() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    UPDATE user_sessions
                    SET is_active = FALSE
                    WHERE session_token = %s
                    """,
                    (session_token,)
                )
                conn.commit()

    response.delete_cookie(key=COOKIE_NAME, path="/")
    return {"message": "Logged out successfully"}