import time
import requests

TABAN_URL = "https://visionfit-backend-docker.onrender.com"


def istek_sure_olc(yontem, yol, **kwargs):
    baslangic = time.time()
    yanit = requests.request(yontem, f"{TABAN_URL}{yol}", **kwargs)
    sure = time.time() - baslangic
    return yanit, sure


print("--- SOGUK BASLANGIC (ilk istek) ---")
yanit, sure = istek_sure_olc("GET", "/")
print(f"Durum: {yanit.status_code}, Sure: {sure:.2f} sn")

print("\n--- ISINMIS DURUM (10 ardisik istek) ---")
sureler = []
for _ in range(10):
    yanit, sure = istek_sure_olc("GET", "/")
    sureler.append(sure)
print(f"Ortalama: {sum(sureler) / len(sureler):.3f} sn")
print(f"En hizli: {min(sureler):.3f} sn")
print(f"En yavas: {max(sureler):.3f} sn")

print("\n--- KULLANICI KAYDI ENDPOINT'I ---")
eposta = f"perf_test_{int(time.time())}@test.com"
yanit, sure = istek_sure_olc("POST", "/api/auth/register", json={
    "ad": "Performans",
    "soyad": "Test",
    "email": eposta,
    "sifre": "PerfTest123!",
})
print(f"Durum: {yanit.status_code}, Sure: {sure:.3f} sn")

print("\n--- BESIN LISTESI ENDPOINT'I (genel) ---")
yanit, sure = istek_sure_olc("GET", "/docs")
print(f"Durum: {yanit.status_code}, Sure: {sure:.3f} sn")