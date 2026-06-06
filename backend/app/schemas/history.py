from pydantic import BaseModel
from datetime import datetime

class HistoryRead(BaseModel):
    id: int
    hareket_adi: str
    eminlik_skoru: float
    diz_acisi: int
    antrenor_notu: str
    tarih: datetime

    class Config:
        from_attributes = True