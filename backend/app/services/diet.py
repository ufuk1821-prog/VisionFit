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
        "baslik": "Dengeli Beslenme Planı",
        "protein_oran": 0.30,
        "karbonhidrat_oran": 0.40,
        "yag_oran": 0.30,
    },
    {
        "baslik": "Yüksek Proteinli Plan",
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

FOOD_DATABASE = {
    "tavuk_gogsu": {"ad": "Izgara Tavuk Göğsü", "protein": 31, "karbonhidrat": 0, "yag": 3.6},
    "yumurta": {"ad": "Haşlanmış Yumurta", "protein": 13, "karbonhidrat": 1.1, "yag": 11},
    "somon": {"ad": "Fırında Somon", "protein": 20, "karbonhidrat": 0, "yag": 13},
    "kofte": {"ad": "Izgara Köfte", "protein": 26, "karbonhidrat": 0, "yag": 15},
    "mercimek": {"ad": "Mercimek", "protein": 9, "karbonhidrat": 20, "yag": 0.4},
    "nohut": {"ad": "Nohut", "protein": 9, "karbonhidrat": 27, "yag": 2.6},
    "yogurt": {"ad": "Yoğurt", "protein": 3.5, "karbonhidrat": 4.7, "yag": 3.3},
    "lor_peyniri": {"ad": "Lor Peyniri", "protein": 11, "karbonhidrat": 3.4, "yag": 4.3},
    "beyaz_peynir": {"ad": "Beyaz Peynir", "protein": 17, "karbonhidrat": 1, "yag": 21},
    "bulgur": {"ad": "Bulgur Pilavı", "protein": 3.5, "karbonhidrat": 19, "yag": 0.2},
    "pirinc": {"ad": "Pirinç Pilavı", "protein": 2.7, "karbonhidrat": 28, "yag": 0.3},
    "kinoa": {"ad": "Kinoa", "protein": 4.4, "karbonhidrat": 21, "yag": 1.9},
    "tam_tahil_ekmek": {"ad": "Tam Tahıllı Ekmek", "protein": 9, "karbonhidrat": 41, "yag": 3.4},
    "yulaf": {"ad": "Yulaf Ezmesi", "protein": 13, "karbonhidrat": 67, "yag": 7},
}

MEAL_SPLIT = {
    "Kahvalti": 0.25,
    "Ogle": 0.35,
    "Aksam": 0.40,
}

MEAL_LABELS = {
    "Kahvalti": "Kahvaltı",
    "Ogle": "Öğle Yemeği",
    "Aksam": "Akşam Yemeği",
}

MEAL_POOL = {
    "Kahvalti": [
        {"ana": "yumurta", "yan": "tam_tahil_ekmek", "ek": "domates ve salatalık", "anahtarlar": ["yumurta", "ekmek"]},
        {"ana": "yogurt", "yan": "yulaf", "ek": "ceviz ve bal", "anahtarlar": ["yogurt", "sut", "yulaf", "ceviz", "bal"]},
        {"ana": "lor_peyniri", "yan": "tam_tahil_ekmek", "ek": "zeytin ve domates", "anahtarlar": ["peynir", "sut", "ekmek", "zeytin"]},
        {"ana": "yumurta", "yan": "yulaf", "ek": "avokado", "anahtarlar": ["yumurta", "yulaf", "avokado"]},
        {"ana": "beyaz_peynir", "yan": "tam_tahil_ekmek", "ek": "salatalık, domates ve zeytin", "anahtarlar": ["peynir", "sut", "ekmek", "zeytin", "zeytinyagi"]},
    ],
    "Ogle": [
        {"ana": "tavuk_gogsu", "yan": "bulgur", "ek": "yeşil salata (zeytinyağlı)", "anahtarlar": ["tavuk", "et", "bulgur"]},
        {"ana": "mercimek", "yan": "tam_tahil_ekmek", "ek": "yeşil salata", "anahtarlar": ["mercimek", "ekmek"]},
        {"ana": "somon", "yan": "kinoa", "ek": "buharda sebze", "anahtarlar": ["balik", "kinoa"]},
        {"ana": "nohut", "yan": "pirinc", "ek": "yoğurt (1 kase)", "anahtarlar": ["nohut", "pirinc", "yogurt", "sut"]},
        {"ana": "yumurta", "yan": "tam_tahil_ekmek", "ek": "yeşil salata (omlet şeklinde)", "anahtarlar": ["yumurta", "ekmek"]},
    ],
    "Aksam": [
        {"ana": "kofte", "yan": "bulgur", "ek": "yoğurt (1 kase)", "anahtarlar": ["et", "bulgur", "yogurt", "sut"]},
        {"ana": "tavuk_gogsu", "yan": "pirinc", "ek": "sebze garnitür", "anahtarlar": ["tavuk", "et", "pirinc"]},
        {"ana": "mercimek", "yan": "bulgur", "ek": "salata ve ayran", "anahtarlar": ["mercimek", "bulgur", "sut"]},
        {"ana": "somon", "yan": "bulgur", "ek": "sebzeli", "anahtarlar": ["balik", "bulgur"]},
        {"ana": "nohut", "yan": "pirinc", "ek": "sebze yemeği şeklinde", "anahtarlar": ["nohut", "pirinc"]},
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

def round_to_5(value: float) -> int:
    clamped = min(max(value, 30), 400)
    return int(round(clamped / 5) * 5)

def describe_meal(option: Dict, meal_protein_target: float, meal_carb_target: float) -> str:
    ana = FOOD_DATABASE[option["ana"]]
    yan = FOOD_DATABASE[option["yan"]]

    ana_gram = (meal_protein_target / ana["protein"]) * 100 if ana["protein"] > 0 else 100
    yan_gram = (meal_carb_target / yan["karbonhidrat"]) * 100 if yan["karbonhidrat"] > 0 else 100

    ana_gram = round_to_5(ana_gram)
    yan_gram = round_to_5(yan_gram)

    return f"{ana_gram}g {ana['ad']}, {yan_gram}g {yan['ad']}, {option['ek']}"

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

        ornek_ogunler = []

        for meal_type in ("Kahvalti", "Ogle", "Aksam"):
            split = MEAL_SPLIT[meal_type]
            meal_protein_target = protein_g * split
            meal_carb_target = karbonhidrat_g * split

            option = select_meal(MEAL_POOL[meal_type], hard_excluded, soft_excluded, preferred, index)
            aciklama = describe_meal(option, meal_protein_target, meal_carb_target)

            ornek_ogunler.append(f"{MEAL_LABELS[meal_type]}: {aciklama}")

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