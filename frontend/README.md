# VisionFit - Frontend

VisionFit'in React + Vite tabanlı web arayüzü. Kamera üzerinden squat analizi, diyet önerisi, beslenme/su/adım takibi, antrenman geçmişi, rozetler ve antrenman defteri sayfalarını içerir.

## Kullanılan Teknolojiler

- React 19 + Vite
- React Router
- Axios (API istekleri)
- Recharts (grafikler)
- Framer Motion (sayfa/modal animasyonları)
- MediaPipe Tasks Vision (kamera üzerinden iskelet takibi)
- Lucide React (ikonlar)

## Kurulum

    npm install

`.env.example` dosyasını `.env` olarak kopyalayın ve `VITE_API_URL` değerini backend adresinize göre ayarlayın:

    cp .env.example .env

## Komutlar

| Komut | Açıklama |
|-------|----------|
| `npm run dev` | Geliştirme sunucusunu başlatır |
| `npm run build` | Production build oluşturur (`dist/`) |
| `npm run preview` | Production build'i yerelde önizler |
| `npm run lint` | ESLint ile kod kontrolü yapar |
| `npm run test` | Vitest ile birim testlerini çalıştırır |

## Klasör Yapısı

    src/
      assets/        Logo ve statik görseller
      components/    Sidebar, MuscleDiagram, EmptyState gibi paylaşılan bileşenler
      data/          Egzersiz kütüphanesi verisi
      hooks/         useCountUp gibi özel React hook'ları
      pages/         Her route için sayfa bileşenleri
      test/          Vitest setup dosyası

## Deployment

Bu proje Vercel üzerinde, `main` branch'ine yapılan her push'ta otomatik olarak build edilip deploy edilir (`vercel.json` rewrite kurallarını içerir, SPA routing için tüm yollar `index.html`'e yönlendirilir).