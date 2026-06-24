import json
import os
from typing import Any

import modal


MODEL_ID = "213asdfdws/visionfit-llm-v2"
MODEL_DIR = "/model"
MODEL_VERSION = "v26-visionfit-qwen25-final-deterministic"


SYSTEM_PROMPT = (
    "Sen VisionFit uygulamasının Türkçe yapay zekâ destekli fitness koçusun. "
    "Sana verilen antrenman veya diyet verilerini dikkatle analiz et. "
    "Girdide bulunmayan bilgi uydurma ve kesin tıbbi teşhis koyma. "
    "Kategori adlarını girdide verildiği biçimiyle kullan. "
    "Antrenman yorumunda skorları yalnızca tekrar etme. "
    "Güçlü alanın kullanıcı açısından ne ifade ettiğini açıkla. "
    "Geliştirilmesi gereken alanın hareket formuna olası etkisini belirt. "
    "Kesinlik bildirmeden muhtemel teknik nedenleri açıkla. "
    "Kullanıcının bir sonraki antrenmanda uygulayabileceği en az iki somut öneri ver. "
    "Ağırlık artırma, tempo, hareket kontrolü, kamera açısı veya teknik çalışma gibi "
    "uygulanabilir önerilerden veriye uygun olanları seç. "
    "Yanıt doğal, profesyonel ve motive edici olmalı; gereksiz övgü yapmamalıdır. "
    "Yanıtın yalnızca geçerli bir JSON nesnesi olmalıdır. "
    "JSON dışında açıklama, markdown veya kod bloğu yazma."
)


def normalize_text(value: Any) -> str:
    return str(value or "").strip().lower()


def detect_request_type(payload: dict[str, Any]) -> str:
    explicit_type = normalize_text(payload.get("tip"))

    if explicit_type in {"antrenor", "trainer"}:
        return "antrenor"

    if explicit_type in {"diyet", "diet"}:
        return "diyet"

    if (
        payload.get("hareket")
        or payload.get("kategori_skorlari")
        or payload.get("gecmis_antrenmanlar")
    ):
        return "antrenor"

    return "diyet"


def safe_float(value: Any) -> float | None:
    try:
        return float(str(value).replace(",", "."))
    except Exception:
        return None


def skor_dict_al(payload: dict[str, Any]) -> dict[str, float]:
    skorlar = payload.get("kategori_skorlari") or {}

    if not skorlar and isinstance(payload.get("gecmis_antrenmanlar"), list):
        gecmis = payload.get("gecmis_antrenmanlar") or []
        if gecmis and isinstance(gecmis[-1], dict):
            skorlar = gecmis[-1].get("kategori_skorlari") or {}

    if not isinstance(skorlar, dict):
        return {}

    temiz = {}

    for key, value in skorlar.items():
        sayi = safe_float(value)

        if sayi is None:
            continue

        if "genel" in normalize_text(key):
            continue

        temiz[str(key)] = sayi

    return temiz


def trainer_sonucunu_duzelt(result: dict, payload: dict) -> dict:
    skorlar = skor_dict_al(payload)

    if not skorlar:
        return result

    guclu_alan = max(skorlar, key=skorlar.get)
    zayif_alan = min(skorlar, key=skorlar.get)

    guclu_skor = skorlar[guclu_alan]
    zayif_skor = skorlar[zayif_alan]

    hareket = (
        payload.get("hareket")
        or result.get("hareket")
        or "antrenman"
    )

    genel_skor = safe_float(
        payload.get("genel_skor")
        or result.get("genel_skor")
    )

    result["tip"] = "antrenor"
    result["hareket"] = hareket

    result["guclu_alan"] = guclu_alan
    result["gelistirilecek_alan"] = zayif_alan
    result["guclu_alan_skoru"] = round(guclu_skor, 1)
    result["gelistirilecek_alan_skoru"] = round(zayif_skor, 1)

    if genel_skor is not None:
        result["genel_skor"] = round(genel_skor, 1)

    mevcut_yorum = result.get("yorum")

    if isinstance(mevcut_yorum, str) and len(mevcut_yorum.strip()) >= 80:
        result["yorum"] = mevcut_yorum.strip()
        return result

    genel_skor_metni = (
        f" Genel skorun {genel_skor:.1f}."
        if genel_skor is not None
        else ""
    )

    result["yorum"] = (
        f"{hareket} analizinde {guclu_alan} alanındaki "
        f"{guclu_skor:.0f} puan, hareket boyunca bu bölgedeki kontrolün "
        f"genel olarak iyi korunduğunu gösteriyor. "
        f"{zayif_alan} alanındaki {zayif_skor:.0f} puan ise formun özellikle "
        f"bu bölümünde tutarlılığın azalabildiğini düşündürüyor."
        f"{genel_skor_metni} "
        f"Bir sonraki antrenmanda ağırlığı artırmadan önce hareketin iniş ve "
        f"çıkış bölümlerini daha yavaş ve kontrollü uygula. "
        f"Ayrıca çekimi yandan ve tüm vücut kadrajda tekrar ederek "
        f"{zayif_alan} bölgesindeki hizayı her tekrarda korumaya odaklan. "
        f"Ağrı veya belirgin kontrol kaybı oluşursa hareketi durdurup "
        f"yükü azaltman daha güvenli olacaktır."
    )

    result.setdefault("uyarilar", []).append(
        "LLM yeterli uzunlukta yorum üretmediği için güvenli yedek yorum kullanıldı."
    )

    return result


def build_instruction(payload: dict[str, Any]) -> str:
    request_type = detect_request_type(payload)

    if request_type == "diyet":
        return (
            "Verilen hareket, genel skor ve kategori skorlarına göre ayrıntılı bir "
            "Türkçe antrenör değerlendirmesi oluştur. "
            "En güçlü ve en düşük kategoriyi doğru belirle fakat skorları düz biçimde tekrar etmekle yetinme."
            "Güçlü alanın hareket açısından ne anlama geldiğini açıkla. "
            "Zayıf alanın form ve güvenlik üzerindeki olası etkisini kesin teşhis koymadan değerlendir."
            "Kullanıcıya bir sonraki antrenmanda uygulayabileceği en az iki somut teknik öneri ver. "
            "Yorum 90 ile 150 kelime arasında olmalıdır. "
            "JSON şu alanları içermelidir: tip, hareket, guclu_alan, gelistirilecek_alan, yorum. "
            "Yanıt yalnızca geçerli JSON nesnesi olmalıdır."
        )

    history = payload.get("gecmis_antrenmanlar")

    if isinstance(history, list) and history:
        return (
            "Geçmiş antrenman verilerindeki yükseliş, düşüş, plato, ani düşüş ve ağırlık-form ilişkisini analiz et. "
            "En fazla gelişen ve gerileyen alanları belirle. "
            "Yanıt yalnızca geçerli JSON olmalıdır."
        )

    return (
        "Verilen hareket ve kategori skorlarına göre Türkçe AI antrenör analizi oluştur. "
        "En güçlü ve geliştirilmesi gereken kategori adlarını girdideki biçimiyle kullan. "
        "Yanıt yalnızca geçerli JSON olmalıdır."
    )


def download_model(version_marker: str = MODEL_VERSION):
    import shutil
    from huggingface_hub import snapshot_download

    print("Model indiriliyor:", MODEL_ID)
    print("Model sürümü:", version_marker)

    if os.path.exists(MODEL_DIR):
        shutil.rmtree(MODEL_DIR)

    snapshot_download(
        repo_id=MODEL_ID,
        local_dir=MODEL_DIR,
        token=os.environ.get("HF_TOKEN"),
    )

    print("Model başarıyla indirildi.")


model_image = (
    modal.Image.debian_slim(python_version="3.11")
    .pip_install(
        "transformers",
        "torch",
        "accelerate",
        "huggingface_hub",
        "bitsandbytes",
        "safetensors",
    )
    .run_function(
        download_model,
        kwargs={"version_marker": MODEL_VERSION},
        secrets=[modal.Secret.from_name("huggingface")],
        timeout=1800,
    )
)


api_image = (
    modal.Image.debian_slim(python_version="3.11")
    .pip_install("fastapi[standard]")
)


app = modal.App("visionfit-llm")


@app.cls(
    image=model_image,
    gpu="T4",
    timeout=700,
    startup_timeout=600,
    scaledown_window=600,
    min_containers=0,
)
class VisionFitLLM:

    @modal.enter()
    def load_model(self):
        import torch
        from transformers import AutoModelForCausalLM, AutoTokenizer, BitsAndBytesConfig

        print("Tokenizer yükleniyor...")

        self.tokenizer = AutoTokenizer.from_pretrained(
            MODEL_DIR,
            local_files_only=True,
        )

        if self.tokenizer.pad_token_id is None:
            self.tokenizer.pad_token = self.tokenizer.eos_token

        self.tokenizer.padding_side = "left"

        quantization_config = BitsAndBytesConfig(
            load_in_4bit=True,
            bnb_4bit_quant_type="nf4",
            bnb_4bit_compute_dtype=torch.float16,
            bnb_4bit_use_double_quant=True,
        )

        print("Model GPU belleğine yükleniyor...")

        self.model = AutoModelForCausalLM.from_pretrained(
            MODEL_DIR,
            local_files_only=True,
            torch_dtype=torch.float16,
            device_map={"": 0},
            quantization_config=quantization_config,
            low_cpu_mem_usage=True,
        )

        self.model.eval()
        self.model.config.use_cache = True

        self.model.generation_config.pad_token_id = self.tokenizer.pad_token_id
        self.model.generation_config.eos_token_id = self.tokenizer.eos_token_id
        self.model.generation_config.max_length = None

        print("VisionFit LLM başarıyla yüklendi:", MODEL_ID, MODEL_VERSION)

    def generate_response(self, payload: dict[str, Any]) -> str:
        import torch

        instruction = build_instruction(payload)

        input_text = json.dumps(
            payload,
            ensure_ascii=False,
            separators=(",", ":"),
        )

        user_message = instruction + "\n\nGİRDİ:\n" + input_text

        messages = [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_message},
        ]

        prompt = self.tokenizer.apply_chat_template(
            messages,
            tokenize=False,
            add_generation_prompt=True,
        )

        inputs = self.tokenizer(
            prompt,
            return_tensors="pt",
            add_special_tokens=False,
        ).to("cuda")

        with torch.inference_mode():
            outputs = self.model.generate(
                **inputs,
                max_new_tokens=650,
                do_sample=False,
                repetition_penalty=1.05,
                use_cache=True,
                pad_token_id=self.tokenizer.pad_token_id,
                eos_token_id=self.tokenizer.eos_token_id,
            )

        generated_tokens = outputs[0, inputs["input_ids"].shape[1]:]

        response = self.tokenizer.decode(
            generated_tokens,
            skip_special_tokens=True,
        ).strip()

        return response

    @modal.method()
    def produce_response(self, payload_json: str) -> str:
        try:
            payload = json.loads(payload_json)
        except json.JSONDecodeError:
            payload = {"tip": "antrenor", "girdi": payload_json}

        if not isinstance(payload, dict):
            payload = {"tip": "antrenor", "girdi": str(payload)}

        raw_response = self.generate_response(payload)

        try:
            parsed_response = json.loads(raw_response)

            if not isinstance(parsed_response, dict):
                raise ValueError("Model çıktısı JSON nesnesi değil.")

            result = parsed_response
            result["dogrulama"] = True
            result["uyarilar"] = []

        except (json.JSONDecodeError, ValueError) as error:
            result = {
                "tip": detect_request_type(payload),
                "yorum": raw_response,
                "dogrulama": False,
                "uyarilar": [f"Model çıktısı JSON olarak çözülemedi: {error}"],
            }

        if detect_request_type(payload) == "antrenor":
            result = trainer_sonucunu_duzelt(result, payload)

        result["surum"] = MODEL_VERSION
        result["model_id"] = MODEL_ID
        result["kaynak"] = "fine_tune_edilmis_llm"

        return json.dumps(result, ensure_ascii=False)


@app.function(
    image=api_image,
    timeout=800,
)
@modal.fastapi_endpoint(method="POST")
async def api(veri: dict) -> dict:
    if not isinstance(veri, dict):
        return {
            "yorum": "",
            "hata": "İstek gövdesi JSON nesnesi olmalıdır.",
            "surum": MODEL_VERSION,
        }

    llm = VisionFitLLM()

    raw_result = await llm.produce_response.remote.aio(
        json.dumps(veri, ensure_ascii=False)
    )

    try:
        result = json.loads(raw_result)
    except json.JSONDecodeError:
        result = {
            "yorum": raw_result,
            "tip": detect_request_type(veri),
            "dogrulama": False,
            "uyarilar": ["Modal sonucu JSON biçiminde çözülemedi."],
        }

    result["surum"] = MODEL_VERSION
    result["model_id"] = MODEL_ID
    result["kaynak"] = "fine_tune_edilmis_llm"

    return result