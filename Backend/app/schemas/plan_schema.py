from pydantic import BaseModel

class PlanRequest(BaseModel):
    interests: list[str]
    budget: str
    available_time: int
    trip_days: int
