import os
import requests
import json

MODAL_URL = os.getenv("MODAL_URL", "https://ufuk1821-prog--visionfit-llm-api.modal.run")


def llm_kullanilabilir_mi():
    return True


def _modal_istek_gonder(payload: dict) -> dict:
    try:
        yanit = requests.post(
            MODAL_URL,
            json=payload,
            timeout=120,
        )
        return yanit.json()
    except Exception as e:
        print(f"MODAL HATA: {e}")
        return {"yorum": "Şu anda yapay zeka servisine erişilemiyor, lütfen birkaç saniye sonra tekrar deneyin.", "hata": str(e)}


def antrenor_geri_bildirimi_uret(hareket: str, genel_skor: float, kategori_skorlari: dict):
    payload = {
        "tip": "antrenor",
        "hareket": hareket,
        "genel_skor": genel_skor,
        "kategori_skorlari": kategori_skorlari,
        "kullanici_notu": "",
    }
    sonuc = _modal_istek_gonder(payload)
    return sonuc.get("yorum") or "Şu anda yapay zeka servisine erişilemiyor, lütfen birkaç saniye sonra tekrar deneyin."


def gecmis_analiz_uret(hareket: str, gecmis_antrenmanlar: list):
    payload = {
        "tip": "antrenor",
        "hareket": hareket,
        "gecmis_antrenmanlar": gecmis_antrenmanlar,
        "kullanici_notu": "",
    }
    sonuc = _modal_istek_gonder(payload)
    return sonuc.get("yorum") or "Şu anda yapay zeka servisine erişilemiyor, lütfen birkaç saniye sonra tekrar deneyin."


def diyet_onerisi_uret(profil: dict, plan: dict, kullanici_notu: str = ""):
    payload = {
        "tip": "diyet",
        "profil": profil,
        "plan": plan,
        "kullanici_notu": kullanici_notu,
    }
    sonuc = _modal_istek_gonder(payload)
    return sonuc.get("yorum") or "Şu anda yapay zeka servisine erişilemiyor, lütfen birkaç saniye sonra tekrar deneyin."