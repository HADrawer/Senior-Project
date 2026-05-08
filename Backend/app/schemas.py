from pydantic import BaseModel, EmailStr, Field
from typing import List ,Optional
from datetime import datetime

class RegisterRequest(BaseModel):
    full_name: str = Field(min_length=2, max_length=150)
    email: EmailStr
    phone_number: str = Field(min_length=5, max_length=30)
    password: str = Field(min_length=6, max_length=100)
    

    

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: int
    full_name: str
    email: EmailStr
    phone_number: str
    role: str



class PlanResponse(BaseModel):
    id: int
    title: Optional[str] = None
    budget: Optional[float] = None
    days: int
    preferences: Optional[str] = None
    user_interests: Optional[str] = None
    travel_styles: Optional[str] = None
    category: Optional[str] = None
    place: Optional[str] = None
    status: str
    generated_by_ai: bool
    created_at: datetime
    updated_at: datetime


class CreatePlanRequest(BaseModel):
    title: str
    days: int
    budget: float | None = None
    preferences: str | None = None
    user_interests: str | None = None
    travel_styles: str | None = None


class UpdatePlanRequest(BaseModel):
    title: str
    days: int
    budget: float | None = None
    preferences: str | None = None
    user_interests: str | None = None
    travel_styles: str | None = None
    category: str | None = None
    place: str | None = None
    people_count: int | None = None


class GenerateAIPlanRequest(BaseModel):
    title: str = Field(min_length=2, max_length=200)
    days: int = Field(gt=0, le=14)
    budget: Optional[float] = Field(default=None, ge=0)
    interests: List[str] = Field(min_length=1)
    travel_style: Optional[str] = None
    preferences: Optional[str] = None
    constraints: Optional[List[str]] = None
    language: str = Field(default="auto", max_length=30)
    people_count: int = Field(default=1, gt=0, le=50)

class PlanChatRequest(BaseModel):
    plan_id: int
    message: str = Field(min_length=1, max_length=2000)
    language: str = "auto"


class UpdateSettingsRequest(BaseModel):
    full_name: str | None = None
    phone_number: str | None = None
    preferred_language: str | None = None

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(min_length=6)

class ChangeEmailRequest(BaseModel):
    current_password: str
    new_email: EmailStr