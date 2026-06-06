import os
os.environ["TESTING"] = "True"

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from main import app
from app.core.database import Base, get_db
from app.api.analyze import get_db as analyze_get_db

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

def get_token(email="token@test.com", sifre="sifre123"):
    client.post("/api/auth/register", json={
        "ad": "Test", "soyad": "User",
        "email": email, "sifre": sifre
    })
    res = client.post("/api/auth/login", json={"email": email, "sifre": sifre})
    return res.json().get("token")

# --- GENEL ---
def test_1_sunucu_ayakta_mi():
    response = client.get("/")
    assert response.status_code == 200

# --- AUTH ---
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

# --- HABERLER ---
def test_8_token_ile_haber_listele():
    token = get_token("haber@test.com")
    response = client.get("/api/data/news", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_9_token_olmadan_haber_erisimi_engelle():
    response = client.get("/api/data/news")
    assert response.status_code == 401

def test_10_gecersiz_token_engelle():
    response = client.get("/api/data/news", headers={"Authorization": "Bearer yanlis_token"})
    assert response.status_code == 401

def test_11_haber_history_token_gerekli():
    response = client.get("/api/data/history/1")
    assert response.status_code == 401

def test_12_haber_history_bulunamadi():
    token = get_token("history@test.com")
    response = client.get("/api/data/history/99999", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 404

# --- ANALİZ ---
def test_13_squat_eksik_landmark_hatasi():
    token = get_token("squat1@test.com")
    response = client.post("/api/analyze/squat",
        json={"landmarks": [0.1] * 10},
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 400

def test_14_squat_token_olmadan_engelle():
    response = client.post("/api/analyze/squat", json={"landmarks": [0.5] * 132})
    assert response.status_code == 401

def test_15_squat_basarili_analiz():
    token = get_token("squat2@test.com")
    response = client.post("/api/analyze/squat",
        json={"landmarks": [0.5] * 132},
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "kayit_id" in data
    assert data["hareket"] == "dogru_squat"
    assert data["mesaj"] == "Veritabanina basariyla kaydedildi!"

def test_16_squat_sonuc_alanlari_tam_mi():
    token = get_token("squat3@test.com")
    response = client.post("/api/analyze/squat",
        json={"landmarks": [0.5] * 132},
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "aci" in data
    assert "eminlik" in data
    assert "antrenor_mesaji" in data

def test_17_history_sadece_kendi_verisi():
    token = get_token("hist1@test.com")
    client.post("/api/analyze/squat",
        json={"landmarks": [0.5] * 132},
        headers={"Authorization": f"Bearer {token}"}
    )
    response = client.get("/api/analyze/history", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1

def test_18_history_token_olmadan_engelle():
    response = client.get("/api/analyze/history")
    assert response.status_code == 401

def test_19_history_alanlari_tam_mi():
    token = get_token("hist2@test.com")
    client.post("/api/analyze/squat",
        json={"landmarks": [0.5] * 132},
        headers={"Authorization": f"Bearer {token}"}
    )
    response = client.get("/api/analyze/history", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    kayit = response.json()[0]
    assert "hareket_adi" in kayit
    assert "eminlik_skoru" in kayit
    assert "diz_acisi" in kayit
    assert "antrenor_notu" in kayit