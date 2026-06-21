import json
import os
import re
from typing import Any, Callable

import modal

MODEL_ID = "213asdfdws/visionfit-llm"
MODEL_DIR = "/model"
MODEL_VERSION = "v23-unified-guarded-llm"

TR_MAP = str.maketrans({
    "ç": "c",
    "ğ": "g",
    "ı": "i",
    "ö": "o",
    "ş": "s",
    "ü": "u",
    "Ç": "c",
    "Ğ": "g",
    "İ": "i",
    "I": "i",
    "Ö": "o",
    "Ş": "s",
    "Ü": "u",
})

MOVEMENT_LABELS = {
    "squat": "Squat",
    "deadlift": "Deadlift",
    "biceps_curl": "Biceps Curl",
}

MOVEMENT_CONTEXTS = {
    "squat": (
        "Squat hareketinde Omurga Nötrlüğü sırt ve bel hizasını, "
        "Kalça Derinliği çömelme derinliğini, Diz Hizası dizlerin doğru doğrultuda kalmasını, "
        "Diz Çöküşü dizlerin içe kapanma durumunu ve Ağırlık Merkezi dengeyi ifade eder."
    ),
    "deadlift": (
        "Deadlift hareketinde Omurga Nötrlüğü sırt ve bel hizasını, "
        "Kalça Pozisyonu kalçanın konumunu, Bar Yolu barın vücuda yakın ve kontrollü ilerlemesini, "
        "Denge ise yük dağılımını ifade eder."
    ),
    "biceps_curl": (
        "Biceps Curl hareketinde Dirsek Sabitliği dirseklerin gövde yanında kalmasını, "
        "Gövde Salınımı Kontrolü gövdeden destek alınmamasını, "
        "Hareket Açıklığı tekrarın yeterli aralıkta tamamlanmasını ve "
        "Bilek Hizası bileğin kontrollü konumunu ifade eder."
    ),
}

PROTEIN_WORDS = [
    "tavuk",
    "hindi",
    "balik",
    "somon",
    "ton baligi",
    "et",
    "kiyma",
    "yumurta",
    "omlet",
    "yogurt",
    "peynir",
    "sut",
    "kefir",
    "ayran",
    "mercimek",
    "nohut",
    "fasulye",
    "barbunya",
    "tofu",
    "protein",
]

VEGETABLE_WORDS = [
    "sebze",
    "salata",
    "brokoli",
    "ispanak",
    "kabak",
    "havuc",
    "domates",
    "salatalik",
    "biber",
    "yesillik",
    "karnabahar",
    "patlican",
    "lahana",
]

FRUIT_WORDS = [
    "meyve",
    "muz",
    "elma",
    "portakal",
    "mandalina",
    "cilek",
    "armut",
    "kivi",
    "uzum",
    "seftali",
]

FIBER_WORDS = VEGETABLE_WORDS + FRUIT_WORDS + [
    "yulaf",
    "mercimek",
    "nohut",
    "fasulye",
    "barbunya",
    "bulgur",
    "tam tahil",
    "chia",
    "keten",
]

MEAT_WORDS = [
    "tavuk",
    "hindi",
    "balik",
    "somon",
    "ton baligi",
    "et",
    "kiyma",
]

DAIRY_WORDS = [
    "sut",
    "yogurt",
    "peynir",
    "kefir",
    "ayran",
]

NUT_WORDS = [
    "kuruyemis",
    "findik",
    "badem",
    "ceviz",
    "kaju",
    "fistik",
    "yer fistigi",
]

FISH_WORDS = [
    "balik",
    "somon",
    "ton baligi",
    "karides",
    "deniz urunu",
]

NONSENSE_WORDS = [
    "jeolog",
    "kilovuran",
    "viskosi",
    "uyguladindi",
    "kaynaki",
    "gefille",
    "ayna yansit",
    "lisede kullanilan",
    "son raf",
    "emerge",
    "required",
    "adapted",
    "trade-off",
]

def normalize_text(value: Any) -> str:
    text = str(value or "").translate(TR_MAP).lower()
    return re.sub(r"\s+", " ", text).strip()

def clean_output(value: Any) -> str:
    return re.sub(r"\s+", " ", str(value or "")).strip()

def safe_float(value: Any) -> float | None:
    try:
        return float(str(value).replace(",", "."))
    except (TypeError, ValueError):
        return None

def average(values: list[float]) -> float | None:
    return sum(values) / len(values) if values else None

def contains_foreign_script(text: str) -> bool:
    return bool(
        re.search(
            r"[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uac00-\ud7af]",
            text,
        )
    )

def serialize(value: Any) -> str:
    if isinstance(value, (dict, list)):
        return json.dumps(
            value,
            ensure_ascii=False,
            indent=2,
        )
    return str(value or "").strip()

def flatten_values(value: Any) -> list[str]:
    result: list[str] = []

    if isinstance(value, dict):
        for item in value.values():
            result.extend(flatten_values(item))

    elif isinstance(value, list):
        for item in value:
            result.extend(flatten_values(item))

    elif value is not None:
        text = str(value).strip()

        if text:
            result.append(text)

    return result

def positive_mention(
    text: str,
    words: list[str],
) -> bool:
    negatives = [
        "yok",
        "bulunmuyor",
        "bulunmamakta",
        "icermiyor",
        "yer almiyor",
        "mevcut degil",
        "eklenmemis",
        "dahil degil",
        "belirtilmemis",
    ]

    for word in words:
        for match in re.finditer(
            re.escape(word),
            text,
        ):
            start = max(
                0,
                match.start() - 25,
            )

            end = min(
                len(text),
                match.end() + 70,
            )

            context = text[start:end]

            if not any(
                item in context
                for item in negatives
            ):
                return True

    return False

def normalize_movement(value: Any) -> str:
    text = normalize_text(value)

    if "deadlift" in text:
        return "deadlift"

    if (
        "biceps" in text
        or "curl" in text
    ):
        return "biceps_curl"

    return "squat"

def normalize_scores(
    raw: Any,
) -> dict[str, float]:
    if not isinstance(raw, dict):
        return {}

    result: dict[str, float] = {}

    for key, value in raw.items():
        score = safe_float(value)

        if score is not None:
            result[str(key).strip()] = score

    return result

def non_general_scores(
    scores: dict[str, float],
) -> dict[str, float]:
    filtered = {
        key: value
        for key, value in scores.items()
        if "genel" not in normalize_text(key)
    }

    return filtered or scores

def session_average(
    session: dict[str, Any],
) -> float | None:
    scores = normalize_scores(
        session.get(
            "kategori_skorlari",
            {},
        )
    )

    return average(
        list(
            non_general_scores(
                scores
            ).values()
        )
    )

def determine_history_trend(
    values: list[float],
) -> str:
    if len(values) < 2:
        return (
            "Geçmiş karşılaştırması için "
            "yeterli oturum yok."
        )

    differences = [
        values[index] - values[index - 1]
        for index in range(
            1,
            len(values),
        )
    ]

    if (
        len(differences) >= 2
        and differences[-1] <= -8
    ):
        return (
            "Son oturumda önceki oturuma göre "
            "ani düşüş var."
        )

    if all(
        item > 0.5
        for item in differences
    ):
        return (
            "Skorlar düzenli biçimde yükseliyor."
        )

    if all(
        item < -0.5
        for item in differences
    ):
        return (
            "Skorlar düzenli biçimde düşüyor."
        )

    if max(values) - min(values) <= 3:
        return (
            "Skorlarda plato görünümü var."
        )

    return (
        "Skorlar oturumlar arasında "
        "dalgalı ilerliyor."
    )

def build_trainer_facts(
    payload: dict[str, Any],
) -> dict[str, Any]:
    movement = normalize_movement(
        payload.get(
            "hareket",
            "",
        )
    )

    movement_label = MOVEMENT_LABELS[
        movement
    ]

    scores = normalize_scores(
        payload.get(
            "kategori_skorlari",
            {},
        )
    )

    history = payload.get(
        "gecmis_antrenmanlar",
        [],
    )

    if not isinstance(history, list):
        history = []

    valid_history = [
        item
        for item in history
        if isinstance(item, dict)
    ]

    if not scores and valid_history:
        scores = normalize_scores(
            valid_history[-1].get(
                "kategori_skorlari",
                {},
            )
        )

    general_score = safe_float(
        payload.get(
            "genel_skor"
        )
    )

    if general_score is None:
        for category, score in scores.items():
            if "genel" in normalize_text(
                category
            ):
                general_score = score
                break

    if general_score is None:
        general_score = average(
            list(scores.values())
        )

    relevant_scores = non_general_scores(
        scores
    )

    strongest_category = (
        max(
            relevant_scores,
            key=relevant_scores.get,
        )
        if relevant_scores
        else ""
    )

    weakest_category = (
        min(
            relevant_scores,
            key=relevant_scores.get,
        )
        if relevant_scores
        else ""
    )

    fact_lines = [
        f"HAREKET: {movement_label}",
    ]

    if general_score is not None:
        fact_lines.append(
            f"GENEL SKOR: {general_score:.1f}"
        )

    fact_lines.append(
        "GÜNCEL KATEGORİ SKORLARI:"
    )

    for category, score in scores.items():
        fact_lines.append(
            f"{category}: {score:.1f}"
        )

    if strongest_category:
        fact_lines.append(
            "EN GÜÇLÜ KATEGORİ: "
            f"{strongest_category} "
            f"({relevant_scores[strongest_category]:.1f})"
        )

    if weakest_category:
        fact_lines.append(
            "GELİŞTİRİLMESİ GEREKEN KATEGORİ: "
            f"{weakest_category} "
            f"({relevant_scores[weakest_category]:.1f})"
        )

    most_improved = ""
    most_declined = ""
    history_trend = ""

    weight_available = (
        payload.get("agirlik") is not None
    )

    if len(valid_history) >= 2:
        first_scores = normalize_scores(
            valid_history[0].get(
                "kategori_skorlari",
                {},
            )
        )

        last_scores = normalize_scores(
            valid_history[-1].get(
                "kategori_skorlari",
                {},
            )
        )

        common = [
            key
            for key in first_scores
            if key in last_scores
        ]

        deltas = {
            key: (
                last_scores[key]
                - first_scores[key]
            )
            for key in common
        }

        if deltas:
            improved_candidate = max(
                deltas,
                key=deltas.get,
            )

            declined_candidate = min(
                deltas,
                key=deltas.get,
            )

            if deltas[improved_candidate] > 0.5:
                most_improved = (
                    improved_candidate
                )

            if deltas[declined_candidate] < -0.5:
                most_declined = (
                    declined_candidate
                )

            fact_lines.append(
                "İLK VE SON OTURUM ARASINDAKİ "
                "DEĞİŞİMLER:"
            )

            for category, delta in deltas.items():
                fact_lines.append(
                    f"{category}: {delta:+.1f}"
                )

            if most_improved:
                fact_lines.append(
                    "EN FAZLA GELİŞEN KATEGORİ: "
                    f"{most_improved} "
                    f"({deltas[most_improved]:+.1f})"
                )

            if most_declined:
                fact_lines.append(
                    "EN FAZLA GERİLEYEN KATEGORİ: "
                    f"{most_declined} "
                    f"({deltas[most_declined]:+.1f})"
                )

        history_values = []

        for session in valid_history:
            current = session_average(
                session
            )

            if current is not None:
                history_values.append(
                    current
                )

            if session.get(
                "agirlik"
            ) is not None:
                weight_available = True

        history_trend = (
            determine_history_trend(
                history_values
            )
        )

        fact_lines.append(
            "TARİHSEL DURUM: "
            + history_trend
        )

        first_weight = safe_float(
            valid_history[0].get(
                "agirlik"
            )
        )

        last_weight = safe_float(
            valid_history[-1].get(
                "agirlik"
            )
        )

        first_average = session_average(
            valid_history[0]
        )

        last_average = session_average(
            valid_history[-1]
        )

        if (
            first_weight is not None
            and last_weight is not None
            and first_average is not None
            and last_average is not None
        ):
            weight_change = (
                last_weight - first_weight
            )

            form_change = (
                last_average - first_average
            )

            fact_lines.append(
                "AĞIRLIK DEĞİŞİMİ: "
                f"{weight_change:+.1f} kg"
            )

            fact_lines.append(
                "ORTALAMA FORM DEĞİŞİMİ: "
                f"{form_change:+.1f}"
            )

            if (
                weight_change > 0
                and form_change < 0
            ):
                fact_lines.append(
                    "AĞIRLIK-FORM İLİŞKİSİ: "
                    "Ağırlık artarken form skoru düşmüş."
                )

            elif (
                abs(weight_change) < 0.1
                and form_change > 0
            ):
                fact_lines.append(
                    "AĞIRLIK-FORM İLİŞKİSİ: "
                    "Ağırlık aynı kalırken form gelişmiş."
                )

    return {
        "movement": movement,
        "movement_label": movement_label,
        "movement_context": MOVEMENT_CONTEXTS[
            movement
        ],
        "strongest_category": (
            strongest_category
        ),
        "weakest_category": (
            weakest_category
        ),
        "most_improved": most_improved,
        "most_declined": most_declined,
        "history_trend": history_trend,
        "weight_available": (
            weight_available
        ),
        "facts_text": "\n".join(
            fact_lines
        ),
    }

def get_dict_value(
    data: Any,
    aliases: list[str],
) -> Any:
    if not isinstance(data, dict):
        return None

    normalized_aliases = {
        normalize_text(alias)
        for alias in aliases
    }

    for key, value in data.items():
        if normalize_text(
            key
        ) in normalized_aliases:
            return value

    return None

def meal_protein_status(
    plan: Any,
    aliases: list[str],
) -> str:
    meal = get_dict_value(
        plan,
        aliases,
    )

    values = flatten_values(
        meal
    )

    if not values:
        return (
            "yok veya belirtilmemiş"
        )

    meal_text = normalize_text(
        " ".join(values)
    )

    if positive_mention(
        meal_text,
        PROTEIN_WORDS,
    ):
        return "var"

    return "yok"

def extract_target(
    profile: Any,
    payload: dict[str, Any],
) -> str:
    profile_target = get_dict_value(
        profile,
        [
            "hedef",
            "goal",
        ],
    )

    text = normalize_text(
        f"{profile_target or ''} "
        f"{payload.get('talimat', '')}"
    )

    if (
        "kilo verm" in text
        or "zayifla" in text
    ):
        return "kilo verme"

    if (
        "kilo al" in text
        or "hacim" in text
    ):
        return "kilo alma"

    if "kilo koru" in text:
        return "kilo koruma"

    return "belirtilmemiş"

def build_diet_facts(
    payload: dict[str, Any],
) -> dict[str, Any]:
    profile = payload.get(
        "profil",
        {},
    )

    plan = payload.get(
        "plan",
        payload.get(
            "girdi",
            "",
        ),
    )

    user_note = str(
        payload.get(
            "kullanici_notu",
            "",
        )
    ).strip()

    plan_text = normalize_text(
        " ".join(
            flatten_values(
                plan
            )
        )
    )

    note_text = normalize_text(
        user_note
    )

    target = extract_target(
        profile,
        payload,
    )

    breakfast_protein = (
        meal_protein_status(
            plan,
            [
                "kahvalti",
                "kahvaltı",
            ],
        )
    )

    lunch_protein = (
        meal_protein_status(
            plan,
            [
                "ogle",
                "öğle",
            ],
        )
    )

    dinner_protein = (
        meal_protein_status(
            plan,
            [
                "aksam",
                "akşam",
            ],
        )
    )

    vegetable_exists = (
        positive_mention(
            plan_text,
            VEGETABLE_WORDS,
        )
    )

    fruit_exists = (
        positive_mention(
            plan_text,
            FRUIT_WORDS,
        )
    )

    fiber_exists = (
        positive_mention(
            plan_text,
            FIBER_WORDS,
        )
    )

    calorie_or_portion_exists = bool(
        re.search(
            r"\b\d+(?:[.,]\d+)?\s*"
            r"(?:kcal|kalori|gram|gr|g|ml|adet|porsiyon)\b",
            plan_text,
        )
    )

    note_findings: list[
        dict[str, str]
    ] = []

    if (
        "yumurta" in note_text
        and "alerj" in note_text
    ):
        conflict = positive_mention(
            plan_text,
            [
                "yumurta",
                "omlet",
            ],
        )

        note_findings.append({
            "code": (
                "egg_conflict"
                if conflict
                else "egg_compatible"
            ),
            "text": (
                "Yumurta alerjisi ile plandaki "
                "yumurta seçeneği çelişiyor."
                if conflict
                else
                "Plan yumurta alerjisi notuyla uyumlu."
            ),
        })

    if (
        "sut" in note_text
        and "alerj" in note_text
    ):
        conflict = positive_mention(
            plan_text,
            DAIRY_WORDS,
        )

        note_findings.append({
            "code": (
                "milk_conflict"
                if conflict
                else "milk_compatible"
            ),
            "text": (
                "Süt alerjisi ile plandaki "
                "süt ürünü çelişiyor."
                if conflict
                else
                "Plan süt alerjisi notuyla uyumlu."
            ),
        })

    if (
        "gluten" in note_text
        or "glutensiz" in note_text
    ):
        cleaned = re.sub(
            r"glutensiz\s+"
            r"(?:ekmek|makarna|lavas)",
            "",
            plan_text,
        )

        conflict = positive_mention(
            cleaned,
            [
                "normal ekmek",
                "normal makarna",
                "ekmek",
                "makarna",
                "bulgur",
                "bugday",
                "lavas",
            ],
        )

        note_findings.append({
            "code": (
                "gluten_conflict"
                if conflict
                else "gluten_compatible"
            ),
            "text": (
                "Glutensiz beslenme notu ile "
                "plandaki gluten kaynağı çelişiyor."
                if conflict
                else
                "Plan glutensiz beslenme notuyla uyumlu."
            ),
        })

    if "vejetaryen" in note_text:
        conflict = positive_mention(
            plan_text,
            MEAT_WORDS,
        )

        note_findings.append({
            "code": (
                "vegetarian_conflict"
                if conflict
                else "vegetarian_compatible"
            ),
            "text": (
                "Vejetaryen beslenme tercihi ile "
                "plandaki et ürünü çelişiyor."
                if conflict
                else
                "Plan vejetaryen beslenme "
                "tercihiyle uyumlu."
            ),
        })

    if "vegan" in note_text:
        conflict = positive_mention(
            plan_text,
            MEAT_WORDS
            + DAIRY_WORDS
            + [
                "yumurta",
                "omlet",
            ],
        )

        note_findings.append({
            "code": (
                "vegan_conflict"
                if conflict
                else "vegan_compatible"
            ),
            "text": (
                "Vegan beslenme tercihi ile "
                "plandaki hayvansal ürün çelişiyor."
                if conflict
                else
                "Plan vegan beslenme tercihiyle uyumlu."
            ),
        })

    if (
        (
            "kuruyemis" in note_text
            or any(
                item in note_text
                for item in NUT_WORDS
            )
        )
        and "alerj" in note_text
    ):
        conflict = positive_mention(
            plan_text,
            NUT_WORDS,
        )

        note_findings.append({
            "code": (
                "nut_conflict"
                if conflict
                else "nut_compatible"
            ),
            "text": (
                "Kuruyemiş alerjisi ile plandaki "
                "kuruyemiş seçeneği çelişiyor."
                if conflict
                else
                "Plan kuruyemiş alerjisi notuyla uyumlu."
            ),
        })

    fish_dislike = (
        "balik sevm" in note_text
        or "balik yemiyorum" in note_text
        or "deniz urunu sevm" in note_text
    )

    if fish_dislike:
        conflict = positive_mention(
            plan_text,
            FISH_WORDS,
        )

        note_findings.append({
            "code": (
                "fish_conflict"
                if conflict
                else "fish_compatible"
            ),
            "text": (
                "Balık tercih etmeme notu ile "
                "plandaki balık seçeneği çelişiyor."
                if conflict
                else
                "Plan balık tercih etmeme notuyla uyumlu."
            ),
        })

    preparation_match = re.search(
        r"(\d+)\s*dakika",
        note_text,
    )

    if preparation_match:
        note_findings.append({
            "code": "preparation_time",
            "text": (
                "Kullanıcı yemek hazırlamak için en fazla "
                f"{preparation_match.group(1)} dakika ayırabiliyor."
            ),
        })

    fact_lines = [
        f"HEDEF: {target}",
        "KULLANICI PROFİLİ:",
        (
            serialize(profile)
            or "Profil bilgisi verilmedi."
        ),
        "SEÇİLEN PLAN:",
        (
            serialize(plan)
            or "Plan bilgisi verilmedi."
        ),
        (
            "KAHVALTI PROTEİNİ: "
            + breakfast_protein
        ),
        (
            "ÖĞLE PROTEİNİ: "
            + lunch_protein
        ),
        (
            "AKŞAM PROTEİNİ: "
            + dinner_protein
        ),
        (
            "SEBZE: "
            + (
                "var"
                if vegetable_exists
                else "yok"
            )
        ),
        (
            "MEYVE: "
            + (
                "var"
                if fruit_exists
                else "yok"
            )
        ),
        (
            "LİF KAYNAĞI: "
            + (
                "var"
                if fiber_exists
                else "düşük veya belirsiz"
            )
        ),
        (
            "PORSİYON VEYA KALORİ BİLGİSİ: "
            + (
                "var"
                if calorie_or_portion_exists
                else "yok"
            )
        ),
    ]

    if note_findings:
        fact_lines.append(
            "KULLANICI NOTU BULGULARI:"
        )

        fact_lines.extend(
            item["text"]
            for item in note_findings
        )

    else:
        fact_lines.append(
            "KULLANICI NOTU BULGULARI: "
            "Ek bir uyum veya çelişki yok."
        )

    return {
        "target": target,
        "breakfast_protein": (
            breakfast_protein
        ),
        "lunch_protein": (
            lunch_protein
        ),
        "dinner_protein": (
            dinner_protein
        ),
        "vegetable_exists": (
            vegetable_exists
        ),
        "fruit_exists": (
            fruit_exists
        ),
        "fiber_exists": (
            fiber_exists
        ),
        "calorie_or_portion_exists": (
            calorie_or_portion_exists
        ),
        "note_findings": (
            note_findings
        ),
        "facts_text": "\n".join(
            fact_lines
        ),
    }

def validate_trainer_answer(
    answer: str,
    facts: dict[str, Any],
) -> list[str]:
    problems: list[str] = []

    normalized = normalize_text(
        answer
    )

    if len(answer.split()) < 20:
        problems.append(
            "Cevap çok kısa."
        )

    if contains_foreign_script(
        answer
    ):
        problems.append(
            "Cevapta Türkçe dışı karakterler var."
        )

    movement = facts[
        "movement"
    ]

    required = {
        "squat": [
            "squat",
        ],
        "deadlift": [
            "deadlift",
        ],
        "biceps_curl": [
            "biceps",
            "curl",
        ],
    }[movement]

    if not all(
        item in normalized
        for item in required
    ):
        problems.append(
            "Doğru hareket adı cevapta yok."
        )

    wrong = {
        "squat": [
            "deadlift",
            "biceps curl",
        ],
        "deadlift": [
            "squat",
            "biceps curl",
        ],
        "biceps_curl": [
            "squat",
            "deadlift",
        ],
    }[movement]

    if any(
        item in normalized
        for item in wrong
    ):
        problems.append(
            "Yanlış hareket adı kullanılmış."
        )

    required_categories = [
        (
            "strongest_category",
            "En güçlü kategori",
        ),
        (
            "weakest_category",
            "Geliştirilmesi gereken kategori",
        ),
        (
            "most_improved",
            "En fazla gelişen kategori",
        ),
        (
            "most_declined",
            "En fazla gerileyen kategori",
        ),
    ]

    for key, label in required_categories:
        value = facts.get(
            key,
            "",
        )

        if (
            value
            and normalize_text(
                value
            ) not in normalized
        ):
            problems.append(
                f"{label} cevapta yok: {value}"
            )

    if not facts.get(
        "weight_available",
        False,
    ):
        forbidden = [
            "agirligi azalt",
            "agirlik azalt",
            "daha hafif agirlik",
            "agirligi artir",
            "agirlik artir",
            "daha agir calis",
        ]

        if any(
            item in normalized
            for item in forbidden
        ):
            problems.append(
                "Ağırlık bilgisi olmadan "
                "ağırlık önerisi verilmiş."
            )

    if any(
        item in normalized
        for item in NONSENSE_WORDS
    ):
        problems.append(
            "Anlamsız veya alakasız ifade var."
        )

    return problems

def validate_diet_answer(
    answer: str,
    facts: dict[str, Any],
) -> list[str]:
    problems: list[str] = []

    normalized = normalize_text(
        answer
    )

    if len(answer.split()) < 30:
        problems.append(
            "Cevap çok kısa."
        )

    if contains_foreign_script(
        answer
    ):
        problems.append(
            "Cevapta Türkçe dışı karakterler var."
        )

    if any(
        item in normalized
        for item in NONSENSE_WORDS
    ):
        problems.append(
            "Anlamsız veya alakasız ifade var."
        )

    protein_problem = any(
        status != "var"
        for status in [
            facts[
                "breakfast_protein"
            ],
            facts[
                "lunch_protein"
            ],
            facts[
                "dinner_protein"
            ],
        ]
    )

    if (
        protein_problem
        and "protein" not in normalized
    ):
        problems.append(
            "Protein dağılımı değerlendirilmemiş."
        )

    if (
        not facts["vegetable_exists"]
        and "sebze" not in normalized
    ):
        problems.append(
            "Sebze eksikliği değerlendirilmemiş."
        )

    if (
        not facts["fruit_exists"]
        and "meyve" not in normalized
    ):
        problems.append(
            "Meyve eksikliği değerlendirilmemiş."
        )

    if (
        not facts["fiber_exists"]
        and "lif" not in normalized
    ):
        problems.append(
            "Lif eksikliği değerlendirilmemiş."
        )

    if (
        not facts[
            "calorie_or_portion_exists"
        ]
        and not any(
            item in normalized
            for item in [
                "kalori",
                "porsiyon",
                "enerji",
            ]
        )
    ):
        problems.append(
            "Kalori veya porsiyon eksikliği "
            "değerlendirilmemiş."
        )

    for finding in facts[
        "note_findings"
    ]:
        code = finding[
            "code"
        ]

        if (
            code.startswith(
                "egg_"
            )
            and not (
                "yumurta" in normalized
                and "alerj" in normalized
            )
        ):
            problems.append(
                "Yumurta alerjisi değerlendirilmemiş."
            )

        elif (
            code.startswith(
                "milk_"
            )
            and not (
                "sut" in normalized
                and "alerj" in normalized
            )
        ):
            problems.append(
                "Süt alerjisi değerlendirilmemiş."
            )

        elif (
            code.startswith(
                "gluten_"
            )
            and "gluten" not in normalized
        ):
            problems.append(
                "Glutensiz beslenme değerlendirilmemiş."
            )

        elif (
            code.startswith(
                "vegetarian_"
            )
            and "vejetaryen"
            not in normalized
        ):
            problems.append(
                "Vejetaryen tercihi değerlendirilmemiş."
            )

        elif (
            code.startswith(
                "vegan_"
            )
            and "vegan"
            not in normalized
        ):
            problems.append(
                "Vegan tercihi değerlendirilmemiş."
            )

        elif (
            code.startswith(
                "nut_"
            )
            and not any(
                item in normalized
                for item in [
                    "kuruyemis",
                    "findik",
                    "badem",
                    "ceviz",
                    "fistik",
                ]
            )
        ):
            problems.append(
                "Kuruyemiş alerjisi değerlendirilmemiş."
            )

        elif (
            code.startswith(
                "fish_"
            )
            and not (
                "balik" in normalized
                or "deniz urunu"
                in normalized
            )
        ):
            problems.append(
                "Balık tercihi değerlendirilmemiş."
            )

        elif (
            code == "preparation_time"
            and not any(
                item in normalized
                for item in [
                    "dakika",
                    "sure",
                    "hazirla",
                ]
            )
        ):
            problems.append(
                "Hazırlama süresi değerlendirilmemiş."
            )

    return problems

def detect_request_type(
    payload: dict[str, Any],
) -> str:
    explicit = normalize_text(
        payload.get(
            "tip",
            "",
        )
    )

    if explicit in {
        "antrenor",
        "trainer",
    }:
        return "antrenor"

    if explicit in {
        "diyet",
        "diet",
    }:
        return "diyet"

    if (
        payload.get(
            "hareket"
        )
        or payload.get(
            "kategori_skorlari"
        )
        or payload.get(
            "gecmis_antrenmanlar"
        )
    ):
        return "antrenor"

    return "diyet"

def download_model(
    version_marker: str = MODEL_VERSION,
):
    import shutil

    from huggingface_hub import (
        snapshot_download,
    )

    print(
        "Model indiriliyor:",
        MODEL_ID,
    )

    print(
        "Model sürümü:",
        version_marker,
    )

    if os.path.exists(
        MODEL_DIR
    ):
        shutil.rmtree(
            MODEL_DIR
        )

    snapshot_download(
        repo_id=MODEL_ID,
        local_dir=MODEL_DIR,
        token=os.environ.get(
            "HF_TOKEN"
        ),
    )

    print(
        "Model başarıyla indirildi."
    )

model_image = (
    modal.Image.debian_slim(
        python_version="3.11"
    )
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
        kwargs={
            "version_marker": (
                MODEL_VERSION
            ),
        },
        secrets=[
            modal.Secret.from_name(
                "huggingface"
            ),
        ],
        timeout=1800,
    )
)

api_image = (
    modal.Image.debian_slim(
        python_version="3.11"
    )
    .pip_install(
        "fastapi[standard]"
    )
)

app = modal.App(
    "visionfit-llm"
)

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
    def load_model(
        self,
    ):
        import torch

        from transformers import (
            AutoModelForCausalLM,
            AutoTokenizer,
            BitsAndBytesConfig,
        )

        self.tokenizer = (
            AutoTokenizer.from_pretrained(
                MODEL_DIR,
                local_files_only=True,
            )
        )

        if (
            self.tokenizer.pad_token
            is None
        ):
            self.tokenizer.pad_token = (
                self.tokenizer.eos_token
            )

        self.tokenizer.padding_side = (
            "left"
        )

        quantization_config = (
            BitsAndBytesConfig(
                load_in_4bit=True,
                bnb_4bit_quant_type="nf4",
                bnb_4bit_compute_dtype=(
                    torch.float16
                ),
                bnb_4bit_use_double_quant=True,
            )
        )

        self.model = (
            AutoModelForCausalLM.from_pretrained(
                MODEL_DIR,
                local_files_only=True,
                dtype=torch.float16,
                device_map={
                    "": 0,
                },
                quantization_config=(
                    quantization_config
                ),
                low_cpu_mem_usage=True,
            )
        )

        self.model.eval()
        self.model.config.use_cache = True

        self.model.generation_config.pad_token_id = (
            self.tokenizer.pad_token_id
        )

        self.model.generation_config.eos_token_id = (
            self.tokenizer.eos_token_id
        )

        print(
            "VisionFit LLM yüklendi:",
            MODEL_VERSION,
        )

    def generate_text(
        self,
        messages: list[
            dict[str, str]
        ],
        max_new_tokens: int,
        temperature: float,
        seed: int,
    ) -> str:
        import torch

        torch.manual_seed(
            seed
        )

        inputs = (
            self.tokenizer.apply_chat_template(
                messages,
                tokenize=True,
                add_generation_prompt=True,
                return_tensors="pt",
                return_dict=True,
            )
        )

        inputs = {
            key: value.to(
                "cuda"
            )
            for key, value
            in inputs.items()
        }

        with torch.inference_mode():
            output = (
                self.model.generate(
                    **inputs,
                    max_new_tokens=(
                        max_new_tokens
                    ),
                    do_sample=True,
                    temperature=(
                        temperature
                    ),
                    top_p=0.9,
                    top_k=40,
                    repetition_penalty=1.12,
                    no_repeat_ngram_size=4,
                    use_cache=True,
                    pad_token_id=(
                        self.tokenizer.pad_token_id
                    ),
                    eos_token_id=(
                        self.tokenizer.eos_token_id
                    ),
                )
            )

        input_length = (
            inputs[
                "input_ids"
            ].shape[1]
        )

        return clean_output(
            self.tokenizer.decode(
                output[0][input_length:],
                skip_special_tokens=True,
            )
        )

    def guarded_generate(
        self,
        system_prompt: str,
        facts_text: str,
        validator: Callable[
            [str],
            list[str],
        ],
        max_new_tokens: int,
    ) -> tuple[
        str,
        bool,
        int,
        list[str],
    ]:
        temperatures = [
            0.12,
            0.18,
            0.24,
            0.30,
        ]

        best_answer = ""
        best_problems = [
            "Cevap üretilmedi."
        ]

        previous_answer = ""
        previous_problems: list[
            str
        ] = []

        for index, temperature in enumerate(
            temperatures,
            start=1,
        ):
            if index == 1:
                user_prompt = (
                    "BAĞLAYICI BULGULAR:\n"
                    f"{facts_text}\n\n"
                    "Bu bulgulara aykırı konuşmadan "
                    "yalnızca nihai Türkçe paragrafı yaz."
                )

            else:
                user_prompt = (
                    "BAĞLAYICI BULGULAR:\n"
                    f"{facts_text}\n\n"
                    "ÖNCEKİ GEÇERSİZ CEVAP:\n"
                    f"{previous_answer}\n\n"
                    "DÜZELTİLMESİ GEREKENLER:\n"
                    + "\n".join(
                        previous_problems
                    )
                    + "\n\n"
                    "Cevabı baştan ve yalnızca nihai "
                    "Türkçe paragraf olarak yaz."
                )

            messages = [
                {
                    "role": "system",
                    "content": system_prompt,
                },
                {
                    "role": "user",
                    "content": user_prompt,
                },
            ]

            candidate = (
                self.generate_text(
                    messages=messages,
                    max_new_tokens=(
                        max_new_tokens
                    ),
                    temperature=(
                        temperature
                    ),
                    seed=(
                        20260621 + index
                    ),
                )
            )

            problems = validator(
                candidate
            )

            print(
                f"{index}. deneme:",
                candidate,
            )

            print(
                "Sorunlar:",
                problems,
            )

            if (
                not best_answer
                or len(problems)
                < len(best_problems)
                or (
                    len(problems)
                    == len(best_problems)
                    and len(
                        candidate.split()
                    )
                    > len(
                        best_answer.split()
                    )
                )
            ):
                best_answer = candidate
                best_problems = problems

            if not problems:
                return (
                    candidate,
                    True,
                    index,
                    [],
                )

            previous_answer = candidate
            previous_problems = problems

        return (
            best_answer,
            False,
            len(temperatures),
            best_problems,
        )

    def produce_trainer(
        self,
        payload: dict[str, Any],
    ) -> dict[str, Any]:
        facts = build_trainer_facts(
            payload
        )

        system_prompt = (
            "Sen VisionFit uygulamasının Türkçe "
            "AI antrenörüsün. "
            f"Analiz edilen hareket yalnızca "
            f"{facts['movement_label']} hareketidir. "
            f"{facts['movement_context']} "
            "Backend bulguları güvenilir ve bağlayıcıdır. "
            "Nihai yorumu kendi cümlelerinle oluştur. "
            "Hareket adını, en güçlü kategori adını ve "
            "geliştirilmesi gereken kategori adını birebir kullan. "
            "Geçmiş veri varsa gelişim veya gerileme "
            "bulgularını yorumla. "
            "Verilmeyen ağırlık, ağrı, sakatlık, tekrar, "
            "tempo veya ekipman bilgisi uydurma. "
            "Başka hareketten söz etme. "
            "Yalnızca Türkçe yaz. "
            "Üç ile beş anlaşılır ve motive edici cümle oluştur. "
            "Başlık, liste ve madde işareti kullanma."
        )

        (
            answer,
            valid,
            attempts,
            problems,
        ) = self.guarded_generate(
            system_prompt=(
                system_prompt
            ),
            facts_text=(
                facts["facts_text"]
            ),
            validator=lambda candidate: (
                validate_trainer_answer(
                    candidate,
                    facts,
                )
            ),
            max_new_tokens=190,
        )

        return {
            "yorum": answer,
            "tip": "antrenor",
            "dogrulama": valid,
            "deneme_sayisi": (
                attempts
            ),
            "uyarilar": problems,
            "hareket": facts[
                "movement"
            ],
            "guclu_alan": facts[
                "strongest_category"
            ],
            "gelistirilecek_alan": facts[
                "weakest_category"
            ],
        }

    def produce_diet(
        self,
        payload: dict[str, Any],
    ) -> dict[str, Any]:
        facts = build_diet_facts(
            payload
        )

        system_prompt = (
            "Sen VisionFit uygulamasının Türkçe "
            "diyet değerlendirme asistanısın. "
            "Kullanıcı sistemin oluşturduğu üç plandan "
            "birini seçmiştir. "
            "Backend bulguları güvenilir ve bağlayıcıdır. "
            "Nihai değerlendirmeyi kendi cümlelerinle oluştur. "
            "Hedef uyumunu, öğünlerdeki protein dağılımını, "
            "sebze, meyve, lif ve kalori veya porsiyon "
            "bilgisini değerlendir. "
            "Kullanıcı notuyla uyum veya çelişki varsa "
            "açıkça belirt. "
            "Gönderilmeyen yiyecek, hastalık, kalori miktarı "
            "veya kullanıcı bilgisi uydurma. "
            "Yalnızca Türkçe yaz. "
            "Dört ile altı anlaşılır cümle oluştur. "
            "Başlık, liste ve madde işareti kullanma."
        )

        (
            answer,
            valid,
            attempts,
            problems,
        ) = self.guarded_generate(
            system_prompt=(
                system_prompt
            ),
            facts_text=(
                facts["facts_text"]
            ),
            validator=lambda candidate: (
                validate_diet_answer(
                    candidate,
                    facts,
                )
            ),
            max_new_tokens=230,
        )

        return {
            "yorum": answer,
            "tip": "diyet",
            "dogrulama": valid,
            "deneme_sayisi": (
                attempts
            ),
            "uyarilar": problems,
            "hedef": facts[
                "target"
            ],
        }

    @modal.method()
    def produce_response(
        self,
        payload_json: str,
    ) -> str:
        try:
            payload = json.loads(
                payload_json
            )

        except json.JSONDecodeError:
            payload = {
                "tip": "antrenor",
                "girdi": payload_json,
            }

        if not isinstance(
            payload,
            dict,
        ):
            payload = {
                "tip": "antrenor",
                "girdi": str(
                    payload
                ),
            }

        request_type = (
            detect_request_type(
                payload
            )
        )

        if request_type == "antrenor":
            result = self.produce_trainer(
                payload
            )

        else:
            result = self.produce_diet(
                payload
            )

        return json.dumps(
            result,
            ensure_ascii=False,
        )

@app.function(
    image=api_image,
    timeout=800,
)
@modal.fastapi_endpoint(
    method="POST"
)
async def api(
    veri: dict,
) -> dict:
    if not isinstance(
        veri,
        dict,
    ):
        return {
            "yorum": "",
            "hata": (
                "İstek gövdesi JSON nesnesi olmalıdır."
            ),
            "surum": MODEL_VERSION,
        }

    llm = VisionFitLLM()

    raw_result = await (
        llm.produce_response.remote.aio(
            json.dumps(
                veri,
                ensure_ascii=False,
            )
        )
    )

    try:
        result = json.loads(
            raw_result
        )

    except json.JSONDecodeError:
        result = {
            "yorum": raw_result,
            "tip": detect_request_type(
                veri
            ),
            "dogrulama": False,
            "deneme_sayisi": 1,
            "uyarilar": [
                "Sunucu sonucu JSON biçiminde çözülemedi."
            ],
        }

    result["surum"] = (
        MODEL_VERSION
    )

    result["kaynak"] = (
        "fine_tune_edilmis_llm"
    )

    return result