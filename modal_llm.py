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


HAREKET_ONERILERI = {
    "squat": [
        "İnişte dizleri ayak yönünde takip ettir ve topuk temasını koru.",
        "Ağırlığı artırmadan önce 3 saniyelik kontrollü inişlerle aynı derinliği tekrar et.",
    ],
    "deadlift": [
        "Barı veya bilek hattını kaval kemiğine yakın tut ve hareketi kalçadan başlat.",
        "Üst pozisyonda geriye aşırı yaslanmadan kalça ve dizleri birlikte kilitle.",
    ],
    "biceps_curl": [
        "Dirsekleri gövdenin yanında sabit tut ve gövde salınımını azalt.",
        "Ağırlığı düşürüp açma bölümünü 2-3 saniyede kontrollü tamamla.",
    ],
    "biceps curl": [
        "Dirsekleri gövdenin yanında sabit tut ve gövde salınımını azalt.",
        "Ağırlığı düşürüp açma bölümünü 2-3 saniyede kontrollü tamamla.",
    ],
    "shoulder_press": [
        "Bilekleri dirseklerin üzerinde tut ve iki kolu aynı hızda yukarı taşı.",
        "Üstte omuzları kulaklara sıkıştırmadan kontrollü kilitlenme yap.",
    ],
    "shoulder press": [
        "Bilekleri dirseklerin üzerinde tut ve iki kolu aynı hızda yukarı taşı.",
        "Üstte omuzları kulaklara sıkıştırmadan kontrollü kilitlenme yap.",
    ],
    "lateral_raise": [
        "Dirsekleri hafif bükülü tutup kolları omuz seviyesine kadar kaldır.",
        "Gövde salınımını azaltmak için ağırlığı düşür ve inişi yavaşlat.",
    ],
    "lateral raise": [
        "Dirsekleri hafif bükülü tutup kolları omuz seviyesine kadar kaldır.",
        "Gövde salınımını azaltmak için ağırlığı düşür ve inişi yavaşlat.",
    ],
}


def hareket_onerileri_al(hareket: Any) -> list[str]:
    anahtar = normalize_text(hareket).replace("-", "_")
    return HAREKET_ONERILERI.get(
        anahtar,
        [
            "Ağırlığı artırmadan önce hareketi daha yavaş ve kontrollü tekrar et.",
            "Kamerayı sabit tutup tüm gerekli eklemleri kadraja alarak formunu yeniden kontrol et.",
        ],
    )


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

    oneriler = hareket_onerileri_al(hareket)

    result["yorum"] = (
        f"{hareket} analizinde en güçlü alanın {guclu_alan} ve bu kategorideki skorun "
        f"{guclu_skor:.0f}. Bu, ilgili teknik özelliğin tekrarların büyük bölümünde "
        f"korunduğunu gösteriyor. En fazla dikkat gerektiren alan {zayif_alan}; "
        f"{zayif_skor:.0f} puan, bu bölümde hareket boyunca tutarlılığın azaldığını düşündürüyor."
        f"{genel_skor_metni} "
        f"{oneriler[0]} {oneriler[1]} "
        f"Bir sonraki kayıtta aynı kamera açısını ve benzer yükü kullanarak değişimi karşılaştır. "
        f"Ağrı, uyuşma veya belirgin kontrol kaybı olursa hareketi durdur ve yükü azalt."
    )
    result["oneriler"] = oneriler

    result.setdefault("uyarilar", []).append(
        "LLM yeterli uzunlukta yorum üretmediği için güvenli yedek yorum kullanıldı."
    )

    return result


def liste_yap(value: Any) -> list[str]:
    if value is None:
        return []
    if isinstance(value, list):
        return [str(item).strip() for item in value if str(item).strip()]
    if isinstance(value, str) and value.strip():
        return [value.strip()]
    return []


def diet_sonucunu_duzelt(result: dict, payload: dict) -> dict:
    profil = payload.get("profil") or {}
    plan = payload.get("plan") or {}
    not_metni = str(payload.get("kullanici_notu") or "").strip()

    hedef = str(profil.get("hedef") or "kilo_koruma")
    hedef_adlari = {
        "kilo_verme": "kilo verme",
        "kilo_koruma": "kilo koruma",
        "kilo_alma": "kilo alma",
    }
    hedef_adi = hedef_adlari.get(hedef, hedef.replace("_", " "))

    hedef_kalori = safe_float(profil.get("hedef_kalori"))
    plan_kalori = safe_float(plan.get("gunluk_kalori"))
    porsiyon_ham = plan.get("porsiyon_bilgisi")
    porsiyon = porsiyon_ham if isinstance(porsiyon_ham, dict) else {}

    protein = safe_float(porsiyon.get("protein_g") or plan.get("protein_g"))
    karbonhidrat = safe_float(
        porsiyon.get("karbonhidrat_g") or plan.get("karbonhidrat_g")
    )
    yag = safe_float(porsiyon.get("yag_g") or plan.get("yag_g"))

    mevcut = result.get("yorum")
    genel_kaliplar = [
        "hedef uyumu değerlendirildi",
        "protein dağılımı değerlendirildi",
        "sebze içeriği değerlendirildi",
        "meyve içeriği değerlendirildi",
        "lif içeriği değerlendirildi",
        "kalori ve porsiyon bilgisi değerlendirildi",
    ]

    gecerli = (
        isinstance(mevcut, str)
        and len(mevcut.strip()) >= 100
        and sum(1 for kalip in genel_kaliplar if kalip in mevcut.lower()) < 2
    )

    if not gecerli:
        cumleler = [f"Seçtiğin plan {hedef_adi} hedefin açısından değerlendirildi."]

        if hedef_kalori is not None and plan_kalori is not None:
            fark = round(plan_kalori - hedef_kalori)
            if abs(fark) <= 100:
                cumleler.append(
                    f"Planın {plan_kalori:.0f} kcal değeri, {hedef_kalori:.0f} kcal hedefinle oldukça uyumlu."
                )
            elif fark > 0:
                cumleler.append(
                    f"Plan hedefinden yaklaşık {abs(fark)} kcal yüksek; porsiyonları biraz küçültmek daha uygun olur."
                )
            else:
                cumleler.append(
                    f"Plan hedefinden yaklaşık {abs(fark)} kcal düşük; antrenman günlerinde küçük bir ara öğün eklenebilir."
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

        if not_metni:
            cumleler.append(
                f"Kullanıcı notu özellikle dikkate alınmalı: {not_metni}. Bu notla çelişen bir besin varsa plandan çıkarılmalı."
            )

        cumleler.append(
            "Proteini gün içine dağıt, her ana öğünde sebze veya lif kaynağı bulundur ve su tüketimini düzenli sürdür."
        )
        cumleler.append(
            "Planı birkaç gün uyguladıktan sonra açlık, enerji ve antrenman performansına göre porsiyonları küçük adımlarla ayarla."
        )
        cumleler.append(
            "Ciddi alerji, sağlık sorunu veya ilaç kullanımı varsa kişisel plan için diyetisyene danış."
        )

        result["yorum"] = " ".join(cumleler)

    result["tip"] = "diyet"
    result["hedef"] = hedef
    result["hedef_kalori"] = hedef_kalori
    result["plan_kalori"] = plan_kalori
    result["makrolar"] = {
        "protein_g": protein,
        "karbonhidrat_g": karbonhidrat,
        "yag_g": yag,
    }

    return result


def build_instruction(payload: dict[str, Any]) -> str:
    request_type = detect_request_type(payload)

    if request_type == "diyet":
        return (
            "Verilen kullanıcı tercihleri, hedef, alerji ve beslenme verilerine göre Türkçe diyet değerlendirmesi oluştur. "
            "Alerji, vejetaryenlik, glutensiz beslenme ve sevilmeyen yiyecekleri kesin kısıt olarak ele al. "
            "Kalori veya makro bilgisi verilmediyse sayı uydurma. "
            "En az iki uygulanabilir öneri ve bir güvenlik uyarısı ver. "
            "Yorum 90 ile 150 kelime arasında olmalıdır. "
            "JSON şu alanları içermelidir: tip, hedef, uygunluk, oneriler, yorum. "
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
                max_new_tokens=420,
                do_sample=False,
                repetition_penalty=1.08,
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
        else:
            result = diet_sonucunu_duzelt(result, payload)

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