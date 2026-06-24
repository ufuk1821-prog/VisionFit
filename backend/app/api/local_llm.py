from fastapi import APIRouter, Depends, HTTPException, status

from app.core.security import get_current_user
from app.schemas.local_llm import AntrenorYorumuRequest, DiyetOnerisiRequest
from app.services import local_llm


router = APIRouter(prefix="/api/yerel-ai", tags=["Yerel AI"])


def _yerel_llm_kontrol():
    if not local_llm.llm_kullanilabilir_mi():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Yapay zeka servisi şu anda kullanılamıyor.",
        )


@router.post("/antrenor-yorumu")
def antrenor_yorumu(
    istek: AntrenorYorumuRequest,
    kullanici=Depends(get_current_user),
):
    _yerel_llm_kontrol()
    yorum = local_llm.antrenor_geri_bildirimi_uret(
        istek.hareket,
        istek.genel_skor,
        istek.kategori_skorlari,
    )
    return {"yorum": yorum}


@router.post("/diyet-onerisi")
def diyet_onerisi(
    istek: DiyetOnerisiRequest,
    kullanici=Depends(get_current_user),
):
    _yerel_llm_kontrol()

    profil = istek.profil or {
        "hedef": istek.hedef,
        "hedef_kalori": istek.hedef_kalori,
    }

    plan = istek.plan or {
        "gunluk_kalori": istek.hedef_kalori,
        "porsiyon_bilgisi": {
            "protein_g": istek.protein_g,
            "karbonhidrat_g": istek.karbonhidrat_g,
            "yag_g": istek.yag_g,
            "bmi": istek.bmi,
            "bmi_kategori": istek.bmi_kategori,
        },
    }

    yorum = local_llm.diyet_onerisi_uret(
        profil,
        plan,
        istek.kullanici_notu or istek.istek or "",
    )

    return {"yorum": yorum}
