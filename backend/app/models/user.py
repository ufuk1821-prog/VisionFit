from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey
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
    createdAt = Column(DateTime(timezone=True), default=func.now())

class AnalysisResult(Base):
    __tablename__ = "analysis_results"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("Users.id"))
    egzersiz_tipi = Column(String(255))
    sonuc_ozeti = Column(Text)
    tarih = Column(DateTime(timezone=True), default=func.now())
    user = relationship("User")

class News(Base):
    __tablename__ = "news"
    id = Column(Integer, primary_key=True, index=True)
    baslik = Column(String(255))
    icerik = Column(Text)
    kaynak = Column(String(255))
    tarih = Column(DateTime(timezone=True), default=func.now())