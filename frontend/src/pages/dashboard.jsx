import { useEffect, useRef, useState } from 'react';
import { PoseLandmarker, FilesetResolver, DrawingUtils } from '@mediapipe/tasks-vision';
import axios from 'axios';
import { Play, Square, CheckCircle, XCircle, SwitchCamera } from 'lucide-react';
import Sidebar from '../components/sidebar';

const KATEGORI_LABELS = {
  genel_form: 'Genel Form',
  omurga_notrluğu: 'Omurga Nötrlüğü',
  kalca_derinligi: 'Kalça Derinliği',
  diz_hizasi: 'Diz Hizası',
  diz_cokusu: 'Diz Çöküşü',
  agirlik_merkezi: 'Ağırlık Merkezi',
};

function ScoreBar({ skor }) {
  const color = skor >= 75 ? 'var(--accent)' : skor >= 50 ? 'var(--accent-2)' : 'var(--danger)';
  return (
    <div style={{ width: '100%' }}>
      <div style={{ height: '8px', background: 'var(--surface-2)', borderRadius: '4px', overflow: 'hidden', marginTop: '4px' }}>
        <div style={{ width: `${skor}%`, height: '100%', background: color, borderRadius: '4px', transition: 'width 0.5s' }} />
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

  const [modelReady, setModelReady] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [phase, setPhase] = useState('idle');
  const [countdown, setCountdown] = useState(3);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [onKamera, setOnKamera] = useState(true);

  const streamRef = useRef(null);
  const detectStartedRef = useRef(false);

  const token = localStorage.getItem('token');
  const apiUrl = import.meta.env.VITE_API_URL;

  const kamerayiAc = async (onMu) => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
    }
    const yeniStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: onMu ? 'user' : 'environment' },
    });
    streamRef.current = yeniStream;
    videoRef.current.srcObject = yeniStream;
  };

  const kameraDegistir = async () => {
    const yeni = !onKamera;
    setOnKamera(yeni);
    try {
      await kamerayiAc(yeni);
    } catch {
      setError('Seçilen kameraya erişilemedi.');
      setOnKamera(!yeni);
    }
  };

  useEffect(() => {
    let poseLandmarker;

    const init = async () => {
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
      );
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
        setCameraReady(true);
        if (!detectStartedRef.current) {
          detectStartedRef.current = true;
          detectLoop();
        }
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
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

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
  }, []);

  const phaseRef = useRef('idle');
  const setPhaseSync = (val) => {
    phaseRef.current = val;
    setPhase(val);
  };

  const handleStart = () => {
    setResult(null);
    setError('');
    framesRef.current = [];
    setPhaseSync('countdown');
    let count = 3;
    setCountdown(count);
    const interval = setInterval(() => {
      count -= 1;
      if (count <= 0) {
        clearInterval(interval);
        setPhaseSync('recording');
      } else {
        setCountdown(count);
      }
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
      const res = await axios.post(
        `${apiUrl}/api/analyze/session`,
        { frames },
        { headers: { Authorization: `Bearer ${token}` } }
      );
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
  };

  return (
    <div>
      <Sidebar />
      <div className="section-title">Kamera Analizi</div>

      <div className="main-wrapper">
        <div className="video-container" style={{ position: 'relative' }}>
          <video ref={videoRef} id="webcam" autoPlay playsInline muted />
          <canvas ref={canvasRef} id="output_canvas" width="640" height="480" />

          <button
            className="timer-btn"
            style={{ position: 'absolute', top: '12px', right: '12px', zIndex: 5, width: 'auto', padding: '8px 14px' }}
            onClick={kameraDegistir}
            disabled={phase === 'recording' || phase === 'countdown' || phase === 'analyzing'}
            title="Kamerayı Değiştir"
          >
            <SwitchCamera size={18} /> {onKamera ? 'Arka Kamera' : 'Ön Kamera'}
          </button>

          {phase === 'countdown' && (
            <div className="camera-overlay">
              <div className="countdown-number">{countdown}</div>
              <p>Hazırlan...</p>
            </div>
          )}

          {phase === 'analyzing' && (
            <div className="camera-overlay">
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent)' }}>
                Analiz ediliyor...
              </div>
            </div>
          )}

          {!modelReady && (
            <div className="camera-overlay">
              <div style={{ color: 'var(--text-muted)' }}>Model yükleniyor...</div>
            </div>
          )}

          {error && (
            <div className="camera-overlay">
              <div style={{ color: 'var(--danger)', textAlign: 'center' }}>{error}</div>
              <button className="submit-btn" style={{ marginTop: '16px', width: 'auto' }} onClick={handleReset}>Tekrar Dene</button>
            </div>
          )}
        </div>

        <div className="dashboard">
          {phase === 'idle' && cameraReady && (
            <div className="card status-card" style={{ alignItems: 'center', textAlign: 'center', gap: '16px' }}>
              <div className="card-title" style={{ fontSize: '1rem' }}>Hazır</div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                Squat yapın. Başlat'a basın, 3'ten geriye sayacak ve analiz başlayacak.
              </p>
              <button className="timer-btn primary" style={{ width: '100%', justifyContent: 'center' }} onClick={handleStart}>
                <Play size={20} /> Başlat
              </button>
            </div>
          )}

          {phase === 'recording' && (
            <div className="card status-card" style={{ alignItems: 'center', textAlign: 'center', gap: '16px' }}>
              <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: 'var(--danger)', animation: 'pulse 1s infinite' }} />
              <div className="card-value" style={{ fontSize: '1.2rem', color: 'var(--danger)' }}>Kayıt Devam Ediyor</div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Squatları yapın, bitince durdurun.</p>
              <button className="timer-btn" style={{ width: '100%', justifyContent: 'center', borderColor: 'var(--danger)', color: 'var(--danger)' }} onClick={handleStop}>
                <Square size={20} /> Durdur ve Analiz Et
              </button>
            </div>
          )}

          {phase === 'countdown' && (
            <div className="card" style={{ alignItems: 'center', textAlign: 'center' }}>
              <div className="card-value" style={{ fontSize: '3rem', color: 'var(--accent)' }}>{countdown}</div>
              <div className="card-title">Hazırlan!</div>
            </div>
          )}

          {phase === 'analyzing' && (
            <div className="card" style={{ alignItems: 'center', textAlign: 'center' }}>
              <div className="card-title">Analiz ediliyor...</div>
            </div>
          )}

          {phase === 'result' && result && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="card status-card" style={{ textAlign: 'center' }}>
                <div className="card-title">Genel Skor</div>
                <div className="card-value" style={{ fontSize: '3rem', color: result.genel_skor >= 75 ? 'var(--accent)' : result.genel_skor >= 50 ? 'var(--accent-2)' : 'var(--danger)' }}>
                  %{result.genel_skor}
                </div>
                <div className="card-subtext">{result.squat_kare} squat karesi analiz edildi</div>
              </div>

              <div className="card">
                <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                  <CheckCircle size={18} color="var(--accent)" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <span style={{ fontSize: '0.85rem', color: 'var(--text)' }}>{result.olumlu_mesaj}</span>
                </div>
              </div>

              <div className="card">
                <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                  <XCircle size={18} color="var(--accent-2)" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <span style={{ fontSize: '0.85rem', color: 'var(--text)' }}>{result.gelistirilecek_mesaj}</span>
                </div>
              </div>

              <button className="timer-btn primary" style={{ justifyContent: 'center' }} onClick={handleReset}>
                <Play size={18} /> Yeni Antrenman
              </button>
            </div>
          )}
        </div>
      </div>

      {phase === 'result' && result && (
        <>
          <div className="section-title">Kategori Detayları</div>
          <div className="dashboard-grid">
            {['genel_form', 'omurga_notrluğu', 'kalca_derinligi', 'diz_hizasi', 'diz_cokusu', 'agirlik_merkezi'].map((key) => {
              const kat = result[key];
              const color = kat.skor >= 75 ? 'var(--accent)' : kat.skor >= 50 ? 'var(--accent-2)' : 'var(--danger)';
              return (
                <div className="card" key={key}>
                  <div className="card-title">{KATEGORI_LABELS[key]}</div>
                  <div className="card-value" style={{ fontSize: '1.8rem', color }}>%{kat.skor}</div>
                  <ScoreBar skor={kat.skor} />
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '8px' }}>{kat.mesaj}</p>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

export default Dashboard;