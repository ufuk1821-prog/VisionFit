from sqlalchemy import Column, Integer, String, DateTime, Text
from sqlalchemy.sql import func
from app.core.database import Base

class News(Base):
    __tablename__ = "news"
    id = Column(Integer, primary_key=True, index=True)
    baslik = Column(String(255))
    icerik = Column(Text)
    kaynak = Column(String(255))
    tarih = Column(DateTime(timezone=True), server_default=func.now())