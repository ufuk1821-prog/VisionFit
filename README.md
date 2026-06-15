# VisionFit - Yapay Zeka Destekli Antrenör

VisionFit, kullanıcıların bilgisayar kameraları üzerinden anlık vücut iskelet takibini (MediaPipe) yaparak squat formunu analiz eden, kişiselleştirilmiş diyet önerileri sunan, beslenme/su/adım takibi yapan ve antrenman geçmişine göre rozet kazandıran yapay zeka destekli bir fitness platformudur.

## Kullanılan Teknolojiler

- **Backend:** Python, FastAPI, SQLAlchemy, Scikit-learn, Pandas
- **Frontend:** React, Vite, MediaPipe Tasks Vision, Recharts, Framer Motion
- **Veritabanı:** PostgreSQL
- **E-posta:** Brevo API (transactional email)
- **DevOps:** Docker, Docker Compose, GitHub Actions (CI), Render (backend), Vercel (frontend)

## Canlı Adresler

- **Frontend:** https://vision-fit-ashy.vercel.app
- **Backend Base URL:** https://visionfit-backend-docker.onrender.com
- **Swagger Dokümantasyonu:** https://visionfit-backend-docker.onrender.com/docs

## API Endpoint'leri

### Genel
| Method | URL | Açıklama |
|--------|-----|----------|
| GET | `/` | Sunucu durumu |

### Kimlik Doğrulama (`/api/auth`)
| Method | URL | Açıklama |
|--------|-----|----------|
| POST | `/api/auth/register` | Yeni kullanıcı kaydı, doğrulama e-postası gönderir |
| POST | `/api/auth/login` | Giriş yap, JWT token al (e-posta doğrulanmamışsa 403) |
| GET | `/api/auth/verify-email/{token}` | E-posta adresini doğrular |
| POST | `/api/auth/resend-verification` | Doğrulama e-postasını yeniden gönderir |

### Kullanıcı Profili (`/api/users`)
| Method | URL | Açıklama |
|--------|-----|----------|
| GET | `/api/users/me` | Profil bilgilerini getirir |
| PUT | `/api/users/me` | Profil bilgilerini günceller (boy, kilo, yaş, cinsiyet, aktiflik, hedef) |
| PUT | `/api/users/me/password` | Şifre değiştirir |
| DELETE | `/api/users/me` | Hesabı siler |
| GET | `/api/users/me/diet` | Profile göre kayıtlı diyet önerisini getirir |
| POST | `/api/users/me/diet/custom` | Profil bilgileriyle özel istek metnine göre diyet önerisi üretir |
| POST | `/api/users/diet/calculate` | Verilen bilgilere göre diyet önerisi hesaplar |

### Adım Sayacı (`/api/steps`)
| Method | URL | Açıklama |
|--------|-----|----------|
| POST | `/api/steps` | Günlük adım kaydı ekler |
| GET | `/api/steps` | Adım geçmişini getirir |

### Rozetler (`/api/badges`)
| Method | URL | Açıklama |
|--------|-----|----------|
| GET | `/api/badges` | Kullanıcının rozet durumunu (kazanılan/kilitli) listeler |

### Beslenme Takibi (`/api/nutrition`)
| Method | URL | Açıklama |
|--------|-----|----------|
| GET | `/api/nutrition/foods` | Besin veritabanını listeler |
| POST | `/api/nutrition/meals` | Öğün kaydı ekler |
| GET | `/api/nutrition/meals/today` | Bugünün öğünlerini getirir |
| DELETE | `/api/nutrition/meals/{meal_id}` | Öğün kaydını siler |
| POST | `/api/nutrition/water` | Su tüketimi kaydı ekler |
| GET | `/api/nutrition/water/today` | Bugünün su tüketimini getirir |
| DELETE | `/api/nutrition/water/{water_id}` | Su kaydını siler |

### Antrenman Defteri (`/api/workout-notes`)
| Method | URL | Açıklama |
|--------|-----|----------|
| GET | `/api/workout-notes/dates` | Kayıt bulunan tarihleri listeler |
| GET | `/api/workout-notes/{tarih}` | Belirli bir tarihteki antrenman notlarını getirir |
| PUT | `/api/workout-notes/{tarih}` | Belirli bir tarih için antrenman notlarını kaydeder |

### Yapay Zeka Analiz (`/api/analyze`)
| Method | URL | Açıklama |
|--------|-----|----------|
| POST | `/api/analyze/squat` | Tek kare squat analizi (ML modeli ile doğru/yanlış squat sınıflandırması) |
| POST | `/api/analyze/session` | Tüm antrenman oturumunun kare dizisi üzerinden 6 kategoride form analizi |
| GET | `/api/analyze/history` | Kullanıcının antrenman geçmişini getirir |

Tüm endpoint'ler (`/`, `/docs` hariç) JWT tabanlı kimlik doğrulama gerektirir (`Authorization: Bearer <token>`).

## Projeyi Yerel Ortamda Çalıştırma

### Docker ile (önerilen)

1. Projeyi klonlayın

       git clone https://github.com/ufuk1821-prog/VisionFit.git
       cd VisionFit

2. Ana dizinde `.env.example` dosyasını `.env` olarak kopyalayıp değerleri kendinize göre düzenleyin

       cp .env.example .env

3. Docker ile başlatın

       docker-compose up --build

4. API'ye erişin

       Swagger: http://localhost:8000/docs
       Base URL: http://localhost:8000

### Frontend'i yerel çalıştırma

1. `frontend/.env.example` dosyasını `frontend/.env` olarak kopyalayın, `VITE_API_URL` değerini backend adresinize göre ayarlayın
2. Bağımlılıkları kurun ve geliştirme sunucusunu başlatın

       cd frontend
       npm install
       npm run dev

## Ortam Değişkenleri

| Değişken | Açıklama |
|----------|----------|
| `DATABASE_URL` | PostgreSQL bağlantı adresi |
| `JWT_SECRET` | JWT imzalama anahtarı (production'da zorunlu, varsayılan değer yoktur) |
| `BREVO_API_KEY` | Brevo transactional email API anahtarı |
| `EMAIL_FROM` | Brevo'da doğrulanmış gönderici e-posta adresi |
| `FRONTEND_URL` | E-posta doğrulama linklerinde kullanılan frontend adresi |
| `TESTING` | `True` ise email gönderimi ve ML modeli devre dışı kalır (CI ortamı için) |
| `VITE_API_URL` | (frontend) Backend API base URL'i |

## Testleri Çalıştırma

### Backend

    cd backend
    pytest -v --cov=app --cov=main

### Frontend

    cd frontend
    npm run test

## Deployment

- **Backend:** Render üzerinde, `backend/Dockerfile` kullanılarak Docker container olarak deploy edilir.
- **Frontend:** Vercel üzerinde, `main` branch'ine yapılan her push'ta otomatik olarak build edilip deploy edilir.
- **CI/CD:** GitHub Actions (`.github/workflows/ci.yml`), her push ve pull request'te backend testlerini PostgreSQL servis container'ı ile çalıştırır ve coverage raporu üretir. Testler `main` branch'inde başarılı olursa, pipeline'ın `deploy` job'ı Render'ın deploy hook'unu tetikleyerek backend'in yeniden deploy edilmesini sağlar (`RENDER_DEPLOY_HOOK_URL` repository secret'ı olarak tanımlıdır).
## Yerel AI (LLM) Özelliği

`ai_training/` klasöründe, VisionFit'e özel verilerle fine-tune edilmiş bir Qwen2.5-1.5B-Instruct modeli bulunur. Bu model 3 görev için eğitilmiştir: antrenör geri bildirimi, diyet AI önerisi ve antrenman defteri ilerleme analizi.

**Bu özellik sadece lokal ortamda çalışır**, deploy edilen siteye dahil değildir (Render'ın ücretsiz planında bu büyüklükte bir modeli çalıştıracak kaynak yoktur).

### Lokalde çalıştırmak için:

1. Ek kütüphaneleri kur (bunlar `requirements.txt`'e dahil değildir, sadece lokal kullanım içindir):
```bash
pip install transformers torch
```

2. Modeli indir (Hugging Face token gerekir, `HF_TOKEN` ortam değişkeni olarak ayarlanmalıdır):
```bash
cd ai_training
python model_indir.py
```

3. Backend'i başlatınca `/api/yerel-ai/antrenor-yorumu`, `/api/yerel-ai/diyet-onerisi`, `/api/yerel-ai/defter-analizi` endpoint'leri aktif olur.

### İlgili dosyalar

- `ai_training/egitim_verisi_uret.py`: Eğitim verisini üreten script (1500 örnek, 3 görev)
- `ai_training/egitim_verisi.jsonl`: Üretilen eğitim verisi
- `ai_training/model_indir.py`: Hugging Face'ten model indirme scripti
- `ai_training/llm_test.py`: Modeli doğrudan test eden script
- `ai_training/llm_api_test.py`: API endpoint'lerini test eden script
- `backend/app/services/local_llm.py`: Modeli yükleyip çalıştıran servis