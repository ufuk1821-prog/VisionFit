import os
import requests

MODAL_URL = "https://ufuk1821-prog--visionfit-llm-api.modal.run"


def llm_kullanilabilir_mi():
    return True


def _yanit_uret(talimat, girdi):
    try:
        yanit = requests.post(
            MODAL_URL,
            json={"talimat": talimat, "girdi": girdi},
            timeout=120,
        )
        veri = yanit.json()
        return veri.get("yorum", "Şu anda yapay zeka servisine erişilemiyor, lütfen birkaç saniye sonra tekrar deneyin.")
    except Exception as e:
        print(f"MODAL HATA: {e}")
        return "Şu anda yapay zeka servisine erişilemiyor, lütfen birkaç saniye sonra tekrar deneyin."


def antrenor_geri_bildirimi_uret(skorlar):
    talimat = "Aşağıdaki squat antrenman oturumu kategori skorlarına göre kullanıcıya kısa, motive edici ve Türkçe bir antrenör geri bildirimi yaz."
    girdi = ", ".join(f"{kategori}: {skor}" for kategori, skor in skorlar.items())
    return _yanit_uret(talimat, girdi)


def diyet_onerisi_uret(bmi, bmi_kategori, hedef, hedef_kalori, protein_g, karbonhidrat_g, yag_g, istek):
    talimat = "Aşağıdaki diyet planı bilgilerine ve kullanıcının özel isteğine göre kısa, kişiselleştirilmiş ve Türkçe bir AI önerisi yaz."
    girdi = (
        f"BMI: {bmi} ({bmi_kategori}), Hedef: {hedef}, Hedef Kalori: {hedef_kalori} kcal, "
        f"Protein: {protein_g} g, Karbonhidrat: {karbonhidrat_g} g, Yağ: {yag_g} g, "
        f"Kullanıcı İsteği: {istek}"
    )
    return _yanit_uret(talimat, girdi)


def defter_analizi_uret(hareket, agirliklar):
    talimat = "Aşağıdaki hareketin ağırlık geçmişine göre kısa, yapıcı ve Türkçe bir ilerleme analizi yaz."
    agirlik_metni = ", ".join(str(a) for a in agirliklar)
    girdi = f"Hareket: {hareket}, Son {len(agirliklar)} antrenmandaki ağırlıklar (kg): {agirlik_metni}"
    return _yanit_uret(talimat, girdi)