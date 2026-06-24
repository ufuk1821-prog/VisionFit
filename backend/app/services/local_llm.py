import json
import os
import re
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


def _float_yap(value: Any) -> float | None:
    try:
        return float(str(value).replace(",", "."))
    except Exception:
        return None


def _liste_yap(value: Any) -> list[str]:
    if value is None:
        return []
    if isinstance(value, list):
        return [str(item).strip() for item in value if str(item).strip()]
    if isinstance(value, str) and value.strip():
        return [value.strip()]
    return []


def _modal_istek_gonder(payload: dict) -> dict:
    try:
        yanit = requests.post(MODAL_URL, json=payload, timeout=120)
        yanit.raise_for_status()
        veri = yanit.json()
        if not isinstance(veri, dict):
            raise ValueError("Modal servisi JSON nesnesi döndürmedi.")
        return veri
    except requests.RequestException as hata:
        print(f"MODAL HTTP HATASI: {hata}")
        return {"yorum": SERVIS_HATA_MESAJI, "hata": str(hata)}
    except (ValueError, json.JSONDecodeError) as hata:
        print(f"MODAL JSON HATASI: {hata}")
        return {"yorum": SERVIS_HATA_MESAJI, "hata": str(hata)}
    except Exception as hata:
        print(f"MODAL BEKLENMEYEN HATA: {hata}")
        return {"yorum": SERVIS_HATA_MESAJI, "hata": str(hata)}


def _yorum_metnini_al(sonuc: dict) -> str:
    yorum = sonuc.get("yorum")
    if isinstance(yorum, str) and yorum.strip():
        return yorum.strip()
    if isinstance(yorum, dict):
        metin = yorum.get("yorum")
        if isinstance(metin, str) and metin.strip():
            return metin.strip()
    return SERVIS_HATA_MESAJI


def _genel_cumle_mi(metin: str) -> bool:
    temiz = re.sub(r"\s+", " ", metin or "").strip().lower()
    if len(temiz) < 70:
        return True
    kaliplar = [
        "hedef uyumu değerlendirildi",
        "protein dağılımı değerlendirildi",
        "sebze içeriği değerlendirildi",
        "meyve içeriği değerlendirildi",
        "lif içeriği değerlendirildi",
        "kalori ve porsiyon bilgisi değerlendirildi",
        "açık bir çelişki bulunmadı",
    ]
    eslesme = sum(1 for kalip in kaliplar if kalip in temiz)
    return eslesme >= 2


def _ogun_metni(plan: dict) -> str:
    ogunler = []
    for key in ("kahvalti", "ogle", "aksam", "ara_ogun", "ornek_ogunler"):
        ogunler.extend(_liste_yap(plan.get(key)))
    return " ".join(ogunler).lower()


def _kisitlari_bul(not_metni: str) -> list[tuple[str, list[str]]]:
    metin = (not_metni or "").lower()
    kurallar = [
        ("yumurta", ["yumurta"]),
        ("süt ürünü", ["süt", "yoğurt", "yogurt", "peynir", "ayran", "kefir"]),
        ("gluten", ["ekmek", "makarna", "bulgur", "buğday", "bugday", "yulaf"]),
        ("kuruyemiş", ["fındık", "findik", "badem", "ceviz", "kaju", "fıstık", "fistik"]),
        ("deniz ürünü", ["balık", "balik", "somon", "ton balığı", "karides"]),
        ("et", ["tavuk", "hindi", "kırmızı et", "kirmizi et", "köfte", "kofte", "balık", "balik"]),
    ]
    bulunan = []
    for ad, kelimeler in kurallar:
        if ad in metin or any(k in metin and any(x in metin for x in ["alerji", "tüketm", "sevm", "istem", "vejetaryen", "vegan"]) for k in kelimeler):
            bulunan.append((ad, kelimeler))
    if "vejetaryen" in metin or "vegan" in metin:
        bulunan.append(("hayvansal ürün", ["tavuk", "hindi", "kırmızı et", "kirmizi et", "köfte", "kofte", "balık", "balik", "ton balığı", "somon"]))
    return bulunan


def _diyet_yedek_yorumu(profil: dict, plan: dict, kullanici_notu: str) -> str:
    hedef = str(profil.get("hedef") or "kilo_koruma")
    hedef_adlari = {
        "kilo_verme": "kilo verme",
        "kilo_koruma": "kilo koruma",
        "kilo_alma": "kilo alma",
    }
    hedef_adi = hedef_adlari.get(hedef, hedef.replace("_", " "))

    hedef_kalori = _float_yap(profil.get("hedef_kalori"))
    plan_kalori = _float_yap(plan.get("gunluk_kalori"))

    porsiyon_ham = plan.get("porsiyon_bilgisi")
    porsiyon = porsiyon_ham if isinstance(porsiyon_ham, dict) else {}

    protein = _float_yap(porsiyon.get("protein_g") or plan.get("protein_g"))
    karbonhidrat = _float_yap(
        porsiyon.get("karbonhidrat_g") or plan.get("karbonhidrat_g")
    )
    yag = _float_yap(porsiyon.get("yag_g") or plan.get("yag_g"))

    cumleler = [f"Seçtiğin plan {hedef_adi} hedefin açısından incelendi."]

    if hedef_kalori is not None and plan_kalori is not None:
        fark = round(plan_kalori - hedef_kalori)
        if abs(fark) <= 100:
            cumleler.append(
                f"Planın {plan_kalori:.0f} kcal değeri, {hedef_kalori:.0f} kcal hedefinle oldukça uyumlu."
            )
        elif fark > 0:
            cumleler.append(
                f"Plan hedefinden yaklaşık {abs(fark)} kcal yüksek; porsiyonları biraz küçültmek veya enerji yoğun bir öğeyi azaltmak daha uygun olur."
            )
        else:
            cumleler.append(
                f"Plan hedefinden yaklaşık {abs(fark)} kcal düşük; özellikle antrenman günlerinde küçük bir ara öğün eklemek enerji düşüşünü önleyebilir."
            )

    makrolar = []
    if protein is not None:
        makrolar.append(f"{protein:.0f} g protein")
    if karbonhidrat is not None:
        makrolar.append(f"{karbonhidrat:.0f} g karbonhidrat")
    if yag is not None:
        makrolar.append(f"{yag:.0f} g yağ")
    if makrolar:
        cumleler.append("Makro dağılımı " + ", ".join(makrolar) + " şeklinde.")

    ogun_metni = _ogun_metni(plan)
    celiskiler = []
    for ad, kelimeler in _kisitlari_bul(kullanici_notu):
        eslesen = next((kelime for kelime in kelimeler if kelime in ogun_metni), None)
        if eslesen:
            celiskiler.append(f"{ad} kısıtına rağmen planda {eslesen} bulunuyor")

    if celiskiler:
        cumleler.append(
            "Kullanıcı notuyla uyumsuzluk var: " + "; ".join(celiskiler) + ". Bu besinleri uygun alternatiflerle değiştir."
        )
    elif kullanici_notu.strip():
        cumleler.append("Kullanıcı notunla doğrudan bir çelişki görünmüyor.")

    if protein is not None:
        cumleler.append(
            "Proteini gün içine tek öğünde yığmak yerine kahvaltı, öğle ve akşam öğünlerine daha dengeli dağıt."
        )
    else:
        cumleler.append(
            "Her ana öğünde belirgin bir protein kaynağı bulundur ve porsiyonları benzer büyüklükte tut."
        )

    cumleler.append(
        "Sebze, meyve ve lif kaynaklarını gün içine yay; su tüketimini de aktivite düzeyine göre düzenli sürdür."
    )
    cumleler.append(
        "Bu değerlendirme genel bilgilendirmedir; sağlık sorunu, ilaç kullanımı veya ciddi alerji varsa diyetisyene danış."
    )

    return " ".join(cumleler)


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
    payload = {
        "tip": "antrenor",
        "hareket": hareket,
        "gecmis_antrenmanlar": [
            _dict_yap(oturum) for oturum in (gecmis_antrenmanlar or [])
        ],
        "kullanici_notu": "",
    }
    sonuc = _modal_istek_gonder(payload)
    return _yorum_metnini_al(sonuc)


def diyet_onerisi_uret(
    profil: dict,
    plan: dict,
    kullanici_notu: str = "",
) -> str:
    profil = _dict_yap(profil) or {}
    plan = _dict_yap(plan) or {}

    payload = {
        "tip": "diyet",
        "profil": profil,
        "plan": plan,
        "kullanici_notu": kullanici_notu or "",
    }

    modal_sonucu = _modal_istek_gonder(payload)

    if modal_sonucu.get("yorum") == SERVIS_HATA_MESAJI:
        return SERVIS_HATA_MESAJI

    try:
        duzeltilmis = diyet_llm_ciktisini_duzelt(
            llm_ciktisi=modal_sonucu,
            profil=profil,
            plan=plan,
            kullanici_notu=kullanici_notu or "",
        )
    except Exception as hata:
        print(f"DİYET GUARD HATASI: {hata}")
        duzeltilmis = modal_sonucu

    adaylar = [
        modal_sonucu.get("yorum"),
        duzeltilmis.get("yorum") if isinstance(duzeltilmis, dict) else None,
    ]

    for aday in adaylar:
        if isinstance(aday, str) and aday.strip() and not _genel_cumle_mi(aday):
            return aday.strip()

    return _diyet_yedek_yorumu(
        profil,
        plan,
        kullanici_notu or "",
    )
