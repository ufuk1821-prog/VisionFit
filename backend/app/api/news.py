from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.news import News
from app.models.analysis import AnalysisResult
from app.core.security import get_current_user

router = APIRouter(prefix="/api/data", tags=["Haberler ve Analizler"])

@router.get("/news")
def haberleri_listele(
    db: Session = Depends(get_db), 
    current_user = Depends(get_current_user)
):
    news = db.query(News).all()
    return news if news else []

@router.get("/history/{user_id}")
def gecmisi_getir(
    user_id: int, 
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    results = db.query(AnalysisResult).filter(AnalysisResult.user_id == user_id).all()
    if not results:
        raise HTTPException(status_code=404, detail="Gecmis veri bulunamadi.")
    return results