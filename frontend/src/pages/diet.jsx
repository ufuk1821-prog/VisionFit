import { useState, useRef } from 'react';
import axios from 'axios';
import { Sparkles, BarChart3, Bot } from 'lucide-react';
import Sidebar from '../components/sidebar';

const BMI_LABELS = { Zayif: 'Zayıf', Normal: 'Normal', Kilolu: 'Kilolu', Obez: 'Obez' };
const HEDEF_LABELS = { kilo_verme: 'Kilo Verme', kilo_koruma: 'Kilo Koruma', kilo_alma: 'Kilo Alma' };

const AKTIFLIK_OPTIONS = [
  { value: 'sedanter', label: 'Hareketsiz (ofis işi, az egzersiz)' },
  { value: 'az_hareketli', label: 'Az Hareketli (haftada 1-3 gün)' },
  { value: 'orta_hareketli', label: 'Orta Hareketli (haftada 3-5 gün)' },
  { value: 'cok_hareketli', label: 'Çok Hareketli (haftada 6-7 gün)' },
  { value: 'asiri_hareketli', label: 'Aşırı Hareketli (günde 2 kez antrenman)' },
];

const HEDEF_OPTIONS = [
  { value: 'kilo_verme', label: 'Kilo Ver', desc: 'Yağ yakımı odaklı kalori açığı.', emoji: '📉' },
  { value: 'kilo_koruma', label: 'Formu Koru', desc: 'Stabil metabolizma ve enerji dengesi.', emoji: '⚖️' },
  { value: 'kilo_alma', label: 'Kilo Al', desc: 'Kas kütlesi için kalori fazlası.', emoji: '💪' },
];

function Diet() {
  const [boy, setBoy] = useState('');
  const [kilo, setKilo] = useState('');
  const [yas, setYas] = useState('');
  const [cinsiyet, setCinsiyet] = useState('');
  const [aktiflik, setAktiflik] = useState('');
  const [hedef, setHedef] = useState('');
  const [istek, setIstek] = useState('');
  const [diet, setDiet] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const sonucRef = useRef(null);
  const [aiOneri, setAiOneri] = useState('');
  const [aiYukleniyor, setAiYukleniyor] = useState(false);
  const [boyHata, setBoyHata] = useState('');
  const [kiloHata, setKiloHata] = useState('');
  const [yasHata, setYasHata] = useState('');
  const token = localStorage.getItem('token');

  const handleBoyChange = (e) => {
    const val = e.target.value;
    setBoy(val);
    const num = parseFloat(val);
    if (val !== '' && (isNaN(num) || num < 50 || num > 300)) {
      setBoyHata('Boy 50 ile 300 cm arasında olmalıdır.');
    } else {
      setBoyHata('');
    }
  };

  const handleKiloChange = (e) => {
    const val = e.target.value;
    setKilo(val);
    const num = parseFloat(val);
    if (val !== '' && (isNaN(num) || num < 20 || num > 500)) {
      setKiloHata('Kilo 20 ile 500 kg arasında olmalıdır.');
    } else {
      setKiloHata('');
    }
  };

  const handleYasChange = (e) => {
    const val = e.target.value;
    setYas(val);
    const num = parseInt(val, 10);
    if (val !== '' && (isNaN(num) || num < 1 || num > 120)) {
      setYasHata('Yaş 1 ile 120 arasında olmalıdır.');
    } else {
      setYasHata('');
    }
  };

  const handleGenerate = async () => {
    setError('');
    if (!boy || !kilo || !yas || !cinsiyet || !aktiflik || !hedef) {
      setError('Lütfen tüm alanları doldurun.');
      return;
    }
    if (boyHata || kiloHata || yasHata) {
      setError('Lütfen geçerli değerler girin.');
      return;
    }
    setLoading(true);
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/users/diet/calculate`,
        {
          boy: Number(boy),
          kilo: Number(kilo),
          yas: Number(yas),
          cinsiyet,
          aktiflik_seviyesi: aktiflik,
          hedef,
          istek,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setDiet(response.data);
      setTimeout(() => sonucRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch (err) {
      setError(err.response?.data?.detail || 'Hesaplama sırasında hata oluştu.');
      setDiet(null);
    } finally {
      setLoading(false);
    }
  };

  const aiOneriAl = async () => {
    if (!diet) return;
    setAiYukleniyor(true);
    setAiOneri('');
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/yerel-ai/diyet-onerisi`,
        {
          bmi: diet.bmi,
          bmi_kategori: diet.bmi_kategori,
          hedef: hedef,
          hedef_kalori: diet.hedef_kalori,
          protein_g: diet.planlar?.[0]?.protein_g ?? 0,
          karbonhidrat_g: diet.planlar?.[0]?.karbonhidrat_g ?? 0,
          yag_g: diet.planlar?.[0]?.yag_g ?? 0,
          istek: istek || 'genel öneri',
        },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      setAiOneri(res.data.yorum);
      setTimeout(() => sonucRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 300);
    } catch {
      setAiOneri('AI önerisi alınamadı, lütfen tekrar deneyin.');
    } finally {
      setAiYukleniyor(false);
    }
  };

  const bmiPercent = diet ? Math.min(Math.max(((diet.bmi - 15) / (35 - 15)) * 100, 0), 100) : 0;

  return (
    <div>
      <Sidebar />

      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '1.8rem', textTransform: 'uppercase' }}>DİYET ÖNERİSİ</h1>
        <p style={{ color: 'var(--text-muted)', maxWidth: '640px', marginTop: '8px' }}>
          Biyometrik verilerinize ve hedeflerinize göre yapay zeka tarafından optimize edilmiş beslenme planınızı inceleyin.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '4fr 8fr', gap: '16px' }} className="diet-grid">
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <BarChart3 size={20} color="var(--accent)" />
            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.1rem' }}>Ölçümler</h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Boy (cm)</label>
              <input type="number" step="0.1" value={boy} onChange={handleBoyChange} placeholder="180" min="50" max="300" style={{ borderColor: boyHata ? 'var(--danger)' : undefined }} />
              {boyHata && <span style={{ color: 'var(--danger)', fontSize: '0.72rem', marginTop: '4px' }}>{boyHata}</span>}
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Kilo (kg)</label>
              <input type="number" step="0.1" value={kilo} onChange={handleKiloChange} placeholder="75" min="20" max="500" style={{ borderColor: kiloHata ? 'var(--danger)' : undefined }} />
              {kiloHata && <span style={{ color: 'var(--danger)', fontSize: '0.72rem', marginTop: '4px' }}>{kiloHata}</span>}
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Yaş</label>
            <input type="number" value={yas} onChange={handleYasChange} placeholder="28" min="1" max="120" style={{ borderColor: yasHata ? 'var(--danger)' : undefined }} />
            {yasHata && <span style={{ color: 'var(--danger)', fontSize: '0.72rem', marginTop: '4px' }}>{yasHata}</span>}
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Cinsiyet</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setCinsiyet('Erkek')}
                style={{ flex: 1, padding: '10px', borderRadius: '8px', cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: '0.72rem', textTransform: 'uppercase', border: cinsiyet === 'Erkek' ? '1px solid var(--accent)' : '1px solid var(--border)', background: cinsiyet === 'Erkek' ? 'var(--surface-2)' : 'transparent', color: cinsiyet === 'Erkek' ? 'var(--accent)' : 'var(--text-muted)' }}
              >
                Erkek
              </button>
              <button
                onClick={() => setCinsiyet('Kadin')}
                style={{ flex: 1, padding: '10px', borderRadius: '8px', cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: '0.72rem', textTransform: 'uppercase', border: cinsiyet === 'Kadin' ? '1px solid var(--accent)' : '1px solid var(--border)', background: cinsiyet === 'Kadin' ? 'var(--surface-2)' : 'transparent', color: cinsiyet === 'Kadin' ? 'var(--accent)' : 'var(--text-muted)' }}
              >
                Kadın
              </button>
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Aktivite Seviyesi</label>
            <select value={aktiflik} onChange={(e) => setAktiflik(e.target.value)}>
              <option value="">Seçin</option>
              {AKTIFLIK_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }} className="diet-goal-grid">
            {HEDEF_OPTIONS.map((h) => {
              const active = hedef === h.value;
              return (
                <div
                  key={h.value}
                  onClick={() => setHedef(h.value)}
                  style={{
                    background: active ? 'var(--surface-2)' : 'var(--surface)', padding: '24px', borderRadius: '16px', cursor: 'pointer',
                    border: active ? '2px solid var(--accent)' : '1px solid var(--border)', position: 'relative', overflow: 'hidden', transition: 'all 0.2s',
                  }}
                >
                  {active && <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: 'var(--accent)' }} />}
                  <div style={{ fontSize: '2.2rem', marginBottom: '12px' }}>{h.emoji}</div>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.05rem', marginBottom: '4px' }}>{h.label}</h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{h.desc}</p>
                </div>
              );
            })}
          </div>

          <div className="form-group" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', padding: '20px', marginBottom: 0 }}>
            <label>Özel İstekler (Vejetaryen, Alerjen vb.)</label>
            <textarea
              value={istek}
              onChange={(e) => setIstek(e.target.value)}
              placeholder="Örn: Süt ürünleri tüketmiyorum, yüksek proteinli tarifler tercih ederim..."
            />
          </div>

          <button
            className="submit-btn"
            disabled={loading || !!boyHata || !!kiloHata || !!yasHata}
            onClick={handleGenerate}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', padding: '16px' }}
          >
            <Sparkles size={18} />
            {loading ? 'Hesaplanıyor...' : 'DİYET PLANINI OLUŞTUR'}
          </button>
        </div>
      </div>

      {error && <p className="error-text">{error}</p>}

      {diet && (
        <div ref={sonucRef}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginTop: '24px' }} className="diet-stats-grid">
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Vücut Kitle Endeksi (BMI)</span>
              <div style={{ marginTop: '16px', display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: '2.4rem', fontWeight: 900 }}>{diet.bmi}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: '#4CAF50' }}>{(BMI_LABELS[diet.bmi_kategori] ?? diet.bmi_kategori).toUpperCase()}</span>
              </div>
              <div style={{ marginTop: '20px', height: '6px', width: '100%', background: 'var(--surface-2)', borderRadius: '999px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${bmiPercent}%`, background: '#4CAF50', borderRadius: '999px' }} />
              </div>
            </div>

            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', padding: '24px' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Günlük Kalori Hedefi</span>
              <div style={{ marginTop: '16px', display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: '2.4rem', fontWeight: 900, color: 'var(--accent)' }}>{diet.hedef_kalori}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-muted)' }}>kcal</span>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '10px' }}>Bazal metabolizma: {diet.bmr} kcal</p>
            </div>

            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', padding: '24px', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center' }}>
              <div style={{ position: 'absolute', top: 0, right: 0, opacity: 0.06 }}>
                <Bot size={120} />
              </div>
              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                  <Sparkles size={14} color="#8d99ae" />
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#8d99ae', letterSpacing: '0.1em', textTransform: 'uppercase' }}>TOPLAM GÜNLÜK HARCAMA</span>
                </div>
                <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', fontWeight: 700, fontStyle: 'italic' }}>{diet.tdee} kcal</p>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '24px' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 700, marginBottom: '16px', textTransform: 'uppercase' }}>
              Önerilen Planlar ({HEDEF_LABELS[diet.hedef] ?? diet.hedef})
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
              {diet.planlar.map((plan, index) => {
                const pKcal = plan.protein_g * 4;
                const cKcal = plan.karbonhidrat_g * 4;
                const fKcal = plan.yag_g * 9;
                const total = pKcal + cKcal + fKcal;
                return (
                  <div className="plan-card" key={index}>
                    <h3>{plan.baslik}</h3>
                    <div className="macro-bar">
                      <div className="macro-bar-segment protein" style={{ width: `${(pKcal / total) * 100}%` }} />
                      <div className="macro-bar-segment carb" style={{ width: `${(cKcal / total) * 100}%` }} />
                      <div className="macro-bar-segment fat" style={{ width: `${(fKcal / total) * 100}%` }} />
                    </div>
                    <div className="plan-macros">
                      <span>{plan.kalori} kcal</span>
                      <span><span className="dot protein" />Protein: {plan.protein_g} g</span>
                      <span><span className="dot carb" />Karbonhidrat: {plan.karbonhidrat_g} g</span>
                      <span><span className="dot fat" />Yağ: {plan.yag_g} g</span>
                    </div>
                    <ul className="plan-meals">
                      {plan.ornek_ogunler.map((ogun, i) => <li key={i}>• {ogun}</li>)}
                    </ul>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="card" style={{ marginTop: '24px' }}>
            <div className="card-header">
              <div className="card-icon"><Sparkles size={18} /></div>
              <div className="card-title">AI Diyet Önerisi</div>
            </div>
            {!aiOneri && (
              <button className="timer-btn" style={{ marginTop: '8px', justifyContent: 'center', width: '100%' }} onClick={aiOneriAl} disabled={aiYukleniyor}>
                <Sparkles size={16} /> {aiYukleniyor ? 'Öneri Hazırlanıyor...' : 'AI Önerisi Al'}
              </button>
            )}
            {aiOneri && <p style={{ fontSize: '0.85rem', color: 'var(--text)', marginTop: '8px', lineHeight: '1.6' }}>{aiOneri}</p>}
          </div>
        </div>
      )}
    </div>
  );
}

export default Diet;