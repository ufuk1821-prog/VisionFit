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
    yorum = local_llm.antrenor_geri_bildirimi_uret(istek.skorlar)
    return {"yorum": yorum}


@router.post("/diyet-onerisi")
def diyet_onerisi(istek: DiyetOnerisiRequest, kullanici=Depends(get_current_user)):
    _yerel_llm_kontrol()
    yorum = local_llm.diyet_onerisi_uret(
        istek.bmi, istek.bmi_kategori, istek.hedef, istek.hedef_kalori,
        istek.protein_g, istek.karbonhidrat_g, istek.yag_g, istek.istek,
    )
    return {"yorum": yorum}


@router.post("/defter-analizi")
def defter_analizi(istek: DefterAnaliziRequest, kullanici=Depends(get_current_user)):
    _yerel_llm_kontrol()
    yorum = local_llm.defter_analizi_uret(istek.hareket, istek.agirliklar)
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