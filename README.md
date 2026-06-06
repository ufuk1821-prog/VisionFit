# VisionFit - Yapay Zeka Destekli Antrenör

VisionFit, kullanıcıların bilgisayar kameraları veya mobil cihazları üzerinden anlık vücut iskelet takibini (MediaPipe) yaparak egzersiz formlarını analiz eden ve PostgreSQL veritabanına kaydeden yapay zeka destekli bir sistemdir. 

## Kullanılan Teknolojiler

*   **Backend:** Python, FastAPI, SQLAlchemy, Scikit-learn, Pandas
*   **Frontend:** React, Vite, MediaPipe
*   **Veritabanı:** PostgreSQL
*   **DevOps:** Docker, Docker Compose, GitHub Actions (CI/CD), Render

## Projeyi Yerel Ortamda Çalıştırma (Docker ile)

Projenin tüm bağımlılıkları ve veritabanı Docker üzerinden tek komutla ayağa kalkacak şekilde tasarlanmıştır.

1.  Projeyi bilgisayarınıza klonlayın.
2.  Ana dizinde `.env` adında bir dosya oluşturup veritabanı değişkenlerini girin.
3.  Terminalden aşağıdaki komutu çalıştırın:

```bash
docker-compose up --build