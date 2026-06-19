import { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Flag, Info } from 'lucide-react';
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

function ProgressRing({ progress, color, finished, size = 280 }) {
  const stroke = 10;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const safeProgress = Math.min(Math.max(progress, 0), 1);
  const offset = circumference * (1 - safeProgress);

  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--surface-2)" strokeWidth={stroke} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={finished ? '#4CAF50' : color}
        strokeWidth={stroke}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.5s linear' }}
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

  return (
    <div>
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '20px', padding: '48px 24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '16px' }}>GEÇEN SÜRE</div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'clamp(2.4rem, 8vw, 5rem)', letterSpacing: '-0.02em', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
          {formatStopwatch(elapsed)}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '32px', marginTop: '48px' }}>
          <button onClick={handleReset} style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <RotateCcw size={22} />
          </button>
          <button
            onClick={handleStartPause}
            style={{ width: '92px', height: '92px', borderRadius: '50%', background: 'var(--accent)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: 'none', boxShadow: '0 10px 30px -10px var(--accent)' }}
          >
            {running ? <Pause size={36} /> : <Play size={36} />}
          </button>
          <button onClick={handleLap} disabled={!running} style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'var(--surface-2)', border: '1px solid var(--border)', color: running ? 'var(--text)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: running ? 'pointer' : 'not-allowed', opacity: running ? 1 : 0.5 }}>
            <Flag size={22} />
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px', marginTop: '16px' }} className="timer-bottom-grid">
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '14px', padding: '20px', height: '280px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '10px', marginBottom: '12px' }}>
            <h3 style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>TUR KAYITLARI</h3>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--accent)' }}># LAP</span>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {laps.length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', marginTop: '32px' }}>Henüz tur kaydı yok</p>}
            {laps.map((lap, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--surface-2)', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--text-muted)' }}>TUR {laps.length - i}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '1rem' }}>{formatStopwatch(lap)}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: 'rgba(232,49,63,0.06)', border: '1px solid rgba(232,49,63,0.15)', borderRadius: '14px', padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <Info size={26} color="var(--accent)" style={{ marginBottom: '12px' }} />
            <h4 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--accent)', marginBottom: '8px', fontSize: '1rem' }}>Performans İpucu</h4>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', lineHeight: 1.5 }}>Set arası 60-90 saniye dinlenin. ATP depolarının yenilenmesi için bu süre kritiktir.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

const PRESETS = [
  { sn: 60, label: 'HIIT Dinlenme' },
  { sn: 90, label: 'Hipertrofi' },
  { sn: 180, label: 'Güç Seti' },
  { sn: 300, label: 'Aktivasyon' },
];

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
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '20px', padding: '48px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ position: 'relative', width: '280px', height: '280px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ProgressRing progress={progress} color="var(--accent)" finished={finished} />
          <div style={{ position: 'absolute', fontFamily: 'var(--font-mono)', fontSize: 'clamp(2rem, 6vw, 3.4rem)', fontWeight: 900, color: finished ? '#4CAF50' : 'var(--text)' }}>
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </div>
        </div>

        {!running && remaining === totalDuration && (
          <div style={{ display: 'flex', gap: '16px', marginTop: '32px', width: '100%', maxWidth: '320px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>DAKİKA</label>
              <input
                type="number" min="0" value={inputMinutes}
                onChange={(e) => setInputMinutes(Math.max(0, Number(e.target.value)))}
                style={{ width: '100%', background: 'var(--surface-lowest, #0e0e0e)', border: '1px solid var(--border)', borderRadius: '8px', padding: '12px', textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: '1.2rem', color: 'var(--text)' }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>SANİYE</label>
              <input
                type="number" min="0" max="59" value={inputSeconds}
                onChange={(e) => setInputSeconds(Math.min(59, Math.max(0, Number(e.target.value))))}
                style={{ width: '100%', background: 'var(--surface-lowest, #0e0e0e)', border: '1px solid var(--border)', borderRadius: '8px', padding: '12px', textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: '1.2rem', color: 'var(--text)' }}
              />
            </div>
          </div>
        )}

        {!running && remaining === totalDuration && (
          <button
            onClick={() => { const total = Math.max(1, inputMinutes * 60 + inputSeconds); setRunning(false); setFinished(false); setRemaining(total); setTotalDuration(total); }}
            className="submit-btn"
            style={{ marginTop: '16px', maxWidth: '320px' }}
          >
            Ayarla
          </button>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '32px', marginTop: '32px' }}>
          <button onClick={handleReset} style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <RotateCcw size={22} />
          </button>
          <button
            onClick={handleStartPause}
            style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--accent)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: 'none' }}
          >
            {running ? <Pause size={32} /> : <Play size={32} />}
          </button>
        </div>

        {finished && <div className="info-banner" style={{ marginTop: '24px' }}>⏰ Süre doldu!</div>}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginTop: '16px' }} className="preset-grid">
        {PRESETS.map((p) => (
          <button
            key={p.sn}
            onClick={() => handleSetPreset(p.sn)}
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px', textAlign: 'center', cursor: 'pointer' }}
          >
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.05rem' }}>{String(Math.floor(p.sn / 60)).padStart(2, '0')}:{String(p.sn % 60).padStart(2, '0')}</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: '4px' }}>{p.label}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

function TimerPage() {
  const [tab, setTab] = useState('kronometre');

  return (
    <div>
      <Sidebar />

      <div style={{ display: 'flex', gap: '32px', marginBottom: '32px', borderBottom: '1px solid var(--border)' }}>
        <button
          onClick={() => setTab('kronometre')}
          style={{
            padding: '0 0 16px', background: 'none', border: 'none', cursor: 'pointer',
            fontFamily: 'var(--font-mono)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em',
            borderBottom: tab === 'kronometre' ? '2px solid var(--accent)' : '2px solid transparent',
            color: tab === 'kronometre' ? 'var(--accent)' : 'var(--text-muted)',
          }}
        >
          KRONOMETRE
        </button>
        <button
          onClick={() => setTab('zamanlayici')}
          style={{
            padding: '0 0 16px', background: 'none', border: 'none', cursor: 'pointer',
            fontFamily: 'var(--font-mono)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em',
            borderBottom: tab === 'zamanlayici' ? '2px solid var(--accent)' : '2px solid transparent',
            color: tab === 'zamanlayici' ? 'var(--accent)' : 'var(--text-muted)',
          }}
        >
          ZAMANLAYICI
        </button>
      </div>

      {tab === 'kronometre' ? <Stopwatch /> : <CountdownTimer />}
    </div>
  );
}

export default TimerPage;