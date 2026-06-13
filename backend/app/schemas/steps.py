from pydantic import BaseModel, ConfigDict
from datetime import datetime

class StepCreate(BaseModel):
    adim_sayisi: int
    aktivite_tipi: str

class StepRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    adim_sayisi: int
    aktivite_tipi: str
    yakilan_kalori: float
    tarih: datetime