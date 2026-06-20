import { useEffect, useState } from 'react';
import axios from 'axios';
import { AnimatePresence, motion } from 'framer-motion';
import Sidebar from '../components/sidebar';
import EmptyState from '../components/EmptyState';

const OGUN_OPTIONS = [
  { value: 'kahvalti', label: 'Kahvaltı', icon: 'wb_sunny' },
  { value: 'ogle', label: 'Öğle Yemeği', icon: 'restaurant' },
  { value: 'aksam', label: 'Akşam Yemeği', icon: 'dinner_dining' },
  { value: 'ara_ogun', label: 'Ara Öğün', icon: 'cookie' },
];

const WATER_QUICK = [200, 250, 330, 500];
const WATER_GOAL = 2500;

const overlayVariants = { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } };
const modalVariants = { initial: { opacity: 0, scale: 0.9, y: 16 }, animate: { opacity: 1, scale: 1, y: 0 }, exit: { opacity: 0, scale: 0.92, y: 12 } };

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

  const fetchMeals = () => axios.get(`${apiUrl}/api/nutrition/meals/today`, { headers }).then((res) => setMeals(res.data)).catch(() => {});
  const fetchWater = () => axios.get(`${apiUrl}/api/nutrition/water/today`, { headers }).then((res) => setWaterLogs(res.data)).catch(() => {});

  useEffect(() => {
    axios.get(`${apiUrl}/api/nutrition/foods`, { headers }).then((res) => setFoods(res.data)).catch(() => {});
    fetchMeals();
    fetchWater();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredFoods = searchTerm.length > 0
    ? foods.filter((f) => f.ad.toLocaleLowerCase('tr-TR').includes(searchTerm.toLocaleLowerCase('tr-TR'))).slice(0, 8)
    : [];

  const previewKcal = selectedFood && modalGram
    ? Math.round(((selectedFood.protein * 4 + selectedFood.karbonhidrat * 4 + selectedFood.yag * 9) * parseFloat(modalGram)) / 100)
    : null;

  const handleSelectFood = (food) => { setSelectedFood(food); setSearchTerm(''); setModalGram(''); };
  const handleCloseModal = () => { setSelectedFood(null); setModalGram(''); };

  const handleAddMeal = async (e) => {
    e.preventDefault();
    if (!selectedFood || !modalGram) return;
    try {
      await axios.post(`${apiUrl}/api/nutrition/meals`, { ogun_tipi: ogunTipi, besin_anahtari: selectedFood.anahtar, gram: parseFloat(modalGram) }, { headers });
      handleCloseModal();
      fetchMeals();
    } catch {}
  };

  const handleDeleteMeal = async (id) => { await axios.delete(`${apiUrl}/api/nutrition/meals/${id}`, { headers }); fetchMeals(); };
  const handleAddWater = async (miktar) => { await axios.post(`${apiUrl}/api/nutrition/water`, { miktar_ml: miktar }, { headers }); fetchWater(); };
  const handleCustomWater = async (e) => { e.preventDefault(); if (!customWater) return; await handleAddWater(parseInt(customWater, 10)); setCustomWater(''); };
  const handleDeleteWater = async (id) => { await axios.delete(`${apiUrl}/api/nutrition/water/${id}`, { headers }); fetchWater(); };

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
      <main className="md:ml-64 min-h-screen pt-20 md:pt-10 pb-24 md:pb-10 px-gutter md:px-12">
        <div className="max-w-5xl mx-auto">
        <header className="mb-8">
          <h1 className="font-display-lg text-display-lg-mobile md:text-display-lg text-on-surface">BESLENME <span className="text-primary">TAKİBİ</span></h1>
          <p className="font-label-mono text-label-mono text-on-surface-variant tracking-widest mt-2 uppercase">GÜNLÜK KALORİ VE MAKRO VERİLERİ</p>
        </header>

        <div className="flex gap-4 mb-8 border-b border-outline-variant pb-px">
          <button
            onClick={() => setActiveTab('yemek')}
            className={`pb-3 px-2 font-label-mono text-label-mono uppercase transition-all border-b-2 ${activeTab === 'yemek' ? 'border-brand-red text-on-surface' : 'border-transparent text-on-surface-variant hover:text-on-surface'}`}
          >
            Yemek Takibi
          </button>
          <button
            onClick={() => setActiveTab('su')}
            className={`pb-3 px-2 font-label-mono text-label-mono uppercase transition-all border-b-2 ${activeTab === 'su' ? 'border-brand-red text-on-surface' : 'border-transparent text-on-surface-variant hover:text-on-surface'}`}
          >
            Su Takibi
          </button>
        </div>

        {activeTab === 'yemek' && (
          <div className="space-y-8">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-bento-gap">
              <div className="p-5 bg-surface-container border border-brand-red/20 rounded-xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-brand-red"></div>
                <span className="text-[10px] font-label-mono uppercase text-brand-red/80 block mb-1">KALORİ</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-stat-lg font-stat-lg text-on-surface">{Math.round(toplamKalori)}</span>
                  <span className="text-label-mono text-[10px] opacity-60">/ 2500 kcal</span>
                </div>
                <div className="mt-3 w-full bg-surface-container-highest h-1 rounded-full overflow-hidden">
                  <div className="bg-brand-red h-full" style={{ width: `${Math.min((toplamKalori / 2500) * 100, 100)}%` }}></div>
                </div>
              </div>

              <div className="p-5 bg-surface-container border border-emerald-500/20 rounded-xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-emerald-400"></div>
                <span className="text-[10px] font-label-mono uppercase text-emerald-400 block mb-1">PROTEİN</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-stat-lg font-stat-lg text-on-surface">{Math.round(toplamProtein)}</span>
                  <span className="text-label-mono text-[10px] opacity-60">/ 180 g</span>
                </div>
                <div className="mt-3 w-full bg-surface-container-highest h-1 rounded-full overflow-hidden">
                  <div className="bg-emerald-400 h-full" style={{ width: `${Math.min((toplamProtein / 180) * 100, 100)}%` }}></div>
                </div>
              </div>

              <div className="p-5 bg-surface-container border border-amber-500/20 rounded-xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-amber-400"></div>
                <span className="text-[10px] font-label-mono uppercase text-amber-400 block mb-1">KARBONHİDRAT</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-stat-lg font-stat-lg text-on-surface">{Math.round(toplamKarb)}</span>
                  <span className="text-label-mono text-[10px] opacity-60">/ 300 g</span>
                </div>
                <div className="mt-3 w-full bg-surface-container-highest h-1 rounded-full overflow-hidden">
                  <div className="bg-amber-400 h-full" style={{ width: `${Math.min((toplamKarb / 300) * 100, 100)}%` }}></div>
                </div>
              </div>

              <div className="p-5 bg-surface-container border border-purple-500/20 rounded-xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-purple-400"></div>
                <span className="text-[10px] font-label-mono uppercase text-purple-400 block mb-1">YAĞ</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-stat-lg font-stat-lg text-on-surface">{Math.round(toplamYag)}</span>
                  <span className="text-label-mono text-[10px] opacity-60">/ 85 g</span>
                </div>
                <div className="mt-3 w-full bg-surface-container-highest h-1 rounded-full overflow-hidden">
                  <div className="bg-purple-400 h-full" style={{ width: `${Math.min((toplamYag / 85) * 100, 100)}%` }}></div>
                </div>
              </div>
            </div>

            <div className="bg-surface-container border border-outline-variant rounded-xl p-6">
              <div className="mb-4">
                <select value={ogunTipi} onChange={(e) => setOgunTipi(e.target.value)} className="bg-surface-container-lowest border border-outline-variant rounded-lg px-4 py-2 font-label-mono text-sm">
                  {OGUN_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>

              <div className="relative group mb-6">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant group-focus-within:text-brand-red transition-colors">search</span>
                <input
                  className="w-full bg-surface-container-lowest border border-outline-variant focus:border-brand-red focus:ring-0 rounded-lg pl-12 pr-4 py-3 font-body-md transition-all outline-none"
                  placeholder="Besin Ara (örn: Tavuk Göğsü, Elma...)" type="text"
                  value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                />
                {filteredFoods.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-surface-container-high border border-outline-variant rounded-lg max-h-72 overflow-y-auto z-50">
                    {filteredFoods.map((f) => (
                      <div key={f.anahtar} onClick={() => handleSelectFood(f)} className="flex items-center justify-between p-3 hover:bg-surface-container-highest transition-colors cursor-pointer border-b border-outline-variant/30 last:border-b-0">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-lg bg-surface-container-lowest flex items-center justify-center border border-outline-variant">
                            <span className="material-symbols-outlined text-primary">lunch_dining</span>
                          </div>
                          <h4 className="font-bold text-on-surface">{f.ad}</h4>
                        </div>
                        <span className="material-symbols-outlined text-brand-red">add</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <AnimatePresence>
              {selectedFood && (
                <motion.div className="fixed inset-0 z-[1100] flex items-center justify-center p-5 bg-black/60 backdrop-blur-sm" onClick={handleCloseModal} variants={overlayVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.2 }}>
                  <motion.div className="bg-surface-container-high border border-brand-red rounded-2xl p-7 max-w-md w-full relative" onClick={(e) => e.stopPropagation()} variants={modalVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.25, ease: [0.34, 1.56, 0.64, 1] }}>
                    <button className="absolute top-4 right-4 text-on-surface-variant hover:text-white" onClick={handleCloseModal}>
                      <span className="material-symbols-outlined">close</span>
                    </button>
                    <form onSubmit={handleAddMeal}>
                      <div className="flex items-center justify-between gap-4 mb-4">
                        <span className="font-headline-md font-bold text-on-surface">{selectedFood.ad}</span>
                        <input
                          type="number" value={modalGram} onChange={(e) => setModalGram(e.target.value)}
                          placeholder="gram" autoFocus required
                          className="w-28 text-center p-3 rounded-lg border border-outline-variant bg-surface-container-lowest font-label-mono text-lg outline-none focus:border-brand-red"
                        />
                      </div>
                      {previewKcal !== null && <div className="font-label-mono text-brand-red font-bold text-lg mb-2">≈ {previewKcal} kcal</div>}
                      <button type="submit" className="w-full py-3 bg-brand-red text-white font-bold rounded-lg uppercase font-label-mono mt-4">Ekle</button>
                    </form>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            <div>
              <h3 className="font-label-mono text-label-mono uppercase text-on-surface-variant tracking-widest mb-4">BUGÜNKÜ ÖĞÜNLER</h3>
              <div className="space-y-4">
                {OGUN_OPTIONS.map((ogun) => {
                  const ogunMeals = meals.filter((m) => m.ogun_tipi === ogun.value);
                  if (ogunMeals.length === 0) return null;
                  const ogunKalori = ogunMeals.reduce((acc, m) => acc + m.kalori, 0);
                  return (
                    <div key={ogun.value} className="p-4 bg-surface-container-low border border-outline-variant rounded-xl">
                      <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-primary">{ogun.icon}</span>
                          <h4 className="font-bold uppercase font-label-mono text-sm tracking-tighter">{ogun.label}</h4>
                        </div>
                        <span className="font-label-mono text-xs text-on-surface-variant">{Math.round(ogunKalori)} kcal</span>
                      </div>
                      <div className="space-y-2">
                        {ogunMeals.map((m) => (
                          <div key={m.id} className="flex justify-between items-center text-sm py-2 border-b border-outline-variant/30 last:border-b-0">
                            <div>
                              <span className="text-on-surface-variant">{m.besin_adi} ({m.gram}g)</span>
                              <div className="text-[10px] text-on-surface-variant/70 font-label-mono">P: {m.protein_g}g · K: {m.karbonhidrat_g}g · Y: {m.yag_g}g</div>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="font-label-mono text-brand-red">{m.kalori} kcal</span>
                              <button onClick={() => handleDeleteMeal(m.id)} className="text-on-surface-variant hover:text-brand-red">
                                <span className="material-symbols-outlined text-base">delete_outline</span>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}

                {meals.length === 0 && <EmptyState type="plate" title="Bugün için öğün kaydı yok" description="Yukarıdaki arama kutusundan bir besin seçerek öğün eklemeye başla." />}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'su' && (
          <div className="space-y-12">
            <div className="flex flex-col items-center justify-center py-10">
              <div className="relative w-64 h-64">
                <svg className="w-full h-full -rotate-90">
                  <circle className="text-surface-container-highest" cx="128" cy="128" fill="transparent" r="120" stroke="currentColor" strokeWidth="12"></circle>
                  <circle
                    cx="128" cy="128" fill="transparent" r="120" stroke="#3b82f6" strokeWidth="12" strokeLinecap="round"
                    strokeDasharray={waterCircumference} strokeDashoffset={waterOffset}
                    style={{ transition: 'stroke-dashoffset 0.6s ease', filter: 'drop-shadow(0 0 8px rgba(59,130,246,0.5))' }}
                  ></circle>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="material-symbols-outlined text-blue-400 text-4xl mb-2" style={{ fontVariationSettings: "'FILL' 1" }}>water_drop</span>
                  <h2 className="text-display-lg font-display-lg text-on-surface">{(toplamSu / 1000).toFixed(1)}</h2>
                  <p className="font-label-mono text-label-mono text-on-surface-variant tracking-[0.2em] uppercase">Litre / {(WATER_GOAL / 1000).toFixed(1)}L</p>
                </div>
              </div>
            </div>

            <div className="max-w-md mx-auto space-y-8">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {WATER_QUICK.map((ml) => (
                  <button
                    key={ml} onClick={() => handleAddWater(ml)}
                    className="flex flex-col items-center gap-2 p-4 bg-surface-container border border-outline-variant rounded-xl hover:border-blue-500 hover:bg-surface-container-highest transition-all group"
                  >
                    <span className="material-symbols-outlined text-blue-400 group-hover:scale-110 transition-transform">local_drink</span>
                    <span className="font-label-mono text-xs">{ml}ml</span>
                  </button>
                ))}
              </div>

              <form onSubmit={handleCustomWater}>
                <label className="block text-[10px] font-label-mono uppercase text-on-surface-variant mb-2 ml-1">ÖZEL MİKTAR (ml)</label>
                <div className="flex gap-2">
                  <input
                    type="number" value={customWater} onChange={(e) => setCustomWater(e.target.value)}
                    placeholder="Miktar girin..."
                    className="flex-1 bg-surface-container-lowest border border-outline-variant focus:border-blue-500 focus:ring-0 rounded-lg px-4 py-3 font-body-md transition-all outline-none"
                  />
                  <button type="submit" className="px-6 bg-blue-600 hover:bg-blue-500 text-white font-label-mono text-label-mono uppercase rounded-lg transition-colors">EKLE</button>
                </div>
              </form>

              {waterLogs.length > 0 && (
                <div className="space-y-2">
                  {waterLogs.map((w) => (
                    <div key={w.id} className="flex justify-between items-center p-3 bg-surface-container border border-outline-variant rounded-lg">
                      <div>
                        <span className="font-bold">{w.miktar_ml} ml</span>
                        <div className="text-[10px] text-on-surface-variant font-label-mono">{new Date(w.tarih).toLocaleTimeString('tr-TR')}</div>
                      </div>
                      <button onClick={() => handleDeleteWater(w.id)} className="text-on-surface-variant hover:text-brand-red">
                        <span className="material-symbols-outlined">delete_outline</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
        </div>
      </main>
    </div>
  );
}

export default Nutrition;