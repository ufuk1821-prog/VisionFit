import { useEffect, useState } from 'react';
import axios from 'axios';
import { Footprints, Flame, Plus } from 'lucide-react';
import Sidebar from '../components/sidebar';
import EmptyState from '../components/EmptyState';

const AKTIVITE_OPTIONS = [
  { value: 'yuruyus', label: 'Yürüyüş' },
  { value: 'tempolu_yuruyus', label: 'Tempolu Yürüyüş' },
  { value: 'kosu', label: 'Koşu' },
  { value: 'tempolu_kosu', label: 'Tempolu Koşu' },
];

const GOAL = 10000;

function Steps() {
  const [adimSayisi, setAdimSayisi] = useState('');
  const [aktiviteTipi, setAktiviteTipi] = useState('');
  const [kayitlar, setKayitlar] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const token = localStorage.getItem('token');

  const fetchKayitlar = () => {
    axios.get(`${import.meta.env.VITE_API_URL}/api/steps`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then((res) => {
      setKayitlar(res.data);
    }).catch(() => {});
  };

  useEffect(() => {
    fetchKayitlar();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/steps`,
        { adim_sayisi: parseInt(adimSayisi, 10), aktivite_tipi: aktiviteTipi },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAdimSayisi('');
      setAktiviteTipi('');
      setShowForm(false);
      fetchKayitlar();
    } catch (err) {
      if (err.response && err.response.data && err.response.data.detail) {
        setError(err.response.data.detail);
      } else {
        setError('Kayıt eklenemedi.');
      }
    } finally {
      setLoading(false);
    }
  };

  const bugun = new Date();
  const bugunkuKayitlar = kayitlar.filter((k) => new Date(k.tarih).toDateString() === bugun.toDateString());
  const toplamAdim = bugunkuKayitlar.reduce((acc, k) => acc + k.adim_sayisi, 0);
  const toplamKalori = bugunkuKayitlar.reduce((acc, k) => acc + (k.yakilan_kalori || 0), 0);
  const toplamMesafe = (toplamAdim * 0.0008).toFixed(1);
  const hedefYuzde = Math.min((toplamAdim / GOAL) * 100, 999);

  const ringCircumference = 2 * Math.PI * 80;
  const ringOffset = ringCircumference * (1 - Math.min(toplamAdim / GOAL, 1));

  const ayAdi = bugun.toLocaleDateString('tr-TR', { month: 'short' }).toUpperCase();

  return (
    <div>
      <Sidebar />

      <div style={{ display: 'flex', gap: '16px' }} className="steps-layout">
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', minWidth: '70px', paddingTop: '8px' }}>
          <div style={{ background: 'var(--accent)', color: '#fff', padding: '6px 10px', borderRadius: '6px', fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '1.2rem' }}>
            {bugun.getDate()}
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{ayAdi}</div>
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ background: 'rgba(141,153,174,0.1)', border: '1px solid rgba(141,153,174,0.3)', padding: '14px 18px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Footprints size={18} color="#8d99ae" />
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: '#8d99ae', textTransform: 'uppercase' }}>Telefon Senkronizasyonu Aktif</p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }} className="steps-bento-grid">
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', padding: '32px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '32px', flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', width: '180px', height: '180px', flexShrink: 0 }}>
                  <svg width="180" height="180" style={{ transform: 'rotate(-90deg)' }}>
                    <circle cx="90" cy="90" r="80" fill="transparent" stroke="var(--surface-2)" strokeWidth="12" />
                    <circle
                      cx="90" cy="90" r="80" fill="transparent"
                      stroke="var(--accent)" strokeWidth="12"
                      strokeDasharray={ringCircumference}
                      strokeDashoffset={ringOffset}
                      strokeLinecap="round"
                      style={{ transition: 'stroke-dashoffset 0.6s ease' }}
                    />
                  </svg>
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--text-muted)' }}>%{Math.round(hedefYuzde)}</span>
                  </div>
                </div>

                <div style={{ flex: 1, minWidth: '200px' }}>
                  <h2 style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>
                    Günlük Toplam Adım
                  </h2>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '2.6rem', fontWeight: 900, color: 'var(--accent)', lineHeight: 1, marginBottom: '8px' }}>
                    {toplamAdim.toLocaleString('tr-TR')}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Hedef: {GOAL.toLocaleString('tr-TR')}</span>
                    {toplamAdim >= GOAL && (
                      <span style={{ padding: '2px 8px', background: 'rgba(76,175,80,0.15)', color: '#4CAF50', borderRadius: '6px', fontSize: '10px', fontWeight: 700 }}>TAMAMLANDI</span>
                    )}
                  </div>
                  <button
                    onClick={() => setShowForm((v) => !v)}
                    style={{
                      marginTop: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                      width: '100%', padding: '12px', background: 'var(--accent)', color: '#fff', border: 'none',
                      borderRadius: '10px', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', textTransform: 'uppercase',
                      fontWeight: 700, cursor: 'pointer',
                    }}
                  >
                    <Plus size={16} /> Verileri Manuel Gir
                  </button>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ flex: 1, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '14px', padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <Flame size={20} color="var(--text-muted)" style={{ marginBottom: '8px' }} />
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>Kalori Yakımı</p>
                <div>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 800 }}>{Math.round(toplamKalori)}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-muted)', marginLeft: '4px' }}>kcal</span>
                </div>
              </div>
              <div style={{ flex: 1, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '14px', padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <Footprints size={20} color="var(--text-muted)" style={{ marginBottom: '8px' }} />
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>Tahmini Mesafe</p>
                <div>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 800 }}>{toplamMesafe}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-muted)', marginLeft: '4px' }}>km</span>
                </div>
              </div>
            </div>
          </div>

          {showForm && (
            <div className="auth-box" style={{ margin: 0 }}>
              {error && <p className="error-text">{error}</p>}
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Adım Sayısı</label>
                  <input
                    type="number"
                    value={adimSayisi}
                    onChange={(e) => setAdimSayisi(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Aktivite Türü</label>
                  <select value={aktiviteTipi} onChange={(e) => setAktiviteTipi(e.target.value)} required>
                    <option value="">Seçiniz</option>
                    {AKTIVITE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <button type="submit" className="submit-btn" disabled={loading}>
                  {loading ? 'Kaydediliyor...' : 'Kaydet'}
                </button>
              </form>
            </div>
          )}

          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '14px', overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', background: 'var(--surface-2)' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.05rem' }}>Aktivite Geçmişi</h3>
            </div>

            {kayitlar.length === 0 ? (
              <div style={{ padding: '24px' }}>
                <EmptyState
                  type="footprint"
                  title="Henüz adım kaydı yok"
                  description="Yukarıdaki formdan günlük adım sayını ekleyerek takibe başla."
                />
              </div>
            ) : (
              kayitlar.map((k) => (
                <div key={k.id} style={{ padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--surface-2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Footprints size={18} color="var(--accent)" />
                    </div>
                    <div>
                      <p style={{ fontWeight: 700, fontSize: '0.9rem' }}>{AKTIVITE_OPTIONS.find((o) => o.value === k.aktivite_tipi)?.label ?? k.aktivite_tipi}</p>
                      <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        {new Date(k.tarih).toLocaleString('tr-TR')}
                      </p>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 800, color: 'var(--accent)' }}>{k.adim_sayisi.toLocaleString('tr-TR')}</p>
                    <p style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>ADIM</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Steps;