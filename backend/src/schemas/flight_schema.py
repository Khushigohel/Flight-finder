from pydantic import BaseModel
from typing import List,Optional
from datetime import date

class FlightSearchRequest(BaseModel):
    source:str
    destinations:List[str]
    start_date:date
    end_date:Optional[date]=None
    budget:Optional[float]=None
   