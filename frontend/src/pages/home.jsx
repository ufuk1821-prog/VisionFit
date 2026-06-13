import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Ruler, Flame, Target, Footprints, Activity, ArrowRight, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import Sidebar from '../components/sidebar';

const BMI_LABELS = {
  Zayif: 'Zayıf',
  Normal: 'Normal',
  Kilolu: 'Kilolu',
  Obez: 'Obez',
};

function formatDelta(current, previous) {
  if (previous === 0 && current === 0) {
    return { text: '—', trend: 'same' };
  }
  if (previous === 0) {
    return { text: 'Yeni', trend: 'up' };
  }
  const diff = current - previous;
  const percent = Math.round((diff / previous) * 100);

  if (diff > 0) return { text: `+%${percent}`, trend: 'up' };
  if (diff < 0) return { text: `%${percent}`, trend: 'down' };
  return { text: '%0', trend: 'same' };
}

function TrendIcon({ trend }) {
  if (trend === 'up') return <TrendingUp size={14} />;
  if (trend === 'down') return <TrendingDown size={14} />;
  return <Minus size={14} />;
}

function Home() {
  const [profile, setProfile] = useState(null);
  const [diet, setDiet] = useState(null);
  const [workouts, setWorkouts] = useState([]);
  const [stepLogs, setStepLogs] = useState([]);
  const [todaySteps, setTodaySteps] = useState(0);
  const [todayCalories, setTodayCalories] = useState(0);
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
    ]).then(([profileRes, dietRes, historyRes, stepsRes]) => {
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
        setStepLogs(stepsRes.value.data);

        const today = new Date().toDateString();
        const bugunkuKayitlar = stepsRes.value.data.filter(
          (k) => new Date(k.tarih).toDateString() === today
        );

        const toplamAdim = bugunkuKayitlar.reduce((acc, k) => acc + k.adim_sayisi, 0);
        const toplamKalori = bugunkuKayitlar.reduce((acc, k) => acc + k.yakilan_kalori, 0);

        setTodaySteps(toplamAdim);
        setTodayCalories(Math.round(toplamKalori));
      }

      setLoading(false);
    });
  }, []);

  if (loading) {
    return <p className="loading-text">Yükleniyor...</p>;
  }

  const profileComplete = profile && profile.boy && profile.kilo && profile.yas && profile.cinsiyet && profile.aktiflik_seviyesi && profile.hedef;
  const lastWorkout = workouts.length > 0 ? workouts[0] : null;

  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - 7);
  const prevWeekStart = new Date(now);
  prevWeekStart.setDate(now.getDate() - 14);

  const thisWeekWorkouts = workouts.filter((w) => new Date(w.tarih) >= weekStart);
  const prevWeekWorkouts = workouts.filter((w) => new Date(w.tarih) >= prevWeekStart && new Date(w.tarih) < weekStart);

  const thisWeekSteps = stepLogs.filter((s) => new Date(s.tarih) >= weekStart).reduce((acc, s) => acc + s.adim_sayisi, 0);
  const prevWeekSteps = stepLogs.filter((s) => new Date(s.tarih) >= prevWeekStart && new Date(s.tarih) < weekStart).reduce((acc, s) => acc + s.adim_sayisi, 0);

  const avgConfidence = (list) => list.length > 0 ? Math.round(list.reduce((acc, w) => acc + w.eminlik_skoru, 0) / list.length) : 0;
  const thisWeekAvgConfidence = avgConfidence(thisWeekWorkouts);
  const prevWeekAvgConfidence = avgConfidence(prevWeekWorkouts);

  const adimDelta = formatDelta(thisWeekSteps, prevWeekSteps);
  const guvenDelta = formatDelta(thisWeekAvgConfidence, prevWeekAvgConfidence);
  const antrenmanDelta = formatDelta(thisWeekWorkouts.length, prevWeekWorkouts.length);

  return (
    <div>
      <Sidebar />
      <div className="welcome-text">Merhaba, {profile?.ad ?? 'Sporcu'}</div>

      {!profileComplete && (
        <div className="info-banner">
          Profilinizi tamamlayarak diyet önerisi ve kalori hesaplamalarından yararlanabilirsiniz.
          <button className="nav-btn" onClick={() => navigate('/profile')}>
            Profilimi Tamamla <ArrowRight size={16} />
          </button>
        </div>
      )}

      <div className="dashboard-grid">
        <div className="card status-card">
          <div className="card-header">
            <div className="card-icon"><Ruler size={18} /></div>
            <div className="card-title">Vücut Kitle Endeksi</div>
          </div>
          <div className="card-value">{diet ? diet.bmi : '—'}</div>
          {diet && (
            <span className={`bmi-badge ${diet.bmi_kategori.toLowerCase()}`}>
              {BMI_LABELS[diet.bmi_kategori] ?? diet.bmi_kategori}
            </span>
          )}
        </div>

        <div className="card angle-card">
          <div className="card-header">
            <div className="card-icon"><Target size={18} /></div>
            <div className="card-title">Hedef Günlük Kalori</div>
          </div>
          <div className="card-value">{diet ? `${diet.hedef_kalori} kcal` : '—'}</div>
        </div>

        <div className="card confidence-card">
          <div className="card-header">
            <div className="card-icon"><Footprints size={18} /></div>
            <div className="card-title">Bugünkü Adım</div>
          </div>
          <div className="card-value">{todaySteps}</div>
          <span className="card-subtext">{todayCalories} kcal yakıldı</span>
        </div>

        <div className="card status-card">
          <div className="card-header">
            <div className="card-icon"><Activity size={18} /></div>
            <div className="card-title">Son Antrenman</div>
          </div>
          {lastWorkout ? (
            <>
              <div className="card-value" style={{ fontSize: '1.3rem' }}>{lastWorkout.antrenor_notu}</div>
              <span className="card-subtext">{new Date(lastWorkout.tarih).toLocaleDateString('tr-TR')}</span>
            </>
          ) : (
            <div className="card-value" style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>Henüz antrenman yok</div>
          )}
        </div>
      </div>

      <div className="section-title">Haftalık Özet</div>

      <div className="dashboard-grid">
        <div className="card">
          <div className="card-title">Toplam Adım (Bu Hafta)</div>
          <div className="card-value">{thisWeekSteps}</div>
          <span className={`comparison-delta ${adimDelta.trend}`}>
            <TrendIcon trend={adimDelta.trend} /> {adimDelta.text} (geçen hafta: {prevWeekSteps})
          </span>
        </div>

        <div className="card">
          <div className="card-title">Ortalama Güven Skoru</div>
          <div className="card-value">%{thisWeekAvgConfidence}</div>
          <span className={`comparison-delta ${guvenDelta.trend}`}>
            <TrendIcon trend={guvenDelta.trend} /> {guvenDelta.text} (geçen hafta: %{prevWeekAvgConfidence})
          </span>
        </div>

        <div className="card">
          <div className="card-title">Antrenman Sayısı</div>
          <div className="card-value">{thisWeekWorkouts.length}</div>
          <span className={`comparison-delta ${antrenmanDelta.trend}`}>
            <TrendIcon trend={antrenmanDelta.trend} /> {antrenmanDelta.text} (geçen hafta: {prevWeekWorkouts.length})
          </span>
        </div>
      </div>

      <div className="section-title">Hızlı Erişim</div>

      <div className="quick-actions">
        <button className="quick-action-btn" onClick={() => navigate('/dashboard')}>
          <Activity size={20} />
          Kamera ile Antrenman
        </button>
        <button className="quick-action-btn" onClick={() => navigate('/diet')}>
          <Target size={20} />
          Diyet Önerisi Al
        </button>
        <button className="quick-action-btn" onClick={() => navigate('/steps')}>
          <Footprints size={20} />
          Adım Ekle
        </button>
      </div>
    </div>
  );
}

export default Home;