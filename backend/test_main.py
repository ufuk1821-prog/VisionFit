import pytest
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

def test_2_basarili_kullanici_kaydi():
    response = client.post("/api/auth/register", json={
        "ad": "Ufuk", 
        "soyad": "Test", 
        "email": test_email, 
        "sifre": test_password
    })
    assert response.status_code == 201

def test_3_ayni_email_ile_kayit_engelle():
    response = client.post("/api/auth/register", json={
        "ad": "Kopya", 
        "soyad": "Kullanici", 
        "email": test_email, 
        "sifre": test_password
    })
    assert response.status_code == 400

def test_4_dogru_bilgilerle_giris_yap_ve_token_al():
    response = client.post("/api/auth/login", json={
        "email": test_email, 
        "sifre": test_password
    })
    assert response.status_code == 200
    assert "token" in response.json()

def test_5_hatali_sifre_ile_girisi_engelle():
    response = client.post("/api/auth/login", json={
        "email": test_email, 
        "sifre": "yanlisSifre"
    })
    assert response.status_code == 400

def test_6_token_ile_korumali_alan_erisi():
    login_res = client.post("/api/auth/login", json={
        "email": test_email, "sifre": test_password
    })
    token = login_res.json()["token"]
    headers = {"Authorization": f"Bearer {token}"}
    response = client.get("/api/data/news", headers=headers)
    assert response.status_code == 200

def test_7_gecersiz_token_hatasi():
    headers = {"Authorization": "Bearer yanlis_token_123"}
    response = client.get("/api/data/news", headers=headers)
    assert response.status_code == 401

def test_8_gecmis_verisi_bulunamadi_404():
    login_res = client.post("/api/auth/login", json={
        "email": test_email, "sifre": test_password
    })
    token = login_res.json()["token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    response = client.get("/api/data/history/99999", headers=headers)
    assert response.status_code == 404