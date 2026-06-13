from sqlalchemy import Column, Integer, String, Float, Date, ForeignKey
from app.core.database import Base


class WorkoutNote(Base):
    __tablename__ = "workout_notes"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("Users.id"), nullable=False)
    tarih = Column(Date, nullable=False, index=True)
    hareket = Column(String(100), nullable=False)
    set_sayisi = Column(Integer, nullable=True)
    tekrar_sayisi = Column(Integer, nullable=True)
    agirlik = Column(Float, nullable=True)  