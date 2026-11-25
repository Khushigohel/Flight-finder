import requests
import psycopg2
import csv
from io import StringIO
import pycountry
import unicodedata

# Extra mappings for codes not handled by pycountry
EXTRA_STATE_MAP = {
    "IN-MM": "Maharashtra",
    "IN-OR": "Odisha",
    "IN-UT": "Uttarakhand",
    "IN-CT": "Chhattisgarh",
    "IN-TG":"Telangana"
}

# Function to remove accent characters
def remove_accents(text):
    return unicodedata.normalize('NFKD', text).encode('ascii', 'ignore').decode('utf-8')

# CSV dataset URL
url = "https://ourairports.com/data/airports.csv"

response = requests.get(url)
csv_data = StringIO(response.text)
reader = csv.DictReader(csv_data)

# PostgreSQL connection
conn = psycopg2.connect(
    host="localhost",
    database="flight",
    user="postgres",
    password="postgres",
    port="5432"
)

cursor = conn.cursor()

count = 0
seen_airports = set()

for row in reader:

    # Only Indian airports
    if row["iso_country"] != "IN":
        continue

    airport_type = row["type"]
    if airport_type not in ["large_airport", "medium_airport", "small_airport"]:
        continue

    airport_name = row["name"]
    city = row["municipality"] or "Unknown"

    latitude = row["latitude_deg"]
    longitude = row["longitude_deg"]

    country = "India"
    timezone = "Asia/Kolkata"

    region_code = row["iso_region"]

    subdivision = pycountry.subdivisions.get(code=region_code)

    if subdivision:
        state = remove_accents(subdivision.name)
    else:
        state = EXTRA_STATE_MAP.get(region_code, region_code)

    airport_code = row["iata_code"]

    # If airport has no IATA code
    if not airport_code:
        airport_code = row["ident"]
        operational = False
    else:
        operational = True
        
    if airport_code in seen_airports:
        continue
    seen_airports.add(airport_code)

    cursor.execute(
        """
        INSERT INTO airport
        (airport_code, airport_name, city, state, operational, latitude, longitude, timezone, country)
        VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s)
        ON CONFLICT (airport_code) DO NOTHING
        """,
        (
            airport_code,
            airport_name,
            city,
            state,
            operational,
            latitude,
            longitude,
            timezone,
            country
        )
    )

    count += 1

conn.commit()
cursor.close()
conn.close()

print("Inserted Indian airports:", count)