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
    "tavuk_but": {"ad": "Fırında Tavuk But", "protein": 24, "karbonhidrat": 0, "yag": 11},
    "hindi_gogsu": {"ad": "Izgara Hindi Göğsü", "protein": 29, "karbonhidrat": 0, "yag": 1},
    "kirmizi_et": {"ad": "Izgara Dana Bonfile", "protein": 26, "karbonhidrat": 0, "yag": 17},
    "dana_kiyma": {"ad": "Sote Dana Kıyma", "protein": 25, "karbonhidrat": 0, "yag": 20},
    "kuzu_eti": {"ad": "Izgara Kuzu Eti", "protein": 25, "karbonhidrat": 0, "yag": 21},
    "kofte": {"ad": "Izgara Köfte", "protein": 26, "karbonhidrat": 0, "yag": 15},
    "somon": {"ad": "Fırında Somon", "protein": 20, "karbonhidrat": 0, "yag": 13},
    "levrek": {"ad": "Fırında Levrek", "protein": 18, "karbonhidrat": 0, "yag": 3},
    "cipura": {"ad": "Izgara Çipura", "protein": 18, "karbonhidrat": 0, "yag": 5},
    "ton_balik": {"ad": "Ton Balığı", "protein": 25, "karbonhidrat": 0, "yag": 1},
    "uskumru": {"ad": "Izgara Uskumru", "protein": 19, "karbonhidrat": 0, "yag": 12},
    "karides": {"ad": "Izgara Karides", "protein": 24, "karbonhidrat": 0, "yag": 0.3},
    "yumurta": {"ad": "Haşlanmış Yumurta", "protein": 13, "karbonhidrat": 1.1, "yag": 11},
    "yumurta_beyazi": {"ad": "Yumurta Beyazı (Omlet)", "protein": 11, "karbonhidrat": 0.7, "yag": 0.2},
    "yogurt": {"ad": "Yoğurt", "protein": 3.5, "karbonhidrat": 4.7, "yag": 3.3},
    "suzme_yogurt": {"ad": "Süzme Yoğurt", "protein": 10, "karbonhidrat": 3.6, "yag": 0.4},
    "lor_peyniri": {"ad": "Lor Peyniri", "protein": 11, "karbonhidrat": 3.4, "yag": 4.3},
    "beyaz_peynir": {"ad": "Beyaz Peynir", "protein": 17, "karbonhidrat": 1, "yag": 21},
    "kasar_peyniri": {"ad": "Kaşar Peyniri", "protein": 25, "karbonhidrat": 1.3, "yag": 27},
    "mercimek": {"ad": "Mercimek", "protein": 9, "karbonhidrat": 20, "yag": 0.4},
    "nohut": {"ad": "Nohut", "protein": 9, "karbonhidrat": 27, "yag": 2.6},
    "kuru_fasulye": {"ad": "Kuru Fasulye", "protein": 8, "karbonhidrat": 22, "yag": 0.5},
    "barbunya": {"ad": "Barbunya", "protein": 8, "karbonhidrat": 21, "yag": 0.5},
    "soya_fasulyesi": {"ad": "Soya Fasulyesi", "protein": 17, "karbonhidrat": 11, "yag": 9},
    "tofu": {"ad": "Tofu", "protein": 8, "karbonhidrat": 2, "yag": 4.8},
    "bezelye": {"ad": "Bezelye", "protein": 5, "karbonhidrat": 14, "yag": 0.4},
    "bulgur": {"ad": "Bulgur Pilavı", "protein": 3.5, "karbonhidrat": 19, "yag": 0.2},
    "pirinc": {"ad": "Pirinç Pilavı", "protein": 2.7, "karbonhidrat": 28, "yag": 0.3},
    "esmer_pirinc": {"ad": "Esmer Pirinç Pilavı", "protein": 2.6, "karbonhidrat": 23, "yag": 0.9},
    "kinoa": {"ad": "Kinoa", "protein": 4.4, "karbonhidrat": 21, "yag": 1.9},
    "tam_tahil_ekmek": {"ad": "Tam Tahıllı Ekmek", "protein": 9, "karbonhidrat": 41, "yag": 3.4},
    "beyaz_ekmek": {"ad": "Beyaz Ekmek", "protein": 8, "karbonhidrat": 49, "yag": 3.2},
    "tam_tahil_makarna": {"ad": "Tam Tahıllı Makarna", "protein": 5.3, "karbonhidrat": 27, "yag": 0.9},
    "makarna": {"ad": "Makarna", "protein": 5, "karbonhidrat": 30, "yag": 0.9},
    "yulaf": {"ad": "Yulaf Ezmesi", "protein": 13, "karbonhidrat": 67, "yag": 7},
    "misir": {"ad": "Mısır", "protein": 3.2, "karbonhidrat": 19, "yag": 1.2},
    "patates": {"ad": "Haşlanmış Patates", "protein": 2, "karbonhidrat": 17, "yag": 0.1},
    "tatli_patates": {"ad": "Fırında Tatlı Patates", "protein": 1.6, "karbonhidrat": 20, "yag": 0.1},
    "brokoli": {"ad": "Buharda Brokoli", "protein": 2.8, "karbonhidrat": 7, "yag": 0.4},
    "ispanak": {"ad": "Ispanak", "protein": 2.9, "karbonhidrat": 3.6, "yag": 0.4},
    "karnabahar": {"ad": "Haşlanmış Karnabahar", "protein": 1.9, "karbonhidrat": 5, "yag": 0.3},
    "havuc": {"ad": "Havuç", "protein": 0.9, "karbonhidrat": 10, "yag": 0.2},
    "domates": {"ad": "Domates", "protein": 0.9, "karbonhidrat": 3.9, "yag": 0.2},
    "salatalik": {"ad": "Salatalık", "protein": 0.7, "karbonhidrat": 3.6, "yag": 0.1},
    "biber": {"ad": "Biber", "protein": 1, "karbonhidrat": 6, "yag": 0.3},
    "patlican": {"ad": "Patlıcan", "protein": 1, "karbonhidrat": 6, "yag": 0.2},
    "kabak": {"ad": "Kabak", "protein": 1.2, "karbonhidrat": 3.1, "yag": 0.3},
    "sogan": {"ad": "Soğan", "protein": 1.1, "karbonhidrat": 9.3, "yag": 0.1},
    "mantar": {"ad": "Mantar", "protein": 3.1, "karbonhidrat": 3.3, "yag": 0.3},
    "muz": {"ad": "Muz", "protein": 1.1, "karbonhidrat": 23, "yag": 0.3},
    "elma": {"ad": "Elma", "protein": 0.3, "karbonhidrat": 14, "yag": 0.2},
    "portakal": {"ad": "Portakal", "protein": 0.9, "karbonhidrat": 12, "yag": 0.1},
    "cilek": {"ad": "Çilek", "protein": 0.7, "karbonhidrat": 8, "yag": 0.3},
    "uzum": {"ad": "Üzüm", "protein": 0.6, "karbonhidrat": 18, "yag": 0.2},
    "armut": {"ad": "Armut", "protein": 0.4, "karbonhidrat": 15, "yag": 0.1},
    "kivi": {"ad": "Kivi", "protein": 1.1, "karbonhidrat": 15, "yag": 0.5},
    "avokado": {"ad": "Avokado", "protein": 2, "karbonhidrat": 9, "yag": 15},
    "ceviz": {"ad": "Ceviz", "protein": 15, "karbonhidrat": 14, "yag": 65},
    "findik": {"ad": "Fındık", "protein": 15, "karbonhidrat": 17, "yag": 61},
    "badem": {"ad": "Badem", "protein": 21, "karbonhidrat": 22, "yag": 50},
    "antep_fistigi": {"ad": "Antep Fıstığı", "protein": 20, "karbonhidrat": 28, "yag": 45},
    "chia_tohumu": {"ad": "Chia Tohumu", "protein": 17, "karbonhidrat": 42, "yag": 31},
    "zeytin": {"ad": "Zeytin", "protein": 1, "karbonhidrat": 6, "yag": 15},
    "zeytinyagi": {"ad": "Zeytinyağı", "protein": 0, "karbonhidrat": 0, "yag": 100},
    "tereyagi": {"ad": "Tereyağı", "protein": 0.9, "karbonhidrat": 0.1, "yag": 81},
    "tahin": {"ad": "Tahin", "protein": 17, "karbonhidrat": 21, "yag": 54},
    "bal": {"ad": "Bal", "protein": 0.3, "karbonhidrat": 82, "yag": 0},
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

EK_KCAL_TAHMINI = 60
ANA_YAN_ORANI = 0.5

MEAL_POOL = {
    "Kahvalti": [
        {"ana": "yumurta", "yan": "tam_tahil_ekmek", "ek": "domates ve salatalık", "anahtarlar": ["yumurta", "ekmek"]},
        {"ana": "yogurt", "yan": "yulaf", "ek": "ceviz ve bal", "anahtarlar": ["yogurt", "sut", "yulaf", "ceviz", "bal"]},
        {"ana": "lor_peyniri", "yan": "tam_tahil_ekmek", "ek": "zeytin ve domates", "anahtarlar": ["peynir", "sut", "ekmek", "zeytin"]},
        {"ana": "yumurta", "yan": "yulaf", "ek": "avokado", "anahtarlar": ["yumurta", "yulaf", "avokado"]},
        {"ana": "beyaz_peynir", "yan": "tam_tahil_ekmek", "ek": "salatalık, domates ve zeytin", "anahtarlar": ["peynir", "sut", "ekmek", "zeytin", "zeytinyagi"]},
        {"ana": "kasar_peyniri", "yan": "tam_tahil_ekmek", "ek": "yeşil zeytin ve salatalık", "anahtarlar": ["peynir", "sut", "ekmek", "zeytin"]},
        {"ana": "tofu", "yan": "yulaf", "ek": "muz dilimleri", "anahtarlar": ["tofu", "muz"]},
        {"ana": "lor_peyniri", "yan": "yulaf", "ek": "elma ve tarçın", "anahtarlar": ["peynir", "sut", "yulaf", "elma"]},
        {"ana": "suzme_yogurt", "yan": "yulaf", "ek": "çilek ve chia tohumu", "anahtarlar": ["yogurt", "sut", "yulaf", "cilek", "chia"]},
        {"ana": "yumurta_beyazi", "yan": "tam_tahil_ekmek", "ek": "avokado ve domates", "anahtarlar": ["yumurta", "ekmek", "avokado"]},
    ],
    "Ogle": [
        {"ana": "tavuk_gogsu", "yan": "bulgur", "ek": "yeşil salata (zeytinyağlı)", "anahtarlar": ["tavuk", "et", "bulgur"]},
        {"ana": "mercimek", "yan": "tam_tahil_ekmek", "ek": "yeşil salata", "anahtarlar": ["mercimek", "ekmek"]},
        {"ana": "somon", "yan": "kinoa", "ek": "buharda sebze", "anahtarlar": ["balik", "kinoa"]},
        {"ana": "nohut", "yan": "pirinc", "ek": "yoğurt (1 kase)", "anahtarlar": ["nohut", "pirinc", "yogurt", "sut"]},
        {"ana": "yumurta", "yan": "tam_tahil_ekmek", "ek": "yeşil salata (omlet şeklinde)", "anahtarlar": ["yumurta", "ekmek"]},
        {"ana": "levrek", "yan": "pirinc", "ek": "haşlanmış sebze", "anahtarlar": ["balik", "pirinc"]},
        {"ana": "kirmizi_et", "yan": "bulgur", "ek": "közlenmiş biber", "anahtarlar": ["et", "bulgur"]},
        {"ana": "kuru_fasulye", "yan": "pirinc", "ek": "turşu", "anahtarlar": ["fasulye", "pirinc"]},
        {"ana": "hindi_gogsu", "yan": "esmer_pirinc", "ek": "karnabahar haşlama", "anahtarlar": ["hindi", "pirinc"]},
        {"ana": "barbunya", "yan": "bulgur", "ek": "yeşil salata", "anahtarlar": ["fasulye", "bulgur"]},
    ],
    "Aksam": [
        {"ana": "kofte", "yan": "bulgur", "ek": "yoğurt (1 kase)", "anahtarlar": ["et", "bulgur", "yogurt", "sut"]},
        {"ana": "tavuk_but", "yan": "pirinc", "ek": "sebze garnitür", "anahtarlar": ["tavuk", "et", "pirinc"]},
        {"ana": "mercimek", "yan": "bulgur", "ek": "salata ve ayran", "anahtarlar": ["mercimek", "bulgur", "sut"]},
        {"ana": "somon", "yan": "bulgur", "ek": "sebzeli", "anahtarlar": ["balik", "bulgur"]},
        {"ana": "nohut", "yan": "pirinc", "ek": "sebze yemeği şeklinde", "anahtarlar": ["nohut", "pirinc"]},
        {"ana": "karides", "yan": "tam_tahil_makarna", "ek": "sarımsaklı zeytinyağlı sos", "anahtarlar": ["karides", "makarna"]},
        {"ana": "tofu", "yan": "kinoa", "ek": "sebzeli soya sosu", "anahtarlar": ["tofu", "kinoa"]},
        {"ana": "kirmizi_et", "yan": "tatli_patates", "ek": "közlenmiş sebze", "anahtarlar": ["et", "patates"]},
        {"ana": "cipura", "yan": "kinoa", "ek": "ızgara sebze", "anahtarlar": ["balik", "kinoa"]},
        {"ana": "dana_kiyma", "yan": "tam_tahil_makarna", "ek": "domates sosu ve roka", "anahtarlar": ["et", "makarna"]},
    ],
}

FOOD_KEYWORDS = [
    "yumurta", "et", "tavuk", "balik", "sut", "peynir", "yogurt", "ekmek",
    "seker", "mercimek", "nohut", "pirinc", "makarna", "patates", "domates",
    "salatalik", "biber", "havuc", "muz", "elma", "ceviz", "findik", "badem",
    "zeytin", "zeytinyagi", "tereyagi", "bal", "cikolata", "kahve", "cay",
    "bulgur", "kinoa", "avokado", "yulaf", "tofu", "karides", "fasulye",
    "hindi", "chia", "cilek",
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

def food_kcal_per_100g(food: Dict) -> float:
    return food["protein"] * 4 + food["karbonhidrat"] * 4 + food["yag"] * 9

def round_to_5(value: float) -> int:
    clamped = min(max(value, 30), 400)
    return int(round(clamped / 5) * 5)

MAKUL_PORSIYONLAR = {
    "tavuk_gogsu": (120, 200), "tavuk_but": (120, 200), "hindi_gogsu": (120, 200),
    "kirmizi_et": (100, 180), "dana_kiyma": (100, 180), "kuzu_eti": (100, 150),
    "kofte": (100, 180), "somon": (100, 180), "levrek": (100, 180),
    "cipura": (100, 180), "ton_balik": (80, 150), "uskumru": (100, 180),
    "karides": (100, 180), "yumurta": (50, 150), "yumurta_beyazi": (50, 120),
    "yogurt": (150, 250), "suzme_yogurt": (150, 250), "lor_peyniri": (80, 150),
    "beyaz_peynir": (50, 100), "kasar_peyniri": (30, 60), "mercimek": (150, 250),
    "nohut": (150, 250), "kuru_fasulye": (150, 250), "barbunya": (150, 250),
    "soya_fasulyesi": (100, 200), "tofu": (100, 200), "bezelye": (100, 150),
    "bulgur": (100, 200), "pirinc": (100, 200), "esmer_pirinc": (100, 200),
    "kinoa": (80, 150), "tam_tahil_ekmek": (50, 100), "beyaz_ekmek": (50, 100),
    "tam_tahil_makarna": (80, 150), "makarna": (80, 150), "yulaf": (50, 100),
    "patates": (150, 250), "tatli_patates": (150, 250),
}

def describe_meal(option: Dict, meal_kcal_target: float) -> str:
    ana = FOOD_DATABASE[option["ana"]]
    yan = FOOD_DATABASE[option["yan"]]

    ana_min, ana_maks = MAKUL_PORSIYONLAR.get(option["ana"], (80, 200))
    yan_min, yan_maks = MAKUL_PORSIYONLAR.get(option["yan"], (80, 200))

    usable_kcal = max(meal_kcal_target - EK_KCAL_TAHMINI, 100)
    ana_kcal_target = usable_kcal * ANA_YAN_ORANI
    yan_kcal_target = usable_kcal * (1 - ANA_YAN_ORANI)

    ana_gram = (ana_kcal_target / food_kcal_per_100g(ana)) * 100
    yan_gram = (yan_kcal_target / food_kcal_per_100g(yan)) * 100

    ana_gram = int(round(max(ana_min, min(ana_maks, ana_gram)) / 5) * 5)
    yan_gram = int(round(max(yan_min, min(yan_maks, yan_gram)) / 5) * 5)

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
            meal_kcal_target = target_calories * MEAL_SPLIT[meal_type]

            option = select_meal(MEAL_POOL[meal_type], hard_excluded, soft_excluded, preferred, index)
            aciklama = describe_meal(option, meal_kcal_target)

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