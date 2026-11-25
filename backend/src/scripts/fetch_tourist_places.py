import requests
import os
import math
from dotenv import load_dotenv
from sqlalchemy import func
from src.core.database import SessionLocal
from src.models.airport import Airport
from src.models.TouristPlace import TouristPlace

load_dotenv()

API_KEY = os.getenv("OPENTRIPMAP_API_KEY")
print("API KEY:", API_KEY)


# ----------------------------------
# Utils
# ----------------------------------

def normalize_name(name):
    return "".join(name.lower().split())


def is_english(text):
    try:
        text.encode("ascii")
        return True
    except:
        return False


def clean_description(description):
    if not description:
        return "No description available."

    if not is_english(description):
        return "Description not available in English."

    if len(description) > 300:
        return description[:300] + "..."

    return description


def calculate_distance(lat1, lon1, lat2, lon2):
    R = 6371

    lat1 = math.radians(lat1)
    lon1 = math.radians(lon1)
    lat2 = math.radians(lat2)
    lon2 = math.radians(lon2)

    dlat = lat2 - lat1
    dlon = lon2 - lon1

    a = math.sin(dlat / 2) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon / 2) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

    return round(R * c, 2)


# ----------------------------------
# API CALLS
# ----------------------------------

def get_places(lat, lon):
    url = "https://api.opentripmap.com/0.1/en/places/radius"

    params = {
        "radius": 50000,  #  50 KM
        "lon": lon,
        "lat": lat,
        "limit": 70,
        "rate": "2",
        "kinds": "cultural,historic,natural,tourist_facilities",
        "apikey": API_KEY
    }

    response = requests.get(url, params=params)

    if response.status_code != 200:
        print("API Error:", response.status_code)
        print(response.text)
        return []

    return response.json().get("features", [])


def get_place_details(xid):
    url = f"https://api.opentripmap.com/0.1/en/places/xid/{xid}"
    params = {"apikey": API_KEY}

    response = requests.get(url, params=params)

    if response.status_code != 200:
        return None

    data = response.json()

    description = None
    image = None

    if "wikipedia_extracts" in data:
        description = data["wikipedia_extracts"].get("text")

    if "preview" in data and data["preview"]:
        image = data["preview"].get("source")

    if not image:
        image = "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRtXhaTDXu6F9J7L34Qy6SoNG5R6LInfNIkIA&s"

    description = clean_description(description)

    lat = data.get("point", {}).get("lat")
    lon = data.get("point", {}).get("lon")

    if not lat or not lon:
        return None

    return {
        "name": data.get("name"),
        "description": description,
        "image": image,
        "lat": lat,
        "lon": lon
    }


# ----------------------------------
# MAIN FUNCTION
# ----------------------------------

def fetch_places():
    db = SessionLocal()

    airports = db.query(Airport).filter(
        Airport.city.in_(["Surat", "Mumbai", "New Delhi"]),
        #Airport.city.in_(["Ahmedabad", "Vadodara"]),
        Airport.operational == True
    ).all()

    seen_places = set()  # (name, lat, lon)

    for airport in airports:
        print(f"\nFetching places for {airport.city}")

        places = get_places(airport.latitude, airport.longitude)

        for place in places:
            prop = place["properties"]

            name = prop.get("name")
            xid = prop.get("xid")

            if not name or len(name) < 3:
                continue

            normalized_name = normalize_name(name)

            lat = place["geometry"]["coordinates"][1]
            lon = place["geometry"]["coordinates"][0]

            unique_key = (normalized_name, round(lat, 3), round(lon, 3))

            # ✅ API duplicate removal
            if unique_key in seen_places:
                continue

            details = get_place_details(xid)

            if not details:
                continue
            
            existing_places = db.query(TouristPlace).filter(
            func.lower(TouristPlace.place_name) == details["name"].lower()).all()

            duplicate_found = False

            for ep in existing_places:
                if round(ep.latitude, 3) == round(details["lat"], 3) and \
                round(ep.longitude, 3) == round(details["lon"], 3):
                    duplicate_found = True
                    break

            if duplicate_found:
                continue
           

            distance = calculate_distance(
                airport.latitude,
                airport.longitude,
                details["lat"],
                details["lon"]
            )
            if distance > 10:
                continue

            tourist_place = TouristPlace(
                airport_code=airport.airport_code,
                place_name=details["name"],
                description=details["description"],
                image_url=details["image"],
                latitude=details["lat"],
                longitude=details["lon"],
                distance_from_airport=distance
            )

            db.add(tourist_place)

            # ✅ Mark as seen
            seen_places.add(unique_key)

        db.commit()

    db.close()


# ----------------------------------
# RUN SCRIPT
# ----------------------------------

if __name__ == "__main__":
    fetch_places()