import { useState, useEffect, useRef } from 'react';
import Sidebar from '../components/sidebar';

function formatStopwatch(ms) {
  const totalCs = Math.floor(ms / 10);
  const cs = totalCs % 100;
  const totalSeconds = Math.floor(totalCs / 100);
  const s = totalSeconds % 60;
  const m = Math.floor(totalSeconds / 60);
  const h = Math.floor(m / 60);
  return `${String(h).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(cs).padStart(2, '0')}`;
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
  } catch {}
}

const PRESETS = [
  { sn: 60, label: 'HIIT Dinlenme' },
  { sn: 90, label: 'Hipertrofi' },
  { sn: 180, label: 'Güç Seti' },
  { sn: 300, label: 'Aktivasyon' },
];

function Timer() {
  const [tab, setTab] = useState('stopwatch');

  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const [laps, setLaps] = useState([]);
  const startRef = useRef(0);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (running) {
      startRef.current = Date.now() - elapsed;
      intervalRef.current = setInterval(() => setElapsed(Date.now() - startRef.current), 10);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  const handleStartPause = () => setRunning((r) => !r);
  const handleReset = () => { setRunning(false); setElapsed(0); setLaps([]); };
  const handleLap = () => setLaps((prev) => [elapsed, ...prev]);

  const [inputMinutes, setInputMinutes] = useState(5);
  const [inputSeconds, setInputSeconds] = useState(0);
  const [totalDuration, setTotalDuration] = useState(300);
  const [remaining, setRemaining] = useState(300);
  const [timerRunning, setTimerRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const timerIntervalRef = useRef(null);

  useEffect(() => {
    if (timerRunning) {
      timerIntervalRef.current = setInterval(() => {
        setRemaining((r) => {
          if (r <= 1) { clearInterval(timerIntervalRef.current); setTimerRunning(false); setFinished(true); playBeep(); return 0; }
          return r - 1;
        });
      }, 1000);
    } else {
      clearInterval(timerIntervalRef.current);
    }
    return () => clearInterval(timerIntervalRef.current);
  }, [timerRunning]);

  const handleSetPreset = (seconds) => {
    setTimerRunning(false); setFinished(false);
    setRemaining(seconds); setTotalDuration(seconds);
    setInputMinutes(Math.floor(seconds / 60)); setInputSeconds(seconds % 60);
  };

  const handleApplyCustom = () => {
    const total = Math.max(1, inputMinutes * 60 + inputSeconds);
    setTimerRunning(false); setFinished(false); setRemaining(total); setTotalDuration(total);
  };

  const handleTimerToggle = () => { if (remaining === 0) return; setFinished(false); setTimerRunning((r) => !r); };
  const handleTimerReset = () => { setTimerRunning(false); setFinished(false); setRemaining(totalDuration); };

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const ringCircumference = 1000;
  const progress = totalDuration > 0 ? remaining / totalDuration : 0;
  const ringOffset = ringCircumference * (1 - progress);

  return (
    <div>
      <Sidebar />
      <main className="md:pl-64 pt-20 md:pt-10 px-gutter min-h-screen pb-24 md:pb-10 bg-surface-container-lowest">
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-8 mb-10 border-b border-outline-variant">
            <button
              onClick={() => setTab('stopwatch')}
              className={`pb-4 font-label-mono text-label-mono uppercase tracking-widest border-b-2 transition-all ${tab === 'stopwatch' ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant hover:text-on-surface'}`}
            >
              KRONOMETRE
            </button>
            <button
              onClick={() => setTab('timer')}
              className={`pb-4 font-label-mono text-label-mono uppercase tracking-widest border-b-2 transition-all ${tab === 'timer' ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant hover:text-on-surface'}`}
            >
              ZAMANLAYICI
            </button>
          </div>

          {tab === 'stopwatch' && (
            <section className="space-y-8">
              <div className="bento-card p-12 text-center flex flex-col items-center">
                <div className="font-label-mono text-label-mono text-on-surface-variant uppercase mb-4 tracking-tighter">GEÇEN SÜRE</div>
                <div className="font-label-mono text-6xl md:text-8xl lg:text-9xl tracking-tighter font-bold tabular-nums text-on-surface">
                  {formatStopwatch(elapsed)}
                </div>
                <div className="flex items-center gap-12 mt-16">
                  <button onClick={handleReset} className="w-16 h-16 rounded-full flex items-center justify-center bg-surface-container-high text-on-surface hover:bg-surface-container-highest border border-outline">
                    <span className="material-symbols-outlined">restart_alt</span>
                  </button>
                  <button
                    onClick={handleStartPause}
                    className={`w-24 h-24 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center hover:scale-105 active:scale-95 shadow-xl transition-all ${running ? 'animate-pulse' : ''}`}
                  >
                    <span className="material-symbols-outlined text-5xl">{running ? 'pause' : 'play_arrow'}</span>
                  </button>
                  <button onClick={handleLap} disabled={!running} className="w-16 h-16 rounded-full flex items-center justify-center bg-surface-container-high text-on-surface hover:bg-surface-container-highest border border-outline disabled:opacity-40">
                    <span className="material-symbols-outlined">timer_10_alt_1</span>
                  </button>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-bento-gap">
                <div className="md:col-span-2 bento-card p-6 h-[300px] flex flex-col">
                  <div className="flex justify-between items-center mb-4 border-b border-outline-variant pb-2">
                    <h3 className="font-label-mono text-label-mono text-on-surface-variant uppercase">TUR KAYITLARI</h3>
                    <span className="font-label-mono text-xs text-primary"># LAP</span>
                  </div>
                  <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                    {laps.length === 0 && <div className="text-on-surface-variant font-label-mono text-center py-10 opacity-30">TUR KAYDI YOK</div>}
                    {laps.map((lap, i) => (
                      <div key={i} className="flex justify-between items-center bg-surface-container-low p-4 rounded-lg border border-outline-variant">
                        <span className="font-label-mono text-on-surface-variant text-base">TUR {laps.length - i}</span>
                        <span className="font-label-mono text-on-surface text-xl">{formatStopwatch(lap)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bento-card p-6 bg-amber-500/10 border-amber-500/20 flex flex-col justify-between">
                  <div>
                    <span className="material-symbols-outlined text-amber-400 text-3xl mb-4">info</span>
                    <h4 className="font-headline-md text-amber-400 mb-2">Performans İpucu</h4>
                    <p className="text-on-surface-variant leading-relaxed">Set arası 60-90 saniye dinlenin. ATP depolarının yenilenmesi için bu süre kritiktir.</p>
                  </div>
                </div>
              </div>
            </section>
          )}

          {tab === 'timer' && (
            <section className="space-y-8">
              <div className="bento-card p-12 flex flex-col items-center">
                <div className="relative w-64 h-64 md:w-80 md:h-80 flex items-center justify-center">
                  <svg className="absolute inset-0 w-full h-full -rotate-90">
                    <circle cx="50%" cy="50%" fill="transparent" r="48%" stroke="#1c1b1b" strokeWidth="8"></circle>
                    <circle
                      cx="50%" cy="50%" fill="transparent" r="48%" stroke={finished ? '#41a447' : '#E8313F'} strokeWidth="8" strokeLinecap="round"
                      strokeDasharray={ringCircumference} strokeDashoffset={ringOffset}
                      className="transition-all duration-1000"
                    ></circle>
                  </svg>
                  <div className="font-label-mono text-6xl md:text-7xl font-black text-on-surface z-10">
                    {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
                  </div>
                </div>

                <div className="mt-12 flex flex-col items-center gap-8 w-full max-w-xs">
                  {!timerRunning && remaining === totalDuration && (
                    <div className="grid grid-cols-2 gap-4 w-full">
                      <div className="space-y-2">
                        <label className="font-label-mono text-[10px] text-on-surface-variant uppercase">DAKİKA</label>
                        <input
                          type="number" min="0" value={inputMinutes}
                          onChange={(e) => setInputMinutes(Math.max(0, Number(e.target.value)))}
                          className="w-full bg-surface-container-lowest border border-outline p-3 rounded font-label-mono text-center text-xl focus:border-primary outline-none text-on-surface transition-colors"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="font-label-mono text-[10px] text-on-surface-variant uppercase">SANİYE</label>
                        <input
                          type="number" min="0" max="59" value={inputSeconds}
                          onChange={(e) => setInputSeconds(Math.min(59, Math.max(0, Number(e.target.value))))}
                          className="w-full bg-surface-container-lowest border border-outline p-3 rounded font-label-mono text-center text-xl focus:border-primary outline-none text-on-surface transition-colors"
                        />
                      </div>
                    </div>
                  )}

                  {!timerRunning && remaining === totalDuration && (
                    <button onClick={handleApplyCustom} className="w-full py-3 bg-surface-container-high border border-outline-variant rounded-lg font-label-mono uppercase text-sm">
                      Ayarla
                    </button>
                  )}

                  <div className="flex items-center gap-8">
                    <button onClick={handleTimerReset} className="w-16 h-16 rounded-full flex items-center justify-center bg-surface-container-high text-on-surface hover:bg-surface-container-highest border border-outline">
                      <span className="material-symbols-outlined">restart_alt</span>
                    </button>
                    <button onClick={handleTimerToggle} className="w-20 h-20 rounded-full bg-primary text-on-primary flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-lg">
                      <span className="material-symbols-outlined text-4xl">{timerRunning ? 'pause' : 'play_arrow'}</span>
                    </button>
                  </div>

                  {finished && <div className="font-label-mono text-emerald-400 uppercase">⏰ Süre doldu!</div>}
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-bento-gap">
                {PRESETS.map((p) => (
                  <button key={p.sn} onClick={() => handleSetPreset(p.sn)} className="bento-card p-4 text-center hover:border-primary transition-colors group">
                    <div className="font-label-mono text-lg text-on-surface group-hover:text-primary transition-colors">
                      {String(Math.floor(p.sn / 60)).padStart(2, '0')}:{String(p.sn % 60).padStart(2, '0')}
                    </div>
                    <div className="font-label-mono text-[10px] text-on-surface-variant uppercase">{p.label}</div>
                  </button>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}

export default Timer;