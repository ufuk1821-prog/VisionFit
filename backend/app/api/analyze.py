from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.schemas.analyze import PoseData
from app.models.history import WorkoutHistory
from app.core.database import SessionLocal
import pickle
import os
import numpy as np
import pandas as pd
import math

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
model_path = os.path.join(base_dir, 'services', 'squat_model.pkl')

with open(model_path, 'rb') as f:
    model = pickle.load(f)

def calculate_angle(a, b, c):
    a = np.array(a)
    b = np.array(b)
    c = np.array(c)
    radians = math.atan2(c[1]-b[1], c[0]-b[0]) - math.atan2(a[1]-b[1], a[0]-b[0])
    angle = np.abs(radians*180.0/math.pi)
    if angle > 180.0:
        angle = 360 - angle
    return angle

@router.post("/squat")
def analyze_squat(data: PoseData, db: Session = Depends(get_db)):
    X = pd.DataFrame([data.landmarks])
    
    hareket_sinifi = str(model.predict(X)[0])
    olasilik = round(max(model.predict_proba(X)[0]).item() * 100, 2)
    
    hip_x, hip_y = data.landmarks[24*4], data.landmarks[24*4 + 1]
    knee_x, knee_y = data.landmarks[26*4], data.landmarks[26*4 + 1]
    ankle_x, ankle_y = data.landmarks[28*4], data.landmarks[28*4 + 1]
    
    angle = calculate_angle([hip_x, hip_y], [knee_x, knee_y], [ankle_x, ankle_y])
    
    if hareket_sinifi == 'dogru_squat':
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
        hareket_adi=hareket_sinifi,
        eminlik_skoru=float(olasilik),
        diz_acisi=int(angle),
        antrenor_notu=durum
    )
    db.add(yeni_kayit)
    db.commit()
    db.refresh(yeni_kayit)
            
    return {
        "kayit_id": yeni_kayit.id,
        "hareket": hareket_sinifi,
        "eminlik": olasilik,
        "aci": int(angle),
        "antrenor_mesaji": durum,
        "mesaj": "Veritabanina basariyla kaydedildi!"
    }
from typing import List
from app.schemas.history import HistoryRead

@router.get("/history", response_model=List[HistoryRead])
def get_history(db: Session = Depends(get_db)):
    kayitlar = db.query(WorkoutHistory).order_by(WorkoutHistory.tarih.desc()).all()
    return kayitlar