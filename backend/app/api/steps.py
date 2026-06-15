from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.steps import StepLog
from app.schemas.steps import StepCreate, StepRead
from app.services.steps import calculate_calories_burned, ACTIVITY_PROFILES

router = APIRouter(prefix="/api/steps", tags=["Adim Sayaci"])

@router.post("", response_model=StepRead, status_code=status.HTTP_201_CREATED)
def log_steps(
    data: StepCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.kilo is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Kalori hesaplaması için profilinizde kilo bilgisi gereklidir."
        )

    if data.aktivite_tipi not in ACTIVITY_PROFILES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Geçersiz aktivite tipi."
        )

    yakilan_kalori = calculate_calories_burned(data.adim_sayisi, data.aktivite_tipi, current_user.kilo)

    kayit = StepLog(
        user_id=current_user.id,
        adim_sayisi=data.adim_sayisi,
        aktivite_tipi=data.aktivite_tipi,
        yakilan_kalori=yakilan_kalori,
    )
    db.add(kayit)
    db.commit()
    db.refresh(kayit)
    return kayit

@router.get("", response_model=List[StepRead])
def get_step_logs(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return db.query(StepLog).filter(StepLog.user_id == current_user.id).order_by(StepLog.tarih.desc()).all()