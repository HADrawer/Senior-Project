from decimal import Decimal

from pydantic import BaseModel, EmailStr, Field, field_validator, model_validator
from typing import List, Optional
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
    title: str = Field(min_length=2, max_length=200)
    days: int = Field(gt=0, le=14)
    budget: Decimal | None = Field(default=None, ge=0)
    preferences: List[str] = Field(default_factory=list)
    extra_preferences: str | None = None
    constraints: List[str] | None = None
    user_interests: str | None = None
    travel_styles: str | None = None
    category: str | None = None
    place: str | None = None
    people_count: int | None = Field(default=None, gt=0, le=50)

    @field_validator("days", "people_count", mode="before")
    @classmethod
    def validate_update_whole_number(cls, value):
        if value is None:
            return value

        if isinstance(value, bool) or not isinstance(value, int):
            raise ValueError("Must be a whole number.")

        return value

    @field_validator("budget", mode="before")
    @classmethod
    def validate_update_budget(cls, value):
        if value is None or value == "":
            return None

        if isinstance(value, bool) or isinstance(value, str):
            raise ValueError("Budget must be a number.")

        amount = Decimal(str(value))
        if amount < 0:
            raise ValueError("Budget must be positive.")

        decimal_places = max(-amount.as_tuple().exponent, 0)
        if decimal_places > 3:
            raise ValueError("Budget can include up to 3 decimal places.")

        return amount

    @field_validator("preferences", mode="before")
    @classmethod
    def normalize_update_preferences(cls, value):
        if value is None:
            return []

        if isinstance(value, str):
            return [item.strip() for item in value.split(",") if item.strip()]

        return value

    @model_validator(mode="after")
    def require_update_preferences_or_legacy_interests(self):
        if not self.preferences and self.user_interests:
            self.preferences = [
                item.strip()
                for item in self.user_interests.split(",")
                if item.strip()
            ]

        if not self.preferences:
            raise ValueError("Select at least one preference.")

        return self


class GenerateAIPlanRequest(BaseModel):
    title: str = Field(min_length=2, max_length=200)
    days: int = Field(gt=0, le=14)
    budget: Optional[Decimal] = Field(default=None, ge=0)
    preferences: List[str] = Field(default_factory=list)
    interests: Optional[List[str]] = None
    travel_style: Optional[str] = None
    extra_preferences: Optional[str] = None
    constraints: Optional[List[str]] = None
    language: str = Field(default="auto", max_length=30)
    people_count: int = Field(default=1, gt=0, le=50)

    @field_validator("days", "people_count", mode="before")
    @classmethod
    def validate_whole_number(cls, value):
        if isinstance(value, bool) or not isinstance(value, int):
            raise ValueError("Must be a whole number.")
        return value

    @field_validator("budget", mode="before")
    @classmethod
    def validate_budget(cls, value):
        if value is None or value == "":
            return None

        if isinstance(value, bool) or isinstance(value, str):
            raise ValueError("Budget must be a number.")

        amount = Decimal(str(value))
        if amount < 0:
            raise ValueError("Budget must be positive.")

        decimal_places = max(-amount.as_tuple().exponent, 0)
        if decimal_places > 3:
            raise ValueError("Budget can include up to 3 decimal places.")

        return amount

    @field_validator("preferences", mode="before")
    @classmethod
    def normalize_preferences(cls, value):
        if value is None:
            return []

        if isinstance(value, str):
            return [item.strip() for item in value.split(",") if item.strip()]

        return value

    @model_validator(mode="after")
    def require_preferences_or_legacy_interests(self):
        if not self.preferences and self.interests:
            self.preferences = self.interests

        if not self.preferences:
            raise ValueError("Select at least one preference.")

        return self

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
