from fastapi import APIRouter, Depends, HTTPException, status
from app.core.database import get_db
from app.core.security import get_current_user
from app.schemas.local_llm import AntrenorYorumuRequest, DiyetOnerisiRequest, DefterAnaliziRequest
from app.services import local_llm

router = APIRouter(prefix="/api/yerel-ai", tags=["Yerel AI"])


def _yerel_llm_kontrol():
    if not local_llm.llm_kullanilabilir_mi():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Yerel AI modeli bu ortamda bulunamadi. Bu ozellik sadece modelin indirildigi lokal ortamda calisir.",
        )


@router.post("/antrenor-yorumu")
def antrenor_yorumu(istek: AntrenorYorumuRequest, kullanici=Depends(get_current_user)):
    _yerel_llm_kontrol()
    yorum = local_llm.antrenor_geri_bildirimi_uret(istek.hareket, istek.genel_skor, istek.kategori_skorlari)
    return {"yorum": yorum}


@router.post("/diyet-onerisi")
def diyet_onerisi(istek: DiyetOnerisiRequest, kullanici=Depends(get_current_user)):
    _yerel_llm_kontrol()
    yorum = local_llm.diyet_onerisi_uret(istek.profil, istek.plan, istek.kullanici_notu)
    return {"yorum": yorum}


GECERLI_HAREKETLER = {
    "squat", "bench press", "deadlift", "overhead press", "barbell row", "pull up", "pullup", "barfiks",
    "dumbbell curl", "bicep curl", "biceps curl", "hammer curl", "triceps pushdown", "skull crusher",
    "lat pulldown", "leg press", "lunge", "leg curl", "leg extension", "calf raise", "hip thrust",
    "plank", "sinav", "şınav", "kopru", "köprü", "yan plank", "duvar squat", "supermen", "süpermen",
    "dips", "face pull", "shrug", "romanian deadlift", "rdl", "good morning", "hyperextension",
    "chest fly", "kablo", "cable", "military press", "arnold press", "lateral raise", "yan kaldirma",
    "front raise", "on kaldirma", "wrist curl", "reverse curl", "ab wheel", "crunch", "leg raise",
    "russian twist", "glute bridge", "sumo deadlift", "hack squat", "goblet squat", "close grip",
    "incline press", "decline press", "pec deck", "seated row", "bent over row", "t bar row",
    "push up", "şınav", "dumbbell press", "barbell curl", "concentration curl", "preacher curl",
    "upright row", "farmers walk", "rack pull", "trap bar", "hex bar", "smith machine",
    "chest press", "shoulder press", "back squat", "front squat", "zercher squat",
    "nordic curl", "glute ham raise", "hip abduction", "hip adduction", "donkey calf",
    "seated calf", "standing calf", "cable fly", "pec fly", "rear delt fly", "reverse fly",
}

def _hareket_gecerli_mi(hareket: str) -> bool:
    h = hareket.lower().strip()
    if len(h) < 3:
        return False
    for gecerli in GECERLI_HAREKETLER:
        if gecerli in h or h in gecerli:
            return True
    return False

@router.post("/defter-analizi")
def defter_analizi(istek: DefterAnaliziRequest, kullanici=Depends(get_current_user)):
    _yerel_llm_kontrol()

    gecerli_hareketler = [h for h in istek.hareketler if _hareket_gecerli_mi(h.hareket)]

    if not gecerli_hareketler:
        return {"yorum": "Analiz için geçerli bir egzersiz hareketi bulunamadı. Lütfen squat, bench press, deadlift gibi spor hareketlerini deftere ekleyin."}

    analiz_satirlari = []
    for h in gecerli_hareketler:
        if len(h.agirliklar) >= 2:
            ilk = h.agirliklar[0]
            son = h.agirliklar[-1]
            fark = son - ilk
            if fark > 0:
                trend = f"↑ {fark:.1f}kg artış"
            elif fark < 0:
                trend = f"↓ {abs(fark):.1f}kg düşüş"
            else:
                trend = "→ sabit"
            analiz_satirlari.append(f"{h.hareket}: {', '.join(str(a) for a in h.agirliklar)} kg ({trend})")
        else:
            analiz_satirlari.append(f"{h.hareket}: {', '.join(str(a) for a in h.agirliklar)} kg")

    girdi = " | ".join(analiz_satirlari)
    talimat = "Aşağıdaki spor hareketlerinin son 15 günlük ağırlık geçmişini analiz et. Artan ve azalan ağırlıklara dikkat çek, kısa ve yapıcı Türkçe tavsiyeler ver. Sadece verilen hareketlerden bahset."
    yorum = local_llm._yanit_uret(talimat, girdi)
    return {"yorum": yorum}

@router.post("/gecmis-analizi")
def gecmis_analizi(
    sayi: int = 10,
    db=Depends(get_db),
    kullanici=Depends(get_current_user)
):
    from app.models.history import WorkoutHistory
    from app.services.local_llm import _yanit_uret

    sayi = min(sayi, 30)
    kayitlar = db.query(WorkoutHistory).filter(
        WorkoutHistory.user_id == kullanici.id
    ).order_by(WorkoutHistory.tarih.asc()).limit(sayi).all()

    if not kayitlar:
        return {"yorum": "Henüz geçmiş antrenman kaydınız yok."}

    kayit_metni = " | ".join(
        f"{k.hareket_adi} - Skor: {k.eminlik_skoru}, Durum: {k.antrenor_notu.split(':')[0] if k.antrenor_notu else 'Bilinmiyor'}"
        for k in kayitlar
    )

    talimat = "Aşağıdaki son antrenman kayıtlarını analiz ederek genel bir değerlendirme ve öneri sun. Türkçe, kısa ve yapıcı bir dille yaz."
    girdi = f"Son {sayi} antrenman kaydı: {kayit_metni}"
    yorum = _yanit_uret(talimat, girdi)
    return {"yorum": yorum or "Şu anda analiz yapılamıyor."}