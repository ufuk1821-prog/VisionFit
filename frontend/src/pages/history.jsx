import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Sidebar from '../components/sidebar';
import EmptyState from '../components/EmptyState';

const HAREKET_BILGI = {
  squat_session: { etiket: 'Squat', tip: 'oturum', icon: 'fitness_center' },
  deadlift_session: { etiket: 'Deadlift', tip: 'oturum', icon: 'fitness_center' },
  biceps_curl_session: { etiket: 'Biceps Curl', tip: 'oturum', icon: 'fitness_center' },
  shoulder_press_session: { etiket: 'Shoulder Press', tip: 'oturum', icon: 'fitness_center' },
  lateral_raise_session: { etiket: 'Lateral Raise', tip: 'oturum', icon: 'fitness_center' },
  dogru_squat: { etiket: 'Squat', tip: 'anlik', icon: 'fitness_center' },
  yanlis_squat: { etiket: 'Squat', tip: 'anlik', icon: 'fitness_center' },
  plank: { etiket: 'Plank', tip: 'anlik', icon: 'self_improvement' },
  sinav: { etiket: 'Şınav', tip: 'anlik', icon: 'sports_gymnastics' },
  kopru: { etiket: 'Köprü', tip: 'anlik', icon: 'accessibility_new' },
  yan_plank: { etiket: 'Yan Plank', tip: 'anlik', icon: 'self_improvement' },
  duvar_squat: { etiket: 'Duvar Squat', tip: 'anlik', icon: 'fitness_center' },
  supermen: { etiket: 'Süpermen', tip: 'anlik', icon: 'flight' },
};

const ACI_GOSTERME_HAREKETLERI = ['plank', 'sinav', 'kopru', 'yan_plank', 'supermen'];

function skorEtiket(skor) {
  if (skor >= 75) return 'Optimum Form';
  if (skor >= 50) return 'Geliştirilebilir';
  return 'Form Düzeltme Gerekli';
}

function History() {
  const [kayitlar, setKayitlar] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filtre, setFiltre] = useState('tumu');
  const [acikMenu, setAcikMenu] = useState(null);
  const [acikKart, setAcikKart] = useState(null);
  const [searchParams] = useSearchParams();
  const hedefKayitId = searchParams.get('kayit');
  const hedefRef = useRef(null);
  const token = localStorage.getItem('token');

  const silKaydi = async (id) => {
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/analyze/history/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      setKayitlar((prev) => prev.filter((k) => k.id !== id));
    } catch {}
    setAcikMenu(null);
  };

  useEffect(() => {
    axios.get(`${import.meta.env.VITE_API_URL}/api/analyze/history`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => {
        setKayitlar(res.data);
        setLoading(false);
        if (hedefKayitId) {
          setTimeout(() => hedefRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300);
        }
      })
      .catch(() => { setError('Veriler yüklenemedi.'); setLoading(false); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const tipBelirle = (hareketAdi) => HAREKET_BILGI[hareketAdi]?.tip ?? 'anlik';
  const etiketBelirle = (hareketAdi) => HAREKET_BILGI[hareketAdi]?.etiket ?? hareketAdi;
  const iconBelirle = (hareketAdi) => HAREKET_BILGI[hareketAdi]?.icon ?? 'fitness_center';

  const oturumKayitlari = kayitlar.filter((k) => tipBelirle(k.hareket_adi) === 'oturum');
  const anlikKayitlari = kayitlar.filter((k) => tipBelirle(k.hareket_adi) === 'anlik');

  const grafikVerisi = [...oturumKayitlari].reverse().map((k) => ({
    tarih: new Date(k.tarih).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' }),
    skor: k.eminlik_skoru,
  }));

  const filtrelenmisKayitlar = kayitlar.filter((k) => filtre === 'tumu' ? true : tipBelirle(k.hareket_adi) === filtre);

  return (
    <div>
      <Sidebar />
      <main className="md:ml-64 p-gutter md:p-section-padding mt-16 md:mt-0 min-h-screen">
        <header className="mb-10">
          <h2 className="font-display-lg text-display-lg-mobile md:text-display-lg text-on-surface mb-2">GEÇMİŞ</h2>
          <p className="text-on-surface-variant max-w-2xl font-body-md">Tüm antrenman performans verileriniz ve teknik analizleriniz burada arşivlenir.</p>
        </header>

        {loading && <p className="loading-text">Yükleniyor...</p>}
        {error && <p className="text-brand-red">{error}</p>}

        {!loading && !error && kayitlar.length === 0 && (
          <EmptyState type="camera" title="Henüz antrenman kaydı yok" description="Kamera sayfasından bir antrenman analizi yaparak ilk kaydını oluştur." />
        )}

        {!loading && oturumKayitlari.length > 1 && (
          <div className="bento-card p-6 mb-10">
            <div className="font-label-mono text-label-mono text-on-surface-variant uppercase mb-4">Genel Skor Gelişimi (Oturum Analizleri)</div>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={grafikVerisi}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333333" />
                <XAxis dataKey="tarih" stroke="#888888" fontSize={12} />
                <YAxis stroke="#888888" fontSize={12} domain={[0, 100]} />
                <Tooltip contentStyle={{ background: '#1c1b1b', border: '1px solid #333333', borderRadius: '8px' }} labelStyle={{ color: '#e5e2e1' }} />
                <Line type="monotone" dataKey="skor" stroke="#E8313F" strokeWidth={2} dot={{ fill: '#E8313F' }} name="Genel Skor (%)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {!loading && kayitlar.length > 0 && (
          <div className="flex flex-wrap gap-3 items-center mb-10">
            {[
              { value: 'tumu', label: 'TÜMÜ', count: kayitlar.length, borderClass: 'border-l-brand-red' },
              { value: 'oturum', label: 'OTURUM', count: oturumKayitlari.length, borderClass: 'border-l-purple-400' },
              { value: 'anlik', label: 'ANLIK', count: anlikKayitlari.length, borderClass: 'border-l-blue-400' },
            ].map((opt) => {
              const active = filtre === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => setFiltre(opt.value)}
                  className={`px-6 py-2 rounded-full font-label-mono text-label-mono transition-colors border-l-[3px] ${
                    active
                      ? `${opt.borderClass} bg-surface-container-high text-on-surface`
                      : 'border-l-transparent border border-outline-variant bg-surface-container text-on-surface-variant hover:bg-surface-container-highest'
                  }`}
                >
                  {opt.label} ({opt.count})
                </button>
              );
            })}
          </div>
        )}

        {!loading && kayitlar.length > 0 && (
          <div className="space-y-5">
            {filtrelenmisKayitlar.map((k) => {
              const tip = tipBelirle(k.hareket_adi);
              const etiket = etiketBelirle(k.hareket_adi);
              const icon = iconBelirle(k.hareket_adi);
              const isOpen = acikKart === k.id;
              const isTarget = hedefKayitId && String(k.id) === hedefKayitId;
              const iyi = k.eminlik_skoru >= 75;

              let detayKismi = '';
              let altMesaj = '';
              if (tip === 'oturum') {
                const parts = k.antrenor_notu.split(' | ');
                detayKismi = parts[1] || '';
                altMesaj = detayKismi === 'Tüm kategoriler iyi' ? 'Tüm kategorilerde formunuz iyiydi.' : `Geliştirilecek: ${detayKismi}`;
              } else {
                altMesaj = k.antrenor_notu;
              }

              return (
                <div
                  key={k.id}
                  ref={isTarget ? hedefRef : null}
                  className={`bento-card bg-surface-container-low rounded-xl overflow-hidden border-l-[3px] transition-colors ${isOpen || isTarget ? 'border-brand-red' : 'border-transparent'}`}
                >
                  <div
                    className="p-8 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:bg-surface-container transition-colors"
                    onClick={() => setAcikKart(isOpen ? null : k.id)}
                  >
                    <div className="flex items-center gap-6">
                      <div className={`w-16 h-16 rounded-lg bg-surface-container-highest flex items-center justify-center border ${tip === 'oturum' ? 'border-purple-500/30' : 'border-blue-500/30'}`}>
                        <span className={`material-symbols-outlined text-[40px] ${tip === 'oturum' ? 'text-purple-400' : 'text-blue-400'}`}>{icon}</span>
                      </div>
                      <div>
                        <h4 className="font-headline-md text-2xl text-on-surface leading-tight">{etiket}</h4>
                        <p className="font-label-mono text-sm text-on-surface-variant uppercase tracking-wider mt-1">
                          {new Date(k.tarih).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-10">
                      <div className="text-right">
                        <span className={`px-4 py-1.5 rounded text-base font-label-mono ${
                          k.eminlik_skoru >= 75 ? 'bg-emerald-500/15 text-emerald-400' :
                          k.eminlik_skoru >= 50 ? 'bg-amber-500/15 text-amber-400' :
                          'bg-brand-red/15 text-brand-red'
                        }`}>
                          {k.eminlik_skoru}% BAŞARI
                        </span>
                        <p className="text-base text-on-surface-variant mt-1.5">{skorEtiket(k.eminlik_skoru)}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <button
                            onClick={(e) => { e.stopPropagation(); setAcikMenu(acikMenu === k.id ? null : k.id); }}
                            className="p-2 hover:bg-surface-container-highest rounded-lg transition-colors"
                          >
                            <span className="material-symbols-outlined text-2xl text-on-surface-variant">more_vert</span>
                          </button>
                          {acikMenu === k.id && (
                            <div className="absolute top-10 right-0 bg-surface-container rounded-lg shadow-xl z-10 overflow-hidden border border-outline-variant">
                              <button onClick={(e) => { e.stopPropagation(); silKaydi(k.id); }} className="bg-transparent border-none text-brand-red px-4 py-3 cursor-pointer whitespace-nowrap text-sm">
                                Bu Kaydı Sil
                              </button>
                            </div>
                          )}
                        </div>
                        <span className={`material-symbols-outlined text-2xl text-primary transition-transform ${isOpen ? 'rotate-180' : ''}`}>expand_more</span>
                      </div>
                    </div>
                  </div>

                  {isOpen && (
                    <div className="px-6 pb-6 pt-2 border-t border-outline-variant/30">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="md:col-span-2 overflow-x-auto">
                          <table className="w-full font-label-mono text-label-mono text-left">
                            <thead className="text-on-surface-variant border-b border-outline-variant/30 uppercase">
                              <tr>
                                <th className="py-3">METRİK</th>
                                <th className="py-3 text-right">DEĞER</th>
                              </tr>
                            </thead>
                            <tbody className="text-on-surface divide-y divide-outline-variant/10">
                              {!ACI_GOSTERME_HAREKETLERI.includes(k.hareket_adi) && k.diz_acisi != null && (
                                <tr>
                                  <td className="py-4">Diz Açısı</td>
                                  <td className="py-4 text-right text-tertiary">{k.diz_acisi}°</td>
                                </tr>
                              )}
                              <tr>
                                <td className="py-4">Kayıt ID</td>
                                <td className="py-4 text-right">#{k.id}</td>
                              </tr>
                              <tr>
                                <td className="py-4">Saat</td>
                                <td className="py-4 text-right">{new Date(k.tarih).toLocaleTimeString('tr-TR')}</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>

                        <div className="bg-surface-container-highest p-5 rounded-lg border border-outline-variant">
                          <div className="flex items-center gap-2 mb-3">
                            <span className="material-symbols-outlined text-primary text-sm">comment</span>
                            <h5 className="font-label-mono text-label-mono uppercase tracking-widest">Antrenör Notu</h5>
                          </div>
                          <p className={`text-body-md leading-relaxed ${altMesaj.startsWith('Tüm') ? 'text-tertiary' : 'text-on-surface'}`}>{altMesaj}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

export default History;