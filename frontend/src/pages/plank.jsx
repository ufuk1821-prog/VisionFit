import { useState, useRef, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { PoseLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';
import axios from 'axios';
import { Upload, CheckCircle, AlertTriangle, Clipboard, Info, Lightbulb, Eye } from 'lucide-react';
import Sidebar from '../components/sidebar';

const HAREKETLER = [
  {
    id: 'plank', label: 'Plank', endpoint: 'plank',
    dogruForm: 'Omuzlar, kalça ve ayak bilekleri tek bir düz çizgi üzerinde olmalı. Karın ve kalça kasları sıkı tutulmalı, bel ne yukarı kalkmalı ne de aşağı çökmeli. Boyun gevşek, bakış yere doğru olmalı.',
    nasilCalisir: 'Sistem, fotoğrafınızdaki omuz, kalça ve ayak bileği noktalarını tespit eder ve bu üç noktanın düz bir hat oluşturup oluşturmadığını hesaplar. Kalçanız bu hattın üzerindeyse "Kalça Çok Yukarıda", altındaysa "Bel Çökmüş", hat üzerindeyse "İyi Form" sonucunu görürsünüz.',
  },
  {
    id: 'sinav', label: 'Şınav', endpoint: 'sinav',
    dogruForm: 'Şınavın alt pozisyonunda omuzlar, kalça ve ayak bilekleri tek düz hat üzerinde olmalı. Kalça yukarı kalkmamalı, bel çökmemeli, dirsekler vücuda yakın açıda tutulmalı.',
    nasilCalisir: 'Sistem, şınavın alt pozisyonundaki fotoğrafınızda omuz, kalça ve ayak bileği noktalarını tespit eder, vücut hattınızın düz olup olmadığını plank ile aynı mantıkla kontrol eder.',
  },
  {
    id: 'kopru', label: 'Köprü', endpoint: 'kopru',
    dogruForm: 'Köprünün tepe noktasında omuzlar, kalça ve dizler tek düz hat oluşturmalı. Kalça ne çok düşük (yetersiz kaldırma) ne de aşırı yukarı kalkık olmalı.',
    nasilCalisir: 'Sistem, omuz, kalça ve diz noktalarını tespit eder; kalçanızın omuz-diz hattıyla aynı seviyede olup olmadığını hesaplayarak yeterince kaldırılıp kaldırılmadığını belirler.',
  },
  {
    id: 'yan_plank', label: 'Yan Plank', endpoint: 'yan-plank',
    dogruForm: 'Vücudunuz baştan ayağa tek düz bir çizgi oluşturmalı. Kalça ne düşmeli ne de aşırı yukarı kalkmalı, destek alan omuz dirseğin üzerinde olmalı.',
    nasilCalisir: 'Sistem, yandan çekilmiş yan plank fotoğrafınızda omuz, kalça ve ayak bileği noktalarını tespit eder, vücut hattınızın düzlüğünü plank ile aynı mantıkla kontrol eder.',
  },
  {
    id: 'duvar_squat', label: 'Duvar Squat', endpoint: 'duvar-squat',
    dogruForm: 'Sırtınız duvara yaslı, dizleriniz yaklaşık 90 derece açıda olmalı. Dizleriniz ayak ucunu geçmemeli, ağırlığınız topuklarınızda olmalı.',
    nasilCalisir: 'Sistem, kalça, diz ve ayak bileği noktalarından diz açınızı hesaplar. Açı 90 dereceye yakınsa "İyi Form", çok küçükse "Çok Derin Çömelmiş", çok büyükse "Yeterince Çömelmemiş" sonucunu görürsünüz.',
  },
  {
    id: 'supermen', label: 'Süpermen', endpoint: 'supermen',
    dogruForm: 'Yüzüstü pozisyonda kollar ve bacaklar aynı anda yukarı kaldırılmalı, omurga doğal kavisinde kalmalı, boyun gevşek ve bakış yere doğru olmalı.',
    nasilCalisir: 'Sistem, omuz, kalça ve ayak bileği noktalarını tespit eder; kol ve bacaklarınızın kalçanıza göre ne kadar yukarı kaldırıldığını ölçerek formunuzu değerlendirir.',
  },
];

function FotografliAnaliz() {
  const [secili, setSecili] = useState('plank');
  const [yukleniyor, setYukleniyor] = useState(false);
  const [sonuc, setSonuc] = useState(null);
  const [hata, setHata] = useState('');
  const [onizleme, setOnizleme] = useState(null);
  const poseLandmarkerRef = useRef(null);

  const token = localStorage.getItem('token');
  const apiUrl = import.meta.env.VITE_API_URL;
  const hareket = HAREKETLER.find((h) => h.id === secili);

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
          `${apiUrl}/api/analyze/${hareket.endpoint}`,
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
  }, [apiUrl, token, hareket.endpoint]);

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

  const hareketSec = (id) => {
    setSecili(id);
    setOnizleme(null);
    setSonuc(null);
    setHata('');
  };

  const durumRengi = (durum) => (durum.includes('İyi') ? 'var(--accent)' : 'var(--danger)');

  return (
    <div>
      <Sidebar />
      <div className="section-title">Fotoğraflı Analiz</div>

      {onizleme && (
        <label className="timer-btn" style={{ cursor: 'pointer', width: 'fit-content', marginBottom: '12px' }}>
          <Upload size={16} /> Yeniden Yükle
          <input type="file" accept="image/*" onChange={dosyaSecildi} style={{ display: 'none' }} />
        </label>
      )}

      <div className="card status-card" style={{ width: '100%', gap: '16px' }}>
        {!onizleme ? (
          <div style={{ textAlign: 'center' }}>
            <div className="card-title">Analiz için lütfen bir fotoğraf yükleyiniz.</div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: '8px 0 16px' }}>
              Yandan çekilmiş, tüm vücudunuzun göründüğü bir fotoğraf yükleyiniz.
            </p>
            <label className="timer-btn primary" style={{ cursor: 'pointer', justifyContent: 'center', margin: '0 auto' }}>
              <Upload size={20} /> Fotoğraf Seç
              <input type="file" accept="image/*" onChange={dosyaSecildi} style={{ display: 'none' }} />
            </label>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '0.82rem', marginTop: '12px' }}>
              <Clipboard size={16} /> Veya bir fotoğraf kopyalayıp bu sayfaya yapıştırın (Ctrl+V)
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap', width: '100%' }}>
            <img src={onizleme} alt="Analiz" style={{ width: '220px', borderRadius: '12px', flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: '200px', textAlign: 'left' }}>
              {yukleniyor && <div className="card-title">Analiz ediliyor...</div>}

              {hata && (
                <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                  <AlertTriangle size={18} color="var(--danger)" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <span style={{ fontSize: '0.85rem', color: 'var(--text)' }}>{hata}</span>
                </div>
              )}

              {sonuc && (
                <>
                  <div className="card-value" style={{ fontSize: '1.4rem', color: durumRengi(sonuc.durum) }}>
                    {sonuc.durum}
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', marginTop: '8px' }}>
                    <CheckCircle size={18} color={durumRengi(sonuc.durum)} style={{ flexShrink: 0, marginTop: '2px' }} />
                    <span style={{ fontSize: '0.85rem', color: 'var(--text)' }}>{sonuc.antrenor_mesaji}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {sonuc && (
        <Link
          to={sonuc?.kayit_id ? `/history?kayit=${sonuc.kayit_id}` : "/history"}
          className="timer-btn"
          style={{
            width: 'fit-content', margin: '12px 0', textDecoration: 'none',
            background: 'var(--accent)', opacity: 0.35, color: '#fff', border: 'none', transition: 'opacity 0.2s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; }}
          onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.35'; }}
        >
          <Eye size={16} /> Analizi Detaylı Görüntüle
        </Link>
      )}

      <div style={{ display: 'flex', gap: '6px', marginTop: '20px', flexWrap: 'nowrap' }}>
        {HAREKETLER.map((h) => (
          <button
            key={h.id}
            onClick={() => hareketSec(h.id)}
            style={{
              flex: '1 1 0', minWidth: 0, padding: '10px 4px', borderRadius: '10px',
              fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer',
              transition: 'background 0.2s, color 0.2s',
              border: secili === h.id ? 'none' : '1px solid var(--danger)',
              background: secili === h.id ? 'var(--danger)' : 'var(--surface-2)',
              color: secili === h.id ? '#fff' : 'var(--danger)',
            }}
            onMouseEnter={(e) => {
              if (secili !== h.id) { e.currentTarget.style.background = 'var(--danger)'; e.currentTarget.style.color = '#fff'; }
            }}
            onMouseLeave={(e) => {
              if (secili !== h.id) { e.currentTarget.style.background = 'var(--surface-2)'; e.currentTarget.style.color = 'var(--danger)'; }
            }}
          >
            {h.label}
          </button>
        ))}
      </div>

      <div className="dashboard-grid" style={{ marginTop: '16px' }}>
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
            <div className="card-title">Doğru {hareket.label} Formu</div>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '8px', lineHeight: '1.6' }}>
            {hareket.dogruForm}
          </p>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-icon"><Info size={18} /></div>
            <div className="card-title">Bu Analiz Nasıl Çalışır?</div>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '8px', lineHeight: '1.6' }}>
            {hareket.nasilCalisir}
          </p>
        </div>
      </div>
    </div>
  );
}

export default FotografliAnaliz;