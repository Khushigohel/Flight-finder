import requests
import time
from datetime import datetime, timedelta
from dotenv import load_dotenv
import os

from src.core.database import SessionLocal
from src.models.flight import Flights
from src.models.airport import Airport

load_dotenv()

API_KEY = os.getenv("SERP_API_KEY")
url = "https://serpapi.com/search"

MAX_API_CALLS=200

# start_date = datetime.today().date()
# end_date = start_date + timedelta(days=8)
start_date = datetime(2026, 4, 14).date()
end_date = datetime(2026, 4, 20).date()


def get_selected_airport_codes(db):
    cities = ["Ahmedabad", "Surat", "New Delhi", "Mumbai", "Vadodara"]

    airports = db.query(Airport).filter(
        Airport.city.in_(cities),
        Airport.operational == True
    ).all()

    codes = [a.airport_code for a in airports]
    print("Using airport codes:", codes)
    return codes


def fetch_multi_day_flights():
    db = SessionLocal()

    total_inserted = 0
    api_calls = 0

    all_airports = get_selected_airport_codes(db)

    current_date = start_date

    while current_date <= end_date:
        outbound_date = current_date.strftime("%Y-%m-%d")

        for source_code in all_airports:
            for dest_code in all_airports:

                if source_code == dest_code:
                    continue  # Skip same airport flights

                if api_calls >= MAX_API_CALLS:
                    print("\n⚠ Daily API limit reached. Stopping safely.")
                    db.close()
                    return

                print(f"Fetching {source_code} → {dest_code} on {outbound_date}")

                params = {
                    "engine": "google_flights",
                    "departure_id": source_code,
                    "arrival_id": dest_code,
                    "outbound_date": outbound_date,
                    "currency": "INR",
                    "gl": "in",
                    "api_key": API_KEY,
                    "type": "2",
                }

                try:
                    response = requests.get(url, params=params)
                    data = response.json()
                except Exception as e:
                    print("Request failed:", e)
                    continue

                api_calls += 1
                print(f"API Calls Used: {api_calls}")

                if "error" in data:
                    print("API Error:", data["error"])
                    continue

                flights = data.get("best_flights", []) + data.get("other_flights", [])

                for f in flights:
                    leg = f.get("flights", [{}])[0]

                    departure_time_str = leg.get("departure_airport", {}).get("time")
                    arrival_time_str = leg.get("arrival_airport", {}).get("time")

                    departure_terminal = leg.get("departure_airport", {}).get("terminal")
                    arrival_terminal = leg.get("arrival_airport", {}).get("terminal")

                    try:
                        departure_time = datetime.fromisoformat(departure_time_str)
                        arrival_time = datetime.fromisoformat(arrival_time_str)
                    except:
                        continue

                    # Prevent duplicate flights
                    exists = db.query(Flights).filter(
                        Flights.source_airport == source_code,
                        Flights.destination_airport == dest_code,
                        Flights.departure_time == departure_time,
                        Flights.flight_no == leg.get("flight_number"),
                        Flights.stops == (len(f.get("flights", [])) - 1)
                    ).first()
                    new_price = f.get("price", 0)

                    if exists:
                        if new_price > 0 and (exists.price is None or new_price < exists.price):
                            exists.price = new_price
                            exists.currency = "INR"
                            exists.flight_status = f.get("status", "Scheduled")
                        continue

                    flight = Flights(
                        source_airport=source_code,
                        destination_airport=dest_code,
                        departure_time=departure_time,
                        arrival_time=arrival_time,
                        airline_name=leg.get("airline"),
                        flight_no=leg.get("flight_number", "N/A"),
                        travel_date=current_date,
                        price=f.get("price", 0),
                        currency="INR",
                        stops=len(f.get("flights", [])) - 1,
                        flight_status=f.get("status", "Scheduled"),
                        departure_terminal=departure_terminal,
                        arrival_terminal=arrival_terminal
                    )

                    db.add(flight)
                    total_inserted += 1

                db.commit()
                time.sleep(1)  # Prevent API rate limit

        current_date += timedelta(days=1)

    db.close()
    print(f"\nInserted {total_inserted} flights successfully")
    #print(f"Total API Calls Used: {api_calls}")


if __name__ == "__main__":
    fetch_multi_day_flights()