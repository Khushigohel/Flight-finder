from fastapi import FastAPI
from src.core.database import Base, engine
from src.routes import user_routes
from src.routes import google_auth_routes
from src.models.airport import Airport
from src.models.flight import Flights
from src.models.TouristPlace import TouristPlace
from src.routes import flight_search_routes
from fastapi.middleware.cors import CORSMiddleware
from src.routes import airport_routes
from src.routes import trip_routes

app = FastAPI(title="User Fast Api")
Base.metadata.create_all(bind=engine)

origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(user_routes.router)
app.include_router(google_auth_routes.router)
app.include_router(flight_search_routes.router)
app.include_router(airport_routes.router)
app.include_router(trip_routes.router)
