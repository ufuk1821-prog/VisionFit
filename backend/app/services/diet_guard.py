import json
from typing import Any


ZORUNLU_ALANLAR = {
    "tip": "diyet",
    "uyum": "kısmen_uyumlu",
    "hedef_uyumu": "Hedef uyumu değerlendirildi.",
    "protein_degerlendirmesi": "Protein dağılımı değerlendirildi.",
    "sebze_degerlendirmesi": "Sebze içeriği değerlendirildi.",
    "meyve_degerlendirmesi": "Meyve içeriği değerlendirildi.",
    "lif_degerlendirmesi": "Lif içeriği değerlendirildi.",
    "kalori_porsiyon_degerlendirmesi": "Kalori ve porsiyon bilgisi değerlendirildi.",
    "kullanici_notu_degerlendirmesi": "Kullanıcı notuyla açık bir çelişki bulunmadı.",
    "yorum": "Diyet planı değerlendirilmiştir.",
}


def diyet_llm_ciktisini_duzelt(
    llm_ciktisi: str | dict,
    profil: dict,
    plan: dict,
    kullanici_notu: str,
) -> dict[str, Any]:
    if isinstance(llm_ciktisi, dict):
        model_sonucu = llm_ciktisi
    else:
        try:
            model_sonucu = json.loads(llm_ciktisi)
        except Exception:
            model_sonucu = {}

    sonuc = dict(ZORUNLU_ALANLAR)

    if isinstance(model_sonucu, dict):
        for alan in sonuc:
            deger = model_sonucu.get(alan)
            if deger not in (None, ""):
                sonuc[alan] = deger

    sonuc["tip"] = "diyet"

    not_text = str(kullanici_notu or "").lower()
    plan_text = json.dumps(plan or {}, ensure_ascii=False).lower()

    bulgular = []

    if "yumurta" in not_text and "alerj" in not_text:
        if "yumurta" in plan_text or "omlet" in plan_text:
            bulgular.append("Planda yumurta alerjisiyle çelişen yumurta/omlet seçeneği bulunuyor.")

    if "gluten" in not_text:
        if "normal ekmek" in plan_text or "makarna" in plan_text or "bulgur" in plan_text:
            bulgular.append("Planda glutensiz beslenmeyle çelişebilecek gluten kaynağı bulunuyor.")

    if "vejetaryen" in not_text:
        yasaklar = ["tavuk", "et", "köfte", "kıyma", "balık", "somon", "hindi"]
        if any(yasak in plan_text for yasak in yasaklar):
            bulgular.append("Planda vejetaryen beslenmeyle çelişen et/balık/tavuk ürünü bulunuyor.")

    if bulgular:
        sonuc["uyum"] = "uyumsuz"
        sonuc["kullanici_notu_degerlendirmesi"] = " ".join(bulgular)

    yorum_parcalari = [
        sonuc.get("hedef_uyumu", ""),
        sonuc.get("protein_degerlendirmesi", ""),
        sonuc.get("sebze_degerlendirmesi", ""),
        sonuc.get("meyve_degerlendirmesi", ""),
        sonuc.get("lif_degerlendirmesi", ""),
        sonuc.get("kalori_porsiyon_degerlendirmesi", ""),
        sonuc.get("kullanici_notu_degerlendirmesi", ""),
    ]

    sonuc["yorum"] = " ".join(
        str(parca).strip()
        for parca in yorum_parcalari
        if str(parca).strip()
    )

    return sonuc