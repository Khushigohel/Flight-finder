from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from src.models.user import User
from src.schemas.flight_schema import FlightSearchRequest
from src.crud.flights_search import search_flights
from src.core.database import get_db
from src.utils.auth import get_current_user
from src.models.search_history import SearchHistory
from src.models.TouristPlace import TouristPlace
from src.models.flight import Flights
from sqlalchemy import func
from src.models.airport import Airport
from datetime import datetime,timedelta
from typing import Optional

router = APIRouter()

@router.post("/search-flights")
def search_flights_api(
    search_data: FlightSearchRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return search_flights(db, search_data, current_user)


@router.get("/search-history")
def get_search_history(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    history = (
        db.query(SearchHistory)
        .filter(SearchHistory.user_id == current_user.user_id)
        .order_by(SearchHistory.searched_at.desc())
        .all()
    )

    return history

from sqlalchemy import text

@router.get("/tourist-places/{airport_code}")
def get_places(airport_code: str, skip: int = 0, limit: int = 6, db: Session = Depends(get_db)):
    query = text("""
        SELECT *
        FROM (
            SELECT DISTINCT ON (
                LOWER(place_name),
                ROUND(latitude::numeric, 3),
                ROUND(longitude::numeric, 3)
            )
                id,
                airport_code,
                place_name,
                description,
                image_url,
                latitude,
                longitude,
                distance_from_airport
            FROM tourist_places
            WHERE airport_code = :airport_code
            ORDER BY 
                LOWER(place_name),
                ROUND(latitude::numeric, 3),
                ROUND(longitude::numeric, 3),
                id
        ) AS deduped
        ORDER BY place_name
        OFFSET :skip LIMIT :limit
    """)

    result = db.execute(query, {"airport_code": airport_code, "skip": skip, "limit": limit})
    places = [dict(row._mapping) for row in result.fetchall()]
    return places

@router.get("/budget-destinations")
def get_budget_destinations(source: str,budget: int,date: Optional[str] = None,db: Session = Depends(get_db)):

    query = (
        db.query(
            Airport.city,
            Flights.destination_airport,
            func.min(Flights.price).label("price"),
            func.count(Flights.flight_id).label("count")
        )
        .join(Airport, Airport.airport_code == Flights.destination_airport)
        .filter(Flights.source_airport == source)
        .filter(Flights.price > 0)
        .filter(Flights.price <= budget)
    )

    # if date:
    #     parsed_date = datetime.strptime(date, "%Y-%m-%d").date()
    #     query = query.filter(func.date(Flights.departure_time) == parsed_date)
    if date:
        parsed_date = datetime.strptime(date, "%Y-%m-%d").date()
        end_date = parsed_date + timedelta(days=7)

        query = query.filter(
        func.date(Flights.departure_time) >= parsed_date,
        func.date(Flights.departure_time) <= end_date
    )
    flights = (
        query
        .group_by(Airport.city, Flights.destination_airport)
        .order_by(func.min(Flights.price))
        .limit(6)
        .all()
    )

    return [
        {
            "city": f.city,
            "airport": f.destination_airport,
            "price": float(f.price),
             "count": f.count
        }
        for f in flights
    ]