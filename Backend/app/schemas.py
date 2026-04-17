from pydantic import BaseModel, EmailStr, Field
from typing import Optional
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