import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Ruler, Flame, Target, Footprints, Activity, ArrowRight, ChevronRight, Video, Camera, History as HistoryIcon, Salad, Utensils, Award } from 'lucide-react';
import Sidebar from '../components/sidebar';
import useCountUp from '../hooks/useCountUp';

const BMI_LABELS = {
  Zayif: 'Zayıf',
  Normal: 'Normal',
  Kilolu: 'Kilolu',
  Obez: 'Obez',
};

const QUICK_ACCESS = [
  { path: '/dashboard', icon: Video, label: 'Kamera Analizi' },
  { path: '/plank', icon: Camera, label: 'Fotoğraf Analizi' },
  { path: '/history', icon: HistoryIcon, label: 'Geçmiş' },
  { path: '/diet', icon: Salad, label: 'Diyet' },
  { path: '/nutrition', icon: Utensils, label: 'Beslenme' },
  { path: '/badges', icon: Award, label: 'Rozetler' },
];

function Home() {
  const [profile, setProfile] = useState(null);
  const [diet, setDiet] = useState(null);
  const [workouts, setWorkouts] = useState([]);
  const [todaySteps, setTodaySteps] = useState(0);
  const [todayCalories, setTodayCalories] = useState(0);
  const [todayWater, setTodayWater] = useState(0);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    const apiUrl = import.meta.env.VITE_API_URL;

    Promise.allSettled([
      axios.get(`${apiUrl}/api/users/me`, { headers }),
      axios.get(`${apiUrl}/api/users/me/diet`, { headers }),
      axios.get(`${apiUrl}/api/analyze/history`, { headers }),
      axios.get(`${apiUrl}/api/steps`, { headers }),
      axios.get(`${apiUrl}/api/nutrition/water/today`, { headers }),
    ]).then(([profileRes, dietRes, historyRes, stepsRes, waterRes]) => {
      if (profileRes.status === 'fulfilled') {
        setProfile(profileRes.value.data);
      }
      if (dietRes.status === 'fulfilled') {
        setDiet(dietRes.value.data);
      }
      if (historyRes.status === 'fulfilled') {
        setWorkouts(historyRes.value.data);
      }
      if (stepsRes.status === 'fulfilled') {
        const today = new Date().toDateString();
        const bugunkuKayitlar = stepsRes.value.data.filter(
          (k) => new Date(k.tarih).toDateString() === today
        );
        const toplamAdim = bugunkuKayitlar.reduce((acc, k) => acc + k.adim_sayisi, 0);
        const toplamKalori = bugunkuKayitlar.reduce((acc, k) => acc + k.yakilan_kalori, 0);
        setTodaySteps(toplamAdim);
        setTodayCalories(Math.round(toplamKalori));
      }
      if (waterRes.status === 'fulfilled') {
        const toplamSu = waterRes.value.data.reduce((acc, w) => acc + w.miktar_ml, 0);
        setTodayWater(toplamSu);
      }

      setLoading(false);
    });
  }, []);

  const bmiCount = useCountUp(diet ? diet.bmi : 0, 900, 1);
  const kcalCount = useCountUp(diet ? diet.hedef_kalori : 0, 900);
  const stepsCount = useCountUp(todaySteps, 900);

  if (loading) {
    return <p className="loading-text">Yükleniyor...</p>;
  }

  const profileComplete = profile && profile.boy && profile.kilo && profile.yas && profile.cinsiyet && profile.aktiflik_seviyesi && profile.hedef;

  const now = new Date();
  const bugunTarih = now.toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase();

  const bmiKategori = diet?.bmi_kategori ?? '';
  const bmiPercent = diet ? Math.min(Math.max(((diet.bmi - 15) / (35 - 15)) * 100, 0), 100) : 0;

  const kalanKalori = diet ? Math.max(diet.hedef_kalori - todayCalories, 0) : null;

  const stepsGoal = 10000;
  const stepsPercent = Math.min((todaySteps / stepsGoal) * 100, 100);
  const stepsCircumference = 364.4;
  const stepsOffset = stepsCircumference * (1 - stepsPercent / 100);

  const waterGoalL = 3.0;
  const waterL = todayWater / 1000;
  const waterBars = 5;
  const filledBars = Math.round((waterL / waterGoalL) * waterBars);

  return (
    <div>
      <Sidebar />

      <header style={{ marginBottom: '32px', display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: '16px' }}>
        <div>
          <h2 className="welcome-text" style={{ marginBottom: 0 }}>Merhaba, {profile?.ad ?? 'Sporcu'} 👋</h2>
          <p className="home-hero-subtitle" style={{ marginTop: '8px', textTransform: 'none' }}>{bugunTarih}</p>
        </div>
        <div style={{ padding: '8px 16px', background: 'var(--surface-2)', borderRadius: '10px', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Flame size={16} color="#4CAF50" />
          <span className="font-label-mono" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {workouts.length} TOPLAM ANTRENMAN
          </span>
        </div>
      </header>

      {!profileComplete && (
        <div className="info-banner" style={{ marginBottom: '24px' }}>
          Profilinizi tamamlayarak diyet önerisi ve kalori hesaplamalarından yararlanabilirsiniz.
          <button className="banner-btn" onClick={() => navigate('/profile')}>
            Profilimi Tamamla <ArrowRight size={16} />
          </button>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <div className="card" style={{ gap: '12px' }}>
          <span className="card-title">VKİ (BMI)</span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <div className="card-value" style={{ fontSize: '2.2rem' }}>{diet ? bmiCount : '—'}</div>
            {diet && (
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: bmiKategori === 'Normal' ? '#4CAF50' : 'var(--accent-2)' }}>
                {(BMI_LABELS[bmiKategori] ?? bmiKategori).toUpperCase()}
              </span>
            )}
          </div>
          <div style={{ width: '100%', height: '4px', background: 'var(--surface-2)', borderRadius: '99px', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${bmiPercent}%`, background: 'var(--accent)', borderRadius: '99px' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-muted)', opacity: 0.6, fontFamily: 'var(--font-mono)' }}>
            <span>18.5</span>
            <span>25.0</span>
          </div>
        </div>

        <div className="card" style={{ gap: '8px' }}>
          <span className="card-title">HEDEF KALORİ</span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <div className="card-value" style={{ fontSize: '2.2rem' }}>{diet ? kcalCount : '—'}</div>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-muted)' }}>KCAL</span>
          </div>
          {diet && (
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              Bugün yakılan: <strong style={{ color: 'var(--text)' }}>{todayCalories} kcal</strong>
            </p>
          )}
        </div>

        <div className="card" style={{ gap: '8px', gridRow: 'span 2', justifyContent: 'space-between' }}>
          <span className="card-title">ADIMLAR</span>
          <div className="card-value" style={{ fontSize: '2.2rem' }}>{stepsCount}</div>
          <div style={{ position: 'relative', width: '128px', height: '128px', margin: '16px auto' }}>
            <svg width="128" height="128" style={{ transform: 'rotate(-90deg)' }}>
              <circle cx="64" cy="64" r="58" fill="transparent" stroke="var(--surface-2)" strokeWidth="8" />
              <circle
                cx="64" cy="64" r="58" fill="transparent"
                stroke="var(--accent)" strokeWidth="8"
                strokeDasharray={stepsCircumference}
                strokeDashoffset={stepsOffset}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 0.6s ease' }}
              />
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: '0.95rem', fontWeight: 700 }}>%{Math.round(stepsPercent)}</span>
              <span style={{ fontSize: '8px', fontFamily: 'var(--font-mono)', opacity: 0.5, textTransform: 'uppercase' }}>HEDEF</span>
            </div>
          </div>
        </div>

        <div className="card" style={{ gap: '8px' }}>
          <span className="card-title">SU TÜKETİMİ</span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <div className="card-value" style={{ fontSize: '2.2rem' }}>{waterL.toFixed(1)}L</div>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-muted)' }}>/ {waterGoalL.toFixed(1)}L</span>
          </div>
          <div style={{ display: 'flex', gap: '4px', marginTop: '12px' }}>
            {Array.from({ length: waterBars }).map((_, i) => (
              <div
                key={i}
                style={{ height: '32px', width: '100%', borderRadius: '2px', background: i < filledBars ? 'var(--accent-blue)' : 'var(--surface-2)' }}
              />
            ))}
          </div>
        </div>
      </div>

      <div
        style={{
          marginTop: '24px', padding: '32px', borderRadius: '16px', position: 'relative', overflow: 'hidden',
          background: 'linear-gradient(135deg, var(--accent) 0%, #5a0d12 100%)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', textAlign: 'center',
        }}
      >
        <div style={{ fontSize: '3rem' }}>🔥</div>
        <div>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.2em', display: 'block', marginBottom: '8px' }}>
            MOTİVASYON
          </span>
          <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', color: '#fff', fontWeight: 800, fontStyle: 'italic', lineHeight: 1.3 }}>
            {workouts.length === 0
              ? '"Her büyük yolculuk ilk adımla başlar."'
              : workouts.length < 10
              ? '"Tutarlılık, motivasyondan daha güçlüdür."'
              : '"Sınırlarını zorla, potansiyelini keşfet."'}
          </h4>
        </div>
      </div>

      <div style={{ marginTop: '48px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 700 }}>Hızlı Erişim</h3>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>TÜMÜ</span>
        </div>
        <div style={{ display: 'flex', overflowX: 'auto', gap: '16px', paddingBottom: '8px' }}>
          {QUICK_ACCESS.map(({ path, icon: Icon, label }) => (
            <div
              key={path}
              className="quick-action-btn"
              style={{ minWidth: '180px', height: '128px', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'space-between', flexShrink: 0 }}
              onClick={() => navigate(path)}
            >
              <Icon size={22} color="var(--accent)" />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '-0.02em' }}>{label}</span>
                <ChevronRight size={16} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Home;