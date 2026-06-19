import { useEffect, useState } from 'react';
import axios from 'axios';
import Sidebar from '../components/sidebar';
import EmptyState from '../components/EmptyState';

const AKTIVITE_OPTIONS = [
  { value: 'yuruyus', label: 'Yürüyüş', icon: 'directions_walk' },
  { value: 'tempolu_yuruyus', label: 'Tempolu Yürüyüş', icon: 'directions_walk' },
  { value: 'kosu', label: 'Koşu', icon: 'directions_run' },
  { value: 'tempolu_kosu', label: 'Tempolu Koşu', icon: 'directions_run' },
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
    axios.get(`${import.meta.env.VITE_API_URL}/api/steps`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => setKayitlar(res.data)).catch(() => {});
  };

  useEffect(() => { fetchKayitlar(); }, []);

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
      setError(err.response?.data?.detail || 'Kayıt eklenemedi.');
    } finally {
      setLoading(false);
    }
  };

  const bugun = new Date();
  const bugunkuKayitlar = kayitlar.filter((k) => new Date(k.tarih).toDateString() === bugun.toDateString());
  const toplamAdim = bugunkuKayitlar.reduce((acc, k) => acc + k.adim_sayisi, 0);
  const toplamKalori = bugunkuKayitlar.reduce((acc, k) => acc + (k.yakilan_kalori || 0), 0);
  const toplamMesafe = (toplamAdim * 0.0008).toFixed(1);
  const hedefYuzde = (toplamAdim / GOAL) * 100;

  const ringCircumference = 2 * Math.PI * 80;
  const ringOffset = ringCircumference * (1 - Math.min(toplamAdim / GOAL, 1));

  const ayAdi = bugun.toLocaleDateString('tr-TR', { month: 'short' }).toUpperCase();

  return (
    <div>
      <Sidebar />
      <main className="md:ml-64 pt-20 md:pt-10 px-gutter md:px-section-padding min-h-screen">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-gutter">
          <div className="flex flex-row md:flex-col items-center md:items-start justify-center md:justify-start gap-2 py-4 md:py-8 min-w-[80px] border-b md:border-b-0 md:border-r border-outline-variant/30">
            <div className="bg-primary text-on-primary-container px-3 py-1 rounded font-black text-stat-lg">{bugun.getDate()}</div>
            <div className="font-label-mono text-label-mono uppercase tracking-widest text-on-surface-variant">{ayAdi}</div>
          </div>

          <div className="flex-1 space-y-bento-gap">
            <div className="bg-secondary-container/20 border border-secondary-container/40 p-4 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>sync</span>
                <p className="font-label-mono text-label-mono text-secondary uppercase">Telefon Senkronizasyonu Aktif</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-bento-gap">
              <div className="lg:col-span-2 bento-card p-8 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4">
                  <span className="material-symbols-outlined text-primary-container/20 text-8xl scale-150 rotate-12">footprint</span>
                </div>
                <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                  <div className="relative w-48 h-48 flex items-center justify-center">
                    <svg className="w-48 h-48 -rotate-90">
                      <circle className="text-surface-container-highest" cx="96" cy="96" fill="transparent" r="80" stroke="currentColor" strokeWidth="12"></circle>
                      <circle
                        className="text-primary" cx="96" cy="96" fill="transparent" r="80" stroke="currentColor" strokeWidth="12" strokeLinecap="round"
                        strokeDasharray={ringCircumference} strokeDashoffset={ringOffset}
                        style={{ transition: 'stroke-dashoffset 0.6s ease' }}
                      ></circle>
                    </svg>
                    <div className="absolute text-center">
                      <span className="block font-label-mono text-label-mono text-on-surface-variant uppercase">%{Math.round(hedefYuzde)}</span>
                      {hedefYuzde >= 100 && <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>stars</span>}
                    </div>
                  </div>

                  <div className="flex-1 text-center md:text-left">
                    <h2 className="font-label-mono text-label-mono text-on-surface-variant uppercase tracking-widest mb-1">Günlük Toplam Adım</h2>
                    <div className="font-display-lg text-display-lg-mobile md:text-display-lg text-primary leading-none mb-2">{toplamAdim.toLocaleString('tr-TR')}</div>
                    <div className="flex items-center justify-center md:justify-start gap-2">
                      <span className="font-label-mono text-label-mono text-on-surface-variant uppercase">Hedef: {GOAL.toLocaleString('tr-TR')}</span>
                      {toplamAdim >= GOAL && <span className="px-2 py-0.5 bg-tertiary-container text-on-tertiary-container rounded text-[10px] font-bold">TAMAMLANDI</span>}
                    </div>
                    <div className="mt-8 flex gap-4">
                      <button onClick={() => setShowForm((v) => !v)} className="flex-1 bg-primary text-on-primary font-bold py-3 px-6 rounded-lg text-label-mono uppercase hover:scale-[1.02] transition-transform flex items-center justify-center gap-2">
                        <span className="material-symbols-outlined text-[18px]">add</span> Verileri Manuel Gir
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-bento-gap">
                <div className="bento-card p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <span className="material-symbols-outlined text-on-surface-variant mb-2">local_fire_department</span>
                    <p className="font-label-mono text-label-mono text-on-surface-variant uppercase">Kalori Yakımı</p>
                  </div>
                  <div>
                    <span className="font-stat-lg text-stat-lg text-on-surface">{Math.round(toplamKalori)}</span>
                    <span className="font-label-mono text-label-mono text-on-surface-variant ml-1">kcal</span>
                  </div>
                </div>
                <div className="bento-card p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <span className="material-symbols-outlined text-on-surface-variant mb-2">straighten</span>
                    <p className="font-label-mono text-label-mono text-on-surface-variant uppercase">Mesafe</p>
                  </div>
                  <div>
                    <span className="font-stat-lg text-stat-lg text-on-surface">{toplamMesafe}</span>
                    <span className="font-label-mono text-label-mono text-on-surface-variant ml-1">km</span>
                  </div>
                </div>
              </div>
            </div>

            {showForm && (
              <div className="bento-card p-6">
                {error && <p className="text-brand-red text-sm mb-3">{error}</p>}
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <label className="font-label-mono text-label-mono text-on-surface-variant uppercase">Adım Sayısı</label>
                    <input
                      type="number" value={adimSayisi} onChange={(e) => setAdimSayisi(e.target.value)} required
                      className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg p-3 text-on-surface focus:border-primary-container focus:ring-0 outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="font-label-mono text-label-mono text-on-surface-variant uppercase">Aktivite Türü</label>
                    <select value={aktiviteTipi} onChange={(e) => setAktiviteTipi(e.target.value)} required className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg p-3 text-on-surface focus:border-primary-container focus:ring-0 outline-none">
                      <option value="">Seçiniz</option>
                      {AKTIVITE_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                    </select>
                  </div>
                  <button type="submit" disabled={loading} className="w-full py-3 bg-primary text-on-primary font-bold rounded-lg uppercase font-label-mono disabled:opacity-50">
                    {loading ? 'Kaydediliyor...' : 'Kaydet'}
                  </button>
                </form>
              </div>
            )}

            <div className="bento-card overflow-hidden">
              <div className="p-6 border-b border-outline-variant flex items-center justify-between bg-surface-container-low">
                <h3 className="font-headline-md text-headline-md text-on-surface">Aktivite Geçmişi</h3>
              </div>

              {kayitlar.length === 0 ? (
                <div className="p-8"><EmptyState type="footprint" title="Henüz adım kaydı yok" description="Yukarıdaki formdan günlük adım sayını ekleyerek takibe başla." /></div>
              ) : (
                <div className="divide-y divide-outline-variant">
                  {kayitlar.map((k) => {
                    const aktivite = AKTIVITE_OPTIONS.find((o) => o.value === k.aktivite_tipi);
                    return (
                      <div key={k.id} className="p-4 md:p-6 flex items-center justify-between hover:bg-surface-container-high transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-surface-container-highest flex items-center justify-center border border-outline-variant">
                            <span className="material-symbols-outlined text-primary text-[20px]">{aktivite?.icon ?? 'directions_walk'}</span>
                          </div>
                          <div>
                            <p className="font-bold text-on-surface">{aktivite?.label ?? k.aktivite_tipi}</p>
                            <p className="text-[12px] text-on-surface-variant font-label-mono">{new Date(k.tarih).toLocaleString('tr-TR')}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-stat-lg text-[20px] text-primary">{k.adim_sayisi.toLocaleString('tr-TR')}</p>
                          <p className="text-[10px] text-on-surface-variant font-label-mono uppercase">ADIM</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="h-10"></div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Steps;