import os
from google import genai

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

def generate_custom_diet(hedef_kalori: int, hedef: str, istek: str) -> str:
    prompt = (
        f"Gunluk kalori hedefi {hedef_kalori} kcal olan ve hedefi '{hedef}' olan bir kullanici icin "
        f"Turkce, gunluk bir diyet plani olustur. "
        f"Kullanicinin ozel istegi/kisitlamasi: {istek}. "
        f"Kahvalti, ogle yemegi, aksam yemegi ve gerekiyorsa ara ogun onerilerini liste halinde ver. "
        f"Toplam kalorinin hedefe yakin olmasina dikkat et, kisa ve net yaz."
    )

    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt,
    )

    return response.text