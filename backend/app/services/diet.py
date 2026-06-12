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

def get_daily_calorie_estimate(kilo_kg: float, bmi_category: str) -> int:
    base = kilo_kg * 24

    if bmi_category == "Zayif":
        base += 400
    elif bmi_category == "Kilolu":
        base -= 300
    elif bmi_category == "Obez":
        base -= 500

    return int(round(base / 50) * 50)

def get_diet_message(bmi_category: str) -> str:
    messages = {
        "Zayif": "Kilo almak icin protein ve kompleks karbonhidrat agirlikli, ogun sayisi artirilmis bir beslenme plani onerilir.",
        "Normal": "Mevcut kilonu korumak icin dengeli ve cesitli bir beslenme programi onerilir.",
        "Kilolu": "Kalori acigi olusturmak icin islenmis gida ve sekerli icecekler azaltilmali, lifli besinler artirilmalidir.",
        "Obez": "Saglikli kilo verme icin kontrollu kalori acigi ve duzenli egzersiz programi onerilir. Bir uzmana danismaniz tavsiye edilir.",
    }
    return messages[bmi_category]

def build_diet_recommendation(boy_cm: float, kilo_kg: float) -> dict:
    bmi = calculate_bmi(boy_cm, kilo_kg)
    category = get_bmi_category(bmi)

    return {
        "bmi": bmi,
        "kategori": category,
        "gunluk_kalori_onerisi": get_daily_calorie_estimate(kilo_kg, category),
        "oneri_mesaji": get_diet_message(category),
    }