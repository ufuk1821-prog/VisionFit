import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Ruler, Flame, Target, Footprints, Activity, ArrowRight } from 'lucide-react';
import Sidebar from '../components/sidebar';

const BMI_LABELS = {
  Zayif: 'Zayıf',
  Normal: 'Normal',
  Kilolu: 'Kilolu',
  Obez: 'Obez',
};

function Home() {
  const [profile, setProfile] = useState(null);
  const [diet, setDiet] = useState(null);
  const [lastWorkout, setLastWorkout] = useState(null);
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

      if (historyRes.status === 'fulfilled' && historyRes.value.data.length > 0) {
        setLastWorkout(historyRes.value.data[0]);
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

      setLoading(false);
    });
  }, []);

  if (loading) {
    return <p className="loading-text">Yükleniyor...</p>;
  }

  const profileComplete = profile && profile.boy && profile.kilo && profile.yas && profile.cinsiyet && profile.aktiflik_seviyesi && profile.hedef;

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