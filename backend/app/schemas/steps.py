from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional

class StepCreate(BaseModel):
    adim_sayisi: int
    aktivite_tipi: str
    tarih: Optional[str] = None

class StepRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    adim_sayisi: int
    aktivite_tipi: str
    yakilan_kalori: float
    tarih: datetime