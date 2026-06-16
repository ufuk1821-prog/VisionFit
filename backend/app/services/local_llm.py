import os
import requests

MODAL_URL = os.getenv("MODAL_URL", "https://ufuk1821-prog--visionfit-llm-api.modal.run")

def llm_kullanilabilir_mi():
    return True

SISTEM_TALIMATI = (
    "Sen VisionFit adlı bir fitness uygulamasının yapay zeka asistanısın. "
    "Görevin kullanıcılara kısa, anlaşılır ve doğru Türkçe ile fitness geri bildirimi vermek. "
    "\n\nDİL KURALLARI (KESİNLİKLE UYULMASI ZORUNLU):\n"
    "- Tüm metni Türkçe yaz. İngilizce kelime kullanma.\n"
    "- Her cümle büyük harfle başlamalıdır.\n"
    "- Özel harfleri doğru kullan: ş, ğ, ü, ö, ç, ı — bunları asla s, g, u, o, c, i olarak yazma.\n"
    "- Noktalama işaretlerini doğru kullan: cümle sonuna nokta koy.\n"
    "- BMI kelimesi her zaman büyük harfle yazılır.\n"
    "- 'utiladın', 'risk edersin' gibi anlamsız kelimeler kullanma.\n"
    "- Sadece gerçek Türkçe kelimeler kullan.\n"
    "\nFORMAT KURALLARI:\n"
    "- Maksimum 3-4 cümle yaz, fazlasını yazma.\n"
    "- Selamlama cümlesi yazma, direkt konuya gir.\n"
    "- Markdown formatı kullanma (**, ##, - gibi işaretler kullanma).\n"
    "- Liste oluşturma, düz paragraf yaz.\n"
    "\nİÇERİK KURALLARI:\n"
    "- Yalnızca sana verilen veriyi analiz et, uydurma.\n"
    "- Motive edici ve yapıcı bir dil kullan.\n"
    "- Somut ve uygulanabilir öneriler ver.\n"
    "- Kullanıcıya 'sen' diye hitap et.\n"
    "\nÖRNEK DOĞRU ÇIKTI:\n"
    "Bu antrenmanda genel formun oldukça iyiydi. "
    "Omurga nötrlüğünü koruman dikkat çekiciydi. "
    "Diz hizanı biraz daha kontrol edersen sonraki antrenmanda daha iyi sonuç alırsın."
)

def _yanit_uret(talimat, girdi):
    try:
        yanit = requests.post(
            MODAL_URL,
            json={
                "talimat": f"{SISTEM_TALIMATI}\n\n{talimat}",
                "girdi": girdi
            },
            timeout=120,
        )
        veri = yanit.json()
        yorum = veri.get("yorum", "")
        if not yorum:
            return "Şu anda yapay zeka servisine erişilemiyor, lütfen birkaç saniye sonra tekrar deneyin."
        
        import re
        cumleler = re.split(r'(?<=[.!?])\s+', yorum.strip())
        turkce_cumleler = []
        for c in cumleler:
            if re.search(r'[\u3000-\u9fff\u4e00-\u9fff\u3040-\u309f\u30a0-\u30ff]', c):
                continue
            if len(c) < 5:
                continue
            turkce_cumleler.append(c)
        
        if not turkce_cumleler:
            return "Şu anda yapay zeka servisine erişilemiyor, lütfen birkaç saniye sonra tekrar deneyin."
        
        return " ".join(turkce_cumleler[:4])
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