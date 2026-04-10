from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.user import News, AnalysisResult

router = APIRouter(prefix="/api/data", tags=["Haberler ve Analizler"])

@router.get("/news")
def haberleri_listele(db: Session = Depends(get_db)):
    return db.query(News).all()

@router.get("/history/{user_id}")
def gecmisi_getir(user_id: int, db: Session = Depends(get_db)):
    return db.query(AnalysisResult).filter(AnalysisResult.user_id == user_id).all()