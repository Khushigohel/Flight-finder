from sqlalchemy import Column,Integer,String,Boolean,Double
from src.core.database import Base

class Airport(Base):
    __tablename__="airports"
    
    airport_code=Column(String,primary_key=True,nullable=False)
    airport_name=Column(String,nullable=False)
    city=Column(String,nullable=False)
    state=Column(String,nullable=True)
    operational=Column(Boolean,nullable=True)
    latitude=Column(Double) 
    longitude=Column(Double) 
    timezone=Column(String,nullable=False)
    country=Column(String,nullable=False)