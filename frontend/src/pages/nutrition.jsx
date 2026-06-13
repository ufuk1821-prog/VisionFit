import { useEffect, useState } from 'react';
import axios from 'axios';
import { AnimatePresence, motion } from 'framer-motion';
import { Trash2, Droplet, X, Search } from 'lucide-react';
import Sidebar from '../components/sidebar';

const OGUN_OPTIONS = [
  { value: 'kahvalti', label: 'Kahvaltı' },
  { value: 'ogle', label: 'Öğle' },
  { value: 'aksam', label: 'Akşam' },
  { value: 'ara_ogun', label: 'Ara Öğün' },
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
  const toplamSu = waterLogs.reduce((acc, w) => acc + w.miktar_ml, 0);
  const suYuzdesi = Math.min((toplamSu / WATER_GOAL) * 100, 100);

  return (
    <div>
      <Sidebar />
      <div className="section-title">Beslenme Takibi</div>

      <div className="tab-switcher">
        <button className={`tab-btn ${activeTab === 'yemek' ? 'active' : ''}`} onClick={() => setActiveTab('yemek')}>Yemek</button>
        <button className={`tab-btn ${activeTab === 'su' ? 'active' : ''}`} onClick={() => setActiveTab('su')}>Su</button>
      </div>

      {activeTab === 'yemek' && (
        <>
          <div className="daily-total-card">
            <span className="card-title">Bugünkü Toplam Kalori</span>
            <span className="card-value">{Math.round(toplamKalori)} kcal</span>
          </div>

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
                  placeholder="Örnek: soğan, tavuk, yoğurt..."
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

          {OGUN_OPTIONS.map((ogun) => {
            const ogunMeals = meals.filter((m) => m.ogun_tipi === ogun.value);
            if (ogunMeals.length === 0) return null;

            return (
              <div className="meal-group" key={ogun.value}>
                <div className="meal-group-title">{ogun.label}</div>
                {ogunMeals.map((m) => (
                  <div className="meal-item" key={m.id}>
                    <div className="meal-item-info">
                      <span className="meal-item-name">{m.besin_adi}</span>
                      <span className="meal-item-detail">{m.gram}g · P: {m.protein_g}g · K: {m.karbonhidrat_g}g · Y: {m.yag_g}g</span>
                    </div>
                    <span className="meal-item-kcal">{m.kalori} kcal</span>
                    <button className="delete-btn" onClick={() => handleDeleteMeal(m.id)}>
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>
            );
          })}

          {meals.length === 0 && <p className="loading-text">Bugün için kayıt yok.</p>}
        </>
      )}

      {activeTab === 'su' && (
        <>
          <div className="water-progress-card">
            <Droplet size={32} color="var(--accent-blue)" />
            <div className="card-value" style={{ marginTop: '8px' }}>{toplamSu} / {WATER_GOAL} ml</div>
            <div className="water-progress-bar">
              <div className="water-progress-fill" style={{ width: `${suYuzdesi}%` }} />
            </div>
          </div>

          <div className="quick-add-row">
            {WATER_QUICK.map((ml) => (
              <button key={ml} className="quick-add-btn" onClick={() => handleAddWater(ml)}>+{ml} ml</button>
            ))}
          </div>

          <form onSubmit={handleCustomWater} className="auth-box">
            <div className="form-group">
              <label>Özel Miktar (ml)</label>
              <input type="number" value={customWater} onChange={(e) => setCustomWater(e.target.value)} />
            </div>
            <button type="submit" className="submit-btn">Ekle</button>
          </form>

          {waterLogs.map((w) => (
            <div className="meal-item" key={w.id}>
              <div className="meal-item-info">
                <span className="meal-item-name">{w.miktar_ml} ml</span>
                <span className="meal-item-detail">{new Date(w.tarih).toLocaleTimeString('tr-TR')}</span>
              </div>
              <button className="delete-btn" onClick={() => handleDeleteWater(w.id)}>
                <Trash2 size={18} />
              </button>
            </div>
          ))}
        </>
      )}
    </div>
  );
}

export default Nutrition;