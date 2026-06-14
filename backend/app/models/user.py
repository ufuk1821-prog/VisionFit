from sqlalchemy import Column, Integer, String, DateTime, Float, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base

class User(Base):
    __tablename__ = "Users"
    id = Column(Integer, primary_key=True, index=True)
    ad = Column(String(255), nullable=False)
    soyad = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    sifre = Column(String(255), nullable=False)
    boy = Column(Float, nullable=True)
    kilo = Column(Float, nullable=True)
    yas = Column(Integer, nullable=True)
    cinsiyet = Column(String(20), nullable=True)
    aktiflik_seviyesi = Column(String(30), nullable=True)
    hedef = Column(String(30), nullable=True)
    email_dogrulandi = Column(Boolean, default=False, nullable=False)
    dogrulama_token = Column(String(100), nullable=True)
    createdAt = Column(DateTime(timezone=True), server_default=func.now())
    updatedAt = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    antrenmanlar = relationship("WorkoutHistory", back_populates="user")