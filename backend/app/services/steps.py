ACTIVITY_PROFILES = {
    "yuruyus": {"met": 3.5, "adim_dk": 100, "etiket": "Yuruyus"},
    "tempolu_yuruyus": {"met": 4.3, "adim_dk": 120, "etiket": "Tempolu Yuruyus"},
    "kosu": {"met": 7.0, "adim_dk": 150, "etiket": "Kosu"},
    "tempolu_kosu": {"met": 9.8, "adim_dk": 170, "etiket": "Tempolu Kosu"},
}

def calculate_calories_burned(adim_sayisi: int, aktivite_tipi: str, kilo_kg: float) -> float:
    profile = ACTIVITY_PROFILES[aktivite_tipi]
    sure_dakika = adim_sayisi / profile["adim_dk"]
    kalori = profile["met"] * kilo_kg * (sure_dakika / 60)
    return round(kalori, 1)