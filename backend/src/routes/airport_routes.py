from fastapi import APIRouter, Depends,HTTPException
from sqlalchemy.orm import Session
from src.core.database import get_db
from src.models.airport import Airport

router = APIRouter()

@router.get("/airports/search")
def search_airports(query: str, db: Session = Depends(get_db)):
    airports = db.query(Airport).filter(
        Airport.city.ilike(f"%{query}%") |
        Airport.airport_name.ilike(f"%{query}%") |
        Airport.airport_code.ilike(f"%{query}%")).all()

    return airports
@router.get("/airports")
def get_all_airports(db: Session = Depends(get_db)):
    airports = db.query(Airport).all()

    return [
        {
            "airport_code": a.airport_code,
            "city": a.city,
            "airport_name": a.airport_name
        }
        for a in airports
    ]

@router.get("/airports/{code}")
def get_airport_by_code(code: str, db: Session = Depends(get_db)):
    airport = db.query(Airport).filter(
        Airport.airport_code == code.upper()
    ).first()

    if not airport:
        raise HTTPException(status_code=404, detail="Airport not found")

    return {
        "airport_code": airport.airport_code,
        "city": airport.city,
        "airport_name": airport.airport_name
    }