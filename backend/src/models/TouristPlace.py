from sqlalchemy import Column, Integer, String, Text, Double, ForeignKey,Float
from src.core.database import Base


class TouristPlace(Base):
    __tablename__ = "tourist_places"

    id = Column(Integer, primary_key=True, index=True)

    airport_code = Column(String, ForeignKey("airports.airport_code"))

    place_name = Column(String, nullable=False)
    description = Column(Text)
    image_url = Column(String)

    latitude = Column(Double)
    longitude = Column(Double)
    distance_from_airport = Column(Float)