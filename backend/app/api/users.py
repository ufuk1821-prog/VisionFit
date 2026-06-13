from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user, verify_password, get_password_hash
from app.models.user import User
from app.models.history import WorkoutHistory
from app.models.steps import StepLog
from app.models.nutrition import MealLog, WaterLog
from app.schemas.user import UserProfileRead, UserProfileUpdate, PasswordChangeRequest
from app.schemas.diet import DietRecommendation, DietCustomRequest, DietCalculateRequest
from app.services.diet import build_diet_recommendation

router = APIRouter(prefix="/api/users", tags=["Kullanici Profili"])

REQUIRED_DIET_FIELDS = ["boy", "kilo", "yas", "cinsiyet", "aktiflik_seviyesi", "hedef"]


def get_validated_diet_inputs(current_user: User) -> User:
    missing = [field for field in REQUIRED_DIET_FIELDS if getattr(current_user, field) is None]
    if missing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Diyet onerisi icin eksik bilgiler: {', '.join(missing)}"
        )
    return current_user


@router.get("/me", response_model=UserProfileRead)
def get_profile(current_user: User = Depends(get_current_user)):
    return current_user


@router.put("/me", response_model=UserProfileRead)
def update_profile(
    data: UserProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(current_user, key, value)
    db.commit()
    db.refresh(current_user)
    return current_user


@router.put("/me/password")
def change_password(
    data: PasswordChangeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not verify_password(data.mevcut_sifre, current_user.sifre):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Mevcut sifre yanlis.")
    if len(data.yeni_sifre) < 6:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Yeni sifre en az 6 karakter olmalidir.")
    current_user.sifre = get_password_hash(data.yeni_sifre)
    db.commit()
    return {"mesaj": "Sifre basariyla guncellendi."}


@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
def delete_account(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db.query(WorkoutHistory).filter(WorkoutHistory.user_id == current_user.id).delete()
    db.query(StepLog).filter(StepLog.user_id == current_user.id).delete()
    db.query(MealLog).filter(MealLog.user_id == current_user.id).delete()
    db.query(WaterLog).filter(WaterLog.user_id == current_user.id).delete()
    db.delete(current_user)
    db.commit()


@router.get("/me/diet", response_model=DietRecommendation)
def get_diet_recommendation(current_user: User = Depends(get_current_user)):
    user = get_validated_diet_inputs(current_user)
    return build_diet_recommendation(
        boy_cm=user.boy, kilo_kg=user.kilo, yas=user.yas,
        cinsiyet=user.cinsiyet, aktiflik_seviyesi=user.aktiflik_seviyesi, hedef=user.hedef,
    )


@router.post("/me/diet/custom", response_model=DietRecommendation)
def get_custom_diet_recommendation(
    data: DietCustomRequest,
    current_user: User = Depends(get_current_user)
):
    user = get_validated_diet_inputs(current_user)
    return build_diet_recommendation(
        boy_cm=user.boy, kilo_kg=user.kilo, yas=user.yas,
        cinsiyet=user.cinsiyet, aktiflik_seviyesi=user.aktiflik_seviyesi,
        hedef=user.hedef, istek=data.istek,
    )


@router.post("/diet/calculate", response_model=DietRecommendation)
def calculate_diet(
    data: DietCalculateRequest,
    current_user: User = Depends(get_current_user)
):
    if data.boy <= 0 or data.kilo <= 0 or data.yas <= 0:
        raise HTTPException(status_code=400, detail="Geçersiz değer.")
    return build_diet_recommendation(
        boy_cm=data.boy, kilo_kg=data.kilo, yas=data.yas,
        cinsiyet=data.cinsiyet, aktiflik_seviyesi=data.aktiflik_seviyesi,
        hedef=data.hedef, istek=data.istek or "",
    )