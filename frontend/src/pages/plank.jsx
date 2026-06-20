import { useState, useRef, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { PoseLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';
import axios from 'axios';
import Sidebar from '../components/sidebar';

const HAREKETLER = [
  {
    id: 'plank', label: 'Plank', endpoint: 'plank',
    dogruForm: 'Omuzlar, kalça ve ayak bilekleri tek bir düz çizgi üzerinde olmalı. Karın ve kalça kasları sıkı tutulmalı.',
    nasilCalisir: [
      'Omuz, kalça ve ayak bileği noktaları tespit edilir.',
      'Bu üç noktanın oluşturduğu açı hesaplanır.',
      'Açı 180°ye yakınsa form "iyi" olarak değerlendirilir.',
    ],
    ipuclari: [
      'Fotoğraf tam yandan, tüm vücut kadrajda olacak şekilde çekilmeli.',
      'Kalçanın ne yukarı kalkık ne aşağı çökük olmadığından emin olun.',
      'Dirsekler omuz hizasında, düz bir açıyla yere bassın.',
    ],
  },
  {
    id: 'sinav', label: 'Şınav', endpoint: 'sinav',
    dogruForm: 'Şınavın alt pozisyonunda omuzlar, kalça ve ayak bilekleri tek düz hat üzerinde olmalı.',
    nasilCalisir: [
      'Şınavın en alt (göğüs yere yakın) anındaki kare analiz edilir.',
      'Vücut hattı düzlüğü plank ile aynı mantıkla ölçülür.',
      'Dirsek açısı da ek bir referans olarak değerlendirilir.',
    ],
    ipuclari: [
      'Fotoğrafı şınavın en alt noktasında çekin.',
      'Kamerayı yere yakın, tam yandan konumlandırın.',
      'Kalçanın havaya kalkmadığından emin olun.',
    ],
  },
  {
    id: 'kopru', label: 'Köprü', endpoint: 'kopru',
    dogruForm: 'Köprünün tepe noktasında omuzlar, kalça ve dizler tek düz hat oluşturmalı.',
    nasilCalisir: [
      'Omuz, kalça ve diz noktaları işaretlenir.',
      'Kalçanın omuz-diz hattına göre yüksekliği ölçülür.',
      'Yeterli kalkış sağlanmışsa "iyi form" olarak işaretlenir.',
    ],
    ipuclari: [
      'Fotoğrafı hareketin en yüksek (tepe) noktasında çekin.',
      'Kamera yere yakın ve tam yandan olmalı.',
      'Omuzlar yere sabit basmalı, baş gevşek olmalı.',
    ],
  },
  {
    id: 'yan_plank', label: 'Yan Plank', endpoint: 'yan-plank',
    dogruForm: 'Vücudunuz baştan ayağa tek düz bir çizgi oluşturmalı.',
    nasilCalisir: [
      'Omuz, kalça ve ayak bileği noktaları tespit edilir.',
      'Vücut hattının yana doğru düzlüğü hesaplanır.',
      'Kalçanın düşüp düşmediği kontrol edilir.',
    ],
    ipuclari: [
      'Fotoğrafı tam yandan, destek alan kol görünecek şekilde çekin.',
      'Kalçanın yere doğru sarkmadığından emin olun.',
      'Üstteki bacak ve kalça aynı hizada olmalı.',
    ],
  },
  {
    id: 'duvar_squat', label: 'Duvar Squat', endpoint: 'duvar-squat',
    dogruForm: 'Sırtınız duvara yaslı, dizleriniz yaklaşık 90 derece açıda olmalı.',
    nasilCalisir: [
      'Kalça, diz ve ayak bileği noktalarından diz açısı hesaplanır.',
      'Açı 90°ye yakınsa "iyi form" sonucu verilir.',
      'Çok küçük veya çok büyük açılar "düzeltme gerekli" olarak işaretlenir.',
    ],
    ipuclari: [
      'Fotoğrafı tam yandan, diz açısı net görünecek şekilde çekin.',
      'Sırtın tamamen duvara yaslı olduğundan emin olun.',
      'Ayaklar kalça genişliğinde ve düz olmalı.',
    ],
  },
  {
    id: 'supermen', label: 'Süpermen', endpoint: 'supermen',
    dogruForm: 'Yüzüstü pozisyonda kollar ve bacaklar aynı anda yukarı kaldırılmalı.',
    nasilCalisir: [
      'Omuz, kalça ve ayak bileği noktaları işaretlenir.',
      'Kol ve bacakların kalçaya göre yüksekliği ölçülür.',
      'Simetrik ve yeterli kalkış varsa "iyi form" verilir.',
    ],
    ipuclari: [
      'Fotoğrafı hareketin en yüksek noktasında, yandan çekin.',
      'Kol ve bacakların aynı anda kalktığından emin olun.',
      'Boynu zorlamadan, bakışı yere doğru tutun.',
    ],
  },
  {
    id: 'lunge', label: 'Lunge', endpoint: 'lunge',
    dogruForm: 'Öne adım at, ön diz 90° açıda olsun. Gövden dik, arka diz yere yakın.',
    nasilCalisir: [
      'Ön bacağın kalça-diz-ayak bileği açısı ölçülür.',
      'Gövdenin dikliği ayrı bir referans olarak değerlendirilir.',
      'İdeal açıya yakınlık skoru belirler.',
    ],
    ipuclari: [
      'Fotoğrafı tam yandan, alçalmanın en düşük noktasında çekin.',
      'Ön diz, ayak ucunu geçmemeli.',
      'Gövdeyi öne eğmeden dik tutun.',
    ],
  },
  {
    id: 'omuz_acikligi', label: 'Omuz Açıklığı', endpoint: 'omuz-acikligi',
    dogruForm: 'Kollar tam olarak yanlara, omuz hizasında T şeklinde açık. Her iki kol aynı seviyede.',
    nasilCalisir: [
      'Bilek konumları omuz hizasıyla karşılaştırılır.',
      'Her iki kolun açısı ayrı ayrı ölçülür.',
      'Simetri ve doğru açı birlikte değerlendirilir.',
    ],
    ipuclari: [
      'Fotoğrafı tam karşıdan, her iki kol görünecek şekilde çekin.',
      'Kollar omuz hizasında, yere paralel olmalı.',
      'Vücudu kameraya tam cepheden dönün.',
    ],
  },
  {
    id: 'one_egilme', label: 'Öne Eğilme', endpoint: 'one-egilme',
    dogruForm: 'Ayakta dur, öne doğru eğil. Dizler düz veya hafif bükülü, eller yere mümkün olduğunca yakın.',
    nasilCalisir: [
      'Kalça açısı ölçülür.',
      'Ellerin zemine olan mesafesi hesaplanır.',
      'Esneklik seviyesi bu iki veriye göre belirlenir.',
    ],
    ipuclari: [
      'Fotoğrafı tam yandan, eğilmenin en alt noktasında çekin.',
      'Dizleri zorlamadan doğal bükülmeye izin verin.',
      'Bacakların tamamı kadrajda olmalı.',
    ],
  },
  {
    id: 'ters_kopru', label: 'Ters Köprü', endpoint: 'ters-kopru',
    dogruForm: 'Yere otur, ellerini arkanıza koy, kalçanı yukarı kaldır. Diz açısı ~90°, gövde düz.',
    nasilCalisir: [
      'Kalça yüksekliği ölçülür.',
      'Diz açısı ayrıca hesaplanır.',
      'İkisi birlikte form kalitesini belirler.',
    ],
    ipuclari: [
      'Fotoğrafı tam yandan, kalçanın en yüksek noktasında çekin.',
      'Diz açısının 90 dereceye yakın olduğundan emin olun.',
      'Omuzdan dize kadar düz bir hat oluşturun.',
    ],
  },
];

function FotografliAnaliz() {
  const [secili, setSecili] = useState('plank');
  const [yukleniyor, setYukleniyor] = useState(false);
  const [sonuc, setSonuc] = useState(null);
  const [hata, setHata] = useState('');
  const [onizleme, setOnizleme] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const poseLandmarkerRef = useRef(null);

  const token = localStorage.getItem('token');
  const apiUrl = import.meta.env.VITE_API_URL;
  const hareket = HAREKETLER.find((h) => h.id === secili);

  const modeliYukle = async () => {
    if (poseLandmarkerRef.current) return poseLandmarkerRef.current;
    const vision = await FilesetResolver.forVisionTasks('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm');
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

        const res = await axios.post(`${apiUrl}/api/analyze/${hareket.endpoint}`, { landmarks: flat }, { headers: { Authorization: `Bearer ${token}` } });
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

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const dosya = e.dataTransfer.files[0];
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

  const skorYuzde = sonuc?.skor ?? sonuc?.eminlik_skoru ?? 0;
  const isIyi = sonuc?.durum?.includes('İyi');
  const gaugeCircumference = 251.2;
  const gaugeOffset = sonuc ? gaugeCircumference * (1 - skorYuzde / 100) : gaugeCircumference;

  return (
    <div>
      <Sidebar />
      <main className="md:ml-64 pt-20 md:pt-10 px-gutter pb-24 md:pb-10 min-h-screen">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h2 className="font-display-lg text-display-lg-mobile md:text-display-lg text-on-surface mb-2">FOTOĞRAF ANALİZİ</h2>
            <p className="font-body-md text-on-surface-variant max-w-2xl">Yapay zeka destekli biyomekanik analiz için formunuzun bir fotoğrafını yükleyin. Formunuzdaki hataları milimetrik hassasiyetle tespit edelim.</p>
          </div>

          <div className="flex overflow-x-auto gap-3 pb-6 mb-4 no-scrollbar">
            {HAREKETLER.map((h) => (
              <button
                key={h.id}
                onClick={() => hareketSec(h.id)}
                className={`shrink-0 px-6 py-2 rounded-full border font-label-mono text-label-mono uppercase transition-all duration-200 ${
                  secili === h.id ? 'bg-brand-red border-brand-red text-white' : 'border-outline-variant hover:bg-surface-container-highest'
                }`}
              >
                {h.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-bento-gap">
            <div className="lg:col-span-2 flex flex-col gap-bento-gap">
              {onizleme ? (
                <div className="relative aspect-video md:aspect-[16/9] bg-black rounded-2xl border border-outline-variant overflow-hidden flex items-center justify-center">
                  <img src={onizleme} alt="Önizleme" className="w-full h-full object-contain" />
                  {yukleniyor && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <span className="text-white font-label-mono text-sm">ANALİZ EDİLİYOR...</span>
                    </div>
                  )}
                </div>
              ) : (
                <div
                  className={`relative group aspect-video md:aspect-[16/9] bg-surface-container rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all ${
                    dragOver ? 'border-brand-red bg-surface-container-high' : 'border-outline-variant hover:border-brand-red hover:bg-surface-container-high'
                  }`}
                  onClick={() => document.getElementById('file-upload').click()}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                >
                  <input accept="image/*" className="hidden" id="file-upload" type="file" onChange={dosyaSecildi} />
                  <div className="flex flex-col items-center text-center p-8">
                    <div className="w-16 h-16 rounded-full bg-surface-container-highest flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <span className="material-symbols-outlined text-brand-red text-4xl">cloud_upload</span>
                    </div>
                    <h3 className="font-headline-md text-on-surface mb-2">Fotoğraf Yükle veya Sürükle</h3>
                    <p className="font-body-sm text-on-surface-variant max-w-xs">PNG, JPG veya HEIC formatında. Maksimum dosya boyutu 15MB.</p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-bento-gap">
                <label htmlFor="file-upload-2" className="flex items-center justify-center gap-3 py-4 bg-surface-container border border-outline-variant rounded-xl font-label-mono text-label-mono uppercase hover:bg-surface-container-highest transition-all active:scale-95 cursor-pointer">
                  <span className="material-symbols-outlined">photo_library</span>
                  Galeri
                  <input accept="image/*" className="hidden" id="file-upload-2" type="file" onChange={dosyaSecildi} />
                </label>
                <label htmlFor="file-upload-camera" className="flex items-center justify-center gap-3 py-4 bg-brand-red text-white rounded-xl font-label-mono text-label-mono uppercase hover:brightness-110 transition-all active:scale-95 cursor-pointer">
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>photo_camera</span>
                  Kamera
                  <input accept="image/*" capture="environment" className="hidden" id="file-upload-camera" type="file" onChange={dosyaSecildi} />
                </label>
              </div>

              {hata && (
                <div className="p-4 bg-error-container/20 border border-error-container/30 rounded-xl text-on-surface text-sm">{hata}</div>
              )}

              {sonuc && (
                <Link to={sonuc?.kayit_id ? `/history?kayit=${sonuc.kayit_id}` : '/history'} className="font-label-mono text-label-mono text-brand-red uppercase hover:underline w-fit">
                  Analizi Detaylı Görüntüle →
                </Link>
              )}
            </div>

            <div className="flex flex-col gap-bento-gap">
              <div className="bg-surface-container-high rounded-2xl border border-outline-variant p-6 relative overflow-hidden h-full">
                <div className="absolute top-0 right-0 p-4">
                  <span className="font-label-mono text-[10px] bg-brand-red/10 text-brand-red px-2 py-1 rounded border border-brand-red/20 uppercase tracking-widest">Analiz Raporu</span>
                </div>

                <div className="mt-8 flex flex-col items-center">
                  <div className="relative w-40 h-40 flex items-center justify-center mb-6">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="40" strokeWidth="8" fill="none" stroke="var(--tw-surface-low, #1c1b1b)" className="text-surface-container-low" style={{ stroke: '#2a2a29' }} />
                      <circle
                        cx="50" cy="50" r="40" strokeWidth="8" fill="none" strokeLinecap="round"
                        style={{ stroke: '#E8313F', strokeDasharray: gaugeCircumference, strokeDashoffset: gaugeOffset, transition: 'stroke-dashoffset 1s ease' }}
                      />
                    </svg>
                    <div className="absolute flex flex-col items-center">
                      <span className="font-display-lg text-4xl text-on-surface">{sonuc ? `${skorYuzde}%` : '—'}</span>
                      <span className="font-label-mono text-[10px] text-on-surface-variant uppercase">SKOR</span>
                    </div>
                  </div>

                  <div className="w-full">
                    <div className="p-4 bg-surface-container-lowest border border-outline-variant rounded-xl mb-4">
                      <h4 className="font-label-mono text-xs text-brand-red mb-2 flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm">smart_toy</span>
                        KOÇUN NOTU
                      </h4>
                      <p className="font-body-sm text-on-surface leading-relaxed italic">
                        {sonuc ? sonuc.antrenor_mesaji : 'Analiz sonucunuz burada görünecek.'}
                      </p>
                    </div>

                    {sonuc && (
                      <div className="flex items-center justify-between text-xs font-label-mono border-b border-outline-variant/30 pb-2">
                        <span className="text-on-surface-variant uppercase">Durum</span>
                        <span className={isIyi ? 'text-tertiary' : 'text-brand-red'}>{sonuc.durum?.toUpperCase()}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-bento-gap">
            <div className="bg-surface-container rounded-2xl border border-outline-variant p-6 hover:border-outline transition-colors">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center">
                  <span className="material-symbols-outlined text-tertiary">task_alt</span>
                </div>
                <h3 className="font-headline-md text-on-surface">Doğru {hareket.label} Formu</h3>
              </div>
              <p className="font-body-sm text-on-surface-variant">{hareket.dogruForm}</p>
            </div>

            <div className="bg-surface-container rounded-2xl border border-outline-variant p-6 hover:border-outline transition-colors">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center">
                  <span className="material-symbols-outlined text-secondary">psychology</span>
                </div>
                <h3 className="font-headline-md text-on-surface">Nasıl Çalışır?</h3>
              </div>
              <ul className="space-y-4">
                {hareket.nasilCalisir.map((t, i) => (
                  <li className="flex gap-3" key={i}>
                    <span className="font-label-mono text-brand-red">{String(i + 1).padStart(2, '0')}</span>
                    <p className="font-body-sm text-on-surface-variant">{t}</p>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-surface-container rounded-2xl border border-outline-variant p-6 hover:border-outline transition-colors">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center">
                  <span className="material-symbols-outlined text-brand-red">lightbulb</span>
                </div>
                <h3 className="font-headline-md text-on-surface">İpuçları</h3>
              </div>
              <div className="space-y-3">
                {hareket.ipuclari.map((t, i) => (
                  <div key={i} className={`p-3 bg-surface-container-lowest rounded-lg border-l-4 ${i === 0 ? 'border-brand-red' : 'border-outline-variant'}`}>
                    <p className="font-body-sm text-on-surface">{t}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default FotografliAnaliz;