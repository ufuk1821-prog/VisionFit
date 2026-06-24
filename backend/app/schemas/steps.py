from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class StepCreate(BaseModel):
    adim_sayisi: int = Field(..., gt=0, le=500000)
    aktivite_tipi: str
    tarih: Optional[str] = None


class StepRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    adim_sayisi: int
    aktivite_tipi: str
    yakilan_kalori: float
    tarih: datetime
