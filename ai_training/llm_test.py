import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

from app.services.local_llm import (
    antrenor_geri_bildirimi_uret,
    diyet_onerisi_uret,
    defter_analizi_uret,
    llm_kullanilabilir_mi,
)

print("LLM kullanilabilir mi:", llm_kullanilabilir_mi())

print("--- ANTRENOR ---")
print(antrenor_geri_bildirimi_uret({
    "Genel Form": 88,
    "Omurga Nötrlüğü": 55,
    "Kalça Derinliği": 92,
    "Diz Hizası": 65,
    "Diz Çöküşü": 97,
    "Ağırlık Merkezi": 78,
}))

print("--- DIYET ---")
print(diyet_onerisi_uret(22.5, "Normal", "kilo_koruma", 2200, 120, 220, 70, "deniz ürünleri sevmiyorum"))

print("--- DEFTER ---")
print(defter_analizi_uret("Bench Press", [40, 42.5, 45, 45, 47.5]))