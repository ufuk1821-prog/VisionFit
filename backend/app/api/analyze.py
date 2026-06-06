import os
import pickle
import math
import numpy as np
import pandas as pd
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.schemas.analyze import PoseData
from app.schemas.history import HistoryRead
from app.models.history import WorkoutHistory
from app.core.database import SessionLocal
from app.core.security import get_current_user

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

IS_TESTING = os.getenv("TESTING") == "True"
model = None

if not IS_TESTING:
    CURRENT_FILE_PATH = os.path.abspath(__file__)
    API_DIR = os.path.dirname(CURRENT_FILE_PATH)
    APP_DIR = os.path.dirname(API_DIR)
    BACKEND_DIR = os.path.dirname(APP_DIR)

    POSSIBLE_PATHS = [
        "/app/services/squat_model.pkl",
        os.path.join(BACKEND_DIR, "services", "squat_model.pkl"),
        os.path.join(APP_DIR, "services", "squat_model.pkl"),
        "/app/app/services/squat_model.pkl"
    ]

    MODEL_PATH = None
    for path in POSSIBLE_PATHS:
        if os.path.exists(path):
            MODEL_PATH = path
            break

    if not MODEL_PATH:
        raise RuntimeError(f"Model pkl dosyasi bulunamadi. Kontrol edilen yollar: {POSSIBLE_PATHS}")

    with open(MODEL_PATH, "rb") as f:
        model = pickle.load(f)

def calculate_angle(a: List[float], b: List[float], c: List[float]) -> float:
    a_np = np.array(a)
    b_np = np.array(b)
    c_np = np.array(c)
    radians = math.atan2(c_np[1] - b_np[1], c_np[0] - b_np[0]) - math.atan2(a_np[1] - b_np[1], a_np[0] - b_np[0])
    angle = np.abs(radians * 180.0 / math.pi)
    if angle > 180.0:
        angle = 360.0 - angle
    return angle

@router.post("/squat")
async def analyze_squat(
    data: PoseData,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    try:
        if len(data.landmarks) < 132:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Eksik landmark verisi gönderildi."
            )

        if IS_TESTING:
            hareket_sinifi = "dogru_squat"
            confidence = 99.9
        else:
            features = data.landmarks[:132]
            X = pd.DataFrame([features])
            prediction = model.predict(X)[0]
            probabilities = model.predict_proba(X)[0]
            confidence = float(round(max(probabilities).item() * 100, 2))
            hareket_sinifi = str(prediction)

        hip_x, hip_y = data.landmarks[24 * 4], data.landmarks[24 * 4 + 1]
        knee_x, knee_y = data.landmarks[26 * 4], data.landmarks[26 * 4 + 1]
        ankle_x, ankle_y = data.landmarks[28 * 4], data.landmarks[28 * 4 + 1]

        angle = int(calculate_angle([hip_x, hip_y], [knee_x, knee_y], [ankle_x, ankle_y]))

        if hareket_sinifi == "dogru_squat":
            if angle > 160:
                durum = "AYAKTA BEKLIYOR"
            elif angle < 100:
                durum = "HARIKA FORM"
            else:
                durum = "YARIM SQUAT"
        else:
            if angle < 90:
                durum = "UYARI: DIZLERINI KONTROL ET"
            else:
                durum = "UYARI: BELINI BUKUYORSUN"

        yeni_kayit = WorkoutHistory(
            user_id=current_user.id,
            hareket_adi=hareket_sinifi,
            eminlik_skoru=confidence,
            diz_acisi=angle,
            antrenor_notu=durum
        )
        db.add(yeni_kayit)
        db.commit()
        db.refresh(yeni_kayit)

        return {
            "kayit_id": yeni_kayit.id,
            "hareket": hareket_sinifi,
            "eminlik": confidence,
            "aci": angle,
            "antrenor_mesaji": durum,
            "mesaj": "Veritabanina basariyla kaydedildi!"
        }

    except HTTPException as http_ex:
        raise http_ex
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Analiz sirasinda sistemsel hata olustu: {str(e)}"
        )

@router.get("/history", response_model=List[HistoryRead])
async def get_history(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    try:
        return db.query(WorkoutHistory).filter(
            WorkoutHistory.user_id == current_user.id
        ).order_by(WorkoutHistory.tarih.desc()).all()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Gecmis veriler alinirken hata olustu: {str(e)}"
        )