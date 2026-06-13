import { useEffect, useState } from 'react';
import axios from 'axios';
import { Award, Lock } from 'lucide-react';
import Sidebar from '../components/sidebar';

const SEVIYE_RENK = {
  Bronz: 'var(--bronze)',
  Gumus: 'var(--silver)',
  Altin: 'var(--gold)',
};

const SEVIYE_ETIKET = {
  Bronz: 'Bronz',
  Gumus: 'Gümüş',
  Altin: 'Altın',
};

function Badges() {
  const [rozetler, setRozetler] = useState([]);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem('token');

  useEffect(() => {
    axios.get(`${import.meta.env.VITE_API_URL}/api/badges`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then((res) => {
      setRozetler(res.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) {
    return <p className="loading-text">Yükleniyor...</p>;
  }

  const kazanilanSayisi = rozetler.filter((r) => r.kazanildi).length;

  return (
    <div>
      <Sidebar />
      <div className="section-title">Rozetlerim ({kazanilanSayisi}/{rozetler.length})</div>

      <div className="badge-grid">
        {rozetler.map((rozet) => (
          <div key={rozet.key} className={`badge-card ${rozet.kazanildi ? '' : 'locked'}`}>
            <div className="badge-icon" style={{ background: `${SEVIYE_RENK[rozet.seviye]}22`, color: SEVIYE_RENK[rozet.seviye] }}>
              {rozet.kazanildi ? <Award size={28} /> : <Lock size={24} />}
            </div>
            <div className="badge-title">{rozet.baslik}</div>
            <div className="badge-desc">{rozet.aciklama}</div>
            {rozet.kazanildi && (
              <span className="badge-seviye" style={{ color: SEVIYE_RENK[rozet.seviye] }}>{SEVIYE_ETIKET[rozet.seviye]}</span>
            )}
            {rozet.kazanildi && rozet.kazanilma_tarihi && (
              <div className="badge-date">{new Date(rozet.kazanilma_tarihi).toLocaleDateString('tr-TR')}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default Badges;