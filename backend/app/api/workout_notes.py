from datetime import date as date_type
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import distinct
from typing import List
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.workout_note import WorkoutNote
from app.schemas.workout_note import WorkoutNoteItem, WorkoutNoteRead

router = APIRouter(prefix="/api/workout-notes", tags=["Antrenman Defteri"])


@router.get("/dates", response_model=List[str])
def get_dates(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    rows = (
        db.query(distinct(WorkoutNote.tarih))
        .filter(WorkoutNote.user_id == current_user.id)
        .order_by(WorkoutNote.tarih.desc())
        .all()
    )
    return [r[0].isoformat() for r in rows]


@router.get("/{tarih}", response_model=List[WorkoutNoteRead])
def get_notes_for_date(
    tarih: date_type,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return (
        db.query(WorkoutNote)
        .filter(WorkoutNote.user_id == current_user.id, WorkoutNote.tarih == tarih)
        .order_by(WorkoutNote.id.asc())
        .all()
    )


@router.put("/{tarih}", response_model=List[WorkoutNoteRead])
def save_notes_for_date(
    tarih: date_type,
    items: List[WorkoutNoteItem],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db.query(WorkoutNote).filter(
        WorkoutNote.user_id == current_user.id,
        WorkoutNote.tarih == tarih
    ).delete()

    kayitlar = []
    for item in items:
        if not item.hareket or not item.hareket.strip():
            continue
        kayit = WorkoutNote(
            user_id=current_user.id,
            tarih=tarih,
            hareket=item.hareket.strip(),
            set_sayisi=item.set_sayisi,
            tekrar_sayisi=item.tekrar_sayisi,
            agirlik=item.agirlik,
        )
        db.add(kayit)
        kayitlar.append(kayit)

    db.commit()
    for kayit in kayitlar:
        db.refresh(kayit)

    return kayitlar