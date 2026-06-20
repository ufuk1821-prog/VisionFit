import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Sidebar from '../components/sidebar';
import useCountUp from '../hooks/useCountUp';

const QUICK_ACCESS = [
  { path: '/dashboard', icon: 'videocam', label: 'KAMERA ANALİZİ' },
  { path: '/plank', icon: 'photo_camera', label: 'FOTOĞRAF ANALİZİ' },
  { path: '/history', icon: 'history', label: 'GEÇMİŞ' },
  { path: '/exercises', icon: 'menu_book', label: 'KÜTÜPHANE' },
  { path: '/workout-notebook', icon: 'edit_note', label: 'GÜNLÜK' },
  { path: '/diet', icon: 'restaurant', label: 'DİYET' },
  { path: '/nutrition', icon: 'nutrition', label: 'BESLENME' },
  { path: '/steps', icon: 'directions_run', label: 'ADIMLAR' },
  { path: '/badges', icon: 'military_tech', label: 'ROZETLER' },
];

const BMI_LABELS = { Zayif: 'ZAYIF', Normal: 'NORMAL', Kilolu: 'KİLOLU', Obez: 'OBEZ' };

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
      if (profileRes.status === 'fulfilled') setProfile(profileRes.value.data);
      if (dietRes.status === 'fulfilled') setDiet(dietRes.value.data);
      if (historyRes.status === 'fulfilled') setWorkouts(historyRes.value.data);
      if (stepsRes.status === 'fulfilled') {
        const today = new Date().toDateString();
        const bugunkuKayitlar = stepsRes.value.data.filter((k) => new Date(k.tarih).toDateString() === today);
        setTodaySteps(bugunkuKayitlar.reduce((acc, k) => acc + k.adim_sayisi, 0));
        setTodayCalories(Math.round(bugunkuKayitlar.reduce((acc, k) => acc + k.yakilan_kalori, 0)));
      }
      if (waterRes.status === 'fulfilled') {
        setTodayWater(waterRes.value.data.reduce((acc, w) => acc + w.miktar_ml, 0));
      }
      setLoading(false);
    });
    localStorage.setItem('kullaniciAdi', profile?.ad || '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const bmiCount = useCountUp(diet ? diet.bmi : 0, 900, 1);
  const kcalCount = useCountUp(diet ? diet.hedef_kalori : 0, 900);
  const stepsCount = useCountUp(todaySteps, 900);

  if (loading) {
    return (
      <div>
        <Sidebar />
        <main className="md:ml-64 pt-20 md:pt-10 px-gutter md:px-10 pb-24">
          <p className="loading-text">Yükleniyor...</p>
        </main>
      </div>
    );
  }

  const profileComplete = profile && profile.boy && profile.kilo && profile.yas && profile.cinsiyet && profile.aktiflik_seviyesi && profile.hedef;
  const now = new Date();
  const tarihStr = now.toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' }).toUpperCase();
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
  const filledBars = Math.min(Math.round((waterL / waterGoalL) * waterBars), waterBars);

  return (
    <div>
      <Sidebar />
      <main className="md:ml-64 pt-20 md:pt-10 px-gutter md:px-10 pb-24">
        <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="font-display-lg text-display-lg-mobile md:text-display-lg leading-none">Merhaba, {profile?.ad ?? 'Sporcu'} 👋</h2>
            <p className="text-on-surface-variant font-label-mono mt-2">{tarihStr}</p>
          </div>
          <div className="flex gap-2">
            <div className="px-4 py-2 bg-surface-container rounded-lg border border-outline-variant flex items-center gap-2">
              <span className="material-symbols-outlined text-tertiary text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span>
              <span className="text-label-mono text-xs uppercase tracking-tighter font-bold">{workouts.length} ANTRENMAN</span>
            </div>
          </div>
        </header>

        {!profileComplete && (
          <div className="mb-6 bg-primary-container/10 border border-primary-container/20 p-4 rounded-xl flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary-container">info</span>
              <span className="text-label-mono text-sm font-bold tracking-widest text-primary-container uppercase">PROFİLİNİ TAMAMLA</span>
            </div>
            <button className="text-xs font-label-mono border-b border-primary-container text-primary-container" onClick={() => navigate('/profile')}>TAMAMLA</button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-bento-gap">
          <div className="bento-card p-6 col-span-1 md:col-span-2">
            <div className="flex justify-between items-start mb-4">
              <span className="font-label-mono text-label-mono text-on-surface-variant">VKİ</span>
              <span className="material-symbols-outlined text-on-surface-variant text-sm">info</span>
            </div>
            <div className="flex items-baseline gap-2 mb-4">
              <h3 className="font-stat-lg text-stat-lg">{diet ? bmiCount : '—'}</h3>
              {diet && <span className="text-tertiary font-label-mono text-xs">{BMI_LABELS[bmiKategori] ?? bmiKategori.toUpperCase()}</span>}
            </div>
            <div className="w-full h-1 bg-surface-container-high rounded-full overflow-hidden">
              <div className="h-full bg-tertiary-container" style={{ width: `${bmiPercent}%` }}></div>
            </div>
            <div className="flex justify-between mt-2 text-[10px] font-label-mono text-on-surface-variant opacity-50">
              <span>18.5</span>
              <span>25.0</span>
            </div>
          </div>

          <div className="bento-card p-6 col-span-1 md:col-span-2">
            <span className="font-label-mono text-label-mono text-on-surface-variant block mb-4">HEDEF KALORİ</span>
            <div className="flex items-baseline gap-2">
              <h3 className="font-stat-lg text-stat-lg">{diet ? kcalCount : '—'}</h3>
              <span className="text-on-surface-variant font-label-mono text-xs">KCAL</span>
            </div>
            {diet && <p className="text-body-sm text-on-surface-variant mt-2">Kalan: <span className="text-on-surface font-bold">{kalanKalori} kcal</span></p>}
          </div>

          <div className="bento-card p-6 col-span-1 md:col-span-2 row-span-1 md:row-span-2 flex flex-col justify-between">
            <div>
              <span className="font-label-mono text-label-mono text-on-surface-variant block mb-4">ADIMLAR</span>
              <h3 className="font-stat-lg text-stat-lg">{stepsCount.toLocaleString('tr-TR')}</h3>
            </div>
            <div className="relative w-44 h-44 mx-auto my-6">
  <svg
    viewBox="0 0 128 128"
    className="w-full h-full transform -rotate-90"
  >
    <circle
      className="text-surface-container-high"
      cx="64"
      cy="64"
      fill="transparent"
      r="58"
      stroke="currentColor"
      strokeWidth="8"
    />

    <circle
      className="text-primary-container"
      cx="64"
      cy="64"
      fill="transparent"
      r="58"
      stroke="currentColor"
      strokeDasharray={stepsCircumference}
      strokeDashoffset={stepsOffset}
      strokeLinecap="round"
      strokeWidth="8"
      style={{ transition: 'stroke-dashoffset 0.6s ease' }}
    />
  </svg>

  <div className="absolute inset-0 flex flex-col items-center justify-center">
    <span className="text-xl font-bold">
      %{Math.round(stepsPercent)}
    </span>

    <span className="text-[11px] font-label-mono opacity-50 uppercase mt-1">
      HEDEF
    </span>
  </div>
</div>
          </div>

          <div className="bento-card p-6 col-span-1 md:col-span-2 border-blue-500/20">
          <span className="font-label-mono text-label-mono text-blue-400 block mb-4">SU TÜKETİMİ</span>
          <div className="flex items-baseline gap-2">
            <h3 className="font-stat-lg text-stat-lg text-blue-300">{waterL.toFixed(1)}L</h3>
            <span className="text-on-surface-variant font-label-mono text-xs">/ {waterGoalL.toFixed(1)}L</span>
          </div>
          <div className="flex gap-1 mt-4">
            {Array.from({ length: waterBars }).map((_, i) => (
              <div key={i} className={`h-8 w-full rounded-sm ${i < filledBars ? 'bg-blue-400' : 'bg-surface-container-high'}`}></div>
            ))}
          </div>
        </div>

          <div className="col-span-1 md:col-span-4 lg:col-span-4 bg-primary-container/10 border border-primary-container/20 p-4 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary-container" style={{ fontVariationSettings: "'FILL' 1" }}>fitness_center</span>
              <span className="text-label-mono text-sm font-bold tracking-widest text-primary-container uppercase">TOPLAM ANTRENMAN: {workouts.length}</span>
            </div>
            <button className="text-xs font-label-mono border-b border-primary-container text-primary-container" onClick={() => navigate('/history')}>DETAYLAR</button>
          </div>

          <div className="col-span-1 md:col-span-4 lg:col-span-6 bg-gradient-to-r from-[#E8313F] to-[#93001a] p-8 rounded-2xl relative overflow-hidden flex flex-col md:flex-row items-center gap-6">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl"></div>
            <div className="text-5xl">🔥</div>
            <div className="z-10 text-center md:text-left">
              <span className="font-label-mono text-[10px] text-white/70 uppercase tracking-[0.2em] block mb-2">MOTİVASYON</span>
              <h4 className="font-headline-md text-2xl text-white font-black leading-tight italic">
                {workouts.length === 0
                  ? '"Her büyük yolculuk ilk adımla başlar."'
                  : workouts.length < 10
                  ? '"Tutarlılık, motivasyondan daha güçlüdür."'
                  : '"Sınırlarını zorla, potansiyelini keşfet."'}
              </h4>
            </div>
          </div>
        </div>

        <div className="mt-12">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-headline-md text-xl">Hızlı Erişim</h3>
            <span className="text-label-mono text-xs text-on-surface-variant uppercase">TÜMÜ</span>
          </div>
          <div className="flex overflow-x-auto gap-4 pb-4 scrollbar-hide">
            {QUICK_ACCESS.map(({ path, icon, label }) => (
              <div
                key={path}
                className="min-w-[190px] flex-1 bento-card p-6 flex flex-col justify-between h-40 cursor-pointer hover:bg-surface-container-high transition-colors"
                onClick={() => navigate(path)}
              >
                <span className="material-symbols-outlined text-primary text-2xl">{icon}</span>
                <div className="flex items-center justify-between mt-auto">
                  <span className="font-label-mono text-xs uppercase tracking-tighter">{label}</span>
                  <span className="material-symbols-outlined text-base">chevron_right</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

export default Home;