from app.services import local_llm
import os
os.environ["TESTING"] = "True"

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from main import app
from app.core.database import Base, get_db
from app.api.analyze import get_db as analyze_get_db
from app.models.user import User
from unittest.mock import patch

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

def get_token(email="token@test.com", sifre="Sifre123!"):
    client.post("/api/auth/register", json={
        "ad": "Test", "soyad": "User",
        "email": email, "sifre": sifre
    })
    res = client.post("/api/auth/login", json={"email": email, "sifre": sifre})
    return res.json().get("token")

def test_1_sunucu_ayakta_mi():
    response = client.get("/")
    assert response.status_code == 200

def test_2_kullanici_kaydi():
    response = client.post("/api/auth/register", json={
        "ad": "Ufuk", "soyad": "Test",
        "email": "ufuk@test.com", "sifre": "Sifre123!"
    })
    assert response.status_code == 201

def test_3_ayni_email_tekrar_kayit_engelle():
    client.post("/api/auth/register", json={
        "ad": "Ufuk", "soyad": "Test",
        "email": "dupli@test.com", "sifre": "Sifre123!"
    })
    response = client.post("/api/auth/register", json={
        "ad": "Ufuk2", "soyad": "Test2",
        "email": "dupli@test.com", "sifre": "Sifre456!"
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
        "email": "login@test.com", "sifre": "Sifre123!"
    })
    response = client.post("/api/auth/login", json={
        "email": "login@test.com", "sifre": "Sifre123!"
    })
    assert response.status_code == 200
    assert "token" in response.json()

def test_6_yanlis_sifre_ile_login_engelle():
    client.post("/api/auth/register", json={
        "ad": "Wrong", "soyad": "Pass",
        "email": "wrong@test.com", "sifre": "Dogru123!"
    })
    response = client.post("/api/auth/login", json={
        "email": "wrong@test.com", "sifre": "Yanlis123!"
    })
    assert response.status_code == 400

def test_7_olmayan_email_ile_login_engelle():
    response = client.post("/api/auth/login", json={
        "email": "yok@test.com", "sifre": "Sifre123!"
    })
    assert response.status_code == 400

def test_8_token_ile_rozet_listele():
    token = get_token("rozet@test.com")
    response = client.get("/api/badges", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_9_token_olmadan_rozet_erisimi_engelle():
    response = client.get("/api/badges")
    assert response.status_code == 401

def test_10_gecersiz_token_engelle():
    response = client.get("/api/badges", headers={"Authorization": "Bearer yanlis_token"})
    assert response.status_code == 401

def test_11_squat_eksik_landmark_hatasi():
    token = get_token("squat1@test.com")
    response = client.post("/api/analyze/squat",
        json={"landmarks": [0.1] * 10},
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 400

def test_12_squat_token_olmadan_engelle():
    response = client.post("/api/analyze/squat", json={"landmarks": [0.5] * 132})
    assert response.status_code == 401

def test_13_squat_basarili_analiz():
    token = get_token("squat2@test.com")
    response = client.post("/api/analyze/squat",
        json={"landmarks": [0.5] * 132},
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "kayit_id" in data
    assert data["hareket"] == "dogru_squat"
    assert data["mesaj"] == "Veritabanına başarıyla kaydedildi!"

def test_14_squat_sonuc_alanlari_tam_mi():
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

def test_15_history_sadece_kendi_verisi():
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

def test_16_history_token_olmadan_engelle():
    response = client.get("/api/analyze/history")
    assert response.status_code == 401

def test_17_history_alanlari_tam_mi():
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

# --- DİYET ---
def test_18_diet_calculate_basarili():
    token = get_token("diet1@test.com")
    response = client.post("/api/users/diet/calculate", json={
        "boy": 180, "kilo": 80, "yas": 25, "cinsiyet": "Erkek",
        "aktiflik_seviyesi": "orta_hareketli", "hedef": "kilo_verme"
    }, headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    data = response.json()
    assert data["bmi"] > 0
    assert data["bmr"] > 0
    assert data["tdee"] > data["bmr"]
    assert len(data["planlar"]) > 0

def test_19_diet_calculate_kadin_ve_istek():
    token = get_token("diet2@test.com")
    response = client.post("/api/users/diet/calculate", json={
        "boy": 165, "kilo": 60, "yas": 30, "cinsiyet": "Kadin",
        "aktiflik_seviyesi": "az_hareketli", "hedef": "kilo_alma",
        "istek": "tavuk severim ama yumurtaya alerjim var"
    }, headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    data = response.json()
    assert data["hedef"] == "kilo_alma"

def test_20_diet_calculate_gecersiz_deger():
    token = get_token("diet3@test.com")
    response = client.post("/api/users/diet/calculate", json={
        "boy": 0, "kilo": 80, "yas": 25, "cinsiyet": "Erkek",
        "aktiflik_seviyesi": "sedanter", "hedef": "kilo_koruma"
    }, headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 400

# --- BESLENME ---
def test_21_besin_listesi():
    token = get_token("nutrition1@test.com")
    response = client.get("/api/nutrition/foods", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    assert len(response.json()) > 0

def test_22_ogun_ekle_getir_sil():
    token = get_token("nutrition2@test.com")
    headers = {"Authorization": f"Bearer {token}"}
    foods = client.get("/api/nutrition/foods", headers=headers).json()
    besin_anahtari = foods[0]["anahtar"]

    response = client.post("/api/nutrition/meals", json={
        "ogun_tipi": "kahvalti", "besin_anahtari": besin_anahtari, "gram": 100
    }, headers=headers)
    assert response.status_code == 201
    meal_id = response.json()["id"]

    response = client.get("/api/nutrition/meals/today", headers=headers)
    assert response.status_code == 200
    assert any(m["id"] == meal_id for m in response.json())

    response = client.delete(f"/api/nutrition/meals/{meal_id}", headers=headers)
    assert response.status_code == 204

def test_23_ogun_gecersiz_tip_ve_besin():
    token = get_token("nutrition3@test.com")
    headers = {"Authorization": f"Bearer {token}"}
    response = client.post("/api/nutrition/meals", json={
        "ogun_tipi": "gecersiz", "besin_anahtari": "yumurta", "gram": 100
    }, headers=headers)
    assert response.status_code == 400

    response = client.post("/api/nutrition/meals", json={
        "ogun_tipi": "kahvalti", "besin_anahtari": "olmayan_besin", "gram": 100
    }, headers=headers)
    assert response.status_code == 400

    foods = client.get("/api/nutrition/foods", headers=headers).json()
    response = client.post("/api/nutrition/meals", json={
        "ogun_tipi": "kahvalti", "besin_anahtari": foods[0]["anahtar"], "gram": 0
    }, headers=headers)
    assert response.status_code == 400

def test_24_su_ekle_getir_sil():
    token = get_token("nutrition4@test.com")
    headers = {"Authorization": f"Bearer {token}"}

    response = client.post("/api/nutrition/water", json={"miktar_ml": 250}, headers=headers)
    assert response.status_code == 201
    water_id = response.json()["id"]

    response = client.get("/api/nutrition/water/today", headers=headers)
    assert response.status_code == 200
    assert any(w["id"] == water_id for w in response.json())

    response = client.delete(f"/api/nutrition/water/{water_id}", headers=headers)
    assert response.status_code == 204

def test_25_su_negatif_miktar():
    token = get_token("nutrition5@test.com")
    response = client.post("/api/nutrition/water", json={"miktar_ml": 0},
        headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 400

def test_26_olmayan_kayit_silme_404():
    token = get_token("nutrition6@test.com")
    headers = {"Authorization": f"Bearer {token}"}
    assert client.delete("/api/nutrition/meals/999999", headers=headers).status_code == 404
    assert client.delete("/api/nutrition/water/999999", headers=headers).status_code == 404

# --- PROFİL ---
def test_27_profil_getir_ve_guncelle():
    token = get_token("profil1@test.com")
    headers = {"Authorization": f"Bearer {token}"}

    response = client.get("/api/users/me", headers=headers)
    assert response.status_code == 200
    assert response.json()["email"] == "profil1@test.com"

    response = client.put("/api/users/me", json={
        "boy": 178, "kilo": 75, "yas": 28, "cinsiyet": "Erkek",
        "aktiflik_seviyesi": "orta_hareketli", "hedef": "kilo_koruma"
    }, headers=headers)
    assert response.status_code == 200
    assert response.json()["boy"] == 178

def test_28_diet_me_basarili_ve_eksik_bilgi():
    eksik_token = get_token("profil2@test.com")
    response = client.get("/api/users/me/diet", headers={"Authorization": f"Bearer {eksik_token}"})
    assert response.status_code == 400

    tam_token = get_token("profil3@test.com")
    headers = {"Authorization": f"Bearer {tam_token}"}
    client.put("/api/users/me", json={
        "boy": 170, "kilo": 65, "yas": 22, "cinsiyet": "Kadin",
        "aktiflik_seviyesi": "cok_hareketli", "hedef": "kilo_verme"
    }, headers=headers)

    response = client.get("/api/users/me/diet", headers=headers)
    assert response.status_code == 200

    response = client.post("/api/users/me/diet/custom", json={"istek": "et severim"}, headers=headers)
    assert response.status_code == 200

def test_29_sifre_degistir():
    token = get_token("profil4@test.com", "EskiSifre123!")
    headers = {"Authorization": f"Bearer {token}"}

    response = client.put("/api/users/me/password", json={
        "mevcut_sifre": "yanlissifre", "yeni_sifre": "yenisifre123"
    }, headers=headers)
    assert response.status_code == 400

    response = client.put("/api/users/me/password", json={
        "mevcut_sifre": "EskiSifre123!", "yeni_sifre": "kisa"
    }, headers=headers)
    assert response.status_code == 400

    response = client.put("/api/users/me/password", json={
        "mevcut_sifre": "EskiSifre123!", "yeni_sifre": "YeniSifre123!"
    }, headers=headers)
    assert response.status_code == 200

def test_30_hesap_sil():
    token = get_token("profil5@test.com")
    response = client.delete("/api/users/me", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 204

# --- ANTRENMAN DEFTERİ ---
def test_31_antrenman_notu_kaydet_ve_getir():
    token = get_token("defter1@test.com")
    headers = {"Authorization": f"Bearer {token}"}
    tarih = "2026-01-15"

    response = client.put(f"/api/workout-notes/{tarih}", json=[
        {"hareket": "Bench Press", "set_sayisi": 3, "tekrar_sayisi": 10, "agirlik": 40}
    ], headers=headers)
    assert response.status_code == 200
    assert response.json()[0]["hareket"] == "Bench Press"

    response = client.get(f"/api/workout-notes/{tarih}", headers=headers)
    assert response.status_code == 200
    assert len(response.json()) == 1

    response = client.get("/api/workout-notes/dates", headers=headers)
    assert response.status_code == 200
    assert tarih in response.json()

def test_32_adim_kaydet_ve_getir():
    token = get_token("adim1@test.com")
    headers = {"Authorization": f"Bearer {token}"}

    response = client.post("/api/steps", json={"adim_sayisi": 1000, "aktivite_tipi": "yuruyus"}, headers=headers)
    assert response.status_code == 400

    client.put("/api/users/me", json={"kilo": 70}, headers=headers)

    response = client.post("/api/steps", json={"adim_sayisi": 1000, "aktivite_tipi": "gecersiz"}, headers=headers)
    assert response.status_code == 400

    response = client.post("/api/steps", json={"adim_sayisi": 1000, "aktivite_tipi": "yuruyus"}, headers=headers)
    assert response.status_code == 201
    assert response.json()["yakilan_kalori"] > 0

    response = client.get("/api/steps", headers=headers)
    assert response.status_code == 200
    assert len(response.json()) >= 1

# --- E-POSTA DOĞRULAMA ---
def test_33_email_dogrulama_gecersiz_token():
    response = client.get("/api/auth/verify-email/gecersiz_token")
    assert response.status_code == 400

def test_34_email_dogrulama_basarili():
    token = get_token("verify1@test.com")
    db = TestingSessionLocal()
    user = db.query(User).filter(User.email == "verify1@test.com").first()
    user.email_dogrulandi = False
    user.dogrulama_token = "test_dogrulama_token_123"
    db.commit()
    db.close()

    response = client.get("/api/auth/verify-email/test_dogrulama_token_123")
    assert response.status_code == 200

def test_35_resend_verification():
    get_token("resend1@test.com")
    db = TestingSessionLocal()
    user = db.query(User).filter(User.email == "resend1@test.com").first()
    user.email_dogrulandi = False
    db.commit()
    db.close()

    response = client.post("/api/auth/resend-verification", json={"email": "resend1@test.com"})
    assert response.status_code == 200

    response = client.post("/api/auth/resend-verification", json={"email": "olmayan@test.com"})
    assert response.status_code == 200

def test_36_gecersiz_kullanici_ile_token_engelle():
    from app.core.security import create_access_token
    sahte_token = create_access_token(data={"sub": "olmayan_kullanici@test.com"})
    response = client.get("/api/users/me", headers={"Authorization": f"Bearer {sahte_token}"})
    assert response.status_code == 401

# --- OTURUM ANALİZİ ---
def build_squat_frame():
    frame = [0.0] * 132
    points = {
        11: (0.45, 0.2), 12: (0.55, 0.2),
        23: (0.45, 0.5), 24: (0.55, 0.5),
        25: (0.35, 0.7), 26: (0.65, 0.7),
        27: (0.45, 0.9), 28: (0.55, 0.9),
    }
    for idx, (x, y) in points.items():
        base = idx * 4
        frame[base] = x
        frame[base + 1] = y
        frame[base + 2] = 0.0
        frame[base + 3] = 0.9
    return frame

def test_37_session_basarili_analiz():
    token = get_token("session1@test.com")
    response = client.post("/api/analyze/session", json={
        "frames": [build_squat_frame() for _ in range(5)]
    }, headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    data = response.json()
    assert data["toplam_kare"] == 5
    assert data["squat_kare"] == 5
    assert 0 <= data["genel_skor"] <= 100
    assert "olumlu_mesaj" in data
    assert "gelistirilecek_mesaj" in data

def test_38_session_bos_kare():
    token = get_token("session2@test.com")
    response = client.post("/api/analyze/session", json={"frames": []},
        headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 400

def test_39_session_gecersiz_vucut_verisi():
    token = get_token("session3@test.com")
    response = client.post("/api/analyze/session", json={"frames": [[0.0] * 132]},
        headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 400

def test_40_session_squat_tespit_edilemedi():
    token = get_token("session4@test.com")
    duz_frame = [0.0] * 132
    points = {
        11: (0.45, 0.2), 12: (0.55, 0.2),
        23: (0.45, 0.5), 24: (0.55, 0.5),
        25: (0.45, 0.7), 26: (0.55, 0.7),
        27: (0.45, 0.9), 28: (0.55, 0.9),
    }
    for idx, (x, y) in points.items():
        base = idx * 4
        duz_frame[base] = x
        duz_frame[base + 1] = y
        duz_frame[base + 2] = 0.0
        duz_frame[base + 3] = 0.9

    response = client.post("/api/analyze/session", json={"frames": [duz_frame]},
        headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 400

# --- ŞİFRE GÜVENLİĞİ ---
def test_41_zayif_sifre_ile_kayit_engelle():
    response = client.post("/api/auth/register", json={
        "ad": "Zayif", "soyad": "Sifre", "email": "zayif1@test.com", "sifre": "kisa1!"
    })
    assert response.status_code == 422

    response = client.post("/api/auth/register", json={
        "ad": "Zayif", "soyad": "Sifre", "email": "zayif2@test.com", "sifre": "uzunsifre1"
    })
    assert response.status_code == 422

    response = client.post("/api/auth/register", json={
        "ad": "Zayif", "soyad": "Sifre", "email": "zayif3@test.com", "sifre": "UzunSifre1"
    })
    assert response.status_code == 422

    response = client.post("/api/auth/register", json={
        "ad": "Guclu", "soyad": "Sifre", "email": "guclu1@test.com", "sifre": "GucluSifre1!"
    })
    assert response.status_code == 201

    # --- YEREL AI ---
def test_42_yerel_ai_endpoint_calisıyor():
    token = get_token("yerelai@test.com")
    headers = {"Authorization": f"Bearer {token}"}

    with patch("app.services.local_llm._yanit_uret", return_value="Test yaniti."):
        response = client.post("/api/yerel-ai/antrenor-yorumu", json={
            "skorlar": {"Genel Form": 80}
        }, headers=headers)
        assert response.status_code == 200
        assert "yorum" in response.json()

        response = client.post("/api/yerel-ai/diyet-onerisi", json={
            "bmi": 22.5,
            "bmi_kategori": "Normal",
            "hedef": "kilo_koruma",
            "hedef_kalori": 2200,
            "protein_g": 120,
            "karbonhidrat_g": 220,
            "yag_g": 70,
            "istek": "test",
        }, headers=headers)
        assert response.status_code == 200

        response = client.post("/api/yerel-ai/defter-analizi", json={
            "hareket": "Bench Press",
            "agirliklar": [40, 42.5],
        }, headers=headers)
        assert response.status_code == 200

        # --- PLANK ANALIZI ---
def plank_kare_olustur(omuz_y, kalca_y, ayak_y):
    frame = [0.0] * 132
    points = {
        11: (0.2, omuz_y), 12: (0.2, omuz_y + 0.02),
        23: (0.5, kalca_y), 24: (0.5, kalca_y + 0.02),
        27: (0.8, ayak_y), 28: (0.8, ayak_y + 0.02),
    }
    for idx, (x, y) in points.items():
        base = idx * 4
        frame[base] = x
        frame[base + 1] = y
        frame[base + 2] = 0.0
        frame[base + 3] = 0.9
    return frame


def test_43_plank_iyi_form():
    token = get_token("plank1@test.com")
    frame = plank_kare_olustur(0.30, 0.32, 0.34)
    response = client.post("/api/analyze/plank", json={"landmarks": frame},
        headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    assert response.json()["durum"] == "İyi Form"


def test_44_plank_kalca_yuksek_ve_bel_cokuk():
    token = get_token("plank2@test.com")
    headers = {"Authorization": f"Bearer {token}"}

    frame = plank_kare_olustur(0.30, 0.10, 0.34)
    response = client.post("/api/analyze/plank", json={"landmarks": frame}, headers=headers)
    assert response.status_code == 200
    assert response.json()["durum"] == "Kalça Çok Yukarıda"

    frame = plank_kare_olustur(0.30, 0.55, 0.34)
    response = client.post("/api/analyze/plank", json={"landmarks": frame}, headers=headers)
    assert response.status_code == 200
    assert response.json()["durum"] == "Bel Çökmüş"


def test_45_plank_gecersiz_durumlar():
    token = get_token("plank3@test.com")
    headers = {"Authorization": f"Bearer {token}"}

    response = client.post("/api/analyze/plank", json={"landmarks": [0.0] * 132}, headers=headers)
    assert response.status_code == 400

    on_frame = plank_kare_olustur(0.30, 0.32, 0.34)
    for idx in [11, 12, 23, 24, 27, 28]:
        on_frame[idx * 4] = 0.5
    response = client.post("/api/analyze/plank", json={"landmarks": on_frame}, headers=headers)
    assert response.status_code == 400

    # --- YENI FOTOGRAF HAREKETLERI ---
def hat_kare_olustur(ust_y, orta_y, alt_y, alt_idx=(27, 28)):
    frame = [0.0] * 132
    points = {
        11: (0.2, ust_y), 12: (0.2, ust_y + 0.02),
        23: (0.5, orta_y), 24: (0.5, orta_y + 0.02),
        alt_idx[0]: (0.8, alt_y), alt_idx[1]: (0.8, alt_y + 0.02),
    }
    for idx, (x, y) in points.items():
        base = idx * 4
        frame[base] = x
        frame[base + 1] = y
        frame[base + 2] = 0.0
        frame[base + 3] = 0.9
    return frame


def aci_kare_olustur(kalca, diz, ayak):
    frame = [0.0] * 132
    points = {
        23: kalca, 24: (kalca[0], kalca[1] + 0.02),
        25: diz, 26: (diz[0], diz[1] + 0.02),
        27: ayak, 28: (ayak[0], ayak[1] + 0.02),
    }
    for idx, (x, y) in points.items():
        base = idx * 4
        frame[base] = x
        frame[base + 1] = y
        frame[base + 2] = 0.0
        frame[base + 3] = 0.9
    return frame


def test_46_sinav_iyi_form_ve_bel_cokmus():
    token = get_token("sinav1@test.com")
    headers = {"Authorization": f"Bearer {token}"}

    frame = plank_kare_olustur(0.30, 0.32, 0.34)
    response = client.post("/api/analyze/sinav", json={"landmarks": frame}, headers=headers)
    assert response.status_code == 200
    assert response.json()["durum"] == "İyi Form"

    frame = plank_kare_olustur(0.30, 0.40, 0.34)
    response = client.post("/api/analyze/sinav", json={"landmarks": frame}, headers=headers)
    assert response.status_code == 200
    assert response.json()["durum"] == "Bel Çökmüş"


def test_47_yan_plank_iyi_form_ve_kalca_dusuk():
    token = get_token("yanplank1@test.com")
    headers = {"Authorization": f"Bearer {token}"}

    frame = plank_kare_olustur(0.30, 0.32, 0.34)
    response = client.post("/api/analyze/yan-plank", json={"landmarks": frame}, headers=headers)
    assert response.status_code == 200
    assert response.json()["durum"] == "İyi Form"

    frame = plank_kare_olustur(0.30, 0.10, 0.34)
    response = client.post("/api/analyze/yan-plank", json={"landmarks": frame}, headers=headers)
    assert response.status_code == 200
    assert response.json()["durum"] == "Kalça Çok Yukarıda"


def test_48_kopru_durumlari():
    token = get_token("kopru1@test.com")
    headers = {"Authorization": f"Bearer {token}"}

    frame = hat_kare_olustur(0.30, 0.32, 0.34, alt_idx=(25, 26))
    response = client.post("/api/analyze/kopru", json={"landmarks": frame}, headers=headers)
    assert response.status_code == 200
    assert response.json()["durum"] == "İyi Form"

    frame = hat_kare_olustur(0.30, 0.45, 0.34, alt_idx=(25, 26))
    response = client.post("/api/analyze/kopru", json={"landmarks": frame}, headers=headers)
    assert response.status_code == 200
    assert response.json()["durum"] == "Kalça Yeterince Yükseltilmemiş"


def test_49_supermen_durumlari():
    token = get_token("supermen1@test.com")
    headers = {"Authorization": f"Bearer {token}"}

    frame = plank_kare_olustur(0.20, 0.35, 0.20)
    response = client.post("/api/analyze/supermen", json={"landmarks": frame}, headers=headers)
    assert response.status_code == 200
    assert response.json()["durum"] == "İyi Form"

    frame = plank_kare_olustur(0.20, 0.21, 0.20)
    response = client.post("/api/analyze/supermen", json={"landmarks": frame}, headers=headers)
    assert response.status_code == 200
    assert response.json()["durum"] == "Yetersiz Kaldırma"


def test_50_duvar_squat_durumlari():
    token = get_token("duvarsquat1@test.com")
    headers = {"Authorization": f"Bearer {token}"}

    frame = aci_kare_olustur((0, 0), (0, 1), (1, 1))
    response = client.post("/api/analyze/duvar-squat", json={"landmarks": frame}, headers=headers)
    assert response.status_code == 200
    assert response.json()["durum"] == "İyi Form"

    frame = aci_kare_olustur((0, 0), (0, 1), (0.3, 1.8))
    response = client.post("/api/analyze/duvar-squat", json={"landmarks": frame}, headers=headers)
    assert response.status_code == 200
    assert response.json()["durum"] == "Yeterince Çömelmemiş"

    frame = aci_kare_olustur((0, 0), (0, 1), (0.3, 0.9))
    response = client.post("/api/analyze/duvar-squat", json={"landmarks": frame}, headers=headers)
    assert response.status_code == 200
    assert response.json()["durum"] == "Çok Derin Çömelmiş"
    
def test_51_gecmis_kaydi_silme():
    token1 = get_token("silme1@test.com")
    token2 = get_token("silme2@test.com")
    headers1 = {"Authorization": f"Bearer {token1}"}
    headers2 = {"Authorization": f"Bearer {token2}"}

    frame = plank_kare_olustur(0.30, 0.32, 0.34)
    response = client.post("/api/analyze/plank", json={"landmarks": frame}, headers=headers1)
    kayit_id = response.json()["kayit_id"]

    response = client.delete(f"/api/analyze/history/{kayit_id}", headers=headers2)
    assert response.status_code == 404

    response = client.delete(f"/api/analyze/history/{kayit_id}", headers=headers1)
    assert response.status_code == 200

    response = client.get("/api/analyze/history", headers=headers1)
    kayit_idler = [k["id"] for k in response.json()]
    assert kayit_id not in kayit_idler

    response = client.delete(f"/api/analyze/history/{kayit_id}", headers=headers1)
    assert response.status_code == 404
    
    # --- LOCAL LLM GERCEK MANTIK ---
def test_52_local_llm_token_yoksa_kullanilamaz(monkeypatch):
    assert local_llm.llm_kullanilabilir_mi() is True


def test_53_local_llm_basarili_yanit(monkeypatch):
    class SahteYanit:
        def json(self):
            return {"yorum": "Formun oldukça iyiydi. Devam et."}

    monkeypatch.setattr(local_llm.requests, "post", lambda *a, **k: SahteYanit())

    sonuc = local_llm.antrenor_geri_bildirimi_uret({"Genel Form": 80})
    assert sonuc is not None
    assert len(sonuc) > 5

    sonuc = local_llm.diyet_onerisi_uret(22.5, "Normal", "kilo_koruma", 2200, 120, 220, 70, "test")
    assert sonuc is not None
    assert len(sonuc) > 5

    sonuc = local_llm.defter_analizi_uret("Bench Press", [40, 42.5])
    assert sonuc is not None
    assert len(sonuc) > 5


def test_54_local_llm_baglanti_hatasi(monkeypatch):
    def hata_firlat(*args, **kwargs):
        raise ConnectionError("baglanti hatasi")

    monkeypatch.setattr(local_llm.requests, "post", hata_firlat)

    sonuc = local_llm.antrenor_geri_bildirimi_uret({"Genel Form": 80})
    assert sonuc == "Şu anda yapay zeka servisine erişilemiyor, lütfen birkaç saniye sonra tekrar deneyin."

    
def test_55_yeni_hareketler_gecmis_kaydina_ekleniyor():
    token = get_token("yenihareketler@test.com")
    headers = {"Authorization": f"Bearer {token}"}

    kayit_idler = []

    frame_hat = plank_kare_olustur(0.30, 0.32, 0.34)
    for endpoint in ["/api/analyze/sinav", "/api/analyze/yan-plank"]:
        response = client.post(endpoint, json={"landmarks": frame_hat}, headers=headers)
        assert response.status_code == 200
        kayit_idler.append(response.json()["kayit_id"])

    frame_kopru = hat_kare_olustur(0.30, 0.32, 0.34, alt_idx=(25, 26))
    response = client.post("/api/analyze/kopru", json={"landmarks": frame_kopru}, headers=headers)
    assert response.status_code == 200
    kayit_idler.append(response.json()["kayit_id"])

    frame_supermen = plank_kare_olustur(0.20, 0.35, 0.20)
    response = client.post("/api/analyze/supermen", json={"landmarks": frame_supermen}, headers=headers)
    assert response.status_code == 200
    kayit_idler.append(response.json()["kayit_id"])

    response = client.get("/api/analyze/history", headers=headers)
    mevcut_idler = [k["id"] for k in response.json()]
    for kid in kayit_idler:
        assert kid in mevcut_idler

    for kid in kayit_idler:
        response = client.delete(f"/api/analyze/history/{kid}", headers=headers)
        assert response.status_code == 200

