from fastapi.testclient import TestClient
from main import app
import random
import string

client = TestClient(app)

random_str = ''.join(random.choices(string.ascii_lowercase + string.digits, k=6))
test_email = f"test_{random_str}@visionfit.com"
test_password = "superGizliSifre123"

def test_1_sunucu_ayakta_mi():
    response = client.get("/")
    assert response.status_code == 200

def test_2_kisa_sifre_engelle():
    response = client.post("/api/auth/register", json={
        "ad": "Ufuk", "soyad": "Test", "email": "kisa@test.com", "sifre": "123"
    })
    assert response.status_code == 400
    assert response.json()["detail"] == "Sifre en az 6 karakter olmalidir"

def test_3_basarili_kullanici_kaydi():
    response = client.post("/api/auth/register", json={
        "ad": "Ufuk", "soyad": "Test", "email": test_email, "sifre": test_password
    })
    assert response.status_code == 201
    assert "kullanici" in response.json()

def test_4_ayni_email_ile_kayit_engelle():
    response = client.post("/api/auth/register", json={
        "ad": "Kopya", "soyad": "Kullanici", "email": test_email, "sifre": test_password
    })
    assert response.status_code == 400
    assert response.json()["detail"] == "Bu email zaten kayitli"

def test_5_dogru_bilgilerle_giris_yap_ve_token_al():
    response = client.post("/api/auth/login", json={
        "email": test_email, "sifre": test_password
    })
    assert response.status_code == 200
    assert "token" in response.json()

def test_6_hatali_sifre_ile_girisi_engelle():
    response = client.post("/api/auth/login", json={
        "email": test_email, "sifre": "yanlisSifre"
    })
    assert response.status_code == 400
    assert response.json()["detail"] == "Gecersiz email veya sifre"