import os
import threading

_model = None
_tokenizer = None
_yukleme_kilidi = threading.Lock()

MODEL_YOLU = os.getenv(
    "LOCAL_LLM_PATH",
    os.path.join(os.path.dirname(__file__), "..", "..", "..", "ai_training", "visionfit_llm"),
)


def llm_kullanilabilir_mi():
    return os.path.isdir(MODEL_YOLU)


def _modeli_yukle():
    global _model, _tokenizer
    if _model is not None:
        return
    with _yukleme_kilidi:
        if _model is not None:
            return
        from transformers import AutoModelForCausalLM, AutoTokenizer
        import torch
        _tokenizer = AutoTokenizer.from_pretrained(MODEL_YOLU)
        _model = AutoModelForCausalLM.from_pretrained(MODEL_YOLU, torch_dtype=torch.float32)
        _model.eval()


def _yanit_uret(talimat, girdi):
    if not llm_kullanilabilir_mi():
        return None

    _modeli_yukle()

    import torch

    mesajlar = [{"role": "user", "content": f"{talimat}\n{girdi}"}]
    girdiler = _tokenizer.apply_chat_template(
        mesajlar,
        tokenize=True,
        add_generation_prompt=True,
        return_tensors="pt",
        return_dict=True,
    )

    girdi_id = girdiler["input_ids"]
    dikkat_maskesi = girdiler.get("attention_mask")

    with torch.no_grad():
        cikti = _model.generate(
            input_ids=girdi_id,
            attention_mask=dikkat_maskesi,
            max_new_tokens=200,
            temperature=0.7,
            do_sample=True,
            pad_token_id=_tokenizer.eos_token_id,
        )

    return _tokenizer.decode(cikti[0][girdi_id.shape[1]:], skip_special_tokens=True).strip()


def antrenor_geri_bildirimi_uret(skorlar):
    talimat = "Asagidaki squat antrenman oturumu kategori skorlarina gore kullaniciya kisa, motive edici ve Turkce bir antrenor geri bildirimi yaz."
    girdi = ", ".join(f"{kategori}: {skor}" for kategori, skor in skorlar.items())
    return _yanit_uret(talimat, girdi)


def diyet_onerisi_uret(bmi, bmi_kategori, hedef, hedef_kalori, protein_g, karbonhidrat_g, yag_g, istek):
    talimat = "Asagidaki diyet plani bilgilerine ve kullanicinin ozel istegine gore kisa, kisisellestirilmis ve Turkce bir AI onerisi yaz."
    girdi = (
        f"BMI: {bmi} ({bmi_kategori}), Hedef: {hedef}, Hedef Kalori: {hedef_kalori} kcal, "
        f"Protein: {protein_g} g, Karbonhidrat: {karbonhidrat_g} g, Yag: {yag_g} g, "
        f"Kullanici Istegi: {istek}"
    )
    return _yanit_uret(talimat, girdi)


def defter_analizi_uret(hareket, agirliklar):
    talimat = "Asagidaki hareketin agirlik gecmisine gore kisa, yapici ve Turkce bir ilerleme analizi yaz."
    agirlik_metni = ", ".join(str(a) for a in agirliklar)
    girdi = f"Hareket: {hareket}, Son {len(agirliklar)} antrenmandaki agirliklar (kg): {agirlik_metni}"
    return _yanit_uret(talimat, girdi)