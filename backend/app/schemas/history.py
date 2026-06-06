from pydantic import BaseModel, ConfigDict
from datetime import datetime

class HistoryRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    hareket_adi: str
    eminlik_skoru: float
    diz_acisi: int
    antrenor_notu: str
    tarih: datetime