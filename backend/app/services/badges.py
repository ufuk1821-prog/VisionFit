from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.history import WorkoutHistory
from app.models.steps import StepLog
from app.models.user import User

REQUIRED_DIET_FIELDS = ["boy", "kilo", "yas", "cinsiyet", "aktiflik_seviyesi", "hedef"]

SEVIYE_ETIKET = {
    "Bronz": "Bronz",
    "Gumus": "Gümüş",
    "Altin": "Altın",
}

def to_iso(value):
    if value is None:
        return None
    return value.isoformat()

def get_badge_status(db: Session, user: User):
    badges = []

    workouts = db.query(WorkoutHistory).filter(WorkoutHistory.user_id == user.id).order_by(WorkoutHistory.tarih.asc()).all()
    correct_squats = [w for w in workouts if w.hareket_adi == "dogru_squat"]

    badges.append({
        "key": "ilk_antrenman",
        "baslik": "İlk Adım",
        "aciklama": "İlk antrenman analizini tamamla",
        "seviye": "Bronz",
        "kazanildi": len(workouts) >= 1,
        "kazanilma_tarihi": to_iso(workouts[0].tarih) if len(workouts) >= 1 else None,
    })

    for esik, seviye, key in [(10, "Bronz", "squat_10"), (50, "Gumus", "squat_50"), (100, "Altin", "squat_100")]:
        kazanildi = len(correct_squats) >= esik
        badges.append({
            "key": key,
            "baslik": f"Squat Ustası ({SEVIYE_ETIKET[seviye]})",
            "aciklama": f"Toplam {esik} dogru squat tamamla",
            "seviye": seviye,
            "kazanildi": kazanildi,
            "kazanilma_tarihi": to_iso(correct_squats[esik - 1].tarih) if kazanildi else None,
        })

    gunluk_adimlar = (
        db.query(func.date(StepLog.tarih).label("gun"), func.sum(StepLog.adim_sayisi).label("toplam"))
        .filter(StepLog.user_id == user.id)
        .group_by(func.date(StepLog.tarih))
        .all()
    )

    for esik, seviye, key in [(5000, "Bronz", "adim_5000"), (10000, "Gumus", "adim_10000"), (15000, "Altin", "adim_15000")]:
        eligible = [g for g in gunluk_adimlar if g.toplam >= esik]
        kazanildi = len(eligible) > 0
        badges.append({
            "key": key,
            "baslik": f"Adım Avcısı ({SEVIYE_ETIKET[seviye]})",
            "aciklama": f"Bir gunde en az {esik} adim at",
            "seviye": seviye,
            "kazanildi": kazanildi,
            "kazanilma_tarihi": to_iso(min(g.gun for g in eligible)) if kazanildi else None,
        })

    profil_tamam = all(getattr(user, field) is not None for field in REQUIRED_DIET_FIELDS)
    badges.append({
        "key": "beslenme_bilinci",
        "baslik": "Beslenme Bilinci",
        "aciklama": "Profil bilgilerini tamamlayarak diyet onerisi al",
        "seviye": "Bronz",
        "kazanildi": profil_tamam,
        "kazanilma_tarihi": to_iso(user.updatedAt) if profil_tamam else None,
    })

    return badges