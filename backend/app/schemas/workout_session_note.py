from pydantic import BaseModel, ConfigDict
from datetime import date
from typing import Optional


class WorkoutSessionNoteCreate(BaseModel):
    oncelikli_odak: Optional[str] = None
    rpe: Optional[int] = None
    uyku_kalitesi: Optional[str] = None


class WorkoutSessionNoteRead(WorkoutSessionNoteCreate):
    model_config = ConfigDict(from_attributes=True)

    id: int
    tarih: date