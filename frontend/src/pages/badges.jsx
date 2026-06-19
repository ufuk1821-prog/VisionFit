import { useEffect, useState } from 'react';
import axios from 'axios';
import Sidebar from '../components/sidebar';

const SEVIYE_GRADIENT = {
  Bronz: 'from-amber-600 via-amber-800 to-amber-900',
  Gumus: 'from-slate-200 via-slate-400 to-slate-600',
  Altin: 'from-yellow-300 via-yellow-600 to-yellow-900',
};

const SEVIYE_RENK = { Bronz: 'text-amber-600', Gumus: 'text-slate-300', Altin: 'text-yellow-500' };
const SEVIYE_BG = { Bronz: 'bg-amber-600/10 border-amber-600/20 text-amber-600', Gumus: 'bg-slate-400/10 border-slate-400/20 text-slate-400', Altin: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-500' };
const SEVIYE_ETIKET = { Bronz: 'BRONZ TIER', Gumus: 'GÜMÜŞ TIER', Altin: 'ALTIN TIER' };

function Badges() {
  const [rozetler, setRozetler] = useState([]);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem('token');

  useEffect(() => {
    axios.get(`${import.meta.env.VITE_API_URL}/api/badges`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => { setRozetler(res.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div>
        <Sidebar />
        <main className="md:ml-64 min-h-screen pt-20 md:pt-10 pb-20 px-gutter md:px-section-padding">
          <p className="loading-text">Yükleniyor...</p>
        </main>
      </div>
    );
  }

  const kazanilanlar = rozetler.filter((r) => r.kazanildi);
  const kilitliler = rozetler.filter((r) => !r.kazanildi);
  const yuzde = rozetler.length > 0 ? Math.round((kazanilanlar.length / rozetler.length) * 100) : 0;

  return (
    <div>
      <Sidebar />
      <main className="md:ml-64 min-h-screen pt-20 md:pt-10 pb-20 px-gutter md:px-section-padding">
        <header className="mb-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h2 className="font-display-lg text-display-lg-mobile md:text-display-lg uppercase text-on-surface leading-none mb-2">Rozetler</h2>
              <p className="font-label-mono text-label-mono text-primary flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">verified</span>
                {kazanilanlar.length}/{rozetler.length} ROZET AÇILDI
              </p>
            </div>
            <div className="w-full md:w-80 space-y-2">
              <div className="flex justify-between font-label-mono text-[10px] text-on-surface-variant">
                <span>TOPLAM İLERLEME</span>
                <span>{yuzde}%</span>
              </div>
              <div className="h-1 w-full bg-surface-container-high rounded-full overflow-hidden">
                <div className="h-full bg-brand-red" style={{ width: `${yuzde}%`, boxShadow: '0 0 10px rgba(232,49,63,0.5)' }}></div>
              </div>
            </div>
          </div>
        </header>

        <section className="mb-12">
          <div className="flex items-center gap-4 mb-6">
            <h3 className="font-headline-md text-headline-md text-on-surface">KAZANILAN ROZETLER</h3>
            <div className="h-px flex-1 bg-outline-variant"></div>
          </div>

          {kazanilanlar.length === 0 ? (
            <p className="text-on-surface-variant">Henüz rozet kazanmadın, antrenmanlara devam et!</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-bento-gap">
              {kazanilanlar.map((rozet) => (
                <div key={rozet.key} className="bg-surface-container border border-outline-variant p-6 rounded-xl flex gap-5 items-start relative overflow-hidden transition-colors hover:border-brand-red">
                  <div className="absolute top-0 right-0 p-2 opacity-10">
                    <span className="material-symbols-outlined text-6xl">military_tech</span>
                  </div>
                  <div className={`w-20 h-20 shrink-0 rounded-full bg-gradient-to-br ${SEVIYE_GRADIENT[rozet.seviye] || 'from-brand-red to-brand-red'} flex items-center justify-center p-[2px]`}>
                    <div className="w-full h-full rounded-full bg-surface-container flex items-center justify-center border-2 border-surface-container">
                      <span className={`material-symbols-outlined text-4xl ${SEVIYE_RENK[rozet.seviye] || 'text-brand-red'}`} style={{ fontVariationSettings: "'FILL' 1" }}>workspace_premium</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <span className={`font-label-mono text-[10px] px-2 py-0.5 rounded border ${SEVIYE_BG[rozet.seviye] || 'bg-brand-red/10 border-brand-red/20 text-brand-red'}`}>
                      {SEVIYE_ETIKET[rozet.seviye] || rozet.seviye?.toUpperCase()}
                    </span>
                    <h4 className="font-headline-md text-headline-md text-on-surface">{rozet.baslik}</h4>
                    <p className="text-on-surface-variant text-body-sm">{rozet.aciklama}</p>
                    {rozet.kazanilma_tarihi && (
                      <p className="font-label-mono text-[10px] text-primary pt-2">KAZANILDI: {new Date(rozet.kazanilma_tarihi).toLocaleDateString('tr-TR')}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section>
          <div className="flex items-center gap-4 mb-6">
            <h3 className="font-headline-md text-headline-md text-on-surface-variant">KİLİTLİ ROZETLER</h3>
            <div className="h-px flex-1 bg-outline-variant/30"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-bento-gap opacity-40 grayscale">
            {kilitliler.map((rozet) => (
              <div key={rozet.key} className="bg-surface-container border border-outline-variant p-6 rounded-xl flex gap-5 items-start relative overflow-hidden">
                <div className="absolute top-4 right-4">
                  <span className="material-symbols-outlined text-on-surface-variant">lock</span>
                </div>
                <div className="w-20 h-20 shrink-0 rounded-full bg-surface-container-highest flex items-center justify-center border border-outline-variant">
                  <span className="material-symbols-outlined text-4xl text-on-surface-variant">fitness_center</span>
                </div>
                <div className="space-y-1">
                  <span className="font-label-mono text-[10px] text-on-surface-variant border border-outline-variant px-2 py-0.5 rounded">KİLİTLİ</span>
                  <h4 className="font-headline-md text-headline-md text-on-surface-variant">{rozet.baslik}</h4>
                  <p className="text-on-surface-variant text-body-sm">{rozet.aciklama}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

export default Badges;