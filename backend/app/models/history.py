from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.core.database import Base

class WorkoutHistory(Base):
    __tablename__ = "workout_history"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("Users.id"), nullable=True)
    hareket_adi = Column(String, index=True)
    eminlik_skoru = Column(Float)
    diz_acisi = Column(Integer)
    antrenor_notu = Column(String)
    tarih = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="antrenmanlar")