import os
from datetime import datetime, timedelta, timezone

from fastapi import FastAPI, HTTPException, Response, Cookie
from fastapi.middleware.cors import CORSMiddleware
from fastapi import Depends
from dotenv import load_dotenv


from app.dependencies import get_current_user
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
def me(current_user = Depends(get_current_user)):
    return {
        "id": current_user["id"],
        "full_name": current_user["full_name"],
        "email": current_user["email"],
        "phone_number": current_user["phone_number"],
        "role": current_user["role"],
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


@app.get("/plans/my-plans")
def get_my_plans(current_user = Depends(get_current_user)):
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT
                    id,
                    title,
                    budget,
                    days,
                    preferences,
                    user_interests,
                    travel_styles,
                    category,
                    place,
                    status,
                    generated_by_ai,
                    created_at,
                    updated_at
                FROM plans
                WHERE user_id = %s
                  AND status != 'deleted'
                ORDER BY created_at DESC
                """,
                (current_user["id"],)
            )
            plans = cur.fetchall()

    return plans

@app.post("/plans")
def create_plan(data: CreatePlanRequest, current_user = Depends(get_current_user)):
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO plans (
                    user_id,
                    title,
                    budget,
                    days,
                    preferences,
                    user_interests,
                    travel_styles,
                    status,
                    generated_by_ai
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, 'saved', FALSE)
                RETURNING id
                """,
                (
                    current_user["id"],
                    data.title,
                    data.budget,
                    data.days,
                    data.preferences,
                    data.user_interests,
                    data.travel_styles,
                )
            )

            plan = cur.fetchone()
            conn.commit()

    return {
        "message": "Plan created",
        "plan_id": plan["id"]
    }


@app.get("/plans/{plan_id}")
def get_plan(plan_id: int, current_user = Depends(get_current_user)):
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT *
                FROM plans
                WHERE id = %s
                  AND user_id = %s
                  AND status != 'deleted'
                """,
                (plan_id, current_user["id"])
            )

            plan = cur.fetchone()

            if not plan:
                raise HTTPException(status_code=404, detail="Plan not found")

    return plan

@app.put("/plans/{plan_id}")
def update_plan(plan_id: int, data: UpdatePlanRequest, current_user = Depends(get_current_user)):
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT id
                FROM plans
                WHERE id = %s
                  AND user_id = %s
                  AND status != 'deleted'
                """,
                (plan_id, current_user["id"])
            )
            existing_plan = cur.fetchone()

            if not existing_plan:
                raise HTTPException(status_code=404, detail="Plan not found")

            cur.execute(
                """
                UPDATE plans
                SET
                    title = %s,
                    days = %s,
                    budget = %s,
                    preferences = %s,
                    user_interests = %s,
                    travel_styles = %s,
                    category = %s,
                    place = %s,
                    updated_at = NOW()
                WHERE id = %s
                  AND user_id = %s
                RETURNING id
                """,
                (
                    data.title,
                    data.days,
                    data.budget,
                    data.preferences,
                    data.user_interests,
                    data.travel_styles,
                    data.category,
                    data.place,
                    plan_id,
                    current_user["id"],
                )
            )
            updated_plan = cur.fetchone()
            conn.commit()

    return {
        "message": "Plan updated successfully",
        "plan_id": updated_plan["id"],
    }


@app.delete("/plans/{plan_id}")
def delete_plan(plan_id: int, current_user = Depends(get_current_user)):
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT id
                FROM plans
                WHERE id = %s
                  AND user_id = %s
                  AND status != 'deleted'
                """,
                (plan_id, current_user["id"])
            )
            existing_plan = cur.fetchone()

            if not existing_plan:
                raise HTTPException(status_code=404, detail="Plan not found")

            cur.execute(
                """
                UPDATE plans
                SET
                    status = 'deleted',
                    updated_at = NOW()
                WHERE id = %s
                  AND user_id = %s
                """,
                (plan_id, current_user["id"])
            )
            conn.commit()

    return {"message": "Plan deleted successfully"}