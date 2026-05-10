import os
import json
import time
import httpx

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi import Depends
from dotenv import load_dotenv
from google import genai
from google.genai import errors
from urllib.parse import quote_plus

from app.dependencies import get_current_user, invalidate_auth_cache_for_user
from app.db import get_conn
from app.schemas import (
    UpdatePlanRequest,
    CreatePlanRequest,
    PlanChatRequest,
    GenerateAIPlanRequest,
    UpdateSettingsRequest,
)
from app.logger import create_log

load_dotenv()

app = FastAPI()

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

FRONTEND_URL = os.getenv("FRONTEND_URL", "https://senior-project-flame.vercel.app")
SESSION_HOURS = int(os.getenv("SESSION_HOURS", "24"))

allowed_origins = [
    FRONTEND_URL.rstrip("/"),
    "https://senior-project-flame.vercel.app",
    "http://localhost:3000",
]
# Remove duplicates while preserving order
allowed_origins = list(dict.fromkeys(allowed_origins))


app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
)
GEMINI_MODELS = [
    "gemini-2.5-flash",
    "gemini-flash-latest",
    "gemini-flash-lite-latest",
]

def generate_with_retry(prompt: str):
    last_error = None

    for model in GEMINI_MODELS:
        for attempt in range(3):
            try:
                response = client.models.generate_content(
                    model=model,
                    contents=prompt
                )
                return response

            except errors.ClientError as e:
                last_error = e

                if e.status_code == 503:
                    time.sleep(1.5 * (attempt + 1))
                    continue

                if e.status_code == 429:
                    time.sleep(2 * (attempt + 1))
                    continue

                raise e

    raise HTTPException(
        status_code=503,
        detail="AI service is busy right now. Please try again in a moment."
    )

COOKIE_NAME = "session_token"

# @app.post("/auth/register")
# def register(data: RegisterRequest):
#     with get_conn() as conn:
#         with conn.cursor() as cur:
#             cur.execute(
#                 "SELECT id FROM users WHERE email = %s",
#                 (data.email,)
#             )
#             existing_user = cur.fetchone()

#             if existing_user:
#                 raise HTTPException(status_code=400, detail="Email already exists")

#             cur.execute(
#                 "SELECT id FROM roles WHERE name = 'user'"
#             )
#             role = cur.fetchone()

#             if not role:
#                 raise HTTPException(status_code=500, detail="Default role not found")

#             cur.execute(
#                 """
#                 INSERT INTO users (
#                     full_name, email, password_hash, phone_number, role_id
#                 )
#                 VALUES (%s, %s, %s, %s, %s)
#                 RETURNING id, full_name, email, phone_number
#                 """,
#                 (
#                     data.full_name,
#                     data.email,
#                     hash_password(data.password),
#                     data.phone_number,
#                     role["id"],
#                 )
#             )
#             user = cur.fetchone()
#             conn.commit()

#         create_log(
#             user_id=user["id"],
#             action_type="register",
#             entity_type="user",
#             entity_id=user["id"],
#             metadata={
#                 "email": data.email,
#                 "message": "New user registered"
#             },
#         )

#     return {
#         "message": "Registered successfully",
#         "user": {
#             "id": user["id"],
#             "full_name": user["full_name"],
#             "email": user["email"],
#             "phone_number": user["phone_number"],
#             "role": "user",
#         },
#     }

# @app.post("/auth/login")
# def login(data: LoginRequest, response: Response):
#     with get_conn() as conn:
#         with conn.cursor() as cur:
#             cur.execute(
#                 """
#                 SELECT u.id, u.full_name, u.email, u.phone_number, u.password_hash, r.name AS role
#                 FROM users u
#                 JOIN roles r ON r.id = u.role_id
#                 WHERE u.email = %s AND u.is_active = TRUE
#                 """,
#                 (data.email,)
#             )
#             user = cur.fetchone()

#             if not user or not verify_password(data.password, user["password_hash"]):
#                 create_log(
#                     user_id=current_user["id"],
#                     action_type="ai_rejected_prompt",
#                     entity_type="plan",
#                     entity_id=None,
#                     metadata={
#                         "title": data.title,
#                         "message": "AI rejected request outside Bahrain tourism planning"
#                     },
#                 )
#                 raise HTTPException(status_code=401, detail="Invalid email or password")

#             token = generate_session_token()
#             now = datetime.now(timezone.utc)
#             expires_at = now + timedelta(hours=SESSION_HOURS)

#             cur.execute(
#                 """
#                 INSERT INTO user_sessions (user_id, session_token, expires_at, is_active)
#                 VALUES (%s, %s, %s, TRUE)
#                 """,
#                 (user["id"], token, expires_at)
#             )
#             conn.commit()

#     response.set_cookie(
#         key=COOKIE_NAME,
#         value=token,
#         httponly=True,
#         secure=False,  # True in production with HTTPS
#         samesite="lax",
#         max_age=SESSION_HOURS * 3600,
#         path="/",
#     )
#     create_log(
#         user_id=user["id"],
#         action_type="login_success",
#         entity_type="user",
#         entity_id=user["id"],
#         metadata={
#             "email": user["email"],
#             "message": "User logged in successfully"
#         },
#     )

#     return {
#         "message": "Logged in successfully",
#         "user": {
#             "id": user["id"],
#             "full_name": user["full_name"],
#             "email": user["email"],
#             "phone_number": user["phone_number"],
#             "role": user["role"],
#         },
#     }

@app.get("/auth/me")
def me(current_user=Depends(get_current_user)):
    return {
        "id": current_user["id"],
        "full_name": current_user["full_name"],
        "email": current_user["email"],
        "phone_number": current_user["phone_number"],
        "preferred_language": current_user.get("preferred_language", "en"),
        "role": current_user["role"],
    }

# @app.post("/auth/logout")
# def logout(response: Response, session_token: str | None = Cookie(default=None, alias=COOKIE_NAME)):
#     if session_token:
#         with get_conn() as conn:
#             with conn.cursor() as cur:
#                 cur.execute(
#                     """
#                     UPDATE user_sessions
#                     SET is_active = FALSE
#                     WHERE session_token = %s
#                     """,
#                     (session_token,)
#                 )
#                 conn.commit()

#     response.delete_cookie(key=COOKIE_NAME, path="/")
#     return {"message": "Logged out successfully"}


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

def clean_ai_json(raw_text: str) -> str:
    raw_text = raw_text.strip()

    if raw_text.startswith("```json"):
        raw_text = raw_text.replace("```json", "", 1).strip()

    if raw_text.startswith("```"):
        raw_text = raw_text.replace("```", "", 1).strip()

    if raw_text.endswith("```"):
        raw_text = raw_text[:-3].strip()

    return raw_text


def parse_interests(value: str | None) -> list[str]:
    interests = [
        interest.strip()
        for interest in (value or "").split(",")
        if interest.strip()
    ]

    return interests or ["Bahrain tourism"]


def format_plan_preferences(
    preferences: list[str] | str | None,
    extra_preferences: str | None = None,
    constraints: list[str] | None = None,
) -> str | None:
    if isinstance(preferences, str):
        selected_preferences = parse_interests(preferences)
    else:
        selected_preferences = [
            preference.strip()
            for preference in (preferences or [])
            if preference and preference.strip()
        ]

    parts = []

    if selected_preferences:
        parts.append(f"Preferences: {', '.join(selected_preferences)}")

    if extra_preferences:
        parts.append(f"Extra preferences: {extra_preferences}")

    if constraints:
        parts.append(f"Constraints: {', '.join(constraints)}")

    return ". ".join(parts) if parts else None


def build_plan_prompt_from_values(
    title: str,
    days: int,
    budget: float | None,
    selected_preferences: list[str],
    travel_style: str | None,
    extra_preferences: str | None,
    constraints: list[str] | None,
    people_count: int,
    language: str = "auto",
    category: str | None = None,
    place: str | None = None,
) -> str:
        preferences_text = ", ".join(selected_preferences)
        constraints_text = ", ".join(constraints or [])

        language_instruction = (
            "Detect the user's language from the input and reply in the same language."
            if language == "auto"
            else f"Reply in this language: {language}."
        )

        category_instruction = (
            f"Preferred category: {category}."
            if category
            else "Preferred category: any suitable Bahrain tourism category."
        )
        place_instruction = (
            f"Preferred place or area: {place}."
            if place
            else "Preferred place or area: any suitable place in Bahrain."
        )

        return f"""
    You are Alsaeh.bh, an AI tourism planner specialized only in Bahrain tourism.

    Your task is to generate a realistic tourism itinerary in Bahrain only.

    User input:
    Title: {title}
    Days: {days}
    Budget in BHD: {budget}
    Preferences: {preferences_text}
    Travel style: {travel_style}
    Extra preferences: {extra_preferences}
    Constraints: {constraints_text}
    People count: {people_count}
    {category_instruction}
    {place_instruction}

    Language rule:
    {language_instruction}

    Rules:
    - Only recommend places, activities, restaurants, cafes, museums, beaches, shopping areas, and attractions located in Bahrain.
    - Do not answer anything unrelated to Bahrain tourism.
    - If the request is unrelated, return JSON with "refused": true.
    - Keep the itinerary realistic.
    - Match the budget if provided.
    - Return ONLY valid JSON.
    - Do not return markdown.
    - Do not use ```json.
    - Do not add text outside JSON.
    - All user-facing text inside the JSON must follow the language rule.
    - Consider the number of people when estimating costs.
    - Budget is for the whole group, not one person.
    - Reconstruct the full itinerary from the latest user input.
    - The number of objects in the days array must match Days exactly.
    - The itinerary must reflect the latest preferences, travel style, extra preferences, preferred category, preferred place or area, budget, and people count.
    - For each activity, include a real Bahrain location name.
    - For each activity, include location_area such as Manama, Muharraq, Seef, Riffa, Zallaq, etc.
    - For google_maps_query, write a search query using this format: place name + area + Bahrain.
    - Do not invent coordinates.
    - Do not invent Google Maps URLs.
    - Do not give generic suggestions such as "a local restaurant", "a nearby cafe", "a hotel", or "a beach".
    - Always provide exact real place names in Bahrain.
    - If recommending a restaurant, cafe, hotel, museum, attraction, mall, or beach, use its exact known name.
    - Each activity name must be a specific real place or activity location.
    - location_name must match the exact place name.
    - google_maps_query must include the exact place name, area, and Bahrain.

    Return this exact JSON structure:
    {{
    "refused": false,
    "title": "string",
    "summary": "string",
    "estimated_total_budget_bhd": 0,
    "days": [
        {{
        "day_number": 1,
        "theme": "string",
        "activities": [
            {{
            "time": "string",
            "name": "string",
            "type": "string",
            "location_name": "string",
            "location_area": "string",
            "google_maps_query": "string",
            "estimated_cost_bhd": 0,
            "notes": "string"
            }}
        ]
        }}
    ],
    "tips": ["string"]
    }}
    """


def build_plan_prompt(data: GenerateAIPlanRequest) -> str:
    return build_plan_prompt_from_values(
        title=data.title,
        days=data.days,
        budget=data.budget,
        selected_preferences=data.preferences,
        travel_style=data.travel_style,
        extra_preferences=data.extra_preferences,
        constraints=data.constraints,
        people_count=data.people_count,
        language=data.language,
    )


def generate_plan_details_from_update(data: UpdatePlanRequest):
    try:
        prompt = build_plan_prompt_from_values(
            title=data.title,
            days=data.days,
            budget=data.budget,
            selected_preferences=data.preferences,
            travel_style=data.travel_styles,
            extra_preferences=data.extra_preferences,
            constraints=data.constraints,
            people_count=data.people_count or 1,
            category=data.category,
            place=data.place,
        )

        response = generate_with_retry(prompt)
        generated_plan = json.loads(clean_ai_json(response.text))
        generated_plan = add_google_maps_links(generated_plan)

        if generated_plan.get("refused") is True:
            raise HTTPException(
                status_code=400,
                detail="This request is outside Bahrain tourism planning."
            )

        return generated_plan

    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="AI returned invalid JSON")


@app.put("/plans/{plan_id}")
def update_plan(plan_id: int, data: UpdatePlanRequest, current_user = Depends(get_current_user)):
    generated_plan_details = None
    stored_preferences = format_plan_preferences(
        data.preferences,
        data.extra_preferences,
        data.constraints,
    )

    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT id, generated_by_ai
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

    if existing_plan.get("generated_by_ai"):
        generated_plan_details = generate_plan_details_from_update(data)

    with get_conn() as conn:
        with conn.cursor() as cur:
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
                    plan_details_json = COALESCE(%s, plan_details_json),
                    people_count = %s,
                    updated_at = NOW()
                WHERE id = %s
                  AND user_id = %s
                RETURNING id
                """,
                (
                    data.title,
                    data.days,
                    data.budget,
                    stored_preferences,
                    None,
                    data.travel_styles,
                    data.category,
                    data.place,
                    json.dumps(generated_plan_details) if generated_plan_details is not None else None,
                    data.people_count,
                    plan_id,
                    current_user["id"],
                )
            )
            updated_plan = cur.fetchone()
            conn.commit()

    create_log(
        user_id=current_user["id"],
        action_type="edit_plan",
        entity_type="plan",
        entity_id=plan_id,
        metadata={
            "message": "User edited a plan"
        },
    )
    return {
        "message": "Plan updated successfully",
        "plan_id": updated_plan["id"],
        "regenerated": generated_plan_details is not None,
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
    

    create_log(
        user_id=current_user["id"],
        action_type="delete_plan",
        entity_type="plan",
        entity_id=plan_id,
        metadata={
            "message": "User deleted a plan"
        },
    )

    return {"message": "Plan deleted successfully"}

@app.post("/ai/generate-plan")
def generate_ai_plan(data: GenerateAIPlanRequest, current_user=Depends(get_current_user)):
    try:
        prompt = build_plan_prompt(data)

        response = generate_with_retry(prompt)

        generated_plan = json.loads(clean_ai_json(response.text))
        generated_plan = add_google_maps_links(generated_plan)

        if generated_plan.get("refused") is True:
            raise HTTPException(
                status_code=400,
                detail="This request is outside Bahrain tourism planning."
            )

    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="AI returned invalid JSON")

    except HTTPException:
        raise

    except Exception as e:
        create_log(
            user_id=current_user["id"] if current_user else None,
            action_type="ai_generation_error",
            entity_type="plan",
            entity_id=None,
            metadata={
                "error": str(e),
                "title": getattr(data, "title", None)
            },
        )
        raise HTTPException(status_code=500, detail=f"AI generation failed: {str(e)}")

    try:
        stored_preferences = format_plan_preferences(
            data.preferences,
            data.extra_preferences,
            data.constraints,
        )

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
                        generated_by_ai,
                        plan_details_json,
                        people_count
                    )
                    VALUES (%s, %s, %s, %s, %s, %s, %s, 'saved', TRUE, %s , %s)
                    RETURNING id
                    """,
                    (
                        current_user["id"],
                        generated_plan.get("title", data.title),
                        data.budget,
                        data.days,
                        stored_preferences,
                        None,
                        data.travel_style,
                        json.dumps(generated_plan),
                        data.people_count,
                    )
                )

                plan = cur.fetchone()
                conn.commit()

        return {
            "message": "AI plan generated successfully",
            "plan_id": plan["id"],
            "plan_details": generated_plan,
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database save failed: {str(e)}")
    

@app.get("/place-categories")
def get_place_categories():
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT id, name, description
                FROM place_categories
                ORDER BY name ASC
                """
            )
            categories = cur.fetchall()

    return categories






def build_plan_chat_prompt(plan, user_message: str, language: str) -> str:
    plan_json = json.dumps(plan.get("plan_details_json") or {}, ensure_ascii=False)

    language_instruction = (
        "Detect the user's language and reply in the same language."
        if language == "auto"
        else f"Reply in this language: {language}."
    )

    return f"""
    You are Alsaeh.bh AI trip assistant.

    You are allowed to help ONLY with the current Bahrain tourism trip plan.

    You can do only these things:
    1. Give advice about the current trip.
    2. Explain the current trip.
    3. Modify the current trip ONLY if the user clearly asks for a change.
    4. Update trip fields such as title, days, budget, preferences, interests, travel style, category, place, and itinerary details.

    You must refuse anything unrelated to the current trip.
    Examples of forbidden topics:
    - coding
    - homework
    - politics
    - general questions
    - jokes
    - poetry
    - unrelated travel outside Bahrain
    - anything not related to this plan

    Language rule:
    {language_instruction}

    Current database plan:
    - id: {plan["id"]}
    - title: {plan.get("title")}
    - days: {plan.get("days")}
    - budget: {plan.get("budget")}
    - preferences: {plan.get("preferences")}
    - interests: {plan.get("user_interests")}
    - travel style: {plan.get("travel_styles")}
    - category: {plan.get("category")}
    - place: {plan.get("place")}
    - people count: {plan.get("people_count")}

    Current itinerary JSON:
    {plan_json}

    User message:
    {user_message}

    Return ONLY valid JSON.
    Do not return markdown.
    Do not return ```json.
    Do not add text outside JSON.

    Important update rules:
    - If the user changes budget, days, interests, travel style, preferences, category, or place, you MUST regenerate and return the full updated plan_details_json.
    - The updated plan_details_json must match the new budget, days, interests, travel style, and preferences.
    - Do not update only the database field if the itinerary itself should also change.
    - If the budget is changed, adjust activities and estimated costs to fit the new budget.
    - If the number of days is changed, update the itinerary days array to match exactly the new number of days.
    - If interests or travel style change, update the activities to match them.

    Return this exact structure:
        {{
        "refused": false,
        "action": "advice_or_update",
        "reply": "string",
        "update": {{
            "title": null,
            "days": null,
            "budget": null,
            "preferences": null,
            "user_interests": null,
            "travel_styles": null,
            "category": null,
            "place": null,
            "plan_details_json": null,
            "people_count": null
        }}
        }}

    Rules for action:
    - If user asks for advice only, use action: "advice"
    - If user asks to change the plan, use action: "update"
    - If user asks unrelated topic, use refused: true and action: "refuse"
    - Only put changed fields inside update.
    - For unchanged fields, keep null.
    - If a changed field affects the itinerary, include a full updated plan_details_json in update.
    - If the user changes people count, you MUST update people_count and regenerate the full plan_details_json.
    - Costs must be adjusted based on the number of people.


    Place naming rules:
    - Never use generic place names.
    - Always use exact real place names in Bahrain.
    - If adding or replacing restaurants, cafes, hotels, attractions, museums, beaches, or malls, provide the exact name.
    - Each updated activity must include name, location_name, location_area, and google_maps_query.
    """




@app.post("/ai/plan-chat")
def plan_chat(data: PlanChatRequest, current_user=Depends(get_current_user)):
    # 1. Get user plan
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
                (data.plan_id, current_user["id"])
            )
            plan = cur.fetchone()

            if not plan:
                raise HTTPException(status_code=404, detail="Plan not found")

    # 2. Ask Gemini
    try:
        prompt = build_plan_chat_prompt(plan, data.message, data.language)

        response = generate_with_retry(prompt)

        raw_text = response.text.strip()

        if raw_text.startswith("```json"):
            raw_text = raw_text.replace("```json", "", 1).strip()
        if raw_text.startswith("```"):
            raw_text = raw_text.replace("```", "", 1).strip()
        if raw_text.endswith("```"):
            raw_text = raw_text[:-3].strip()

        ai_result = json.loads(raw_text)

    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="AI returned invalid JSON")
    except Exception as e:
        create_log(
            user_id=current_user["id"] if current_user else None,
            action_type="ai_chat_error",
            entity_type="plan",
            entity_id=data.plan_id,
            metadata={
                "error": str(e),
                "message": data.message,
            },
        )
        raise HTTPException(status_code=500, detail=f"AI chat failed: {str(e)}")

    # 3. Refuse unrelated topics
    if ai_result.get("refused") is True or ai_result.get("action") == "refuse":
        return {
            "message": ai_result.get(
                "reply",
                "I can only help with this Bahrain trip plan."
            ),
            "updated": False,
            "plan_id": data.plan_id,
        }

    # 4. Save chat messages
    with get_conn() as conn:
        with conn.cursor() as cur:
            # Reuse existing active session for this plan
            cur.execute(
                """
                SELECT id FROM chat_sessions
                WHERE user_id = %s AND plan_id = %s AND status = 'active'
                ORDER BY started_at DESC
                LIMIT 1
                """,
                (current_user["id"], data.plan_id)
            )
            existing = cur.fetchone()

            if existing:
                session_id = existing["id"]
            else:
                cur.execute(
                    """
                    INSERT INTO chat_sessions (user_id, plan_id, status)
                    VALUES (%s, %s, 'active')
                    RETURNING id
                    """,
                    (current_user["id"], data.plan_id)
                )
                session_id = cur.fetchone()["id"]

            # Insert both messages using the same session
            cur.execute(
                """
                INSERT INTO messages (chat_session_id, sender_type, message_text)
                VALUES (%s, 'user', %s), (%s, 'assistant', %s)
                """,
                (session_id, data.message, session_id, ai_result.get("reply", ""))
            )
            conn.commit()

    # 5. If advice only, return without update
    if ai_result.get("action") != "update":
        return {
            "message": ai_result.get("reply", ""),
            "updated": False,
            "plan_id": data.plan_id,
        }

    # 6. Apply update if requested
    update = ai_result.get("update") or {}

    new_title = update.get("title")
    new_days = update.get("days")
    new_budget = update.get("budget")
    new_preferences = update.get("preferences")
    new_interests = update.get("user_interests")
    new_travel_styles = update.get("travel_styles")
    new_category = update.get("category")
    new_place = update.get("place")
    new_plan_details = update.get("plan_details_json")
    new_people_count = update.get("people_count")

    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                UPDATE plans
                SET
                    title = COALESCE(%s, title),
                    days = COALESCE(%s, days),
                    budget = COALESCE(%s, budget),
                    preferences = COALESCE(%s, preferences),
                    user_interests = COALESCE(%s, user_interests),
                    travel_styles = COALESCE(%s, travel_styles),
                    category = COALESCE(%s, category),
                    place = COALESCE(%s, place),
                    plan_details_json = COALESCE(%s, plan_details_json),
                    people_count = COALESCE(%s, people_count),
                    updated_at = NOW()
                WHERE id = %s
                  AND user_id = %s
                  AND status != 'deleted'
                """,
                (
                    new_title,
                    new_days,
                    new_budget,
                    new_preferences,
                    new_interests,
                    new_travel_styles,
                    new_category,
                    new_place,
                    json.dumps(new_plan_details) if new_plan_details is not None else None,
                    new_people_count,
                    data.plan_id,
                    current_user["id"],
                )
            )
            conn.commit()

    create_log(
        user_id=current_user["id"],
        action_type="ai_plan_chat",
        entity_type="plan",
        entity_id=data.plan_id,
        metadata={
            "message": data.message,
            "updated_plan": True
        },
    )

    return {
        "message": ai_result.get("reply", "Plan updated successfully."),
        "updated": True,
        "plan_id": data.plan_id,
    }



def add_google_maps_links(plan_json):
    for day in plan_json.get("days", []):
        for activity in day.get("activities", []):
            query = activity.get("google_maps_query")

            if not query:
                name = activity.get("name", "")
                area = activity.get("location_area", "")
                query = f"{name} {area} Bahrain"

            activity["google_maps_url"] = (
                "https://www.google.com/maps/search/?api=1&query="
                + quote_plus(query)
            )

    return plan_json


@app.get("/admin/overview")
def admin_overview(current_user=Depends(get_current_user)):
    require_admin(current_user)

    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT COUNT(*) AS total FROM profiles WHERE is_active = TRUE")
            total_users = cur.fetchone()["total"]

            cur.execute("SELECT COUNT(*) AS total FROM plans WHERE status != 'deleted'")
            total_plans = cur.fetchone()["total"]

            cur.execute("""
                SELECT COUNT(*) AS total
                FROM plans
                WHERE generated_by_ai = TRUE
                  AND status != 'deleted'
            """)
            ai_plans = cur.fetchone()["total"]

            cur.execute("SELECT COUNT(*) AS total FROM messages")
            total_messages = cur.fetchone()["total"]

            cur.execute("SELECT COUNT(*) AS total FROM usage_logs")
            total_logs = cur.fetchone()["total"]

            cur.execute("""
                SELECT category, COUNT(*) AS total
                FROM plans
                WHERE category IS NOT NULL
                  AND status != 'deleted'
                GROUP BY category
                ORDER BY total DESC
                LIMIT 5
            """)
            popular_categories = cur.fetchall()

    return {
        "total_users": total_users,
        "total_plans": total_plans,
        "ai_plans": ai_plans,
        "total_messages": total_messages,
        "total_logs": total_logs,
        "popular_categories": popular_categories,
    }

def require_admin(current_user):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    

@app.get("/admin/users")
def admin_get_users(current_user=Depends(get_current_user)):
    require_admin(current_user)

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
                    p.created_at,
                    r.name AS role
                FROM profiles p
                LEFT JOIN roles r ON r.id = p.role_id
                ORDER BY p.created_at DESC
                """
            )
            users = cur.fetchall()

    return users

@app.put("/admin/users/{user_id}")
def admin_update_user(user_id: str, data: dict, current_user=Depends(get_current_user)):
    require_admin(current_user)

    requested_active = data.get("is_active")

    if user_id == current_user["id"] and requested_active is False:
        raise HTTPException(status_code=400, detail="Admin cannot disable own account")

    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                UPDATE profiles
                SET
                    full_name = COALESCE(%s, full_name),
                    phone_number = COALESCE(%s, phone_number),
                    preferred_language = COALESCE(%s, preferred_language),
                    is_active = COALESCE(%s, is_active)
                WHERE id = %s
                RETURNING id
                """,
                (
                    data.get("full_name"),
                    data.get("phone_number"),
                    data.get("preferred_language"),
                    requested_active,
                    user_id,
                )
            )

            updated = cur.fetchone()

            if not updated:
                raise HTTPException(status_code=404, detail="User not found")

            conn.commit()

    if requested_active is not None:
        invalidate_auth_cache_for_user(user_id)

    create_log(
        user_id=current_user["id"],
        action_type="admin_update_user",
        entity_type="user",
        entity_id=user_id,
        metadata={"message": "Admin updated user information"},
    )

    return {"message": "User updated successfully"}


@app.delete("/admin/users/{user_id}")
def admin_delete_user(user_id: str, current_user=Depends(get_current_user)):
    require_admin(current_user)

    if user_id == current_user["id"]:
        raise HTTPException(status_code=400, detail="Admin cannot delete own account")

    service_role_key = (
        os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        or os.getenv("SUPABASE_SECRET_KEY")
    )

    if not os.getenv("SUPABASE_URL") or not service_role_key:
        raise HTTPException(
            status_code=500,
            detail="Supabase admin credentials are not configured."
        )

    delete_user_account_data(user_id, service_role_key)

    create_log(
        user_id=current_user["id"],
        action_type="admin_delete_user",
        entity_type="user",
        entity_id=user_id,
        metadata={"message": "Admin permanently deleted user account"},
    )

    return {"message": "User deleted successfully"}
@app.get("/admin/plans")
def admin_get_plans(current_user=Depends(get_current_user)):
    require_admin(current_user)

    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT
                    p.id,
                    p.title,
                    p.budget,
                    p.days,
                    p.people_count,
                    p.status,
                    p.generated_by_ai,
                    p.created_at,
                    p.updated_at,
                    pr.full_name AS user_name,
                    pr.email AS user_email
                FROM plans p
                LEFT JOIN profiles pr ON pr.id = p.user_id
                ORDER BY p.created_at DESC
                """
            )
            plans = cur.fetchall()

    return plans


@app.put("/admin/plans/{plan_id}")
def admin_update_plan(plan_id: int, data: dict, current_user=Depends(get_current_user)):
    require_admin(current_user)

    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                UPDATE plans
                SET
                    title = COALESCE(%s, title),
                    budget = COALESCE(%s, budget),
                    days = COALESCE(%s, days),
                    people_count = COALESCE(%s, people_count),
                    status = COALESCE(%s, status),
                    updated_at = NOW()
                WHERE id = %s
                RETURNING id
                """,
                (
                    data.get("title"),
                    data.get("budget"),
                    data.get("days"),
                    data.get("people_count"),
                    data.get("status"),
                    plan_id,
                )
            )

            updated = cur.fetchone()

            if not updated:
                raise HTTPException(status_code=404, detail="Plan not found")

            conn.commit()

    create_log(
        user_id=current_user["id"],
        action_type="admin_update_plan",
        entity_type="plan",
        entity_id=plan_id,
        metadata={
            "message": "Admin updated plan"
        },
    )

    return {"message": "Plan updated successfully"}

@app.delete("/admin/plans/{plan_id}")
def admin_delete_plan(plan_id: int, current_user=Depends(get_current_user)):
    require_admin(current_user)

    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                UPDATE plans
                SET status = 'deleted', updated_at = NOW()
                WHERE id = %s
                RETURNING id
                """,
                (plan_id,)
            )

            deleted = cur.fetchone()

            if not deleted:
                raise HTTPException(status_code=404, detail="Plan not found")

            conn.commit()

    create_log(
        user_id=current_user["id"],
        action_type="admin_delete_plan",
        entity_type="plan",
        entity_id=plan_id,
        metadata={
            "message": "Admin deleted plan"
        },
    )

    return {"message": "Plan deleted successfully"}

@app.get("/admin/logs")
def admin_get_logs(current_user=Depends(get_current_user)):
    require_admin(current_user)

    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT
                    l.id,
                    l.user_id,
                    p.full_name AS user_name,
                    p.email AS user_email,
                    l.action_type,
                    l.entity_type,
                    l.entity_id,
                    l.metadata_json,
                    l.created_at
                FROM usage_logs l
                LEFT JOIN profiles p ON p.id = l.user_id
                ORDER BY l.created_at DESC
                LIMIT 200
                """
            )
            logs = cur.fetchall()

    return logs

@app.get("/settings/me")
def get_my_settings(current_user=Depends(get_current_user)):
    return {
        "id": current_user["id"],
        "full_name": current_user["full_name"],
        "email": current_user["email"],
        "phone_number": current_user["phone_number"],
        "preferred_language": current_user.get("preferred_language", "en"),
    }


@app.put("/settings/me")
def update_my_settings(data: UpdateSettingsRequest, current_user=Depends(get_current_user)):
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                UPDATE profiles
                SET
                    full_name = COALESCE(%s, full_name),
                    phone_number = COALESCE(%s, phone_number),
                    preferred_language = COALESCE(%s, preferred_language)
                WHERE id = %s
                RETURNING id, full_name, email, phone_number, preferred_language
                """,
                (
                    data.full_name,
                    data.phone_number,
                    data.preferred_language,
                    current_user["id"],
                )
            )

            user = cur.fetchone()
            conn.commit()

    create_log(
        user_id=current_user["id"],
        action_type="update_profile",
        entity_type="user",
        entity_id=current_user["id"],
        metadata={
            "full_name": data.full_name,
            "phone_number": data.phone_number,
            "preferred_language": data.preferred_language,
        },
    )

    return {"message": "Settings updated successfully", "user": user}



# @app.put("/settings/change-password")
# def change_password(data: ChangePasswordRequest, current_user=Depends(get_current_user)):
#     with get_conn() as conn:
#         with conn.cursor() as cur:
#             cur.execute(
#                 "SELECT password_hash FROM users WHERE id = %s",
#                 (current_user["id"],)
#             )
#             user = cur.fetchone()

#             if not user or not verify_password(data.current_password, user["password_hash"]):
#                 raise HTTPException(status_code=400, detail="Current password is incorrect")

#             cur.execute(
#                 """
#                 UPDATE users
#                 SET password_hash = %s, updated_at = NOW()
#                 WHERE id = %s
#                 """,
#                 (hash_password(data.new_password), current_user["id"])
#             )

#             conn.commit()

#     create_log(
#         user_id=current_user["id"],
#         action_type="change_password",
#         entity_type="user",
#         entity_id=current_user["id"],
#         metadata={
#             "message": "User changed password"
#         },
#     )

#     return {"message": "Password changed successfully"}


# @app.put("/settings/change-email")
# def change_email(data: ChangeEmailRequest, current_user=Depends(get_current_user)):
#     with get_conn() as conn:
#         with conn.cursor() as cur:
#             cur.execute(
#                 "SELECT password_hash FROM users WHERE id = %s",
#                 (current_user["id"],)
#             )
#             user = cur.fetchone()

#             if not user or not verify_password(data.current_password, user["password_hash"]):
#                 raise HTTPException(status_code=400, detail="Current password is incorrect")

#             cur.execute(
#                 "SELECT id FROM users WHERE email = %s AND id != %s",
#                 (data.new_email, current_user["id"])
#             )
#             existing = cur.fetchone()

#             if existing:
#                 raise HTTPException(status_code=400, detail="Email is already used")

#             cur.execute(
#                 """
#                 UPDATE users
#                 SET email = %s, updated_at = NOW()
#                 WHERE id = %s
#                 """,
#                 (data.new_email, current_user["id"])
#             )

#             conn.commit()

#     create_log(
#         user_id=current_user["id"],
#         action_type="change_email",
#         entity_type="user",
#         entity_id=current_user["id"],
#         metadata={
#             "old_email": current_user["email"],
#             "new_email": data.new_email
#         },
#     )

#     return {"message": "Email changed successfully"}

@app.get("/settings/export-data")
def export_my_data(current_user=Depends(get_current_user)):
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT id, full_name, email, phone_number, preferred_language, created_at
                FROM profiles
                WHERE id = %s
                """,
                (current_user["id"],)
            )
            user = cur.fetchone()

            cur.execute(
                """
                SELECT *
                FROM plans
                WHERE user_id = %s
                ORDER BY created_at DESC
                """,
                (current_user["id"],)
            )
            plans = cur.fetchall()

    create_log(
        user_id=current_user["id"],
        action_type="export_data",
        entity_type="user",
        entity_id=current_user["id"],
        metadata={"message": "User exported account data"},
    )

    return {
        "user": user,
        "plans": plans,
    }


def delete_auth_user_from_supabase(user_id: str, service_role_key: str):
    url = (
        f"{os.getenv('SUPABASE_URL').rstrip('/')}"
        f"/auth/v1/admin/users/{user_id}"
    )

    try:
        response = httpx.delete(
            url,
            headers={
                "Authorization": f"Bearer {service_role_key}",
                "apikey": service_role_key,
            },
            timeout=10,
        )
    except httpx.HTTPError as e:
        raise HTTPException(
            status_code=502,
            detail=f"Could not delete Supabase Auth user: {str(e)}",
        )

    if response.status_code == 404:
        return

    if response.status_code not in (200, 204):
        raise HTTPException(
            status_code=502,
            detail="Could not delete Supabase Auth user. Check service role credentials.",
        )


def delete_user_account_data(user_id: str, service_role_key: str):
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT id, email
                FROM profiles
                WHERE id = %s
                """,
                (user_id,)
            )
            profile = cur.fetchone()

            if not profile:
                raise HTTPException(status_code=404, detail="User not found")

            cur.execute(
                "SELECT id FROM plans WHERE user_id = %s",
                (user_id,)
            )
            plan_ids = [row["id"] for row in cur.fetchall()]
            plan_id_strings = [str(plan_id) for plan_id in plan_ids]

            cur.execute(
                """
                DELETE FROM messages
                WHERE chat_session_id IN (
                    SELECT id
                    FROM chat_sessions
                    WHERE user_id = %s
                       OR plan_id = ANY(%s::bigint[])
                )
                """,
                (user_id, plan_ids)
            )

            cur.execute(
                """
                DELETE FROM chat_sessions
                WHERE user_id = %s
                   OR plan_id = ANY(%s::bigint[])
                """,
                (user_id, plan_ids)
            )

            cur.execute(
                """
                DELETE FROM usage_logs
                WHERE user_id = %s
                   OR entity_id::text = %s
                   OR (
                        entity_type = 'plan'
                        AND entity_id::text = ANY(%s::text[])
                   )
                """,
                (user_id, str(user_id), plan_id_strings)
            )

            cur.execute(
                "DELETE FROM plans WHERE user_id = %s",
                (user_id,)
            )

            cur.execute(
                "DELETE FROM profiles WHERE id = %s",
                (user_id,)
            )

            delete_auth_user_from_supabase(user_id, service_role_key)

            conn.commit()

    invalidate_auth_cache_for_user(user_id)


@app.delete("/settings/delete-account")
def delete_my_account(current_user=Depends(get_current_user)):
    user_id = current_user["id"]
    service_role_key = (
        os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        or os.getenv("SUPABASE_SECRET_KEY")
    )

    if not os.getenv("SUPABASE_URL") or not service_role_key:
        raise HTTPException(
            status_code=500,
            detail="Supabase admin credentials are not configured."
        )

    delete_user_account_data(user_id, service_role_key)

    return {"message": "Account deleted successfully"}

@app.get("/debug/me")
async def debug_me(current_user=Depends(get_current_user)):
    return {
        "id": current_user["id"],
        "role": current_user["role"],
        "is_active": current_user["is_active"],
    }

