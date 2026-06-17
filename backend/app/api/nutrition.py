from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.nutrition import MealLog, WaterLog
from app.schemas.nutrition import FoodItem, MealLogCreate, MealLogRead, WaterLogCreate, WaterLogRead
from app.services.diet import FOOD_DATABASE

router = APIRouter(prefix="/api/nutrition", tags=["Beslenme Takibi"])

OGUN_TIPLERI = ["kahvalti", "ogle", "aksam", "ara_ogun"]

@router.get("/foods", response_model=List[FoodItem])
def list_foods():
    return [
        {
            "anahtar": key,
            "ad": value["ad"],
            "protein": value["protein"],
            "karbonhidrat": value["karbonhidrat"],
            "yag": value["yag"],
        }
        for key, value in FOOD_DATABASE.items()
    ]

@router.post("/meals", response_model=MealLogRead, status_code=status.HTTP_201_CREATED)
def add_meal(
    data: MealLogCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if data.ogun_tipi not in OGUN_TIPLERI:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Geçersiz öğün tipi.")

    if data.besin_anahtari not in FOOD_DATABASE:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Geçersiz besin.")

    if data.gram <= 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Gram pozitif olmalıdır.")

    besin = FOOD_DATABASE[data.besin_anahtari]
    oran = data.gram / 100

    protein_g = round(besin["protein"] * oran, 1)
    karbonhidrat_g = round(besin["karbonhidrat"] * oran, 1)
    yag_g = round(besin["yag"] * oran, 1)
    kalori = round((protein_g * 4) + (karbonhidrat_g * 4) + (yag_g * 9), 1)

    from datetime import datetime as dt
    hedef_tarih = dt.now()
    if data.tarih:
        try:
            hedef_tarih = dt.fromisoformat(data.tarih)
        except ValueError:
            pass

    kayit = MealLog(
        user_id=current_user.id,
        ogun_tipi=data.ogun_tipi,
        besin_anahtari=data.besin_anahtari,
        besin_adi=besin["ad"],
        gram=data.gram,
        kalori=kalori,
        protein_g=protein_g,
        karbonhidrat_g=karbonhidrat_g,
        yag_g=yag_g,
        tarih=hedef_tarih,
    )
    db.add(kayit)
    db.commit()
    db.refresh(kayit)
    return kayit

@router.get("/meals/today", response_model=List[MealLogRead])
def get_today_meals(
    tarih: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from datetime import date as date_type
    if tarih:
        try:
            hedef_tarih = date_type.fromisoformat(tarih)
        except ValueError:
            hedef_tarih = date_type.today()
    else:
        hedef_tarih = date_type.today()
    return (
        db.query(MealLog)
        .filter(MealLog.user_id == current_user.id, func.date(MealLog.tarih) == hedef_tarih)
        .order_by(MealLog.tarih.asc())
        .all()
    )

@router.delete("/meals/{meal_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_meal(
    meal_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    kayit = db.query(MealLog).filter(MealLog.id == meal_id, MealLog.user_id == current_user.id).first()

    if not kayit:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Kayıt bulunamadı.")

    db.delete(kayit)
    db.commit()

@router.post("/water", response_model=WaterLogRead, status_code=status.HTTP_201_CREATED)
def add_water(
    data: WaterLogCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if data.miktar_ml <= 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Miktar pozitif olmalıdır.")

    from datetime import datetime as dt
    hedef_tarih = dt.now()
    if data.tarih:
        try:
            hedef_tarih = dt.fromisoformat(data.tarih)
        except ValueError:
            pass
    kayit = WaterLog(user_id=current_user.id, miktar_ml=data.miktar_ml, tarih=hedef_tarih)
    
    db.add(kayit)
    db.commit()
    db.refresh(kayit)
    return kayit

@router.get("/water/today", response_model=List[WaterLogRead])
def get_today_water(
    tarih: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from datetime import date as date_type
    if tarih:
        try:
            hedef_tarih = date_type.fromisoformat(tarih)
        except ValueError:
            hedef_tarih = date_type.today()
    else:
        hedef_tarih = date_type.today()
    return (
        db.query(WaterLog)
        .filter(WaterLog.user_id == current_user.id, func.date(WaterLog.tarih) == hedef_tarih)
        .order_by(WaterLog.tarih.asc())
        .all()
    )

@router.delete("/water/{water_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_water(
    water_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    kayit = db.query(WaterLog).filter(WaterLog.id == water_id, WaterLog.user_id == current_user.id).first()

    if not kayit:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Kayıt bulunamadı.")

    db.delete(kayit)
    db.commit()