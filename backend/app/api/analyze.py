import os
import pickle
import math
import numpy as np
import pandas as pd
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.schemas.analyze import PoseData, SessionData, SessionResult, KategoriSonuc
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


def calculate_angle(a, b, c):
    a_np = np.array(a)
    b_np = np.array(b)
    c_np = np.array(c)
    radians = math.atan2(c_np[1] - b_np[1], c_np[0] - b_np[0]) - \
              math.atan2(a_np[1] - b_np[1], a_np[0] - b_np[0])
    angle = np.abs(radians * 180.0 / math.pi)
    if angle > 180.0:
        angle = 360 - angle
    return float(angle)


def extract_landmark(lm_flat, idx):
    base = idx * 4
    return lm_flat[base], lm_flat[base + 1], lm_flat[base + 2], lm_flat[base + 3]


def landmarks_visible(lm_flat, indices, threshold=0.4):
    for idx in indices:
        _, _, _, vis = extract_landmark(lm_flat, idx)
        if vis < threshold:
            return False
    return True


def analyze_single_frame(lm_flat):
    """Tek bir kare analiz eder. Dict döndürür."""
    KEY_INDICES = [11, 12, 23, 24, 25, 26, 27, 28]

    if not landmarks_visible(lm_flat, KEY_INDICES):
        return None  # vücut görünür değil

    l_shoulder_x, l_shoulder_y, _, _ = extract_landmark(lm_flat, 11)
    r_shoulder_x, r_shoulder_y, _, _ = extract_landmark(lm_flat, 12)
    l_hip_x, l_hip_y, _, _           = extract_landmark(lm_flat, 23)
    r_hip_x, r_hip_y, _, _           = extract_landmark(lm_flat, 24)
    l_knee_x, l_knee_y, _, _         = extract_landmark(lm_flat, 25)
    r_knee_x, r_knee_y, _, _         = extract_landmark(lm_flat, 26)
    l_ankle_x, l_ankle_y, _, _       = extract_landmark(lm_flat, 27)
    r_ankle_x, r_ankle_y, _, _       = extract_landmark(lm_flat, 28)

    knee_angle = calculate_angle(
        [r_hip_x, r_hip_y],
        [r_knee_x, r_knee_y],
        [r_ankle_x, r_ankle_y]
    )

    knee_angle_left = calculate_angle(
        [l_hip_x, l_hip_y],
        [l_knee_x, l_knee_y],
        [l_ankle_x, l_ankle_y]
    )

    avg_knee_angle = (knee_angle + knee_angle_left) / 2

    in_squat = 70 <= avg_knee_angle <= 160

    ml_correct = True
    ml_confidence = 90.0
    if model is not None:
        try:
            features = lm_flat[:132]
            X = pd.DataFrame([features])
            pred = model.predict(X)[0]
            probs = model.predict_proba(X)[0]
            ml_confidence = float(round(max(probs) * 100, 2))
            ml_correct = (str(pred) == "dogru_squat")
        except Exception:
            pass

    shoulder_mid_x = (l_shoulder_x + r_shoulder_x) / 2
    hip_mid_x = (l_hip_x + r_hip_x) / 2
    forward_lean = abs(shoulder_mid_x - hip_mid_x)
    spine_ok = forward_lean < 0.15

    hip_mid_y = (l_hip_y + r_hip_y) / 2
    knee_mid_y = (l_knee_y + r_knee_y) / 2
    depth_ok = hip_mid_y >= knee_mid_y * 0.92

    r_knee_over = abs(r_knee_x - r_ankle_x)
    l_knee_over = abs(l_knee_x - l_ankle_x)
    knee_alignment_ok = r_knee_over < 0.12 and l_knee_over < 0.12

    r_valgus = r_knee_x > r_ankle_x + 0.06
    l_valgus = l_knee_x < l_ankle_x - 0.06
    no_valgus = not (r_valgus or l_valgus)

    ankle_mid_x = (l_ankle_x + r_ankle_x) / 2
    weight_center_ok = abs(hip_mid_x - ankle_mid_x) < 0.12

    return {
        "in_squat": in_squat,
        "knee_angle": avg_knee_angle,
        "ml_correct": ml_correct,
        "ml_confidence": ml_confidence,
        "spine_ok": spine_ok,
        "depth_ok": depth_ok,
        "knee_alignment_ok": knee_alignment_ok,
        "no_valgus": no_valgus,
        "weight_center_ok": weight_center_ok,
    }


@router.post("/session", response_model=SessionResult)
async def analyze_session(
    data: SessionData,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    if not data.frames:
        raise HTTPException(status_code=400, detail="Kare verisi boş.")

    results = []
    for frame in data.frames:
        if len(frame) < 132:
            continue
        r = analyze_single_frame(frame)
        if r is not None:
            results.append(r)

    if not results:
        raise HTTPException(status_code=400, detail="Analiz edilecek yeterli vücut verisi bulunamadı.")

    squat_frames = [r for r in results if r["in_squat"]]

    if not squat_frames:
        raise HTTPException(status_code=400, detail="Squat hareketi tespit edilemedi. Lütfen tam vücudunuzun göründüğünden emin olun.")

    total = len(squat_frames)

    def pct(key):
        ok = sum(1 for r in squat_frames if r[key])
        return round(ok / total * 100, 1)

    genel_skor_pct     = pct("ml_correct")
    spine_pct          = pct("spine_ok")
    depth_pct          = pct("depth_ok")
    knee_align_pct     = pct("knee_alignment_ok")
    no_valgus_pct      = pct("no_valgus")
    weight_center_pct  = pct("weight_center_ok")

    avg_confidence = round(sum(r["ml_confidence"] for r in squat_frames) / total, 1)
    avg_knee_angle = round(sum(r["knee_angle"] for r in squat_frames) / total, 0)

    def kategori(skor, iyi_mesaj, kotu_mesaj):
        if skor >= 75:
            return KategoriSonuc(skor=skor, mesaj=iyi_mesaj)
        else:
            return KategoriSonuc(skor=skor, mesaj=kotu_mesaj)

    sorunlar = []
    olumlu = []

    genel = kategori(genel_skor_pct,
        "Genel form iyi, squat hareketini doğru yapıyorsunuz.",
        "Squat formunda genel hatalar tespit edildi.")
    if genel_skor_pct < 75: sorunlar.append("genel form")
    else: olumlu.append("genel form")

    omurga = kategori(spine_pct,
        "Omurga nötrlüğü korunuyor, sırtınız düz.",
        "Öne aşırı eğilme var. Göğsünüzü dik tutun ve omurgayı nötr konumda tutun.")
    if spine_pct < 75: sorunlar.append("omurga nötrlüğü")
    else: olumlu.append("omurga nötrlüğü")

    kalca = kategori(depth_pct,
        "Kalça derinliği yeterli, diz seviyesine iniliyor.",
        "Squat derinliği yetersiz. Kalçanızı diz seviyesine veya altına kadar indirin.")
    if depth_pct < 75: sorunlar.append("kalça derinliği")
    else: olumlu.append("kalça derinliği")

    diz_hiza = kategori(knee_align_pct,
        "Diz hizası iyi, dizler ayak uçlarıyla hizalı.",
        "Dizler ayak ucunun önüne geçiyor. Ağırlığı topuklara alın.")
    if knee_align_pct < 75: sorunlar.append("diz hizası")
    else: olumlu.append("diz hizası")

    valgus = kategori(no_valgus_pct,
        "Diz çöküşü yok, dizler stabil.",
        "Diz içe çöküşü (valgus) var. Dizleri dışa doğru itin.")
    if no_valgus_pct < 75: sorunlar.append("diz çöküşü")
    else: olumlu.append("diz çöküşü")

    agirlik = kategori(weight_center_pct,
        "Ağırlık merkezi dengeli, topuklar yerde.",
        "Ağırlık merkezi öne kayıyor. Topuklarınızı yere basın.")
    if weight_center_pct < 75: sorunlar.append("ağırlık merkezi")
    else: olumlu.append("ağırlık merkezi")

    genel_skor = round((genel_skor_pct + spine_pct + depth_pct + knee_align_pct + no_valgus_pct + weight_center_pct) / 6, 1)

    olumlu_mesaj = ("Tebrikler! " + ", ".join(olumlu).capitalize() + " kategorilerinde başarılıydınız.") if olumlu else "Antrenmanı tamamladınız."
    gelistir_mesaj = ("Geliştirilecek alanlar: " + ", ".join(sorunlar) + ".") if sorunlar else "Harika antrenman! Tüm kategorilerde formunuz iyiydi."

    antrenor_notu = f"Skor: %{genel_skor} | " + (", ".join(sorunlar) if sorunlar else "Tüm kategoriler iyi")

    yeni_kayit = WorkoutHistory(
        user_id=current_user.id,
        hareket_adi="squat_session",
        eminlik_skoru=genel_skor,
        diz_acisi=int(avg_knee_angle),
        antrenor_notu=antrenor_notu
    )
    db.add(yeni_kayit)
    db.commit()

    return SessionResult(
        toplam_kare=len(results),
        squat_kare=total,
        genel_skor=genel_skor,
        genel_form=genel,
        omurga_notrluğu=omurga,
        kalca_derinligi=kalca,
        diz_hizasi=diz_hiza,
        diz_cokusu=valgus,
        agirlik_merkezi=agirlik,
        olumlu_mesaj=olumlu_mesaj,
        gelistirilecek_mesaj=gelistir_mesaj,
    )


@router.get("/history", response_model=List[HistoryRead])
async def get_history(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    return db.query(WorkoutHistory).filter(
        WorkoutHistory.user_id == current_user.id
    ).order_by(WorkoutHistory.tarih.desc()).all()