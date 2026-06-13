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
    // ses desteklenmiyor, sessizce gec
  }
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

  return (
    <div>
      <div className="timer-display">{formatStopwatch(elapsed)}</div>
      <div className="timer-controls">
        <button className="timer-btn primary" onClick={handleStartPause}>
          {running ? <Pause size={20} /> : <Play size={20} />}
          {running ? 'Duraklat' : 'Başlat'}
        </button>
        <button className="timer-btn" onClick={handleLap} disabled={!running}>
          <Flag size={20} />
          Tur
        </button>
        <button className="timer-btn" onClick={handleReset}>
          <RotateCcw size={20} />
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

const PRESETS = [30, 60, 90, 120, 180];

function CountdownTimer() {
  const [inputMinutes, setInputMinutes] = useState(1);
  const [inputSeconds, setInputSeconds] = useState(0);
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
    setInputMinutes(Math.floor(seconds / 60));
    setInputSeconds(seconds % 60);
  };

  const handleApplyCustom = () => {
    const total = Math.max(1, inputMinutes * 60 + inputSeconds);
    setRunning(false);
    setFinished(false);
    setRemaining(total);
  };

  const handleStartPause = () => {
    if (remaining === 0) return;
    setFinished(false);
    setRunning((r) => !r);
  };

  const handleReset = () => {
    setRunning(false);
    setFinished(false);
    const total = Math.max(1, inputMinutes * 60 + inputSeconds);
    setRemaining(total);
  };

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;

  return (
    <div>
      <div className={`timer-display ${finished ? 'finished' : ''}`}>
        {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
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
          {running ? <Pause size={20} /> : <Play size={20} />}
          {running ? 'Duraklat' : 'Başlat'}
        </button>
        <button className="timer-btn" onClick={handleReset}>
          <RotateCcw size={20} />
          Sıfırla
        </button>
      </div>

      {finished && <div className="info-banner">⏰ Süre doldu!</div>}
    </div>
  );
}

function TimerPage() {
  const [tab, setTab] = useState('kronometre');

  return (
    <div>
      <Sidebar />
      <div className="section-title">Kronometre &amp; Zamanlayıcı</div>

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
    </div>
  );
}

export default TimerPage;