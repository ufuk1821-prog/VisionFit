from sqlalchemy import Column, Integer, String, Date, ForeignKey, Text
from app.core.database import Base


class WorkoutSessionNote(Base):
    __tablename__ = "workout_session_notes"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("Users.id"), nullable=False)
    tarih = Column(Date, nullable=False, index=True)
    oncelikli_odak = Column(Text, nullable=True)
    rpe = Column(Integer, nullable=True)
    uyku_kalitesi = Column(String(20), nullable=True)