from sqlalchemy.orm import Session
from src.models.flight import Flights
from src.models.search_history import SearchHistory
from sqlalchemy import func
from datetime import timedelta

def calculate_duration_minutes(flight):
    duration = flight.arrival_time - flight.departure_time
    return int(duration.total_seconds() / 60)

def format_duration(flight):
    minutes = calculate_duration_minutes(flight)

    hours = minutes // 60
    mins = minutes % 60
    if hours == 0:
        return f"{mins}m"
    if mins == 0:
        return f"{hours}h"
    return f"{hours}h {mins:02d}m"

def calculate_best_score(flight):
    duration = calculate_duration_minutes(flight)
    score = flight.price * 0.5 + duration * 0.3 + flight.stops * 200
    return score

def search_flights(db: Session, search_data, current_user):
    history = SearchHistory(
        user_id=current_user.user_id,
        source=search_data.source,
        destinations=",".join(search_data.destinations),
        start_date=search_data.start_date,
        end_date=search_data.end_date,
        budget=search_data.budget,
    )
    db.add(history)
    db.commit()
    
    if search_data.end_date:
        query = db.query(Flights).filter(
            Flights.source_airport == search_data.source,
            Flights.destination_airport.in_(search_data.destinations),
            Flights.travel_date.between(search_data.start_date, search_data.end_date),
        )
    else:
        query = db.query(Flights).filter(
            Flights.source_airport == search_data.source,
            Flights.destination_airport.in_(search_data.destinations),
            Flights.travel_date == search_data.start_date,
        )
    if search_data.budget is not None:

        budget_query = query.filter(Flights.price <= search_data.budget).order_by(
            Flights.price.asc()
        )

        results = budget_query.all()

        if not results:
            results = query.order_by(Flights.price.asc()).all()
            message = "No flights under budget. Showing cheapest available."
        else:
            message = "Flights under budget"

    else:
        results = query.order_by(Flights.price.asc()).all()
        message = "Suggested cheapest flights"

    if not results:
        return {"message": "No flights found", "flights": []}
    unique = {}

    for f in results:
        key = (
            f.flight_no,
            f.departure_time,
            f.arrival_time,
        )
        if not f.price or f.price == 0:
            continue

        if key not in unique:
            unique[key] = f
        else:
            if f.price < unique[key].price:
                unique[key] = f

    results = list(unique.values())
    
    # cheapest_flight = min(results, key=lambda x: x.price)

    # fastest_flight = min(results, key=lambda x: calculate_duration_minutes(x))

    # best_flight = min(results, key=lambda x: calculate_best_score(x))
    data_for_calc = results

    cheapest_flight = min(data_for_calc, key=lambda x: x.price)
    fastest_flight = min(data_for_calc, key=lambda x: calculate_duration_minutes(x))
    best_flight = min(data_for_calc, key=lambda x: calculate_best_score(x))
    
    date_prices_query = (
    db.query(
        Flights.travel_date,
        func.min(Flights.price).label("price")
    )
    .filter(
        Flights.source_airport == search_data.source,
        Flights.destination_airport.in_(search_data.destinations),
        Flights.travel_date.between(search_data.start_date, search_data.start_date + timedelta(days=7)),
        Flights.price > 0  
)
    .group_by(Flights.travel_date)
    .order_by(Flights.travel_date)
    .all()
    )

    date_prices = [
    {"date": str(d.travel_date), "price": d.price}
    for d in date_prices_query
    ]
    
    return {
        "message": message,
        "summary": {
            "cheapest": {
                "price": cheapest_flight.price,
                "duration": format_duration(cheapest_flight),
            },
            "fastest": {
                "price": fastest_flight.price,
                "duration": format_duration(fastest_flight),
            },
            "best": {
                "price": best_flight.price,
                "duration": format_duration(best_flight),
            },
        },
        "date_prices": date_prices,
       "flights": [
        {
            "flight_id": f.flight_id,
            "departure_time": f.departure_time,
            "arrival_time": f.arrival_time,
            "source_airport": f.source_airport,
            "destination_airport": f.destination_airport,
            "airline_name": f.airline_name,
            "flight_no": f.flight_no,
            "price": f.price,
            "currency": f.currency,
            "stops": f.stops,
            "travel_date": f.travel_date,
        }
        for f in results
    ]
}
