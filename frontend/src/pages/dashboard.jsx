import { useEffect, useRef, useState } from 'react';
import { PoseLandmarker, FilesetResolver, DrawingUtils } from '@mediapipe/tasks-vision';
import axios from 'axios';
import Sidebar from '../components/sidebar';

const KATEGORI_LABELS = {
  genel_form: 'Genel Form',
  omurga_notrluğu: 'Omurga Nötrlüğü',
  kalca_derinligi: 'Kalça Derinliği',
  diz_hizasi: 'Diz Hizası',
  diz_cokusu: 'Diz Çöküşü',
  agirlik_merkezi: 'Ağırlık Merkezi',
};

function VideoAnalizBolumu({ apiUrl, token }) {
  const [videoSonuc, setVideoSonuc] = useState(null);
  const [videoYukleniyor, setVideoYukleniyor] = useState(false);
  const [videoHata, setVideoHata] = useState('');
  const [secilenVideo, setSecilenVideo] = useState(null);
  const [videoAiYorum, setVideoAiYorum] = useState('');
  const [videoAiYukleniyor, setVideoAiYukleniyor] = useState(false);
  const [videoAiHata, setVideoAiHata] = useState('');
  const [videoKategoriAcik, setVideoKategoriAcik] = useState(false);
  const videoRef2 = useRef(null);

  const videoAiYorumuAl = async () => {
    if (!videoSonuc) return;
    setVideoAiYukleniyor(true);
    setVideoAiHata('');
    setVideoAiYorum('');
    try {
      const kategoriSkorlari = {};
      Object.entries(KATEGORI_LABELS).forEach(([key, label]) => {
        if (videoSonuc[key]) kategoriSkorlari[label] = videoSonuc[key].skor;
      });
      const res = await axios.post(
        `${apiUrl}/api/yerel-ai/antrenor-yorumu`,
        { hareket: 'squat', genel_skor: videoSonuc.genel_skor, kategori_skorlari: kategoriSkorlari },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setVideoAiYorum(res.data.yorum);
    } catch {
      setVideoAiHata('AI yorumu alınamadı, lütfen tekrar deneyin.');
    } finally {
      setVideoAiYukleniyor(false);
    }
  };

  const videoSec = (e) => {
    const dosya = e.target.files[0];
    if (!dosya) return;
    setSecilenVideo(dosya);
    setVideoSonuc(null);
    setVideoHata('');
    if (videoRef2.current) videoRef2.current.src = URL.createObjectURL(dosya);
  };

  const videoAnalizEt = async () => {
    if (!secilenVideo || !videoRef2.current) return;
    setVideoYukleniyor(true);
    setVideoHata('');
    setVideoSonuc(null);

    try {
      const { PoseLandmarker, FilesetResolver } = await import('@mediapipe/tasks-vision');
      const vision = await FilesetResolver.forVisionTasks('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm');
      const poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
          delegate: 'GPU',
        },
        runningMode: 'VIDEO',
        numPoses: 1,
      });

      const video = videoRef2.current;
      const frames = [];

      await new Promise((resolve, reject) => {
        video.currentTime = 0;
        video.muted = true;
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        video.onloadedmetadata = () => { canvas.width = video.videoWidth; canvas.height = video.videoHeight; };

        let sonZaman = -1;
        let frameNo = 0;

        const isle = () => {
          if (video.ended || video.paused) { poseLandmarker.close(); resolve(); return; }
          frameNo++;
          const simdikiZaman = video.currentTime * 1000;
          if (simdikiZaman !== sonZaman && frameNo % 2 === 0) {
            sonZaman = simdikiZaman;
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            try {
              const sonuc = poseLandmarker.detectForVideo(canvas, simdikiZaman);
              if (sonuc.landmarks && sonuc.landmarks.length > 0) {
                const flat = [];
                sonuc.landmarks[0].forEach((lm) => flat.push(lm.x, lm.y, lm.z, lm.visibility ?? 0));
                frames.push(flat);
              }
            } catch {}
          }
          requestAnimationFrame(isle);
        };
        video.onplay = () => requestAnimationFrame(isle);
        video.onerror = reject;
        video.play();
      });

      if (frames.length < 10) {
        setVideoHata('Videoda yeterli vücut tespiti yapılamadı. Yandan, tüm vücudun göründüğü bir video yükleyin.');
        return;
      }

      const res = await axios.post(`${apiUrl}/api/analyze/session`, { frames }, { headers: { Authorization: `Bearer ${token}` } });
      setVideoSonuc(res.data);
    } catch (err) {
      setVideoHata(err.response?.data?.detail || 'Video analizi sırasında hata oluştu.');
    } finally {
      setVideoYukleniyor(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <div className="w-full max-w-6xl bento-card p-10">
        <h2 className="font-headline-md text-headline-md mb-2">Video Analizi</h2>
        <p className="text-on-surface-variant font-body-sm mb-6">Yandan çekilmiş, tüm vücudunuzun göründüğü bir squat videosu yükleyin.</p>

        <div className="grid md:grid-cols-3 gap-bento-gap">
          <div className="md:col-span-2">
            <video ref={videoRef2} className="w-full aspect-[4/3] min-h-[420px] bg-black rounded-xl border border-outline-variant object-cover" style={{ display: secilenVideo ? 'block' : 'none' }} controls />
            {!secilenVideo && (
              <div className="w-full aspect-[4/3] min-h-[420px] bg-surface-container-lowest rounded-xl border border-outline-variant flex items-center justify-center text-on-surface-variant text-sm">
                Video seçilmedi
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3 justify-center md:col-span-1">
            <label className="font-label-mono text-label-mono text-on-surface-variant uppercase">Video Seç</label>
            <input type="file" accept="video/*" onChange={videoSec} className="hidden" id="video-input" />
            <label htmlFor="video-input" className="px-6 py-3 bg-surface-container-high border border-outline-variant rounded-lg text-center cursor-pointer font-label-mono text-label-mono uppercase">
              Video Yükle
            </label>

            {secilenVideo && (
              <button className="px-6 py-3 bg-primary text-on-primary font-bold rounded-lg uppercase font-label-mono disabled:opacity-40" onClick={videoAnalizEt} disabled={videoYukleniyor}>
                {videoYukleniyor ? 'Analiz Ediliyor...' : 'Videoyu Analiz Et'}
              </button>
            )}

            {videoHata && <p className="text-brand-red text-sm">{videoHata}</p>}

            {videoSonuc && (
              <div className="bento-card p-4 mt-2">
                <div className="font-label-mono text-label-mono text-on-surface-variant uppercase mb-2">Analiz Sonucu</div>
                <div className="font-stat-lg text-stat-lg text-primary">%{videoSonuc.genel_skor}</div>

                <button
                  onClick={() => setVideoKategoriAcik((v) => !v)}
                  className="w-full mt-3 py-2 bg-surface-container-high border border-outline-variant rounded-lg flex items-center justify-between px-3"
                >
                  <span className="font-label-mono text-xs uppercase text-on-surface-variant">Antrenman Detayını Göster</span>
                  <span className={`material-symbols-outlined text-primary text-base transition-transform ${videoKategoriAcik ? 'rotate-180' : ''}`}>expand_more</span>
                </button>
                {videoKategoriAcik && (
                  <div className="grid grid-cols-2 gap-2 mt-3">
                    {Object.entries(KATEGORI_LABELS).map(([key, label]) => {
                      const kat = videoSonuc[key];
                      if (!kat) return null;
                      return (
                        <div key={key} className="bg-surface-container-high rounded-lg p-3">
                          <p className="font-label-mono text-[10px] text-on-surface-variant uppercase mb-1">{label}</p>
                          <span className="font-stat-lg text-lg" style={{ color: kat.skor >= 75 ? '#41a447' : kat.skor >= 50 ? '#E8313F' : '#ffb4ab' }}>%{kat.skor}</span>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="mt-4 pt-4 border-t border-outline-variant/30">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="material-symbols-outlined text-purple-400 text-base">smart_toy</span>
                    <span className="font-label-mono text-[10px] text-purple-300 uppercase">AI Antrenör Yorumu</span>
                  </div>
                  {!videoAiYorum && !videoAiHata && (
                    <button className="w-full py-2 bg-surface-container-high border border-outline-variant rounded-lg font-label-mono text-xs uppercase disabled:opacity-50" onClick={videoAiYorumuAl} disabled={videoAiYukleniyor}>
                      {videoAiYukleniyor ? 'Analiz Hazırlanıyor...' : 'DETAYLI AI YORUMU AL'}
                    </button>
                  )}
                  {videoAiYorum && <p className="text-body-sm text-on-surface leading-relaxed">{videoAiYorum}</p>}
                  {videoAiHata && <p className="text-body-sm text-on-surface-variant">{videoAiHata}</p>}
                </div>
              </div>
            )}

            {!secilenVideo && (
              <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-5 mt-2">
                <div className="flex items-center gap-2 mb-3">
                  <span className="material-symbols-outlined text-blue-400 text-xl">tips_and_updates</span>
                  <h4 className="font-label-mono text-label-mono text-on-surface uppercase">İyi Bir Video İçin</h4>
                </div>
                <ul className="space-y-3">
                  <li className="flex gap-2">
                    <span className="material-symbols-outlined text-blue-400 text-base">check</span>
                    <p className="font-body-sm text-on-surface-variant">Kamerayı yere sabit, tam yandan konumlandırın.</p>
                  </li>
                  <li className="flex gap-2">
                    <span className="material-symbols-outlined text-blue-400 text-base">check</span>
                    <p className="font-body-sm text-on-surface-variant">Tüm vücudunuz baştan ayağa kadraja sığsın.</p>
                  </li>
                  <li className="flex gap-2">
                    <span className="material-symbols-outlined text-blue-400 text-base">check</span>
                    <p className="font-body-sm text-on-surface-variant">En az 3-5 tekrar yapılan bir kayıt yükleyin.</p>
                  </li>
                  <li className="flex gap-2">
                    <span className="material-symbols-outlined text-blue-400 text-base">check</span>
                    <p className="font-body-sm text-on-surface-variant">Aydınlık bir ortamda, dar kıyafetle çekim yapın.</p>
                  </li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Dashboard() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const poseLandmarkerRef = useRef(null);
  const animFrameRef = useRef(null);
  const framesRef = useRef([]);
  const phaseRef = useRef('idle');
  const streamRef = useRef(null);
  const detectStartedRef = useRef(false);

  const [modelReady, setModelReady] = useState(false);
  const [phase, setPhase] = useState('idle');
  const [countdown, setCountdown] = useState(3);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [aiYorum, setAiYorum] = useState('');
  const [aiYukleniyor, setAiYukleniyor] = useState(false);
  const [aiHata, setAiHata] = useState('');
  const [kategoriAcik, setKategoriAcik] = useState(false);
  const [onKamera, setOnKamera] = useState(true);
  const [activeTab, setActiveTab] = useState('canli');
  const [elapsedSec, setElapsedSec] = useState(0);

  const token = localStorage.getItem('token');
  const apiUrl = import.meta.env.VITE_API_URL;

  const kamerayiAc = async (onMu) => {
    if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
    const yeniStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: onMu ? 'user' : 'environment' } });
    streamRef.current = yeniStream;
    videoRef.current.srcObject = yeniStream;
  };

  const kameraDegistir = async () => {
    const yeni = !onKamera;
    setOnKamera(yeni);
    try { await kamerayiAc(yeni); } catch { setError('Seçilen kameraya erişilemedi.'); setOnKamera(!yeni); }
  };

  useEffect(() => {
    let poseLandmarker;
    const init = async () => {
      const vision = await FilesetResolver.forVisionTasks('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm');
      poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
          delegate: 'GPU',
        },
        runningMode: 'VIDEO',
        numPoses: 1,
      });
      poseLandmarkerRef.current = poseLandmarker;
      setModelReady(true);

      await kamerayiAc(onKamera);
      videoRef.current.onloadeddata = () => {
        if (!detectStartedRef.current) { detectStartedRef.current = true; detectLoop(); }
      };
    };

    const detectLoop = () => {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      const drawingUtils = new DrawingUtils(ctx);

      const detect = () => {
        if (!videoRef.current || !canvasRef.current || !poseLandmarkerRef.current) return;
        const now = performance.now();
        const results = poseLandmarkerRef.current.detectForVideo(videoRef.current, now);
        ctx.save();
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (results.landmarks && results.landmarks.length > 0) {
          drawingUtils.drawConnectors(results.landmarks[0], PoseLandmarker.POSE_CONNECTIONS, { color: '#e8313f', lineWidth: 3 });
          drawingUtils.drawLandmarks(results.landmarks[0], { color: '#f5f5f5', lineWidth: 1, radius: 3 });
          if (phaseRef.current === 'recording') {
            const flat = [];
            results.landmarks[0].forEach((lm) => flat.push(lm.x, lm.y, lm.z, lm.visibility ?? 0));
            framesRef.current.push(flat);
          }
        }
        ctx.restore();
        animFrameRef.current = requestAnimationFrame(detect);
      };
      animFrameRef.current = requestAnimationFrame(detect);
    };

    init().catch(() => setError('Kamera erişimi reddedildi.'));

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
      if (poseLandmarker) poseLandmarker.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setPhaseSync = (val) => { phaseRef.current = val; setPhase(val); };

  useEffect(() => {
    let interval;
    if (phase === 'recording') {
      setElapsedSec(0);
      interval = setInterval(() => setElapsedSec((s) => s + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [phase]);

  const handleStart = () => {
    setResult(null);
    setError('');
    framesRef.current = [];
    setPhaseSync('countdown');
    let count = 3;
    setCountdown(count);
    const interval = setInterval(() => {
      count -= 1;
      if (count <= 0) { clearInterval(interval); setPhaseSync('recording'); }
      else setCountdown(count);
    }, 1000);
  };

  const handleStop = async () => {
    setPhaseSync('analyzing');
    const frames = [...framesRef.current];
    framesRef.current = [];

    if (frames.length < 10) {
      setError('Yeterli veri toplanamadı. Lütfen daha uzun süre hareket yapın.');
      setPhaseSync('idle');
      return;
    }

    try {
      const res = await axios.post(`${apiUrl}/api/analyze/session`, { frames }, { headers: { Authorization: `Bearer ${token}` } });
      setResult(res.data);
      setPhaseSync('result');
    } catch (err) {
      setError(err.response?.data?.detail || 'Analiz sırasında hata oluştu.');
      setPhaseSync('idle');
    }
  };

  const handleReset = () => {
    setResult(null);
    setError('');
    setPhaseSync('idle');
    setAiYorum('');
    setAiHata('');
  };

  const aiYorumuAl = async () => {
    setAiYukleniyor(true);
    setAiHata('');
    setAiYorum('');
    try {
      const kategoriSkorlari = {};
      Object.entries(KATEGORI_LABELS).forEach(([key, label]) => {
        if (result[key]) kategoriSkorlari[label] = result[key].skor;
      });
      const res = await axios.post(
        `${apiUrl}/api/yerel-ai/antrenor-yorumu`,
        { hareket: 'squat', genel_skor: result.genel_skor, kategori_skorlari: kategoriSkorlari },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAiYorum(res.data.yorum);
    } catch {
      setAiHata('AI yorumu alınamadı, lütfen tekrar deneyin.');
    } finally {
      setAiYukleniyor(false);
    }
  };

  return (
    <div>
      <Sidebar />
      <main className="md:ml-64 min-h-screen pt-16 md:pt-0 relative overflow-hidden flex flex-col">
        <div className="absolute top-20 md:top-6 left-1/2 -translate-x-1/2 z-30 flex bg-surface-container rounded-full p-1 border border-outline-variant shadow-xl">
          <button
            className={`px-8 py-2 rounded-full font-label-mono uppercase transition-all ${activeTab === 'canli' ? 'bg-primary-container text-on-primary-container font-bold' : 'text-on-surface-variant font-medium hover:text-on-surface'}`}
            onClick={() => setActiveTab('canli')}
          >
            CANLI
          </button>
          <button
            className={`px-8 py-2 rounded-full font-label-mono uppercase transition-all ${activeTab === 'video' ? 'bg-primary-container text-on-primary-container font-bold' : 'text-on-surface-variant font-medium hover:text-on-surface'}`}
            onClick={() => setActiveTab('video')}
          >
            VİDEO
          </button>
        </div>

        {activeTab === 'video' ? (
          <VideoAnalizBolumu apiUrl={apiUrl} token={token} />
        ) : (
          <div className="flex-1 relative bg-surface-lowest overflow-hidden">
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-10 left-10 w-20 h-20 border-t-2 border-l-2 border-primary opacity-50"></div>
              <div className="absolute top-10 right-10 w-20 h-20 border-t-2 border-r-2 border-primary opacity-50"></div>
              <div className="absolute bottom-10 left-10 w-20 h-20 border-b-2 border-l-2 border-primary opacity-50"></div>
              <div className="absolute bottom-10 right-10 w-20 h-20 border-b-2 border-r-2 border-primary opacity-50"></div>
            </div>

            <div className="relative w-full h-full flex items-center justify-center">
              <video ref={videoRef} autoPlay playsInline muted className="hidden" />
              <canvas ref={canvasRef} width="640" height="480" className="max-w-full max-h-full" style={{ transform: 'scaleX(-1)' }} />
            </div>

            <div className="absolute top-36 md:top-24 left-1/2 -translate-x-1/2 w-[90%] md:w-auto px-6 py-3 bg-surface-container-high/80 backdrop-blur-md rounded-xl border border-outline-variant flex items-center justify-between gap-8 z-20">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary-container">info</span>
                <p className="font-body-md text-on-surface font-medium">Vücudunuzun tamamını çerçevede tutun</p>
              </div>
              <button className="p-2 hover:bg-surface-container-highest rounded-lg transition-colors" onClick={kameraDegistir} disabled={phase === 'recording' || phase === 'countdown' || phase === 'analyzing'}>
                <span className="material-symbols-outlined text-on-surface">flip_camera_ios</span>
              </button>
            </div>

            {phase === 'countdown' && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="text-[180px] md:text-[240px] font-black font-display-lg text-primary" style={{ filter: 'drop-shadow(0 0 30px rgba(232,49,63,0.5))' }}>{countdown}</span>
              </div>
            )}

            {!modelReady && phase === 'idle' && (
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-on-surface-variant font-label-mono">Model yükleniyor...</p>
              </div>
            )}

            {error && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/70 z-40">
                <p className="text-brand-red text-center px-6">{error}</p>
                <button className="px-6 py-3 bg-primary text-on-primary font-bold rounded-xl uppercase font-label-mono" onClick={handleReset}>Tekrar Dene</button>
              </div>
            )}

            {phase === 'idle' && modelReady && !error && (
              <div className="absolute bottom-0 left-0 w-full bg-surface-container-high border-t border-outline-variant p-6 z-30 shadow-[0_-20px_50px_rgba(0,0,0,0.5)] rounded-t-[32px]">
                <div className="max-w-4xl mx-auto flex flex-col items-center gap-6">
                  <p className="text-on-surface-variant text-center text-sm">Squat yapın. Başlat'a basın, 3'ten geriye sayacak ve analiz başlayacak.</p>
                  <button
                    className="w-full md:w-64 py-4 bg-primary text-on-primary font-bold rounded-xl flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform active:scale-95 shadow-lg shadow-primary/20 uppercase tracking-tight"
                    onClick={handleStart}
                  >
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>play_circle</span> BAŞLAT
                  </button>
                </div>
              </div>
            )}

            {phase === 'recording' && (
              <div className="absolute bottom-0 left-0 w-full bg-surface-container-high border-t border-outline-variant p-6 z-30 shadow-[0_-20px_50px_rgba(0,0,0,0.5)] rounded-t-[32px]">
                <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="flex gap-8 md:gap-16 w-full md:w-auto justify-between md:justify-start">
                    <div className="flex flex-col">
                      <span className="font-label-mono text-label-mono text-on-surface-variant uppercase tracking-widest mb-1">GEÇEN SÜRE</span>
                      <span className="font-stat-lg text-stat-lg text-primary">{String(Math.floor(elapsedSec / 60)).padStart(2, '0')}:{String(elapsedSec % 60).padStart(2, '0')}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="font-label-mono text-label-mono text-on-surface-variant uppercase tracking-widest mb-1">TOPLANAN KARE</span>
                      <span className="font-stat-lg text-stat-lg text-on-surface">{framesRef.current.length}</span>
                    </div>
                  </div>
                  <button
                    className="w-full md:w-48 py-4 bg-primary text-on-primary font-bold rounded-xl flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform active:scale-95 shadow-lg shadow-primary/20 uppercase tracking-tight"
                    onClick={handleStop}
                  >
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>stop_circle</span> DURDUR
                  </button>
                </div>
              </div>
            )}

            {phase === 'analyzing' && (
              <div className="absolute bottom-0 left-0 w-full bg-surface-container-high border-t border-outline-variant p-6 z-30 rounded-t-[32px] text-center">
                <p className="font-label-mono text-label-mono text-on-surface-variant uppercase">Analiz Ediliyor...</p>
              </div>
            )}

            {phase === 'result' && result && (
              <div className="fixed inset-x-0 bottom-0 z-50 flex items-end justify-center px-4">
                <div className="w-full max-w-5xl max-h-[90vh] overflow-y-auto bg-surface-container-lowest border-x border-t border-outline-variant rounded-t-[40px] p-8 pb-12 shadow-[0_-50px_100px_rgba(0,0,0,0.8)]">
                  <div className="w-16 h-1.5 bg-outline-variant rounded-full mx-auto mb-8"></div>
                  <div className="flex flex-col gap-10">
                    <header className="text-center">
                      <h2 className="font-display-lg text-display-lg-mobile md:text-display-lg text-on-surface mb-2">ANALİZ TAMAMLANDI</h2>
                      <p className="font-label-mono text-label-mono text-on-surface-variant uppercase">Veri setleri başarıyla işlendi ve optimize edildi</p>
                    </header>

                    <div className="bento-card p-8 border-l-[3px] border-primary-container text-center">
                      <p className="font-label-mono text-label-mono text-on-surface-variant uppercase mb-3">ANALİZ SONUCU</p>
                      <div className="flex items-baseline justify-center gap-2">
                        <span className="font-stat-lg text-6xl text-primary">{result.genel_skor}</span>
                        <span className="font-label-mono text-xl text-primary">%</span>
                      </div>
                    </div>

                    <div className="bento-card p-0 overflow-hidden">
                      <button
                        onClick={() => setKategoriAcik((v) => !v)}
                        className="w-full p-5 flex items-center justify-between text-left hover:bg-surface-container-high transition-colors"
                      >
                        <span className="font-label-mono text-label-mono uppercase text-on-surface-variant">Antrenman Detayını Göster</span>
                        <span className={`material-symbols-outlined text-primary transition-transform ${kategoriAcik ? 'rotate-180' : ''}`}>expand_more</span>
                      </button>
                      {kategoriAcik && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-bento-gap p-5 pt-0">
                          {Object.entries(KATEGORI_LABELS).map(([key, label]) => {
                            const kat = result[key];
                            if (!kat) return null;
                            return (
                              <div className="bg-surface-container-high rounded-xl p-4" key={key}>
                                <p className="font-label-mono text-label-mono text-on-surface-variant uppercase mb-2">{label}</p>
                                <span className="font-stat-lg text-2xl" style={{ color: kat.skor >= 75 ? '#41a447' : kat.skor >= 50 ? '#E8313F' : '#ffb4ab' }}>%{kat.skor}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <div className="bento-card p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <span className="material-symbols-outlined text-purple-400">smart_toy</span>
                        <h3 className="font-headline-md text-headline-md">AI Koç Analizi</h3>
                      </div>
                      {!aiYorum && !aiHata && (
                        <button className="w-full py-3 bg-surface-container-high border border-outline-variant rounded-lg font-label-mono uppercase disabled:opacity-50" onClick={aiYorumuAl} disabled={aiYukleniyor}>
                          {aiYukleniyor ? 'Analiz Hazırlanıyor...' : 'DETAYLI AI YORUMU AL'}
                        </button>
                      )}
                      {aiYorum && <p className="text-body-sm text-on-surface leading-relaxed">{aiYorum}</p>}
                      {aiHata && <p className="text-body-sm text-on-surface-variant">{aiHata}</p>}
                    </div>

                    <div className="flex flex-col md:flex-row gap-4 pt-4">
                      <button className="flex-1 py-4 bg-primary text-on-primary font-bold rounded-xl hover:brightness-110 transition-all uppercase font-label-mono" onClick={handleReset}>
                        YENİDEN BAŞLAT
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default Dashboard;