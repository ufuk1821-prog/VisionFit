import { useEffect, useState } from 'react';
import axios from 'axios';
import { AnimatePresence, motion } from 'framer-motion';
import { Trash2, Droplet, X, Search, Sun, Utensils as UtensilsIcon, Moon } from 'lucide-react';
import Sidebar from '../components/sidebar';
import EmptyState from '../components/EmptyState';

const OGUN_OPTIONS = [
  { value: 'kahvalti', label: 'Kahvaltı', icon: Sun },
  { value: 'ogle', label: 'Öğle', icon: UtensilsIcon },
  { value: 'aksam', label: 'Akşam', icon: Moon },
  { value: 'ara_ogun', label: 'Ara Öğün', icon: UtensilsIcon },
];

const WATER_QUICK = [200, 250, 330, 500];
const WATER_GOAL = 2500;

const overlayVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

const modalVariants = {
  initial: { opacity: 0, scale: 0.9, y: 16 },
  animate: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.92, y: 12 },
};

function Nutrition() {
  const [activeTab, setActiveTab] = useState('yemek');
  const [foods, setFoods] = useState([]);
  const [ogunTipi, setOgunTipi] = useState('kahvalti');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFood, setSelectedFood] = useState(null);
  const [modalGram, setModalGram] = useState('');
  const [meals, setMeals] = useState([]);
  const [waterLogs, setWaterLogs] = useState([]);
  const [customWater, setCustomWater] = useState('');
  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };
  const apiUrl = import.meta.env.VITE_API_URL;

  const fetchMeals = () => {
    axios.get(`${apiUrl}/api/nutrition/meals/today`, { headers })
      .then((res) => setMeals(res.data))
      .catch(() => {});
  };

  const fetchWater = () => {
    axios.get(`${apiUrl}/api/nutrition/water/today`, { headers })
      .then((res) => setWaterLogs(res.data))
      .catch(() => {});
  };

  useEffect(() => {
    axios.get(`${apiUrl}/api/nutrition/foods`, { headers })
      .then((res) => setFoods(res.data))
      .catch(() => {});
    fetchMeals();
    fetchWater();
  }, []);

  const filteredFoods = searchTerm.length > 0
    ? foods.filter((f) => f.ad.toLocaleLowerCase('tr-TR').includes(searchTerm.toLocaleLowerCase('tr-TR'))).slice(0, 8)
    : [];

  const previewKcal = selectedFood && modalGram
    ? Math.round(((selectedFood.protein * 4 + selectedFood.karbonhidrat * 4 + selectedFood.yag * 9) * parseFloat(modalGram)) / 100)
    : null;

  const handleSelectFood = (food) => {
    setSelectedFood(food);
    setSearchTerm('');
    setModalGram('');
  };

  const handleCloseModal = () => {
    setSelectedFood(null);
    setModalGram('');
  };

  const handleAddMeal = async (e) => {
    e.preventDefault();
    if (!selectedFood || !modalGram) return;

    try {
      await axios.post(`${apiUrl}/api/nutrition/meals`, {
        ogun_tipi: ogunTipi,
        besin_anahtari: selectedFood.anahtar,
        gram: parseFloat(modalGram),
      }, { headers });
      handleCloseModal();
      fetchMeals();
    } catch (err) {
    }
  };

  const handleDeleteMeal = async (id) => {
    await axios.delete(`${apiUrl}/api/nutrition/meals/${id}`, { headers });
    fetchMeals();
  };

  const handleAddWater = async (miktar) => {
    await axios.post(`${apiUrl}/api/nutrition/water`, { miktar_ml: miktar }, { headers });
    fetchWater();
  };

  const handleCustomWater = async (e) => {
    e.preventDefault();
    if (!customWater) return;
    await handleAddWater(parseInt(customWater, 10));
    setCustomWater('');
  };

  const handleDeleteWater = async (id) => {
    await axios.delete(`${apiUrl}/api/nutrition/water/${id}`, { headers });
    fetchWater();
  };

  const toplamKalori = meals.reduce((acc, m) => acc + m.kalori, 0);
  const toplamProtein = meals.reduce((acc, m) => acc + (m.protein_g || 0), 0);
  const toplamKarb = meals.reduce((acc, m) => acc + (m.karbonhidrat_g || 0), 0);
  const toplamYag = meals.reduce((acc, m) => acc + (m.yag_g || 0), 0);
  const toplamSu = waterLogs.reduce((acc, w) => acc + w.miktar_ml, 0);
  const suYuzdesi = Math.min((toplamSu / WATER_GOAL) * 100, 100);

  const waterCircumference = 2 * Math.PI * 120;
  const waterOffset = waterCircumference * (1 - suYuzdesi / 100);

  return (
    <div>
      <Sidebar />

      <header style={{ marginBottom: '24px' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '1.8rem' }}>
          BESLENME <span style={{ color: 'var(--accent)' }}>TAKİBİ</span>
        </h1>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '8px' }}>
          GÜNLÜK KALORİ VE MAKRO VERİLERİ
        </p>
      </header>

      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', borderBottom: '1px solid var(--border)' }}>
        <button
          onClick={() => setActiveTab('yemek')}
          style={{
            padding: '0 8px 12px', background: 'none', border: 'none', cursor: 'pointer',
            fontFamily: 'var(--font-mono)', fontSize: '0.78rem', textTransform: 'uppercase',
            borderBottom: activeTab === 'yemek' ? '2px solid var(--accent)' : '2px solid transparent',
            color: activeTab === 'yemek' ? 'var(--text)' : 'var(--text-muted)',
          }}
        >
          Yemek Takibi
        </button>
        <button
          onClick={() => setActiveTab('su')}
          style={{
            padding: '0 8px 12px', background: 'none', border: 'none', cursor: 'pointer',
            fontFamily: 'var(--font-mono)', fontSize: '0.78rem', textTransform: 'uppercase',
            borderBottom: activeTab === 'su' ? '2px solid var(--accent)' : '2px solid transparent',
            color: activeTab === 'su' ? 'var(--text)' : 'var(--text-muted)',
          }}
        >
          Su Takibi
        </button>
      </div>

      {activeTab === 'yemek' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }} className="macro-grid">
            <div style={{ padding: '18px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, width: '3px', height: '100%', background: 'var(--accent)', opacity: 0.5 }} />
              <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>KALORİ</span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 800 }}>{Math.round(toplamKalori)}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', opacity: 0.6 }}>/ 2500 kcal</span>
              </div>
              <div style={{ marginTop: '10px', height: '4px', background: 'var(--surface-2)', borderRadius: '99px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${Math.min((toplamKalori / 2500) * 100, 100)}%`, background: 'var(--accent)' }} />
              </div>
            </div>

            <div style={{ padding: '18px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px' }}>
              <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>PROTEİN</span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 800 }}>{Math.round(toplamProtein)}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', opacity: 0.6 }}>g</span>
              </div>
              <div style={{ marginTop: '10px', height: '4px', background: 'var(--surface-2)', borderRadius: '99px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${Math.min((toplamProtein / 180) * 100, 100)}%`, background: '#4CAF50' }} />
              </div>
            </div>

            <div style={{ padding: '18px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px' }}>
              <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>KARBONHİDRAT</span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 800 }}>{Math.round(toplamKarb)}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', opacity: 0.6 }}>g</span>
              </div>
              <div style={{ marginTop: '10px', height: '4px', background: 'var(--surface-2)', borderRadius: '99px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${Math.min((toplamKarb / 300) * 100, 100)}%`, background: '#8B5CF6' }} />
              </div>
            </div>

            <div style={{ padding: '18px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px' }}>
              <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>YAĞ</span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 800 }}>{Math.round(toplamYag)}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', opacity: 0.6 }}>g</span>
              </div>
              <div style={{ marginTop: '10px', height: '4px', background: 'var(--surface-2)', borderRadius: '99px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${Math.min((toplamYag / 85) * 100, 100)}%`, background: 'var(--danger)' }} />
              </div>
            </div>
          </div>

          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '14px', padding: '24px', marginBottom: '24px' }}>
            <div className="form-group">
              <label>Öğün</label>
              <select value={ogunTipi} onChange={(e) => setOgunTipi(e.target.value)}>
                {OGUN_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            <div className="food-search-wrapper">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Besin Ara</label>
                <div className="search-input-row">
                  <Search size={18} color="var(--text-muted)" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Besin Ara (örn: Tavuk Göğsü, Elma...)"
                  />
                </div>
              </div>

              {filteredFoods.length > 0 && (
                <div className="food-search-results">
                  {filteredFoods.map((f) => (
                    <div key={f.anahtar} className="food-search-result" onClick={() => handleSelectFood(f)}>
                      {f.ad}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <AnimatePresence>
            {selectedFood && (
              <motion.div
                className="food-modal-overlay"
                onClick={handleCloseModal}
                variants={overlayVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.2 }}
              >
                <motion.div
                  className="food-modal"
                  onClick={(e) => e.stopPropagation()}
                  variants={modalVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={{ duration: 0.25, ease: [0.34, 1.56, 0.64, 1] }}
                >
                  <button className="food-modal-close" onClick={handleCloseModal}>
                    <X size={20} />
                  </button>
                  <form onSubmit={handleAddMeal}>
                    <div className="food-modal-row">
                      <span className="food-modal-name">{selectedFood.ad}</span>
                      <input
                        type="number"
                        value={modalGram}
                        onChange={(e) => setModalGram(e.target.value)}
                        placeholder="gram"
                        autoFocus
                        required
                      />
                    </div>
                    {previewKcal !== null && <div className="preview-kcal">≈ {previewKcal} kcal</div>}
                    <button type="submit" className="submit-btn">Ekle</button>
                  </form>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          <div>
            <h3 style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '16px' }}>BUGÜNKÜ ÖĞÜNLER</h3>

            {OGUN_OPTIONS.map((ogun) => {
              const ogunMeals = meals.filter((m) => m.ogun_tipi === ogun.value);
              if (ogunMeals.length === 0) return null;
              const ogunKalori = ogunMeals.reduce((acc, m) => acc + m.kalori, 0);
              const Icon = ogun.icon;

              return (
                <div key={ogun.value} style={{ padding: '16px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '14px', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Icon size={18} color="var(--accent)" />
                      <h4 style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase' }}>{ogun.label}</h4>
                    </div>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>{Math.round(ogunKalori)} kcal</span>
                  </div>
                  {ogunMeals.map((m) => (
                    <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <div>
                        <span style={{ fontSize: '0.85rem' }}>{m.besin_adi}</span>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-muted)' }}>{m.gram}g · P: {m.protein_g}g · K: {m.karbonhidrat_g}g · Y: {m.yag_g}g</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent)', fontSize: '0.85rem' }}>{m.kalori} kcal</span>
                        <button className="delete-btn" onClick={() => handleDeleteMeal(m.id)}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}

            {meals.length === 0 && (
              <EmptyState
                type="plate"
                title="Bugün için öğün kaydı yok"
                description="Yukarıdaki arama kutusundan bir besin seçerek öğün eklemeye başla."
              />
            )}
          </div>
        </>
      )}

      {activeTab === 'su' && (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '32px 0' }}>
            <div style={{ position: 'relative', width: '240px', height: '240px' }}>
              <svg width="240" height="240" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="120" cy="120" r="120" fill="transparent" stroke="var(--surface-2)" strokeWidth="12" />
                <circle
                  cx="120" cy="120" r="120" fill="transparent"
                  stroke="var(--accent-blue)" strokeWidth="12"
                  strokeDasharray={waterCircumference}
                  strokeDashoffset={waterOffset}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dashoffset 0.6s ease', filter: 'drop-shadow(0 0 8px rgba(59,130,246,0.5))' }}
                />
              </svg>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                <Droplet size={36} color="var(--accent-blue)" style={{ marginBottom: '8px' }} />
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '2.2rem', fontWeight: 900 }}>{(toplamSu / 1000).toFixed(1)}</h2>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.15em' }}>
                  Litre / {(WATER_GOAL / 1000).toFixed(1)}L
                </p>
              </div>
            </div>
          </div>

          <div style={{ maxWidth: '440px', margin: '0 auto' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '24px' }}>
              {WATER_QUICK.map((ml) => (
                <button
                  key={ml}
                  onClick={() => handleAddWater(ml)}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', padding: '16px',
                    background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', cursor: 'pointer',
                  }}
                >
                  <Droplet size={20} color="var(--accent-blue)" />
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem' }}>{ml}ml</span>
                </button>
              ))}
            </div>

            <form onSubmit={handleCustomWater}>
              <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>ÖZEL MİKTAR (ml)</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="number"
                  value={customWater}
                  onChange={(e) => setCustomWater(e.target.value)}
                  placeholder="Miktar girin..."
                  style={{ flex: 1, background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '10px', padding: '12px 16px', color: 'var(--text)' }}
                />
                <button type="submit" style={{ padding: '0 24px', background: 'var(--accent-blue)', color: '#fff', border: 'none', borderRadius: '10px', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', textTransform: 'uppercase', cursor: 'pointer' }}>
                  EKLE
                </button>
              </div>
            </form>

            {waterLogs.length > 0 && (
              <div style={{ marginTop: '24px' }}>
                {waterLogs.map((w) => (
                  <div key={w.id} className="meal-item">
                    <div className="meal-item-info">
                      <span className="meal-item-name">{w.miktar_ml} ml</span>
                      <span className="meal-item-detail">{new Date(w.tarih).toLocaleTimeString('tr-TR')}</span>
                    </div>
                    <button className="delete-btn" onClick={() => handleDeleteWater(w.id)}>
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default Nutrition;