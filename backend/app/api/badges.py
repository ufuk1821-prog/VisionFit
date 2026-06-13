from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.schemas.badges import BadgeStatus
from app.services.badges import get_badge_status

router = APIRouter(prefix="/api/badges", tags=["Rozetler"])

@router.get("", response_model=List[BadgeStatus])
def list_badges(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return get_badge_status(db, current_user)