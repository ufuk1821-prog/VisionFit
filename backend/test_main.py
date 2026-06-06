import os
os.environ["TESTING"] = "True"

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.core.database import Base
from app.api.analyze import get_db

# CI ortaminda ana DB'yi kirletmemek icin gecici SQLite kullanilacak
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

client = TestClient(app)

def test_read_root():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"status": "VisionFit API Aktif ve Calisiyor!"}

def test_analyze_squat_missing_landmarks():
    payload = {
        "landmarks": [0.1, 0.2, 0.3, 0.4] 
    }
    response = client.post("/api/analyze/squat", json=payload)
    assert response.status_code == 400
    assert response.json() == {"detail": "Eksik landmark verisi gönderildi."}

def test_analyze_squat_success():
    valid_landmarks = [0.5] * 132
    payload = {
        "landmarks": valid_landmarks
    }
    response = client.post("/api/analyze/squat", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "kayit_id" in data
    assert data["hareket"] == "dogru_squat"
    assert data["mesaj"] == "Veritabanina basariyla kaydedildi!"

def test_get_history():
    valid_landmarks = [0.5] * 132
    client.post("/api/analyze/squat", json={"landmarks": valid_landmarks})
    
    response = client.get("/api/analyze/history")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1
    assert data[0]["hareket_adi"] == "dogru_squat"
    assert "eminlik_skoru" in data[0]
    assert "diz_acisi" in data[0]