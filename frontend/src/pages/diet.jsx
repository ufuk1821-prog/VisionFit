import { useState, useRef } from 'react';
import axios from 'axios';
import Sidebar from '../components/sidebar';

const AKTIFLIK_OPTIONS = [
  { value: 'sedanter', label: 'Sedanter (Hareketsiz)' },
  { value: 'az_hareketli', label: 'Az Hareketli (Haftada 1-3)' },
  { value: 'orta_hareketli', label: 'Orta Derece (Haftada 3-5)' },
  { value: 'cok_hareketli', label: 'Çok Hareketli (Haftada 6-7)' },
  { value: 'asiri_hareketli', label: 'Ekstra Aktif (Profesyonel)' },
];

const HEDEF_OPTIONS = [
  { value: 'kilo_verme', label: 'Kilo Ver', desc: 'Yağ yakımı odaklı kalori açığı.', icon: 'trending_down', renk: 'text-blue-400' },
  { value: 'kilo_koruma', label: 'Formu Koru', desc: 'Stabil metabolizma ve enerji dengesi.', icon: 'balance', renk: 'text-emerald-400' },
  { value: 'kilo_alma', label: 'Kilo Al', desc: 'Kas kütlesi için kalori fazlası.', icon: 'fitness_center', renk: 'text-brand-red' },
];

const OGUN_GORSEL = { kahvalti: 'KAHVALTI', ogle: 'ÖĞLE YEMEĞİ', aksam: 'AKŞAM YEMEĞİ' };

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
  const [seciliPlanIndex, setSeciliPlanIndex] = useState(null);
  const [aiHata, setAiHata] = useState('');
  const [boyHata, setBoyHata] = useState('');
  const [kiloHata, setKiloHata] = useState('');
  const [yasHata, setYasHata] = useState('');
  const token = localStorage.getItem('token');

  const handleBoyChange = (e) => {
    const val = e.target.value;
    setBoy(val);
    const num = parseFloat(val);
    setBoyHata(val !== '' && (isNaN(num) || num < 50 || num > 300) ? 'Boy 50 ile 300 cm arasında olmalıdır.' : '');
  };

  const handleKiloChange = (e) => {
    const val = e.target.value;
    setKilo(val);
    const num = parseFloat(val);
    setKiloHata(val !== '' && (isNaN(num) || num < 20 || num > 500) ? 'Kilo 20 ile 500 kg arasında olmalıdır.' : '');
  };

  const handleYasChange = (e) => {
    const val = e.target.value;
    setYas(val);
    const num = parseInt(val, 10);
    setYasHata(val !== '' && (isNaN(num) || num < 1 || num > 120) ? 'Yaş 1 ile 120 arasında olmalıdır.' : '');
  };

  const handleGenerate = async () => {
    setError('');
    if (!boy || !kilo || !yas || !cinsiyet || !aktiflik || !hedef) { setError('Lütfen tüm alanları doldurun.'); return; }
    if (boyHata || kiloHata || yasHata) { setError('Lütfen geçerli değerler girin.'); return; }
    setLoading(true);
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/users/diet/calculate`,
        { boy: Number(boy), kilo: Number(kilo), yas: Number(yas), cinsiyet, aktiflik_seviyesi: aktiflik, hedef, istek },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setDiet(response.data);
      setSeciliPlanIndex(null);
      setAiOneri('');
      setAiHata('');
      setTimeout(() => sonucRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch (err) {
      setError(err.response?.data?.detail || 'Hesaplama sırasında hata oluştu.');
      setDiet(null);
      setSeciliPlanIndex(null);
      setAiOneri('');
      setAiHata('');
    } finally {
      setLoading(false);
    }
  };

  const yorumMetniHazirla = (yorum) => {
    if (!yorum) return '';

    if (typeof yorum === 'object') {
      return yorum.yorum || '';
    }

    const temiz = String(yorum).trim();
    if (!temiz) return '';

    try {
      const parsed = JSON.parse(temiz);
      return typeof parsed?.yorum === 'string' ? parsed.yorum.trim() : temiz;
    } catch {
      return temiz;
    }
  };

  const planOgunleriniAyir = (seciliPlan) => {
    const ogunler = seciliPlan?.ornek_ogunler || [];

    const kahvalti = ogunler.filter((x) => {
      const t = x.toLowerCase();
      return t.includes('kahvalt');
    });

    const ogle = ogunler.filter((x) => {
      const t = x.toLowerCase();
      return t.includes('öğle') || t.includes('ogle');
    });

    const aksam = ogunler.filter((x) => {
      const t = x.toLowerCase();
      return t.includes('akşam') || t.includes('aksam');
    });

    const ara_ogun = ogunler.filter((x) => {
      const t = x.toLowerCase();
      return t.includes('ara');
    });

    const eslesenler = new Set([...kahvalti, ...ogle, ...aksam, ...ara_ogun]);
    const diger_ogunler = ogunler.filter((x) => !eslesenler.has(x));

    return {
      kahvalti: kahvalti.length ? kahvalti : diger_ogunler,
      ogle,
      aksam,
      ara_ogun,
    };
  };

  const aiOneriAl = async () => {
    if (!diet) return;

    if (seciliPlanIndex === null) {
      setAiHata('Lütfen bir diyet planı seçin.');
      setAiOneri('');
      return;
    }

    const seciliPlan = diet.planlar?.[seciliPlanIndex];

    if (!seciliPlan) {
      setAiHata('Seçilen diyet planı bulunamadı.');
      setAiOneri('');
      return;
    }

    const ogunler = planOgunleriniAyir(seciliPlan);

    setAiYukleniyor(true);
    setAiOneri('');
    setAiHata('');

    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/yerel-ai/diyet-onerisi`,
        {
          profil: {
            yas: Number(yas),
            cinsiyet,
            boy_cm: Number(boy),
            kilo_kg: Number(kilo),
            aktivite_duzeyi: aktiflik,
            hedef,
            hedef_kalori: diet.hedef_kalori,
          },
          plan: {
            plan_adi: seciliPlan.baslik || `Plan ${seciliPlanIndex + 1}`,
            kahvalti: ogunler.kahvalti,
            ogle: ogunler.ogle,
            aksam: ogunler.aksam,
            ara_ogun: ogunler.ara_ogun,
            gunluk_kalori: seciliPlan.kalori,
            ornek_ogunler: seciliPlan.ornek_ogunler || [],
            porsiyon_bilgisi: {
              protein_g: seciliPlan.protein_g,
              karbonhidrat_g: seciliPlan.karbonhidrat_g,
              yag_g: seciliPlan.yag_g,
              bmi: diet.bmi,
              bmi_kategori: diet.bmi_kategori,
            },
          },
          kullanici_notu: istek || '',
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const hazirYorum = yorumMetniHazirla(res.data.yorum);
      setAiOneri(hazirYorum || 'AI geçerli bir diyet önerisi üretemedi.');
    } catch (err) {
      console.error(err);
      setAiOneri('AI önerisi alınamadı, lütfen tekrar deneyin.');
    } finally {
      setAiYukleniyor(false);
    }
  };

  const bmiPercent = diet ? Math.min(Math.max(((diet.bmi - 15) / (35 - 15)) * 100, 0), 100) : 0;

  return (
    <div>
      <Sidebar />
      <main className="md:ml-64 pt-20 md:pt-10 px-gutter md:px-12 pb-24">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="font-display-lg text-display-lg-mobile md:text-display-lg text-on-surface mb-2">DİYET ÖNERİSİ</h1>
            <p className="font-body-md text-on-surface-variant max-w-2xl">Biyometrik verilerinize ve hedeflerinize göre yapay zeka tarafından optimize edilmiş beslenme planınızı inceleyin.</p>
          </div>

          <div className="grid grid-cols-12 gap-bento-gap">
            <div className="col-span-12 lg:col-span-4 bg-surface-container rounded-2xl p-6 border border-outline-variant flex flex-col gap-6">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-blue-400">analytics</span>
                <h2 className="font-headline-md text-headline-md text-on-surface">Ölçümler</h2>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="font-label-mono text-label-mono text-on-surface-variant uppercase">Boy (cm)</label>
                    <input
                      className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg p-3 text-on-surface focus:border-primary-container focus:ring-0 outline-none transition-all"
                      placeholder="180" type="number" min="50" max="300"
                      value={boy} onChange={handleBoyChange}
                      style={{ borderColor: boyHata ? '#E8313F' : undefined }}
                    />
                    {boyHata && <span className="text-brand-red text-xs">{boyHata}</span>}
                  </div>
                  <div className="space-y-2">
                    <label className="font-label-mono text-label-mono text-on-surface-variant uppercase">Kilo (kg)</label>
                    <input
                      className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg p-3 text-on-surface focus:border-primary-container focus:ring-0 outline-none transition-all"
                      placeholder="75" type="number" min="20" max="500"
                      value={kilo} onChange={handleKiloChange}
                      style={{ borderColor: kiloHata ? '#E8313F' : undefined }}
                    />
                    {kiloHata && <span className="text-brand-red text-xs">{kiloHata}</span>}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="font-label-mono text-label-mono text-on-surface-variant uppercase">Yaş</label>
                  <input
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg p-3 text-on-surface focus:border-primary-container focus:ring-0 outline-none transition-all"
                    placeholder="28" type="number" min="1" max="120"
                    value={yas} onChange={handleYasChange}
                    style={{ borderColor: yasHata ? '#E8313F' : undefined }}
                  />
                  {yasHata && <span className="text-brand-red text-xs">{yasHata}</span>}
                </div>

                <div className="space-y-2">
                  <label className="font-label-mono text-label-mono text-on-surface-variant uppercase">Cinsiyet</label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setCinsiyet('Erkek')}
                      className={`flex-1 py-2 rounded-lg border font-label-mono text-label-mono uppercase transition-all ${cinsiyet === 'Erkek' ? 'border-primary-container bg-surface-container-high text-primary' : 'border-outline-variant text-on-surface-variant hover:border-primary-container'}`}
                    >
                      Erkek
                    </button>
                    <button
                      onClick={() => setCinsiyet('Kadin')}
                      className={`flex-1 py-2 rounded-lg border font-label-mono text-label-mono uppercase transition-all ${cinsiyet === 'Kadin' ? 'border-primary-container bg-surface-container-high text-primary' : 'border-outline-variant text-on-surface-variant hover:border-primary-container'}`}
                    >
                      Kadın
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="font-label-mono text-label-mono text-on-surface-variant uppercase">Aktivite Seviyesi</label>
                  <select
                    value={aktiflik} onChange={(e) => setAktiflik(e.target.value)}
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg p-3 text-on-surface focus:border-primary-container focus:ring-0 outline-none cursor-pointer"
                  >
                    <option value="">Seçin</option>
                    {AKTIFLIK_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div className="col-span-12 lg:col-span-8 flex flex-col gap-bento-gap">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-bento-gap">
                {HEDEF_OPTIONS.map((h) => {
                  const active = hedef === h.value;
                  return (
                    <div
                      key={h.value}
                      onClick={() => setHedef(h.value)}
                      className={`p-6 rounded-2xl cursor-pointer relative overflow-hidden transition-all ${active ? 'bg-surface-container-high border-[2px] border-primary' : 'bg-surface-container border border-outline-variant hover:border-primary'}`}
                    >
                      {active && <div className="absolute top-0 left-0 w-1 h-full bg-primary"></div>}
                      <span className={`material-symbols-outlined text-4xl mb-4 inline-block ${h.renk}`}>{h.icon}</span>
                      <h3 className="font-headline-md text-headline-md mb-1 text-on-surface">{h.label}</h3>
                      <p className="font-body-sm text-body-sm text-on-surface-variant">{h.desc}</p>
                    </div>
                  );
                })}
              </div>

              <div className="bg-surface-container rounded-2xl p-6 border border-outline-variant">
                <label className="font-label-mono text-label-mono text-on-surface-variant uppercase mb-3 block">Özel İstekler (Vejetaryen, Alerjen vb.)</label>
                <textarea
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg p-4 text-on-surface focus:border-primary-container focus:ring-0 outline-none resize-none transition-all placeholder:text-surface-variant"
                  placeholder="Örn: Süt ürünleri tüketmiyorum, yüksek proteinli tarifler tercih ederim..." rows="3"
                  value={istek} onChange={(e) => setIstek(e.target.value)}
                />
              </div>

              <button
                onClick={handleGenerate} disabled={loading || !!boyHata || !!kiloHata || !!yasHata}
                className="w-full py-4 bg-primary-container text-on-primary-container font-headline-md text-headline-md rounded-xl hover:scale-[1.01] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
              >
                <span className="material-symbols-outlined">auto_awesome</span>
                {loading ? 'HESAPLANIYOR...' : 'DİYET PLANINI OLUŞTUR'}
              </button>
            </div>

            {error && <p className="col-span-12 text-brand-red text-sm">{error}</p>}

            {diet && (
              <div ref={sonucRef} className="col-span-12 grid grid-cols-12 gap-bento-gap">
                <div className="col-span-12 md:col-span-4 bg-surface-container rounded-2xl p-6 border border-outline-variant flex flex-col justify-between">
                  <span className="font-label-mono text-label-mono text-on-surface-variant uppercase">Vücut Kitle Endeksi (BMI)</span>
                  <div className="mt-4 flex items-baseline gap-2">
                    <span className="font-stat-lg text-stat-lg text-on-surface">{diet.bmi}</span>
                    <span className="font-label-mono text-label-mono text-tertiary">{diet.bmi_kategori?.toUpperCase()}</span>
                  </div>
                  <div className="mt-6 h-2 w-full bg-surface-container-highest rounded-full overflow-hidden">
                    <div className="h-full bg-tertiary-container" style={{ width: `${bmiPercent}%` }}></div>
                  </div>
                </div>

                <div className="col-span-12 md:col-span-4 bg-surface-container rounded-2xl p-6 border border-outline-variant">
                  <span className="font-label-mono text-label-mono text-on-surface-variant uppercase">Günlük Kalori Hedefi</span>
                  <div className="mt-4 flex items-baseline gap-2">
                    <span className="font-stat-lg text-stat-lg text-primary-container">{diet.hedef_kalori}</span>
                    <span className="font-label-mono text-label-mono text-on-surface-variant">kcal</span>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant mt-2">Bazal metabolizma: {diet.bmr} kcal</p>
                </div>

                <div className="col-span-12 md:col-span-4 bg-surface-container rounded-2xl p-6 border border-outline-variant relative overflow-hidden flex items-center">
                  <div className="absolute top-0 right-0 p-2 opacity-10">
                    <span className="material-symbols-outlined text-[120px]">smart_toy</span>
                  </div>
                  <div className="relative z-10 flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-secondary text-sm">bolt</span>
                      <span className="font-label-mono text-[10px] text-secondary tracking-widest uppercase">AI ÖNERİSİ</span>
                    </div>
                    {!aiOneri ? (
                      <button onClick={aiOneriAl} disabled={aiYukleniyor} className="text-left font-headline-md text-[16px] text-on-surface leading-tight italic underline disabled:opacity-50">
                        {aiYukleniyor ? 'Öneri hazırlanıyor...' : 'AI önerisi al →'}
                      </button>
                    ) : (
                      <p className="font-headline-md text-[16px] text-on-surface leading-tight italic">"{aiOneri}"</p>
                    )}
                    {aiHata && <p className="font-body-sm text-body-sm text-brand-red mt-2">{aiHata}</p>}
                    {seciliPlanIndex !== null && !aiOneri && !aiHata && (
                      <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">Seçilen plan: {diet.planlar?.[seciliPlanIndex]?.baslik || `Plan ${seciliPlanIndex + 1}`}</p>
                    )}
                  </div>
                </div>

                <div className="col-span-12 grid grid-cols-1 lg:grid-cols-3 gap-bento-gap">
                  {diet.planlar.map((plan, index) => {
                    const planRenkler = ['text-blue-400', 'text-purple-400', 'text-amber-400'];
                    const planRenk = planRenkler[index % planRenkler.length];
                    const secili = seciliPlanIndex === index;
                    return (
                    <div
                      key={index}
                      onClick={() => {
                        setSeciliPlanIndex(index);
                        setAiOneri('');
                        setAiHata('');
                      }}
                      className={`bg-surface-container rounded-2xl border overflow-hidden flex flex-col cursor-pointer transition-all ${secili ? 'border-primary ring-2 ring-primary/60 shadow-[0_0_24px_rgba(232,49,63,0.25)] scale-[1.01]' : 'border-outline-variant hover:border-primary/70'}`}
                    >
                      <div className="h-12 relative flex items-end p-4 bg-surface-container-low">
                        <span className={`font-label-mono text-label-mono uppercase ${planRenk}`}>{plan.baslik}</span>
                        {secili && (
                          <span className="absolute top-3 right-3 px-2 py-1 rounded-full bg-primary text-on-primary text-[10px] font-label-mono uppercase">Seçildi</span>
                        )}
                      </div>
                      <div className="p-6 pt-2">
                        <ul className="text-on-surface font-body-md space-y-2 mb-4">
                          {plan.ornek_ogunler.map((ogun, i) => <li key={i}>• {ogun}</li>)}
                        </ul>
                        <div className="flex flex-wrap gap-2">
                          <span className="px-2.5 py-1 bg-emerald-500/15 border border-emerald-500/30 rounded text-[10px] font-label-mono text-emerald-400 font-bold">P: {plan.protein_g}g</span>
                          <span className="px-2.5 py-1 bg-amber-500/15 border border-amber-500/30 rounded text-[10px] font-label-mono text-amber-400 font-bold">K: {plan.karbonhidrat_g}g</span>
                          <span className="px-2.5 py-1 bg-purple-500/15 border border-purple-500/30 rounded text-[10px] font-label-mono text-purple-300 font-bold">Y: {plan.yag_g}g</span>
                        </div>
                        <p className="font-label-mono text-label-mono text-on-surface-variant mt-3">{plan.kalori} kcal</p>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSeciliPlanIndex(index);
                            setAiOneri('');
                            setAiHata('');
                          }}
                          className={`mt-4 w-full py-2 rounded-lg border font-label-mono text-label-mono uppercase transition-all ${secili ? 'border-primary bg-primary text-on-primary' : 'border-outline-variant text-on-surface-variant hover:border-primary hover:text-primary'}`}
                        >
                          {secili ? 'Seçilen Plan' : 'Bu Planı Seç'}
                        </button>
                      </div>
                    </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default Diet;