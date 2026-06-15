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
    KEY_INDICES = [11, 12, 23, 24, 25, 26, 27, 28]

    if not landmarks_visible(lm_flat, KEY_INDICES):
        return None

    l_shoulder_x, l_shoulder_y, _, _ = extract_landmark(lm_flat, 11)
    r_shoulder_x, r_shoulder_y, _, _ = extract_landmark(lm_flat, 12)
    l_hip_x, l_hip_y, _, _           = extract_landmark(lm_flat, 23)
    r_hip_x, r_hip_y, _, _           = extract_landmark(lm_flat, 24)
    l_knee_x, l_knee_y, _, _         = extract_landmark(lm_flat, 25)
    r_knee_x, r_knee_y, _, _         = extract_landmark(lm_flat, 26)
    l_ankle_x, l_ankle_y, _, _       = extract_landmark(lm_flat, 27)
    r_ankle_x, r_ankle_y, _, _       = extract_landmark(lm_flat, 28)

    knee_angle = calculate_angle(
        [r_hip_x, r_hip_y], [r_knee_x, r_knee_y], [r_ankle_x, r_ankle_y]
    )
    knee_angle_left = calculate_angle(
        [l_hip_x, l_hip_y], [l_knee_x, l_knee_y], [l_ankle_x, l_ankle_y]
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


@router.post("/squat")
async def analyze_squat(
    data: PoseData,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    if len(data.landmarks) < 132:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Eksik landmark verisi gönderildi."
        )

    if IS_TESTING:
        hareket_sinifi = "dogru_squat"
        confidence = 99.9
    else:
        try:
            features = data.landmarks[:132]
            X = pd.DataFrame([features])
            prediction = model.predict(X)[0]
            probabilities = model.predict_proba(X)[0]
            confidence = float(round(max(probabilities).item() * 100, 2))
            hareket_sinifi = str(prediction)
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Model hatası: {str(e)}"
            )

    hip_x, hip_y = data.landmarks[24 * 4], data.landmarks[24 * 4 + 1]
    knee_x, knee_y = data.landmarks[26 * 4], data.landmarks[26 * 4 + 1]
    ankle_x, ankle_y = data.landmarks[28 * 4], data.landmarks[28 * 4 + 1]
    angle = int(calculate_angle([hip_x, hip_y], [knee_x, knee_y], [ankle_x, ankle_y]))

    if hareket_sinifi == "dogru_squat":
        if angle > 160:
            durum = "Ayakta Bekliyor"
        elif angle < 100:
            durum = "Harika Form"
        else:
            durum = "Yarım Squat"
    else:
        if angle < 90:
            durum = "Uyarı: Dizlerini Kontrol Et"
        else:
            durum = "Uyarı: Belini Büküyorsun"

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
        "mesaj": "Veritabanına başarıyla kaydedildi!"
    }

@router.post("/plank")
async def analyze_plank(
    data: PoseData,
    current_user=Depends(get_current_user)
):
    if len(data.landmarks) < 132:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Eksik landmark verisi gönderildi."
        )

    gerekli_noktalar = [11, 12, 23, 24, 27, 28]
    if not landmarks_visible(data.landmarks, gerekli_noktalar):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Vücudunuz net görünmüyor. Lütfen yandan, tüm vücudunuz kadraja girecek şekilde durun."
        )

    omuz_x = (data.landmarks[11 * 4] + data.landmarks[12 * 4]) / 2
    omuz_y = (data.landmarks[11 * 4 + 1] + data.landmarks[12 * 4 + 1]) / 2
    kalca_x = (data.landmarks[23 * 4] + data.landmarks[24 * 4]) / 2
    kalca_y = (data.landmarks[23 * 4 + 1] + data.landmarks[24 * 4 + 1]) / 2
    ayak_x = (data.landmarks[27 * 4] + data.landmarks[28 * 4]) / 2
    ayak_y = (data.landmarks[27 * 4 + 1] + data.landmarks[28 * 4 + 1]) / 2

    if abs(ayak_x - omuz_x) < 0.05:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Plank pozisyonunuz tespit edilemedi. Lütfen kameraya yandan durun."
        )

    oran = (kalca_x - omuz_x) / (ayak_x - omuz_x)
    beklenen_kalca_y = omuz_y + oran * (ayak_y - omuz_y)
    fark = kalca_y - beklenen_kalca_y

    ESIK = 0.05
    if fark < -ESIK:
        durum = "Kalça Çok Yukarıda"
        antrenor_mesaji = "Kalçanız omuz-ayak çizgisinin üzerinde, vücudunuzu düz bir hat haline getirin."
    elif fark > ESIK:
        durum = "Bel Çökmüş"
        antrenor_mesaji = "Belinizde çökme var, karın kaslarınızı sıkarak belinizi düzleştirin."
    else:
        durum = "İyi Form"
        antrenor_mesaji = "Vücudunuz düz bir hat halinde, harika bir plank formu!"

    return {
        "durum": durum,
        "fark": round(float(fark), 4),
        "antrenor_mesaji": antrenor_mesaji
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
        raise HTTPException(status_code=400, detail="Squat hareketi tespit edilemedi. Lütfen tüm vücudunuzun göründüğünden emin olun.")

    total = len(squat_frames)

    def pct(key):
        ok = sum(1 for r in squat_frames if r[key])
        return round(ok / total * 100, 1)

    genel_skor_pct    = pct("ml_correct")
    spine_pct         = pct("spine_ok")
    depth_pct         = pct("depth_ok")
    knee_align_pct    = pct("knee_alignment_ok")
    no_valgus_pct     = pct("no_valgus")
    weight_center_pct = pct("weight_center_ok")

    avg_knee_angle = round(sum(r["knee_angle"] for r in squat_frames) / total, 0)

    def kategori(skor, iyi_mesaj, kotu_mesaj):
        if skor >= 75:
            return KategoriSonuc(skor=skor, mesaj=iyi_mesaj)
        return KategoriSonuc(skor=skor, mesaj=kotu_mesaj)

    sorunlar = []
    olumlu = []

    genel = kategori(genel_skor_pct,
        "Genel form iyi, squat hareketini doğru yapıyorsunuz.",
        "Squat formunda genel hatalar tespit edildi.")
    (olumlu if genel_skor_pct >= 75 else sorunlar).append("genel form")

    omurga = kategori(spine_pct,
        "Omurga nötrlüğü korunuyor, sırtınız düz.",
        "Öne aşırı eğilme var. Göğsünüzü dik tutun ve omurgayı nötr konumda tutun.")
    (olumlu if spine_pct >= 75 else sorunlar).append("omurga nötrlüğü")

    kalca = kategori(depth_pct,
        "Kalça derinliği yeterli, diz seviyesine iniliyor.",
        "Squat derinliği yetersiz. Kalçanızı diz seviyesine veya altına indirin.")
    (olumlu if depth_pct >= 75 else sorunlar).append("kalça derinliği")

    diz_hiza = kategori(knee_align_pct,
        "Diz hizası iyi, dizler ayak uçlarıyla hizalı.",
        "Dizler ayak ucunun önüne geçiyor. Ağırlığı topuklara alın.")
    (olumlu if knee_align_pct >= 75 else sorunlar).append("diz hizası")

    valgus = kategori(no_valgus_pct,
        "Diz çöküşü yok, dizler stabil.",
        "Diz içe çöküşü (valgus) var. Dizleri dışa doğru itin.")
    (olumlu if no_valgus_pct >= 75 else sorunlar).append("diz çöküşü")

    agirlik = kategori(weight_center_pct,
        "Ağırlık merkezi dengeli, topuklar yerde.",
        "Ağırlık merkezi öne kayıyor. Topuklarınızı yere basın.")
    (olumlu if weight_center_pct >= 75 else sorunlar).append("ağırlık merkezi")

    genel_skor = round(
        (genel_skor_pct + spine_pct + depth_pct + knee_align_pct + no_valgus_pct + weight_center_pct) / 6, 1
    )

    olumlu_mesaj = ("Tebrikler! " + ", ".join(olumlu).capitalize() + " kategorilerinde başarılıydınız.") if olumlu else "Antrenman tamamlandı."
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