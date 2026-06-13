import os
import re
import pickle
from typing import List, Dict, Set, Optional, Tuple

ACTIVITY_MULTIPLIERS = {
    "sedanter": 1.2,
    "az_hareketli": 1.375,
    "orta_hareketli": 1.55,
    "cok_hareketli": 1.725,
    "asiri_hareketli": 1.9,
}

GOAL_ADJUSTMENTS = {
    "kilo_verme": -500,
    "kilo_koruma": 0,
    "kilo_alma": 500,
}

DIET_TEMPLATES = [
    {
        "baslik": "Dengeli Beslenme Plani",
        "protein_oran": 0.30,
        "karbonhidrat_oran": 0.40,
        "yag_oran": 0.30,
    },
    {
        "baslik": "Yuksek Proteinli Plan",
        "protein_oran": 0.40,
        "karbonhidrat_oran": 0.30,
        "yag_oran": 0.30,
    },
    {
        "baslik": "Akdeniz Tipi Plan",
        "protein_oran": 0.25,
        "karbonhidrat_oran": 0.45,
        "yag_oran": 0.30,
    },
]

MEAL_POOL = {
    "Kahvalti": [
        {"metin": "Yulaf ezmesi, sut ve taze meyve", "anahtarlar": ["yulaf", "sut", "meyve"]},
        {"metin": "Haslanmis yumurta, beyaz peynir, tam tahilli ekmek", "anahtarlar": ["yumurta", "peynir", "ekmek", "sut"]},
        {"metin": "Yogurt, ceviz ve bal", "anahtarlar": ["yogurt", "sut", "ceviz", "bal"]},
        {"metin": "Avokadolu tam tahilli tost, domates", "anahtarlar": ["ekmek", "avokado"]},
        {"metin": "Domates, salatalik, zeytin ve zeytinyagi", "anahtarlar": ["zeytin", "zeytinyagi"]},
    ],
    "Ogle": [
        {"metin": "Izgara tavuk gogsu, bulgur pilavi, salata", "anahtarlar": ["tavuk", "et", "bulgur"]},
        {"metin": "Mercimek corbasi, tam tahilli ekmek, salata", "anahtarlar": ["mercimek", "ekmek"]},
        {"metin": "Firinda somon, kinoa, sebze", "anahtarlar": ["balik", "kinoa"]},
        {"metin": "Nohut yemegi, pirinc pilavi, yogurt", "anahtarlar": ["nohut", "pirinc", "yogurt", "sut"]},
        {"metin": "Sebzeli omlet, salata", "anahtarlar": ["yumurta"]},
    ],
    "Aksam": [
        {"metin": "Izgara kofte, bulgur pilavi, yogurt", "anahtarlar": ["et", "bulgur", "yogurt", "sut"]},
        {"metin": "Firinda tavuk but, sebze garnitur", "anahtarlar": ["tavuk", "et"]},
        {"metin": "Mercimek koftesi, salata, ayran", "anahtarlar": ["mercimek", "sut"]},
        {"metin": "Izgara balik, sebzeli bulgur", "anahtarlar": ["balik", "bulgur"]},
        {"metin": "Sebze yemegi, pirinc pilavi", "anahtarlar": ["pirinc"]},
    ],
}

FOOD_KEYWORDS = [
    "yumurta", "et", "tavuk", "balik", "sut", "peynir", "yogurt", "ekmek",
    "seker", "mercimek", "nohut", "pirinc", "makarna", "patates", "domates",
    "salatalik", "biber", "havuc", "muz", "elma", "ceviz", "findik", "badem",
    "zeytin", "zeytinyagi", "tereyagi", "bal", "cikolata", "kahve", "cay",
    "bulgur", "kinoa", "avokado", "yulaf",
]

TR_MAP = str.maketrans("çğıöşü", "cgiosu")

def normalize(text: str) -> str:
    return text.lower().translate(TR_MAP)

def _load_preference_model():
    current_dir = os.path.dirname(os.path.abspath(__file__))
    model_path = os.path.join(current_dir, "diet_preference_model.pkl")

    if os.path.exists(model_path):
        with open(model_path, "rb") as f:
            return pickle.load(f)

    return None

PREFERENCE_MODEL = _load_preference_model()

def extract_preferences(istek: Optional[str]) -> Tuple[Set[str], Set[str], Set[str]]:
    if not istek:
        return set(), set(), set()

    text = normalize(istek)
    clauses = re.split(r"ama|fakat|ancak", text)

    hard_excluded = set()
    soft_excluded = set()
    preferred = set()

    for clause in clauses:
        for food in FOOD_KEYWORDS:
            if food not in clause:
                continue

            if PREFERENCE_MODEL is not None:
                prediction = PREFERENCE_MODEL.predict([clause])[0]
            else:
                prediction = 1

            if prediction == 0:
                hard_excluded.add(food)
            elif prediction == 1:
                soft_excluded.add(food)
            else:
                preferred.add(food)

    return hard_excluded, soft_excluded, preferred

def select_meal(options: List[Dict], hard_excluded: Set[str], soft_excluded: Set[str], preferred: Set[str], offset: int) -> Dict:
    candidates = [o for o in options if not any(k in hard_excluded for k in o["anahtarlar"])]

    if not candidates:
        candidates = options

    preferred_candidates = [o for o in candidates if any(k in preferred for k in o["anahtarlar"])]
    soft_safe = [o for o in candidates if not any(k in soft_excluded for k in o["anahtarlar"])]
    preferred_soft_safe = [o for o in preferred_candidates if not any(k in soft_excluded for k in o["anahtarlar"])]

    for pool in (preferred_soft_safe, preferred_candidates, soft_safe, candidates):
        if pool:
            return pool[offset % len(pool)]

    return options[0]

def calculate_bmi(boy_cm: float, kilo_kg: float) -> float:
    boy_m = boy_cm / 100
    return round(kilo_kg / (boy_m ** 2), 1)

def get_bmi_category(bmi: float) -> str:
    if bmi < 18.5:
        return "Zayif"
    if bmi < 25:
        return "Normal"
    if bmi < 30:
        return "Kilolu"
    return "Obez"

def calculate_bmr(boy_cm: float, kilo_kg: float, yas: int, cinsiyet: str) -> float:
    base = 10 * kilo_kg + 6.25 * boy_cm - 5 * yas
    return base + 5 if cinsiyet == "Erkek" else base - 161

def calculate_tdee(bmr: float, aktiflik_seviyesi: str) -> float:
    return bmr * ACTIVITY_MULTIPLIERS[aktiflik_seviyesi]

def calculate_target_calories(tdee: float, hedef: str) -> int:
    target = tdee + GOAL_ADJUSTMENTS[hedef]
    return int(round(max(target, 1200) / 50) * 50)

def build_diet_plans(target_calories: int, istek: Optional[str] = None) -> List[Dict]:
    hard_excluded, soft_excluded, preferred = extract_preferences(istek)
    plans = []

    for index, template in enumerate(DIET_TEMPLATES):
        protein_g = round((target_calories * template["protein_oran"]) / 4)
        karbonhidrat_g = round((target_calories * template["karbonhidrat_oran"]) / 4)
        yag_g = round((target_calories * template["yag_oran"]) / 9)

        kahvalti = select_meal(MEAL_POOL["Kahvalti"], hard_excluded, soft_excluded, preferred, index)
        ogle = select_meal(MEAL_POOL["Ogle"], hard_excluded, soft_excluded, preferred, index)
        aksam = select_meal(MEAL_POOL["Aksam"], hard_excluded, soft_excluded, preferred, index)

        ornek_ogunler = [
            f"Kahvalti: {kahvalti['metin']}",
            f"Ogle: {ogle['metin']}",
            f"Aksam: {aksam['metin']}",
        ]

        plans.append({
            "baslik": template["baslik"],
            "kalori": target_calories,
            "protein_g": protein_g,
            "karbonhidrat_g": karbonhidrat_g,
            "yag_g": yag_g,
            "ornek_ogunler": ornek_ogunler,
        })

    return plans

def build_diet_recommendation(boy_cm: float, kilo_kg: float, yas: int, cinsiyet: str, aktiflik_seviyesi: str, hedef: str, istek: Optional[str] = None) -> dict:
    bmi = calculate_bmi(boy_cm, kilo_kg)
    bmr = calculate_bmr(boy_cm, kilo_kg, yas, cinsiyet)
    tdee = calculate_tdee(bmr, aktiflik_seviyesi)
    target_calories = calculate_target_calories(tdee, hedef)

    return {
        "bmi": bmi,
        "bmi_kategori": get_bmi_category(bmi),
        "bmr": round(bmr),
        "tdee": round(tdee),
        "hedef_kalori": target_calories,
        "hedef": hedef,
        "planlar": build_diet_plans(target_calories, istek),
    }