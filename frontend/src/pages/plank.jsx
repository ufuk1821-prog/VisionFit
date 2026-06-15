import { useState, useRef, useEffect, useCallback } from 'react';
import { PoseLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';
import axios from 'axios';
import { Upload, CheckCircle, AlertTriangle, Clipboard, Info, Lightbulb } from 'lucide-react';
import Sidebar from '../components/sidebar';

function Plank() {
  const [yukleniyor, setYukleniyor] = useState(false);
  const [sonuc, setSonuc] = useState(null);
  const [hata, setHata] = useState('');
  const [onizleme, setOnizleme] = useState(null);
  const poseLandmarkerRef = useRef(null);

  const token = localStorage.getItem('token');
  const apiUrl = import.meta.env.VITE_API_URL;

  const modeliYukle = async () => {
    if (poseLandmarkerRef.current) return poseLandmarkerRef.current;
    const vision = await FilesetResolver.forVisionTasks(
      'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
    );
    const poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
        delegate: 'GPU',
      },
      runningMode: 'IMAGE',
      numPoses: 1,
    });
    poseLandmarkerRef.current = poseLandmarker;
    return poseLandmarker;
  };

  const goruntuyuAnalizEt = useCallback(async (dosya) => {
    setHata('');
    setSonuc(null);
    setYukleniyor(true);

    const url = URL.createObjectURL(dosya);
    setOnizleme(url);

    const goruntu = new Image();
    goruntu.src = url;

    goruntu.onload = async () => {
      try {
        const poseLandmarker = await modeliYukle();
        const sonuclar = poseLandmarker.detect(goruntu);

        if (!sonuclar.landmarks || sonuclar.landmarks.length === 0) {
          setHata('Fotoğrafta vücut tespit edilemedi. Lütfen yandan, tüm vücudunuzun göründüğü bir fotoğraf yükleyin.');
          setYukleniyor(false);
          return;
        }

        const flat = [];
        sonuclar.landmarks[0].forEach((lm) => flat.push(lm.x, lm.y, lm.z, lm.visibility ?? 0));

        const res = await axios.post(
          `${apiUrl}/api/analyze/plank`,
          { landmarks: flat },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setSonuc(res.data);
      } catch (err) {
        setHata(err.response?.data?.detail || 'Analiz sırasında bir hata oluştu.');
      } finally {
        setYukleniyor(false);
      }
    };
  }, [apiUrl, token]);

  const dosyaSecildi = (e) => {
    const dosya = e.target.files[0];
    if (dosya) goruntuyuAnalizEt(dosya);
  };

  useEffect(() => {
    const yapistirmaDinleyici = (e) => {
      const oge = [...e.clipboardData.items].find((i) => i.type.startsWith('image/'));
      if (oge) goruntuyuAnalizEt(oge.getAsFile());
    };
    window.addEventListener('paste', yapistirmaDinleyici);
    return () => window.removeEventListener('paste', yapistirmaDinleyici);
  }, [goruntuyuAnalizEt]);

  const durumRengi = (durum) => (durum === 'İyi Form' ? 'var(--accent)' : 'var(--danger)');
  const bosDurum = !onizleme && !sonuc && !hata && !yukleniyor;

  return (
    <div>
      <Sidebar />
      <div className="section-title">Plank Analizi</div>

      <div className="main-wrapper">
        <div className="card status-card" style={{ alignItems: 'center', textAlign: 'center', gap: '16px' }}>
          <div className="card-title">Plank Fotoğrafı Yükle</div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Yandan çekilmiş, tüm vücudunuzun göründüğü bir plank fotoğrafı yükleyin.
          </p>
          <label className="timer-btn primary" style={{ cursor: 'pointer', justifyContent: 'center' }}>
            <Upload size={20} /> Fotoğraf Seç
            <input type="file" accept="image/*" onChange={dosyaSecildi} style={{ display: 'none' }} />
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
            <Clipboard size={16} /> Veya bir fotoğraf kopyalayıp bu sayfaya yapıştırın (Ctrl+V)
          </div>
        </div>

        <div className="dashboard">
          {bosDurum && (
            <div className="card">
              <div className="card-header">
                <div className="card-icon"><Info size={18} /></div>
                <div className="card-title">Bu Analiz Nasıl Çalışır?</div>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '8px', lineHeight: '1.6' }}>
                Sistem, fotoğrafınızdaki omuz, kalça ve ayak bileği noktalarını tespit eder ve bu üç noktanın
                düz bir hat oluşturup oluşturmadığını hesaplar. Kalçanız bu hattın üzerindeyse "Kalça Çok Yukarıda",
                altındaysa "Bel Çökmüş", hat üzerindeyse "İyi Form" sonucunu görürsünüz.
              </p>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '12px', lineHeight: '1.6' }}>
                Plank, karın, sırt ve omuz kaslarını aynı anda çalıştıran, gövde stabilitesini geliştiren
                statik bir egzersizdir. Doğru form, sakatlanmayı önler ve egzersizin etkisini artırır.
              </p>
            </div>
          )}

          {onizleme && (
            <div className="card">
              <div className="card-title">Yüklenen Fotoğraf</div>
              <img src={onizleme} alt="Plank" style={{ width: '100%', borderRadius: '12px', marginTop: '8px' }} />
            </div>
          )}

          {yukleniyor && (
            <div className="card" style={{ textAlign: 'center' }}>
              <div className="card-title">Analiz ediliyor...</div>
            </div>
          )}

          {hata && (
            <div className="card">
              <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                <AlertTriangle size={18} color="var(--danger)" style={{ flexShrink: 0, marginTop: '2px' }} />
                <span style={{ fontSize: '0.85rem', color: 'var(--text)' }}>{hata}</span>
              </div>
            </div>
          )}

          {sonuc && (
            <div className="card status-card" style={{ textAlign: 'center' }}>
              <div className="card-title">Sonuç</div>
              <div className="card-value" style={{ fontSize: '1.5rem', color: durumRengi(sonuc.durum) }}>
                {sonuc.durum}
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', marginTop: '12px', textAlign: 'left' }}>
                <CheckCircle size={18} color={durumRengi(sonuc.durum)} style={{ flexShrink: 0, marginTop: '2px' }} />
                <span style={{ fontSize: '0.85rem', color: 'var(--text)' }}>{sonuc.antrenor_mesaji}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="section-title">İpuçları ve Doğru Form</div>
      <div className="dashboard-grid">
        <div className="card">
          <div className="card-header">
            <div className="card-icon"><Lightbulb size={18} /></div>
            <div className="card-title">İyi Fotoğraf İçin İpuçları</div>
          </div>
          <ul style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '8px', paddingLeft: '20px', lineHeight: '1.6' }}>
            <li>Telefonu yere paralel, kameraya tam yandan bakacak şekilde konumlandırın.</li>
            <li>Baştan ayağa tüm vücudunuz kadrajda olsun.</li>
            <li>Ortam aydınlık olsun, vücut hattınız net seçilsin.</li>
            <li>Bol kıyafet vücut hattını gizleyebilir, dar kıyafet daha doğru sonuç verir.</li>
          </ul>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-icon"><CheckCircle size={18} /></div>
            <div className="card-title">Doğru Plank Formu</div>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '8px', lineHeight: '1.6' }}>
            Omuzlar, kalça ve ayak bilekleri tek bir düz çizgi üzerinde olmalı. Karın ve kalça kasları sıkı
            tutulmalı, bel ne yukarı kalkmalı ne de aşağı çökmeli. Boyun gevşek, bakış yere doğru olmalı.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Plank;