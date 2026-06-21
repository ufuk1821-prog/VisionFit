import json
import os
from typing import Any

import requests

from app.services.diet_guard import diyet_llm_ciktisini_duzelt


MODAL_URL = os.getenv(
    "MODAL_URL",
    "https://ufuk1821-prog--visionfit-llm-api.modal.run",
)

SERVIS_HATA_MESAJI = (
    "Şu anda yapay zeka servisine erişilemiyor, "
    "lütfen birkaç saniye sonra tekrar deneyin."
)


def llm_kullanilabilir_mi() -> bool:
    return bool(MODAL_URL)


def _dict_yap(value: Any) -> Any:
    if hasattr(value, "model_dump"):
        return value.model_dump()

    if hasattr(value, "dict"):
        return value.dict()

    return value


def _modal_istek_gonder(payload: dict) -> dict:
    try:
        yanit = requests.post(
            MODAL_URL,
            json=payload,
            timeout=120,
        )

        yanit.raise_for_status()

        veri = yanit.json()

        if not isinstance(veri, dict):
            raise ValueError("Modal servisi JSON nesnesi döndürmedi.")

        return veri

    except requests.RequestException as hata:
        print(f"MODAL HTTP HATASI: {hata}")

        return {
            "yorum": SERVIS_HATA_MESAJI,
            "hata": str(hata),
        }

    except (ValueError, json.JSONDecodeError) as hata:
        print(f"MODAL JSON HATASI: {hata}")

        return {
            "yorum": SERVIS_HATA_MESAJI,
            "hata": str(hata),
        }

    except Exception as hata:
        print(f"MODAL BEKLENMEYEN HATA: {hata}")

        return {
            "yorum": SERVIS_HATA_MESAJI,
            "hata": str(hata),
        }


def _yorum_metnini_al(sonuc: dict) -> str:
    yorum = sonuc.get("yorum")

    if isinstance(yorum, str) and yorum.strip():
        return yorum.strip()

    if isinstance(yorum, dict):
        return json.dumps(
            yorum,
            ensure_ascii=False,
        )

    return SERVIS_HATA_MESAJI


def antrenor_geri_bildirimi_uret(
    hareket: str,
    genel_skor: float,
    kategori_skorlari: dict,
) -> str:
    payload = {
        "tip": "antrenor",
        "hareket": hareket,
        "genel_skor": genel_skor,
        "kategori_skorlari": kategori_skorlari,
        "kullanici_notu": "",
    }

    sonuc = _modal_istek_gonder(payload)

    return _yorum_metnini_al(sonuc)


def gecmis_analiz_uret(
    hareket: str,
    gecmis_antrenmanlar: list,
) -> str:
    temiz_gecmis = []

    for oturum in gecmis_antrenmanlar or []:
        temiz_gecmis.append(
            _dict_yap(oturum)
        )

    payload = {
        "tip": "antrenor",
        "hareket": hareket,
        "gecmis_antrenmanlar": temiz_gecmis,
        "kullanici_notu": "",
    }

    sonuc = _modal_istek_gonder(payload)

    return _yorum_metnini_al(sonuc)


def diyet_onerisi_uret(
    profil: dict,
    plan: dict,
    kullanici_notu: str = "",
) -> str:
    profil = _dict_yap(profil)
    plan = _dict_yap(plan)

    payload = {
        "tip": "diyet",
        "profil": profil,
        "plan": plan,
        "kullanici_notu": kullanici_notu or "",
    }

    modal_sonucu = _modal_istek_gonder(payload)

    if modal_sonucu.get("yorum") == SERVIS_HATA_MESAJI:
        return SERVIS_HATA_MESAJI

    duzeltilmis_sonuc = diyet_llm_ciktisini_duzelt(
        llm_ciktisi=modal_sonucu,
        profil=profil,
        plan=plan,
        kullanici_notu=kullanici_notu or "",
    )

    return json.dumps(
        duzeltilmis_sonuc,
        ensure_ascii=False,
    )