from pydantic import BaseModel, ConfigDict
from datetime import date
from typing import Optional


class WorkoutNoteItem(BaseModel):
    hareket: str
    set_sayisi: Optional[int] = None
    tekrar_sayisi: Optional[int] = None
    agirlik: Optional[float] = None


class WorkoutNoteRead(WorkoutNoteItem):
    model_config = ConfigDict(from_attributes=True)

    id: int
    tarih: date