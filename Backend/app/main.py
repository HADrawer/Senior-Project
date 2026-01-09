from fastapi import FastAPI
from app.api.routes import plan

app = FastAPI(title="Bahrain Tourism AI")

app.include_router(plan.router)

@app.get("/")
def root():
    return {"message": "Tourism AI Backend is running 🚀"}
