from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.schemas.user import UserProfileRead, UserProfileUpdate
from app.schemas.diet import DietRecommendation
from app.services.diet import build_diet_recommendation

router = APIRouter(prefix="/api/users", tags=["Kullanici Profili"])

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
    if current_user.boy is None or current_user.kilo is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Diyet onerisi icin boy ve kilo bilgisi gereklidir."
        )

    return build_diet_recommendation(current_user.boy, current_user.kilo)