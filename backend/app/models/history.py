from sqlalchemy import Column, Integer, String, Float, DateTime
from datetime import datetime, timezone
from app.core.database import Base

class WorkoutHistory(Base):
    __tablename__ = "workout_history"

    id = Column(Integer, primary_key=True, index=True)
    hareket_adi = Column(String, index=True)
    eminlik_skoru = Column(Float)
    diz_acisi = Column(Integer)
    antrenor_notu = Column(String)
    tarih = Column(DateTime, default=lambda: datetime.now(timezone.utc))