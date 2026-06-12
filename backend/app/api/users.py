from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.schemas.user import UserProfileRead, UserProfileUpdate
from app.schemas.diet import DietRecommendation, DietCustomRequest, DietCustomResponse
from app.services.diet import build_diet_recommendation
from app.services.ai_diet import generate_custom_diet

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

@router.get("/me/diet", response_model=DietRecommendation)
def get_diet_recommendation(current_user: User = Depends(get_current_user)):
    user = get_validated_diet_inputs(current_user)

    return build_diet_recommendation(
        boy_cm=user.boy,
        kilo_kg=user.kilo,
        yas=user.yas,
        cinsiyet=user.cinsiyet,
        aktiflik_seviyesi=user.aktiflik_seviyesi,
        hedef=user.hedef,
    )

@router.post("/me/diet/custom", response_model=DietCustomResponse)
def get_custom_diet(
    data: DietCustomRequest,
    current_user: User = Depends(get_current_user)
):
    user = get_validated_diet_inputs(current_user)

    recommendation = build_diet_recommendation(
        boy_cm=user.boy,
        kilo_kg=user.kilo,
        yas=user.yas,
        cinsiyet=user.cinsiyet,
        aktiflik_seviyesi=user.aktiflik_seviyesi,
        hedef=user.hedef,
    )

    oneri = generate_custom_diet(recommendation["hedef_kalori"], user.hedef, data.istek)

    return {"oneri": oneri}