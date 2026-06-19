import { useEffect, useState } from 'react';
import axios from 'axios';
import { Award, Lock, ShieldCheck } from 'lucide-react';
import Sidebar from '../components/sidebar';

const SEVIYE_RENK = {
  Bronz: '#CD7F32',
  Gumus: '#C0C0C0',
  Altin: '#FFD700',
};

const SEVIYE_GRADIENT = {
  Bronz: 'linear-gradient(135deg, #b87333, #7a4a1f)',
  Gumus: 'linear-gradient(135deg, #e2e2e2, #8a8a8a)',
  Altin: 'linear-gradient(135deg, #ffe082, #b8860b)',
};

const SEVIYE_ETIKET = {
  Bronz: 'BRONZ TIER',
  Gumus: 'GÜMÜŞ TIER',
  Altin: 'ALTIN TIER',
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

  const kazanilanlar = rozetler.filter((r) => r.kazanildi);
  const kilitliler = rozetler.filter((r) => !r.kazanildi);
  const yuzde = rozetler.length > 0 ? Math.round((kazanilanlar.length / rozetler.length) * 100) : 0;

  return (
    <div>
      <Sidebar />

      <header style={{ marginBottom: '40px', display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: '24px' }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '1.8rem', textTransform: 'uppercase', lineHeight: 1, marginBottom: '8px' }}>Rozetler</h2>
          <p style={{ display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--accent)' }}>
            <ShieldCheck size={16} /> {kazanilanlar.length}/{rozetler.length} ROZET AÇILDI
          </p>
        </div>
        <div style={{ width: '100%', maxWidth: '320px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-muted)', marginBottom: '8px' }}>
            <span>TOPLAM İLERLEME</span>
            <span>{yuzde}%</span>
          </div>
          <div style={{ height: '4px', width: '100%', background: 'var(--surface-2)', borderRadius: '99px', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${yuzde}%`, background: 'var(--accent)', boxShadow: '0 0 10px rgba(232,49,63,0.5)' }} />
          </div>
        </div>
      </header>

      <section style={{ marginBottom: '48px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.1rem', textTransform: 'uppercase' }}>KAZANILAN ROZETLER</h3>
          <div style={{ height: '1px', flex: 1, background: 'var(--border)' }} />
        </div>

        {kazanilanlar.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Henüz rozet kazanmadın, antrenmanlara devam et!</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
            {kazanilanlar.map((rozet) => {
              const renk = SEVIYE_RENK[rozet.seviye] || 'var(--accent)';
              const gradient = SEVIYE_GRADIENT[rozet.seviye] || 'var(--accent)';
              return (
                <div key={rozet.key} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '14px', padding: '24px', display: 'flex', gap: '20px', alignItems: 'flex-start', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ width: '76px', height: '76px', flexShrink: 0, borderRadius: '50%', background: gradient, padding: '2px' }}>
                    <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Award size={32} color={renk} />
                    </div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: renk, background: `${renk}1A`, padding: '2px 8px', borderRadius: '6px', border: `1px solid ${renk}33` }}>
                      {SEVIYE_ETIKET[rozet.seviye] || rozet.seviye?.toUpperCase()}
                    </span>
                    <h4 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.05rem', marginTop: '8px' }}>{rozet.baslik}</h4>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '4px' }}>{rozet.aciklama}</p>
                    {rozet.kazanilma_tarihi && (
                      <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--accent)', marginTop: '10px' }}>
                        KAZANILDI: {new Date(rozet.kazanilma_tarihi).toLocaleDateString('tr-TR')}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.1rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>KİLİTLİ ROZETLER</h3>
          <div style={{ height: '1px', flex: 1, background: 'var(--border)', opacity: 0.3 }} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px', opacity: 0.5, filter: 'grayscale(0.6)' }}>
          {kilitliler.map((rozet) => (
            <div key={rozet.key} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '14px', padding: '24px', display: 'flex', gap: '20px', alignItems: 'flex-start', position: 'relative' }}>
              <div style={{ position: 'absolute', top: '16px', right: '16px' }}>
                <Lock size={18} color="var(--text-muted)" />
              </div>
              <div style={{ width: '76px', height: '76px', flexShrink: 0, borderRadius: '50%', background: 'var(--surface-2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Award size={32} color="var(--text-muted)" />
              </div>
              <div style={{ flex: 1 }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-muted)', border: '1px solid var(--border)', padding: '2px 8px', borderRadius: '6px' }}>
                  KİLİTLİ
                </span>
                <h4 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.05rem', marginTop: '8px', color: 'var(--text-muted)' }}>{rozet.baslik}</h4>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '4px' }}>{rozet.aciklama}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default Badges;