import requests

TABAN_URL = "http://localhost:8000"

giris_yaniti = requests.post(f"{TABAN_URL}/api/auth/login", json={
    "email": "llmtest@test.com",
    "sifre": "Test1234!",
})
print("Giris durumu:", giris_yaniti.status_code)

token = giris_yaniti.json()["token"]
basliklar = {"Authorization": f"Bearer {token}"}

print("--- ANTRENOR ---")
yanit = requests.post(f"{TABAN_URL}/api/yerel-ai/antrenor-yorumu", json={
    "skorlar": {
        "Genel Form": 88,
        "Omurga Nötrlüğü": 55,
        "Kalça Derinliği": 92,
        "Diz Hizası": 65,
        "Diz Çöküşü": 97,
        "Ağırlık Merkezi": 78,
    }
}, headers=basliklar)
print(yanit.status_code, yanit.json())

print("--- DIYET ---")
yanit = requests.post(f"{TABAN_URL}/api/yerel-ai/diyet-onerisi", json={
    "bmi": 22.5,
    "bmi_kategori": "Normal",
    "hedef": "kilo_koruma",
    "hedef_kalori": 2200,
    "protein_g": 120,
    "karbonhidrat_g": 220,
    "yag_g": 70,
    "istek": "deniz ürünleri sevmiyorum",
}, headers=basliklar)
print(yanit.status_code, yanit.json())

print("--- DEFTER ---")
yanit = requests.post(f"{TABAN_URL}/api/yerel-ai/defter-analizi", json={
    "hareket": "Bench Press",
    "agirliklar": [40, 42.5, 45, 45, 47.5],
}, headers=basliklar)
print(yanit.status_code, yanit.json())
print("--- GECMIS ---")
yanit = requests.post(f"{TABAN_URL}/api/yerel-ai/gecmis-analizi?sayi=5", json={}, headers=basliklar)
print(yanit.status_code, yanit.json())