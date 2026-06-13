from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.sql import func
from app.core.database import Base

class StepLog(Base):
    __tablename__ = "step_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("Users.id"), nullable=False)
    adim_sayisi = Column(Integer, nullable=False)
    aktivite_tipi = Column(String(30), nullable=False)
    yakilan_kalori = Column(Float, nullable=False)
    tarih = Column(DateTime(timezone=True), server_default=func.now())