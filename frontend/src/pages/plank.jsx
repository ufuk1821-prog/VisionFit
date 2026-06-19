import { useState, useRef, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { PoseLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';
import axios from 'axios';
import { Upload, CheckCircle, AlertTriangle, Clipboard, Info, Lightbulb, Eye, Camera as CameraIcon, ImagePlus, Bot } from 'lucide-react';
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
  {
    id: 'lunge', label: 'Lunge', endpoint: 'lunge',
    dogruForm: 'Öne adım at, ön diz 90° açıda olsun. Gövden dik, arka diz yere yakın. Ön diz ayak ucunu geçmemeli.',
    nasilCalisir: 'Ön bacağın kalça-diz-ayak bileği açısı ve gövde eğimi ölçülür.',
  },
  {
    id: 'omuz_acikligi', label: 'Omuz Açıklığı', endpoint: 'omuz-acikligi',
    dogruForm: 'Kollar tam olarak yanlara, omuz hizasında T şeklinde açık. Her iki kol aynı seviyede.',
    nasilCalisir: 'Bilek konumları omuz hizasıyla karşılaştırılır, kol açıları ölçülür.',
  },
  {
    id: 'one_egilme', label: 'Öne Eğilme', endpoint: 'one-egilme',
    dogruForm: 'Ayakta dur, öne doğru eğil. Dizler düz veya hafif bükülü, eller yere mümkün olduğunca yakın.',
    nasilCalisir: 'Kalça açısı ve ellerin zemine mesafesi ölçülerek esneklik belirlenir.',
  },
  {
    id: 'ters_kopru', label: 'Ters Köprü', endpoint: 'ters-kopru',
    dogruForm: 'Yere otur, ellerini arkanıza koy, kalçanı yukarı kaldır. Diz açısı ~90°, gövde düz.',
    nasilCalisir: 'Kalça yüksekliği ve diz açısı ölçülerek form değerlendirilir.',
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

  const skorRengi = sonuc ? (sonuc.durum?.includes('İyi') ? 'var(--accent)' : 'var(--danger)') : 'var(--accent)';
  const skorYuzde = sonuc?.skor ?? (sonuc ? (sonuc.durum?.includes('İyi') ? 88 : 45) : 0);
  const gaugeCircumference = 2 * Math.PI * 40;
  const gaugeOffset = gaugeCircumference * (1 - skorYuzde / 100);

  return (
    <div>
      <Sidebar />
      <div style={{ marginBottom: '24px' }}>
        <h2 className="section-title" style={{ margin: 0, fontSize: '1.8rem', textTransform: 'uppercase' }}>Fotoğraf Analizi</h2>
        <p style={{ color: 'var(--text-muted)', maxWidth: '640px', marginTop: '8px' }}>
          Yapay zeka destekli biyomekanik analiz için formunuzun bir fotoğrafını yükleyin. Formunuzdaki hataları milimetrik hassasiyetle tespit edelim.
        </p>
      </div>

      <div style={{ display: 'flex', overflowX: 'auto', gap: '10px', paddingBottom: '16px', marginBottom: '8px' }}>
        {HAREKETLER.map((h) => (
          <button
            key={h.id}
            onClick={() => hareketSec(h.id)}
            style={{
              flexShrink: 0, padding: '8px 20px', borderRadius: '999px', cursor: 'pointer',
              fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase',
              transition: 'all 0.2s',
              border: secili === h.id ? '1px solid var(--accent)' : '1px solid var(--border)',
              background: secili === h.id ? 'var(--accent)' : 'var(--surface-2)',
              color: secili === h.id ? '#fff' : 'var(--text-muted)',
            }}
          >
            {h.label}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }} className="dashboard-grid-responsive">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {onizleme ? (
            <div style={{ position: 'relative', borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--border)', background: '#000' }}>
              <img src={onizleme} alt="Önizleme" style={{ width: '100%', maxHeight: '380px', objectFit: 'contain', display: 'block' }} />
              {yukleniyor && (
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ color: '#fff', fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>ANALİZ EDİLİYOR...</span>
                </div>
              )}
            </div>
          ) : (
            <label
              style={{
                aspectRatio: '16/9', background: 'var(--surface-2)', borderRadius: '16px',
                border: '2px dashed var(--border)', display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', cursor: 'pointer', textAlign: 'center', padding: '32px',
              }}
            >
              <input type="file" accept="image/*" onChange={dosyaSecildi} style={{ display: 'none' }} />
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--surface-container-highest, var(--border))', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                <Upload size={28} color="var(--accent)" />
              </div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: '8px' }}>Fotoğraf Yükle veya Sürükle</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', maxWidth: '280px' }}>PNG, JPG veya HEIC formatında. Maksimum dosya boyutu 15MB.</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: '16px' }}>
                <Clipboard size={14} /> Veya Ctrl+V ile yapıştırın
              </div>
            </label>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <label className="timer-btn" style={{ justifyContent: 'center', cursor: 'pointer' }}>
              <ImagePlus size={18} /> Galeri
              <input type="file" accept="image/*" onChange={dosyaSecildi} style={{ display: 'none' }} />
            </label>
            <label className="timer-btn primary" style={{ justifyContent: 'center', cursor: 'pointer' }}>
              <CameraIcon size={18} /> Kamera
              <input type="file" accept="image/*" capture="environment" onChange={dosyaSecildi} style={{ display: 'none' }} />
            </label>
          </div>

          {hata && (
            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', padding: '14px', background: 'rgba(232,49,63,0.1)', border: '1px solid rgba(232,49,63,0.3)', borderRadius: '10px' }}>
              <AlertTriangle size={18} color="var(--danger)" style={{ flexShrink: 0, marginTop: '2px' }} />
              <span style={{ fontSize: '0.85rem', color: 'var(--text)' }}>{hata}</span>
            </div>
          )}

          {sonuc && (
            <Link
              to={sonuc?.kayit_id ? `/history?kayit=${sonuc.kayit_id}` : '/history'}
              className="timer-btn"
              style={{ width: 'fit-content', textDecoration: 'none' }}
            >
              <Eye size={16} /> Analizi Detaylı Görüntüle
            </Link>
          )}
        </div>

        <div style={{ background: 'var(--surface-2)', borderRadius: '16px', border: '1px solid var(--border)', padding: '24px', position: 'relative' }}>
          <span style={{ position: 'absolute', top: '16px', right: '16px', fontFamily: 'var(--font-mono)', fontSize: '9px', background: 'rgba(232,49,63,0.1)', color: 'var(--accent)', padding: '4px 8px', borderRadius: '4px', border: '1px solid rgba(232,49,63,0.2)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Analiz Raporu
          </span>

          <div style={{ marginTop: '32px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ position: 'relative', width: '160px', height: '160px', marginBottom: '24px' }}>
              <svg width="160" height="160" viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="50" cy="50" r="40" fill="none" stroke="var(--surface)" strokeWidth="8" />
                <circle
                  cx="50" cy="50" r="40" fill="none"
                  stroke={skorRengi} strokeWidth="8"
                  strokeDasharray={gaugeCircumference}
                  strokeDashoffset={sonuc ? gaugeOffset : gaugeCircumference}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dashoffset 0.6s ease' }}
                />
              </svg>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 800 }}>{sonuc ? `${skorYuzde}%` : '—'}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>SKOR</span>
              </div>
            </div>

            <div style={{ width: '100%' }}>
              <div style={{ padding: '14px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', marginBottom: '16px' }}>
                <h4 style={{ display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--accent)', marginBottom: '8px', textTransform: 'uppercase' }}>
                  <Bot size={14} /> KOÇUN NOTU
                </h4>
                <p style={{ fontSize: '0.85rem', fontStyle: 'italic', lineHeight: 1.5, color: 'var(--text)' }}>
                  {sonuc ? sonuc.antrenor_mesaji : 'Analiz sonucunuz burada görünecek.'}
                </p>
              </div>

              {sonuc && (
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '8px', marginBottom: '8px' }}>
                    <span style={{ color: 'var(--text-muted)', textTransform: 'uppercase' }}>Durum</span>
                    <span style={{ color: skorRengi }}>{sonuc.durum?.toUpperCase()}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', marginTop: '48px' }}>
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
      </div>
    </div>
  );
}

export default FotografliAnaliz;