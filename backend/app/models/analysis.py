from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base

class AnalysisResult(Base):
    __tablename__ = "analysis_results"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("Users.id"))
    egzersiz_tipi = Column(String(255))
    sonuc_ozeti = Column(Text)
    tarih = Column(DateTime(timezone=True), server_default=func.now())
    
    user = relationship("app.models.user.User")