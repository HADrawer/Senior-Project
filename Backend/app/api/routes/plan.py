from fastapi import APIRouter
from app.schemas.plan_schema import PlanRequest
from app.services.ai_service import generate_plan

router = APIRouter(prefix="/plan", tags=["Plan"])

@router.post("/generate")
def create_plan(data: PlanRequest):
    plan = generate_plan(data)
    return {"plan": plan}
