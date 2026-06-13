import { useState } from 'react';
import axios from 'axios';
import { Activity, Flame, Target } from 'lucide-react';
import Sidebar from '../components/sidebar';

const BMI_LABELS = {
  Zayif: 'Zayıf',
  Normal: 'Normal',
  Kilolu: 'Kilolu',
  Obez: 'Obez',
};

const HEDEF_LABELS = {
  kilo_verme: 'Kilo Verme',
  kilo_koruma: 'Kilo Koruma',
  kilo_alma: 'Kilo Alma',
};

function Diet() {
  const [confirmed, setConfirmed] = useState(false);
  const [istek, setIstek] = useState('');
  const [diet, setDiet] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const token = localStorage.getItem('token');

  const handleGenerate = async () => {
    setError('');
    setLoading(true);
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/users/me/diet/custom`,
        { istek },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setDiet(response.data);
    } catch (err) {
      setError('Profil bilgileriniz eksik. Önce Profilim sayfasından boy, kilo, yaş, cinsiyet, aktiflik seviyesi ve hedef bilgilerinizi doldurun.');
      setDiet(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Sidebar />
      <div className="section-title">Diyet Önerisi</div>

      <div className="auth-box">
        <div className="checkbox-row">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
          />
          <label>Boy, kilo, yaş, cinsiyet, aktiflik seviyesi ve hedef bilgilerim güncel</label>
        </div>

        <div className="form-group">
          <label>Özel istek, alerji veya tercih (opsiyonel)</label>
          <textarea
            value={istek}
            onChange={(e) => setIstek(e.target.value)}
            placeholder="Örnek: Yumurtaya alerjim var, kırmızı et seviyorum"
          />
        </div>

        <button className="submit-btn" disabled={!confirmed || loading} onClick={handleGenerate}>
          {loading ? 'Hesaplanıyor...' : 'Diyet Önerisi Al'}
        </button>
      </div>

      {error && <p className="error-text">{error}</p>}

      {diet && (
        <>
          <div className="main-wrapper" style={{ marginTop: '24px' }}>
            <div className="bmi-card">
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
              const proteinKcal = plan.protein_g * 4;
              const carbKcal = plan.karbonhidrat_g * 4;
              const fatKcal = plan.yag_g * 9;
              const total = proteinKcal + carbKcal + fatKcal;

              return (
                <div className="plan-card" key={index}>
                  <h3>{plan.baslik}</h3>

                  <div className="macro-bar">
                    <div className="macro-bar-segment protein" style={{ width: `${(proteinKcal / total) * 100}%` }} />
                    <div className="macro-bar-segment carb" style={{ width: `${(carbKcal / total) * 100}%` }} />
                    <div className="macro-bar-segment fat" style={{ width: `${(fatKcal / total) * 100}%` }} />
                  </div>

                  <div className="plan-macros">
                    <span>{plan.kalori} kcal</span>
                    <span><span className="dot protein"></span>Protein: {plan.protein_g} g</span>
                    <span><span className="dot carb"></span>Karbonhidrat: {plan.karbonhidrat_g} g</span>
                    <span><span className="dot fat"></span>Yağ: {plan.yag_g} g</span>
                  </div>

                  <ul className="plan-meals">
                    {plan.ornek_ogunler.map((ogun, i) => (
                      <li key={i}>{ogun}</li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

export default Diet;