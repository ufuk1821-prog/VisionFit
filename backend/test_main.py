import os
os.environ["TESTING"] = "True"

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from main import app
from app.core.database import Base, get_db
from app.api.analyze import get_db as analyze_get_db
from app.core.security import get_current_user
from app.models.user import User
from app.core.security import get_password_hash

SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base.metadata.create_all(bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db
app.dependency_overrides[analyze_get_db] = override_get_db

client = TestClient(app)

def get_token():
    client.post("/api/auth/register", json={
        "ad": "Test", "soyad": "User",
        "email": "token@test.com", "sifre": "sifre123"
    })
    res = client.post("/api/auth/login", json={
        "email": "token@test.com", "sifre": "sifre123"
    })
    return res.json().get("token")

def test_1_sunucu_ayakta_mi():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"status": "VisionFit API Aktif ve Calisiyor!"}

def test_2_kullanici_kaydi():
    response = client.post("/api/auth/register", json={
        "ad": "Ufuk", "soyad": "Test",
        "email": "ufuk@test.com", "sifre": "sifre123"
    })
    assert response.status_code == 201

def test_3_ayni_email_tekrar_kayit_engelle():
    client.post("/api/auth/register", json={
        "ad": "Ufuk", "soyad": "Test",
        "email": "dupli@test.com", "sifre": "sifre123"
    })
    response = client.post("/api/auth/register", json={
        "ad": "Ufuk2", "soyad": "Test2",
        "email": "dupli@test.com", "sifre": "sifre456"
    })
    assert response.status_code == 400

def test_4_eksik_alan_ile_kayit_engelle():
    response = client.post("/api/auth/register", json={
        "ad": "Eksik", "email": "eksik@test.com"
    })
    assert response.status_code == 422

def test_5_dogru_bilgilerle_login():
    client.post("/api/auth/register", json={
        "ad": "Login", "soyad": "Test",
        "email": "login@test.com", "sifre": "sifre123"
    })
    response = client.post("/api/auth/login", json={
        "email": "login@test.com", "sifre": "sifre123"
    })
    assert response.status_code == 200
    assert "token" in response.json()

def test_6_yanlis_sifre_ile_login_engelle():
    client.post("/api/auth/register", json={
        "ad": "Wrong", "soyad": "Pass",
        "email": "wrong@test.com", "sifre": "dogru123"
    })
    response = client.post("/api/auth/login", json={
        "email": "wrong@test.com", "sifre": "yanlis123"
    })
    assert response.status_code == 400

def test_7_olmayan_email_ile_login_engelle():
    response = client.post("/api/auth/login", json={
        "email": "yok@test.com", "sifre": "sifre123"
    })
    assert response.status_code == 400

def test_8_token_ile_haber_listele():
    token = get_token()
    response = client.get("/api/data/news", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_9_token_olmadan_haber_erisimi_engelle():
    response = client.get("/api/data/news")
    assert response.status_code == 401

def test_10_gecersiz_token_engelle():
    response = client.get("/api/data/news", headers={"Authorization": "Bearer yanlis_token"})
    assert response.status_code == 401

def test_11_squat_eksik_landmark_hatasi():
    response = client.post("/api/analyze/squat", json={"landmarks": [0.1] * 10})
    assert response.status_code == 400
    assert response.json()["detail"] == "Eksik landmark verisi gönderildi."

def test_12_squat_basarili_analiz():
    response = client.post("/api/analyze/squat", json={"landmarks": [0.5] * 132})
    assert response.status_code == 200
    data = response.json()
    assert "kayit_id" in data
    assert data["hareket"] == "dogru_squat"
    assert data["mesaj"] == "Veritabanina basariyla kaydedildi!"

def test_13_squat_sonuc_alanlari_tam_mi():
    response = client.post("/api/analyze/squat", json={"landmarks": [0.5] * 132})
    assert response.status_code == 200
    data = response.json()
    assert "aci" in data
    assert "eminlik" in data
    assert "antrenor_mesaji" in data

def test_14_history_listesi_donuyor_mu():
    client.post("/api/analyze/squat", json={"landmarks": [0.5] * 132})
    response = client.get("/api/analyze/history")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1

def test_15_history_alanlari_tam_mi():
    client.post("/api/analyze/squat", json={"landmarks": [0.5] * 132})
    response = client.get("/api/analyze/history")
    assert response.status_code == 200
    kayit = response.json()[0]
    assert "hareket_adi" in kayit
    assert "eminlik_skoru" in kayit
    assert "diz_acisi" in kayit
    assert "antrenor_notu" in kayit