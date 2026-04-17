from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func
from app.core.database import Base

class User(Base):
    __tablename__ = "Users"
    id = Column(Integer, primary_key=True, index=True)
    ad = Column(String(255), nullable=False)
    soyad = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    sifre = Column(String(255), nullable=False)
    createdAt = Column(DateTime(timezone=True), server_default=func.now())
    updatedAt = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())