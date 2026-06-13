from pydantic import BaseModel
from typing import Optional

class BadgeStatus(BaseModel):
    key: str
    baslik: str
    aciklama: str
    seviye: str
    kazanildi: bool
    kazanilma_tarihi: Optional[str] = None