# VisionFit - Yapay Zeka Destekli Antrenör

VisionFit, kullanıcıların bilgisayar kameraları veya mobil cihazları üzerinden anlık vücut iskelet takibini (MediaPipe) yaparak egzersiz formlarını analiz eden ve PostgreSQL veritabanına kaydeden yapay zeka destekli bir sistemdir.

## Kullanılan Teknolojiler

- **Backend:** Python, FastAPI, SQLAlchemy, Scikit-learn, Pandas
- **Frontend:** React, Vite, MediaPipe
- **Veritabanı:** PostgreSQL
- **DevOps:** Docker, Docker Compose, GitHub Actions (CI/CD), Render

## Canlı API

**Base URL:** https://visionfit-backend.onrender.com

**Swagger Dokümantasyonu:** https://visionfit-backend.onrender.com/docs

## API Endpoint'leri

### Genel
| Method | URL | Açıklama |
|--------|-----|----------|
| GET | `/` | Sunucu durumu |

### Kimlik Doğrulama
| Method | URL | Açıklama |
|--------|-----|----------|
| POST | `/api/auth/register` | Yeni kullanıcı kaydı |
| POST | `/api/auth/login` | Giriş yap, JWT token al |

### Haberler
| Method | URL | Açıklama |
|--------|-----|----------|
| GET | `/api/data/news` | Haberleri listele (token gerekli) |
| GET | `/api/data/history/{user_id}` | Kullanıcı geçmişi (token gerekli) |

### Yapay Zeka Analiz
| Method | URL | Açıklama |
|--------|-----|----------|
| POST | `/api/analyze/squat` | Squat analizi yap |
| GET | `/api/analyze/history` | Analiz geçmişini getir |

## Projeyi Yerel Ortamda Çalıştırma

1. Projeyi klonlayın

        git clone https://github.com/ufuk1821-prog/VisionFit.git
        cd VisionFit

2. Ana dizinde `.env` dosyası oluşturun

        POSTGRES_USER=visionfit_user
        POSTGRES_PASSWORD=visionfit_secure_pass_2026
        POSTGRES_DB=visionfit_db
        DATABASE_URL=postgresql+psycopg2://visionfit_user:visionfit_secure_pass_2026@db:5432/visionfit_db
        JWT_SECRET=super_secret_crypto_key_998877

3. Docker ile başlatın

        docker-compose up --build

4. API'ye erişin

        Swagger: http://localhost:8000/docs
        Base URL: http://localhost:8000

## Testleri Çalıştırma

        cd backend
        pytest -v --cov=app

## CI/CD

Her main branch'e push'ta GitHub Actions otomatik olarak:
- Bağımlılıkları yükler
- 15 test senaryosunu çalıştırır
- Coverage raporu üretir
- Render'a otomatik deploy eder