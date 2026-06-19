import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, Minus, Dumbbell, Zap, MoreVertical, Sparkles, ChevronDown } from 'lucide-react';
import Sidebar from '../components/sidebar';
import EmptyState from '../components/EmptyState';

const HAREKET_BILGI = {
  squat_session: { etiket: 'Squat', tip: 'oturum' },
  dogru_squat: { etiket: 'Squat', tip: 'anlik' },
  yanlis_squat: { etiket: 'Squat', tip: 'anlik' },
  plank: { etiket: 'Plank', tip: 'anlik' },
  sinav: { etiket: 'Şınav', tip: 'anlik' },
  kopru: { etiket: 'Köprü', tip: 'anlik' },
  yan_plank: { etiket: 'Yan Plank', tip: 'anlik' },
  duvar_squat: { etiket: 'Duvar Squat', tip: 'anlik' },
  supermen: { etiket: 'Süpermen', tip: 'anlik' },
};

const ACI_GOSTERME_HAREKETLERI = ['plank', 'sinav', 'kopru', 'yan_plank', 'supermen'];

const FILTRE_OPTIONS = [
  { value: 'tumu', label: 'TÜMÜ' },
  { value: 'oturum', label: 'OTURUM' },
  { value: 'anlik', label: 'ANLIK' },
];

function skorRengi(skor) {
  if (skor >= 75) return 'var(--accent)';
  if (skor >= 50) return 'var(--accent-blue)';
  return 'var(--danger)';
}

function skorEtiket(skor) {
  if (skor >= 75) return 'Optimum Form';
  if (skor >= 50) return 'Geliştirilebilir';
  return 'Form Düzeltme Gerekli';
}

function TrendIcon({ fark }) {
  if (fark > 0) return <TrendingUp size={14} />;
  if (fark < 0) return <TrendingDown size={14} />;
  return <Minus size={14} />;
}

function History() {
  const [kayitlar, setKayitlar] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filtre, setFiltre] = useState('tumu');
  const [acikMenu, setAcikMenu] = useState(null);
  const [acikKart, setAcikKart] = useState(null);
  const [analizSayi, setAnalizSayi] = useState(10);
  const [analizSonuc, setAnalizSonuc] = useState('');
  const [analizYukleniyor, setAnalizYukleniyor] = useState(false);
  const [searchParams] = useSearchParams();
  const hedefKayitId = searchParams.get('kayit');
  const hedefRef = useRef(null);
  const token = localStorage.getItem('token');

  const silKaydi = async (id) => {
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/analyze/history/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setKayitlar((prev) => prev.filter((k) => k.id !== id));
    } catch {
    }
    setAcikMenu(null);
  };

  useEffect(() => {
    axios.get(`${import.meta.env.VITE_API_URL}/api/analyze/history`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then((res) => {
      setKayitlar(res.data);
      setLoading(false);
      if (hedefKayitId) {
        setTimeout(() => {
          hedefRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 300);
      }
    }).catch(() => {
      setError('Veriler yüklenemedi.');
      setLoading(false);
    });
  }, []);

  const tipBelirle = (hareketAdi) => HAREKET_BILGI[hareketAdi]?.tip ?? 'anlik';
  const etiketBelirle = (hareketAdi) => HAREKET_BILGI[hareketAdi]?.etiket ?? hareketAdi;

  const oturumKayitlari = kayitlar.filter((k) => tipBelirle(k.hareket_adi) === 'oturum');
  const anlikKayitlari = kayitlar.filter((k) => tipBelirle(k.hareket_adi) === 'anlik');

  const grafikVerisi = [...oturumKayitlari]
    .reverse()
    .map((k) => ({
      tarih: new Date(k.tarih).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' }),
      skor: k.eminlik_skoru,
    }));

  const filtrelenmisKayitlar = kayitlar.filter((k) => {
    if (filtre === 'tumu') return true;
    return tipBelirle(k.hareket_adi) === filtre;
  });

  const sonOturumFarki = oturumKayitlari.length >= 2
    ? Math.round((oturumKayitlari[0].eminlik_skoru - oturumKayitlari[1].eminlik_skoru) * 10) / 10
    : null;

  const handleAnalizEt = async () => {
    setAnalizYukleniyor(true);
    setAnalizSonuc('');
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/yerel-ai/gecmis-analizi?sayi=${analizSayi}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAnalizSonuc(res.data.yorum);
    } catch {
      setAnalizSonuc('Analiz alınamadı, lütfen tekrar deneyin.');
    } finally {
      setAnalizYukleniyor(false);
    }
  };

  return (
    <div>
      <Sidebar />

      <header style={{ marginBottom: '40px' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 900, textTransform: 'uppercase', marginBottom: '8px' }}>GEÇMİŞ</h2>
        <p style={{ color: 'var(--text-muted)', maxWidth: '640px' }}>Tüm antrenman performans verileriniz ve teknik analizleriniz burada arşivlenir.</p>
      </header>

      {loading && <p className="loading-text">Yükleniyor...</p>}
      {error && <p className="error-text">{error}</p>}

      {!loading && !error && kayitlar.length === 0 && (
        <EmptyState
          type="camera"
          title="Henüz antrenman kaydı yok"
          description="Kamera sayfasından bir antrenman analizi yaparak ilk kaydını oluştur."
        />
      )}

      {!loading && oturumKayitlari.length > 1 && (
        <div className="chart-card">
          <div className="card-title" style={{ marginBottom: '16px' }}>Genel Skor Gelişimi (Oturum Analizleri)</div>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={grafikVerisi}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="tarih" stroke="var(--text-muted)" fontSize={12} />
              <YAxis stroke="var(--text-muted)" fontSize={12} domain={[0, 100]} />
              <Tooltip
                contentStyle={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '8px' }}
                labelStyle={{ color: 'var(--text)' }}
              />
              <Line type="monotone" dataKey="skor" stroke="var(--accent)" strokeWidth={2} dot={{ fill: 'var(--accent)' }} name="Genel Skor (%)" />
            </LineChart>
          </ResponsiveContainer>

          {sonOturumFarki !== null && (
            <div className={`comparison-delta ${sonOturumFarki > 0 ? 'up' : sonOturumFarki < 0 ? 'down' : 'same'}`} style={{ marginTop: '12px' }}>
              <TrendIcon fark={sonOturumFarki} />
              {sonOturumFarki > 0 ? `Son oturumda önceki oturuma göre +${sonOturumFarki} puan` : sonOturumFarki < 0 ? `Son oturumda önceki oturuma göre ${sonOturumFarki} puan` : 'Son oturum önceki oturumla aynı skorda'}
            </div>
          )}
        </div>
      )}

      {!loading && kayitlar.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px', marginTop: '16px', marginBottom: '24px' }} className="history-filter-grid">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
            {FILTRE_OPTIONS.map((opt) => {
              const count = opt.value === 'tumu' ? kayitlar.length : opt.value === 'oturum' ? oturumKayitlari.length : anlikKayitlari.length;
              const active = filtre === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => setFiltre(opt.value)}
                  style={{
                    padding: '8px 24px', borderRadius: '999px', cursor: 'pointer',
                    fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 700,
                    border: active ? '1px solid var(--accent)' : '1px solid var(--border)',
                    borderLeft: active ? '3px solid var(--accent)' : '1px solid var(--border)',
                    background: active ? 'var(--surface-2)' : 'transparent',
                    color: active ? 'var(--text)' : 'var(--text-muted)',
                    transition: 'all 0.15s',
                  }}
                >
                  {opt.label} ({count})
                </button>
              );
            })}
          </div>

          <div style={{ background: 'var(--surface-2)', borderRadius: '12px', padding: '20px', position: 'relative', overflow: 'hidden', border: '1px solid var(--border)' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: '#8d99ae', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px' }}>
              <Sparkles size={16} /> AI ANALİZİ
            </h3>
            <p style={{ fontSize: '0.85rem', marginBottom: '12px' }}>Son N antrenmanı analiz et</p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="number"
                min={1}
                max={30}
                value={analizSayi}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '' || val === '0') { setAnalizSayi(''); return; }
                  setAnalizSayi(Math.min(30, Math.max(1, Number(val))));
                }}
                onBlur={() => { if (!analizSayi || analizSayi === '') setAnalizSayi(10); }}
                style={{ width: '70px', padding: '8px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--surface-lowest, #0e0e0e)', color: 'var(--text)', textAlign: 'center', fontFamily: 'var(--font-mono)' }}
              />
              <button
                onClick={handleAnalizEt}
                disabled={analizYukleniyor}
                style={{
                  flex: 1, background: '#8d99ae', color: '#fff', border: 'none', borderRadius: '8px',
                  fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', cursor: 'pointer',
                }}
              >
                {analizYukleniyor ? 'Analiz...' : 'Analiz Et'}
              </button>
            </div>
            {analizSonuc && <p style={{ fontSize: '0.82rem', color: 'var(--text)', marginTop: '12px', lineHeight: '1.6' }}>{analizSonuc}</p>}
          </div>
        </div>
      )}

      {!loading && kayitlar.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filtrelenmisKayitlar.map((k) => {
            const tip = tipBelirle(k.hareket_adi);
            const etiket = etiketBelirle(k.hareket_adi);
            const isOpen = acikKart === k.id;
            const isTarget = hedefKayitId && String(k.id) === hedefKayitId;
            const renk = skorRengi(k.eminlik_skoru);

            let altMesaj = '';
            let detayKismi = '';
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
                style={{
                  background: 'var(--surface-2)', borderRadius: '12px', overflow: 'hidden',
                  borderLeft: isOpen ? '3px solid var(--accent)' : '3px solid transparent',
                  border: isTarget ? '1px solid var(--accent)' : '1px solid var(--border)',
                  borderLeftWidth: '3px',
                  borderLeftColor: isOpen ? 'var(--accent)' : 'transparent',
                }}
              >
                <div
                  style={{ padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', cursor: 'pointer', flexWrap: 'wrap' }}
                  onClick={() => setAcikKart(isOpen ? null : k.id)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '10px', background: 'var(--surface)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {tip === 'oturum' ? <Zap size={22} color="var(--accent)" /> : <Dumbbell size={22} color="var(--accent)" />}
                    </div>
                    <div>
                      <h4 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.05rem' }}>{etiket}</h4>
                      <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {new Date(k.tarih).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ padding: '4px 12px', borderRadius: '6px', fontFamily: 'var(--font-mono)', fontSize: '0.72rem', fontWeight: 700, background: `${renk}22`, color: renk }}>
                        %{k.eminlik_skoru} BAŞARI
                      </span>
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>{skorEtiket(k.eminlik_skoru)}</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <div style={{ position: 'relative' }}>
                        <button
                          onClick={(e) => { e.stopPropagation(); setAcikMenu(acikMenu === k.id ? null : k.id); }}
                          style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '6px', display: 'flex' }}
                        >
                          <MoreVertical size={18} />
                        </button>
                        {acikMenu === k.id && (
                          <div style={{ position: 'absolute', top: '28px', right: '0', background: 'var(--surface)', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.3)', zIndex: 10, overflow: 'hidden', border: '1px solid var(--border)' }}>
                            <button onClick={(e) => { e.stopPropagation(); silKaydi(k.id); }} style={{ background: 'none', border: 'none', color: 'var(--danger)', padding: '10px 16px', cursor: 'pointer', whiteSpace: 'nowrap', fontSize: '0.85rem' }}>
                              Bu Kaydı Sil
                            </button>
                          </div>
                        )}
                      </div>
                      <ChevronDown size={20} color="var(--accent)" style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                    </div>
                  </div>
                </div>

                {isOpen && (
                  <div style={{ padding: '0 20px 20px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', paddingTop: '16px' }} className="history-detail-grid">
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem' }}>
                        {!ACI_GOSTERME_HAREKETLERI.includes(k.hareket_adi) && k.diz_acisi != null && (
                          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                            <span style={{ color: 'var(--text-muted)', textTransform: 'uppercase' }}>Diz Açısı</span>
                            <span style={{ color: renk }}>{k.diz_acisi}°</span>
                          </div>
                        )}
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                          <span style={{ color: 'var(--text-muted)', textTransform: 'uppercase' }}>Kayıt ID</span>
                          <span>#{k.id}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0' }}>
                          <span style={{ color: 'var(--text-muted)', textTransform: 'uppercase' }}>Saat</span>
                          <span>{new Date(k.tarih).toLocaleTimeString('tr-TR')}</span>
                        </div>
                      </div>

                      <div style={{ background: 'var(--surface)', padding: '16px', borderRadius: '10px', border: '1px solid var(--border)' }}>
                        <h5 style={{ display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'var(--font-mono)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>
                          Antrenör Notu
                        </h5>
                        <p style={{ fontSize: '0.85rem', lineHeight: 1.6, color: altMesaj.startsWith('Tüm') ? 'var(--accent)' : 'var(--text)' }}>
                          {altMesaj}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default History;