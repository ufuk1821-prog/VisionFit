import { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Flag } from 'lucide-react';
import Sidebar from '../components/sidebar';

function formatStopwatch(ms) {
  const totalCs = Math.floor(ms / 10);
  const cs = totalCs % 100;
  const totalSeconds = Math.floor(totalCs / 100);
  const s = totalSeconds % 60;
  const m = Math.floor(totalSeconds / 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(cs).padStart(2, '0')}`;
}

function playBeep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    gain.gain.value = 0.3;
    osc.start();
    osc.stop(ctx.currentTime + 0.5);
  } catch {
  }
}

function ProgressRing({ progress, color, finished }) {
  const size = 280;
  const stroke = 12;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const safeProgress = Math.min(Math.max(progress, 0), 1);
  const offset = circumference * (1 - safeProgress);

  return (
    <svg width={size} height={size} className="timer-ring-svg">
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--surface-2)" strokeWidth={stroke} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={finished ? 'var(--accent-2)' : color}
        strokeWidth={stroke}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        className="timer-ring-progress"
      />
    </svg>
  );
}

function Stopwatch() {
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const [laps, setLaps] = useState([]);
  const startRef = useRef(0);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (running) {
      startRef.current = Date.now() - elapsed;
      intervalRef.current = setInterval(() => {
        setElapsed(Date.now() - startRef.current);
      }, 10);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  const handleStartPause = () => setRunning((r) => !r);

  const handleReset = () => {
    setRunning(false);
    setElapsed(0);
    setLaps([]);
  };

  const handleLap = () => setLaps((prev) => [elapsed, ...prev]);

  const progress = (elapsed % 60000) / 60000;

  return (
    <div>
      <div className="timer-ring-wrapper">
        <ProgressRing progress={progress} color="var(--accent)" />
        <div className="timer-ring-display">{formatStopwatch(elapsed)}</div>
      </div>

      <div className="timer-controls">
        <button className="timer-btn primary" onClick={handleStartPause}>
          {running ? <Pause size={22} /> : <Play size={22} />}
          {running ? 'Duraklat' : 'Başlat'}
        </button>
        <button className="timer-btn" onClick={handleLap} disabled={!running}>
          <Flag size={22} />
          Tur
        </button>
        <button className="timer-btn" onClick={handleReset}>
          <RotateCcw size={22} />
          Sıfırla
        </button>
      </div>

      {laps.length > 0 && (
        <div className="lap-list">
          {laps.map((lap, i) => (
            <div className="lap-item" key={i}>
              <span>Tur {laps.length - i}</span>
              <span>{formatStopwatch(lap)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const PRESETS = [30, 60, 90, 120, 180, 300];

function CountdownTimer() {
  const [inputMinutes, setInputMinutes] = useState(1);
  const [inputSeconds, setInputSeconds] = useState(0);
  const [totalDuration, setTotalDuration] = useState(60);
  const [remaining, setRemaining] = useState(60);
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setRemaining((r) => {
          if (r <= 1) {
            clearInterval(intervalRef.current);
            setRunning(false);
            setFinished(true);
            playBeep();
            return 0;
          }
          return r - 1;
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [running]);

  const handleSetPreset = (seconds) => {
    setRunning(false);
    setFinished(false);
    setRemaining(seconds);
    setTotalDuration(seconds);
    setInputMinutes(Math.floor(seconds / 60));
    setInputSeconds(seconds % 60);
  };

  const handleApplyCustom = () => {
    const total = Math.max(1, inputMinutes * 60 + inputSeconds);
    setRunning(false);
    setFinished(false);
    setRemaining(total);
    setTotalDuration(total);
  };

  const handleStartPause = () => {
    if (remaining === 0) return;
    setFinished(false);
    setRunning((r) => !r);
  };

  const handleReset = () => {
    setRunning(false);
    setFinished(false);
    setRemaining(totalDuration);
  };

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const progress = totalDuration > 0 ? remaining / totalDuration : 0;

  return (
    <div>
      <div className="timer-ring-wrapper">
        <ProgressRing progress={progress} color="var(--accent-blue)" finished={finished} />
        <div className={`timer-ring-display ${finished ? 'finished' : ''}`}>
          {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
        </div>
      </div>

      <div className="quick-add-row">
        {PRESETS.map((p) => (
          <button key={p} className="quick-add-btn" onClick={() => handleSetPreset(p)}>
            {p < 60 ? `${p} sn` : `${p / 60} dk`}
          </button>
        ))}
      </div>

      <div className="timer-custom-row">
        <div className="form-group">
          <label>Dakika</label>
          <input
            type="number"
            min="0"
            value={inputMinutes}
            onChange={(e) => setInputMinutes(Math.max(0, Number(e.target.value)))}
          />
        </div>
        <div className="form-group">
          <label>Saniye</label>
          <input
            type="number"
            min="0"
            max="59"
            value={inputSeconds}
            onChange={(e) => setInputSeconds(Math.min(59, Math.max(0, Number(e.target.value))))}
          />
        </div>
        <button className="submit-btn timer-apply-btn" onClick={handleApplyCustom}>
          Ayarla
        </button>
      </div>

      <div className="timer-controls">
        <button className="timer-btn primary" onClick={handleStartPause}>
          {running ? <Pause size={22} /> : <Play size={22} />}
          {running ? 'Duraklat' : 'Başlat'}
        </button>
        <button className="timer-btn" onClick={handleReset}>
          <RotateCcw size={22} />
          Sıfırla
        </button>
      </div>

      {finished && <div className="info-banner">⏰ Süre doldu!</div>}
    </div>
  );
}

const REST_TIPS = [
  { hedef: 'Maksimal Güç (1-5 Tekrar)', sure: '3 - 5 dakika' },
  { hedef: 'Kas Kütlesi / Hipertrofi (6-12 Tekrar)', sure: '60 - 90 saniye' },
  { hedef: 'Kas Dayanıklılığı (12+ Tekrar)', sure: '30 - 45 saniye' },
  { hedef: 'Süper Set / Devre Antrenmanı', sure: '15 - 30 saniye' },
];

function TimerPage() {
  const [tab, setTab] = useState('kronometre');

  return (
    <div>
      <Sidebar />
      <div className="section-title">Kronometre &amp; Zamanlayıcı</div>
      <p style={{ color: 'var(--text-muted)', marginBottom: '20px' }}>
        Setler arası dinlenme süresini takip edin veya antrenmanınızın toplam süresini ölçün.
      </p>

      <div className="tab-switcher">
        <button className={`tab-btn ${tab === 'kronometre' ? 'active' : ''}`} onClick={() => setTab('kronometre')}>
          Kronometre
        </button>
        <button className={`tab-btn ${tab === 'zamanlayici' ? 'active' : ''}`} onClick={() => setTab('zamanlayici')}>
          Zamanlayıcı
        </button>
      </div>

      <div className="timer-card">
        {tab === 'kronometre' ? <Stopwatch /> : <CountdownTimer />}
      </div>

      <div className="chart-card">
        <div className="section-title" style={{ marginTop: 0 }}>Önerilen Dinlenme Süreleri</div>
        <div className="rest-tip-grid">
          {REST_TIPS.map((tip) => (
            <div className="rest-tip-card" key={tip.hedef}>
              <span className="rest-tip-label">{tip.hedef}</span>
              <span className="rest-tip-value">{tip.sure}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default TimerPage;