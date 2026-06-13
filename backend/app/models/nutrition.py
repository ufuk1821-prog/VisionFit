from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.sql import func
from app.core.database import Base

class MealLog(Base):
    __tablename__ = "meal_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("Users.id"), nullable=False)
    ogun_tipi = Column(String(20), nullable=False)
    besin_anahtari = Column(String(50), nullable=False)
    besin_adi = Column(String(100), nullable=False)
    gram = Column(Float, nullable=False)
    kalori = Column(Float, nullable=False)
    protein_g = Column(Float, nullable=False)
    karbonhidrat_g = Column(Float, nullable=False)
    yag_g = Column(Float, nullable=False)
    tarih = Column(DateTime(timezone=True), server_default=func.now())

class WaterLog(Base):
    __tablename__ = "water_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("Users.id"), nullable=False)
    miktar_ml = Column(Integer, nullable=False)
    tarih = Column(DateTime(timezone=True), server_default=func.now())