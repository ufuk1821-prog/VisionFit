from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.history import WorkoutHistory
from app.models.steps import StepLog
from app.models.nutrition import MealLog, WaterLog
from app.models.workout_note import WorkoutNote
from app.models.user import User

REQUIRED_DIET_FIELDS = ["boy", "kilo", "yas", "cinsiyet", "aktiflik_seviyesi", "hedef"]

SEVIYE_ETIKET = {
    "Bronz": "Bronz",
    "Gumus": "Gümüş",
    "Altin": "Altın",
}

WATER_GOAL_ML = 2500


def to_iso(value):
    if value is None:
        return None
    if hasattr(value, "isoformat"):
        return value.isoformat()
    return str(value)


def get_badge_status(db: Session, user: User):
    badges = []

    workouts = db.query(WorkoutHistory).filter(WorkoutHistory.user_id == user.id).order_by(WorkoutHistory.tarih.asc()).all()

    badges.append({
        "key": "ilk_antrenman",
        "baslik": "İlk Adım",
        "aciklama": "İlk antrenman analizini tamamla",
        "seviye": "Bronz",
        "kazanildi": len(workouts) >= 1,
        "kazanilma_tarihi": to_iso(workouts[0].tarih) if len(workouts) >= 1 else None,
    })

    iyi_seanslar = [
        w for w in workouts
        if (w.hareket_adi == "squat_session" and w.eminlik_skoru >= 75)
        or (w.hareket_adi == "dogru_squat")
    ]

    for esik, seviye, key in [(5, "Bronz", "form_5"), (20, "Gumus", "form_20"), (50, "Altin", "form_50")]:
        kazanildi = len(iyi_seanslar) >= esik
        badges.append({
            "key": key,
            "baslik": f"Form Ustası ({SEVIYE_ETIKET[seviye]})",
            "aciklama": f"%75 ve üzeri skorla {esik} antrenman tamamla",
            "seviye": seviye,
            "kazanildi": kazanildi,
            "kazanilma_tarihi": to_iso(iyi_seanslar[esik - 1].tarih) if kazanildi else None,
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
            "aciklama": f"Bir günde en az {esik} adım at",
            "seviye": seviye,
            "kazanildi": kazanildi,
            "kazanilma_tarihi": to_iso(min(g.gun for g in eligible)) if kazanildi else None,
        })

    gunluk_su = (
        db.query(func.date(WaterLog.tarih).label("gun"), func.sum(WaterLog.miktar_ml).label("toplam"))
        .filter(WaterLog.user_id == user.id)
        .group_by(func.date(WaterLog.tarih))
        .all()
    )
    su_gunleri = sorted([g.gun for g in gunluk_su if g.toplam >= WATER_GOAL_ML])

    for esik, seviye, key in [(1, "Bronz", "su_1"), (7, "Gumus", "su_7"), (30, "Altin", "su_30")]:
        kazanildi = len(su_gunleri) >= esik
        badges.append({
            "key": key,
            "baslik": f"Su İçme Şampiyonu ({SEVIYE_ETIKET[seviye]})",
            "aciklama": f"Günlük {WATER_GOAL_ML}ml su hedefine {esik} gün ulaş",
            "seviye": seviye,
            "kazanildi": kazanildi,
            "kazanilma_tarihi": to_iso(su_gunleri[esik - 1]) if kazanildi else None,
        })

    ogun_gunleri = sorted(set(
        g[0] for g in
        db.query(func.date(MealLog.tarih))
        .filter(MealLog.user_id == user.id)
        .distinct()
        .all()
    ))

    for esik, seviye, key in [(1, "Bronz", "ogun_1"), (7, "Gumus", "ogun_7"), (30, "Altin", "ogun_30")]:
        kazanildi = len(ogun_gunleri) >= esik
        badges.append({
            "key": key,
            "baslik": f"Beslenme Takipçisi ({SEVIYE_ETIKET[seviye]})",
            "aciklama": f"{esik} farklı gün öğün kaydet",
            "seviye": seviye,
            "kazanildi": kazanildi,
            "kazanilma_tarihi": to_iso(ogun_gunleri[esik - 1]) if kazanildi else None,
        })

    defter_gunleri = sorted(set(
        g[0] for g in
        db.query(WorkoutNote.tarih)
        .filter(WorkoutNote.user_id == user.id)
        .distinct()
        .all()
    ))

    for esik, seviye, key in [(1, "Bronz", "defter_1"), (5, "Gumus", "defter_5"), (15, "Altin", "defter_15")]:
        kazanildi = len(defter_gunleri) >= esik
        badges.append({
            "key": key,
            "baslik": f"Antrenman Defteri Tutkunu ({SEVIYE_ETIKET[seviye]})",
            "aciklama": f"{esik} farklı gün antrenman defterine kayıt gir",
            "seviye": seviye,
            "kazanildi": kazanildi,
            "kazanilma_tarihi": to_iso(defter_gunleri[esik - 1]) if kazanildi else None,
        })

    profil_tamam = all(getattr(user, field) is not None for field in REQUIRED_DIET_FIELDS)
    badges.append({
        "key": "beslenme_bilinci",
        "baslik": "Beslenme Bilinci",
        "aciklama": "Profil bilgilerini tamamlayarak diyet önerisi al",
        "seviye": "Bronz",
        "kazanildi": profil_tamam,
        "kazanilma_tarihi": None,
    })

    return badges