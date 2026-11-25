from fastapi import APIRouter
from pydantic import BaseModel
from src.scripts.ai_trip_plane import generate_trip_plan

router = APIRouter()

class TripRequest(BaseModel):
    destination: str
    budget: str
    startDate: str
    endDate: str
    interests: list[str]

@router.post("/generate-trip")
def generate_trip(data: TripRequest):
    result = generate_trip_plan(data.dict())
    return result