import { useState } from 'react';
import axios from 'axios';
import { Sparkles } from 'lucide-react';
import { Activity, Flame, Target } from 'lucide-react';
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
  { value: 'kilo_verme', label: 'Kilo Ver' },
  { value: 'kilo_koruma', label: 'Kiloyu Koru' },
  { value: 'kilo_alma', label: 'Kilo Al' },
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
          protein_g: diet.gunluk_protein_g,
          karbonhidrat_g: diet.gunluk_karbonhidrat_g,
          yag_g: diet.gunluk_yag_g,
          istek: istek || 'genel öneri',
        },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      setAiOneri(res.data.yorum);
    } catch {
      setAiOneri('AI önerisi alınamadı, lütfen tekrar deneyin.');
    } finally {
      setAiYukleniyor(false);
    }
  };

  return (
    <div>
      <Sidebar />
      <div className="section-title">Diyet Önerisi</div>

      <div className="auth-box">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '16px' }}>
          <div className="form-group">
            <label>Boy (cm)</label>
            <input
              type="number"
              step="0.1"
              value={boy}
              onChange={handleBoyChange}
              placeholder="175"
              min="50"
              max="300"
              style={{ borderColor: boyHata ? 'var(--danger)' : undefined }}
            />
            {boyHata && <span style={{ color: 'var(--danger)', fontSize: '0.78rem', marginTop: '4px' }}>{boyHata}</span>}
          </div>
          <div className="form-group">
            <label>Kilo (kg)</label>
            <input
              type="number"
              step="0.1"
              value={kilo}
              onChange={handleKiloChange}
              placeholder="70"
              min="20"
              max="500"
              style={{ borderColor: kiloHata ? 'var(--danger)' : undefined }}
            />
            {kiloHata && <span style={{ color: 'var(--danger)', fontSize: '0.78rem', marginTop: '4px' }}>{kiloHata}</span>}
          </div>
          <div className="form-group">
            <label>Yaş</label>
            <input
              type="number"
              value={yas}
              onChange={handleYasChange}
              placeholder="25"
              min="1"
              max="120"
              style={{ borderColor: yasHata ? 'var(--danger)' : undefined }}
            />
            {yasHata && <span style={{ color: 'var(--danger)', fontSize: '0.78rem', marginTop: '4px' }}>{yasHata}</span>}
          </div>
          <div className="form-group">
            <label>Cinsiyet</label>
            <select value={cinsiyet} onChange={(e) => setCinsiyet(e.target.value)}>
              <option value="">Seçin</option>
              <option value="Erkek">Erkek</option>
              <option value="Kadin">Kadın</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label>Aktivite Seviyesi</label>
          <select value={aktiflik} onChange={(e) => setAktiflik(e.target.value)}>
            <option value="">Seçin</option>
            {AKTIFLIK_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        <div className="form-group">
          <label>Hedef</label>
          <select value={hedef} onChange={(e) => setHedef(e.target.value)}>
            <option value="">Seçin</option>
            {HEDEF_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        <div className="form-group">
          <label>Özel istek, alerji veya tercih (opsiyonel)</label>
          <textarea
            value={istek}
            onChange={(e) => setIstek(e.target.value)}
            placeholder="Örnek: Yumurtaya alerjim var, kırmızı et seviyorum"
          />
        </div>

        <button className="submit-btn" disabled={loading || !!boyHata || !!kiloHata || !!yasHata} onClick={handleGenerate}>
          {loading ? 'Hesaplanıyor...' : 'Diyet Önerisi Al'}
        </button>
      </div>

      {error && <p className="error-text">{error}</p>}

      {diet && (
        <>
          <div className="main-wrapper" style={{ marginTop: '24px' }}>
            <div className="bmi-card">
              <div className="bmi-card-title">Vücut Kitle Endeksi</div>
              <div className="bmi-value">{diet.bmi}</div>
              <span className={`bmi-badge ${diet.bmi_kategori.toLowerCase()}`}>
                {BMI_LABELS[diet.bmi_kategori] ?? diet.bmi_kategori}
              </span>
            </div>
            <div className="dashboard">
              <div className="card status-card">
                <div className="card-header">
                  <div className="card-icon"><Activity size={18} /></div>
                  <div className="card-title">Bazal Metabolizma (BMR)</div>
                </div>
                <div className="card-value">{diet.bmr} kcal</div>
              </div>
              <div className="card angle-card">
                <div className="card-header">
                  <div className="card-icon"><Flame size={18} /></div>
                  <div className="card-title">Toplam Günlük Harcama (TDEE)</div>
                </div>
                <div className="card-value">{diet.tdee} kcal</div>
              </div>
              <div className="card confidence-card">
                <div className="card-header">
                  <div className="card-icon"><Target size={18} /></div>
                  <div className="card-title">Hedef Günlük Kalori</div>
                </div>
                <div className="card-value">{diet.hedef_kalori} kcal</div>
              </div>
            </div>
          </div>

          <div className="section-title">Önerilen Planlar ({HEDEF_LABELS[diet.hedef] ?? diet.hedef})</div>

          <div className="diet-panel">
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
                    {plan.ornek_ogunler.map((ogun, i) => <li key={i}>{ogun}</li>)}
                  </ul>
                </div>
              );
            })}
          </div>
        <div className="card" style={{ marginTop: '16px' }}>
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
        </>
      )}
    </div>
  );
}

export default Diet;