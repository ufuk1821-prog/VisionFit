import { useEffect, useState } from 'react';
import axios from 'axios';
import Sidebar from '../components/sidebar';

const AKTIVITE_OPTIONS = [
  { value: 'sedanter', label: 'Sedanter', desc: 'Masa başı iş, az hareket' },
  { value: 'az_hareketli', label: 'Hafif', desc: 'Haftada 1-2 gün egzersiz' },
  { value: 'orta_hareketli', label: 'Orta', desc: 'Haftada 3-5 gün yoğun' },
  { value: 'cok_hareketli', label: 'Yüksek', desc: 'Günde 1-2 saat ağır antrenman' },
  { value: 'asiri_hareketli', label: 'Ekstrem', desc: 'Profesyonel sporcu seviyesi' },
];

const HEDEF_OPTIONS = [
  { value: 'kilo_verme', label: 'Kilo Ver', desc: 'Yağ Yakımı Odaklı', icon: 'local_fire_department' },
  { value: 'kilo_koruma', label: 'Formu Koru', desc: 'Stabil Performans', icon: 'balance' },
  { value: 'kilo_alma', label: 'Kilo Al', desc: 'Hipertrofi Odaklı', icon: 'fitness_center' },
];

function Profile() {
  const [ad, setAd] = useState('');
  const [soyad, setSoyad] = useState('');
  const [boy, setBoy] = useState('');
  const [kilo, setKilo] = useState('');
  const [yas, setYas] = useState('');
  const [cinsiyet, setCinsiyet] = useState('');
  const [aktiflik, setAktiflik] = useState('');
  const [hedef, setHedef] = useState('');
  const [mesaj, setMesaj] = useState('');
  const [hata, setHata] = useState('');
  const [yukleniyor, setYukleniyor] = useState(false);
  const [kaydediliyor, setKaydediliyor] = useState(false);
  const token = localStorage.getItem('token');

  useEffect(() => {
    axios.get(`${import.meta.env.VITE_API_URL}/api/users/me`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then((res) => {
      const u = res.data;
      setAd(u.ad || '');
      setSoyad(u.soyad || '');
      setBoy(u.boy || '');
      setKilo(u.kilo || '');
      setYas(u.yas || '');
      setCinsiyet(u.cinsiyet || '');
      setAktiflik(u.aktiflik_seviyesi || '');
      setHedef(u.hedef || '');
      setYukleniyor(false);
    }).catch(() => setYukleniyor(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setHata('');
    setMesaj('');
    setKaydediliyor(true);
    try {
      await axios.put(
        `${import.meta.env.VITE_API_URL}/api/users/me`,
        {
          ad, soyad,
          boy: boy ? Number(boy) : null,
          kilo: kilo ? Number(kilo) : null,
          yas: yas ? Number(yas) : null,
          cinsiyet, aktiflik_seviyesi: aktiflik, hedef,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMesaj('Profil bilgileriniz güncellendi.');
    } catch (err) {
      setHata(err.response?.data?.detail || 'Güncelleme başarısız.');
    } finally {
      setKaydediliyor(false);
    }
  };

  if (yukleniyor) {
    return (
      <div>
        <Sidebar />
        <p className="loading-text">Yükleniyor...</p>
      </div>
    );
  }

  return (
    <div>
      <Sidebar />

      <main className="md:ml-64 pt-20 md:pt-10 px-gutter md:px-12 pb-24 min-h-screen bg-surface-container-lowest">
        <div className="w-full">
          <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h2 className="font-display-lg text-display-lg-mobile md:text-display-lg text-on-surface mb-2">Kullanıcı Profili</h2>
              <p className="font-label-mono text-label-mono text-primary flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                VERİ SENKRONİZASYONU AKTİF
              </p>
            </div>
          </header>

          <form className="grid grid-cols-1 md:grid-cols-12 gap-bento-gap" onSubmit={handleSubmit}>
            <section className="md:col-span-12 bento-card p-6 rounded-2xl">
              <h3 className="font-headline-md text-headline-md mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">badge</span>
                Kişisel Bilgiler
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="flex flex-col gap-2">
                  <label className="font-label-mono text-label-mono text-on-surface-variant uppercase">Ad</label>
                  <input
                    className="bg-surface-container-low border border-outline-variant rounded-lg p-3 text-on-surface focus:ring-0 focus:border-primary transition-all"
                    placeholder="Adınızı giriniz" type="text" value={ad} onChange={(e) => setAd(e.target.value)} required
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="font-label-mono text-label-mono text-on-surface-variant uppercase">Soyad</label>
                  <input
                    className="bg-surface-container-low border border-outline-variant rounded-lg p-3 text-on-surface focus:ring-0 focus:border-primary transition-all"
                    placeholder="Soyadınızı giriniz" type="text" value={soyad} onChange={(e) => setSoyad(e.target.value)} required
                  />
                </div>
              </div>
            </section>

            <section className="md:col-span-8 bento-card p-6 rounded-2xl">
              <h3 className="font-headline-md text-headline-md mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">monitoring</span>
                Vücut Ölçüleri
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="font-label-mono text-label-mono text-on-surface-variant uppercase">Boy (cm)</label>
                  <input
                    className="bg-surface-container-low border border-outline-variant rounded-lg p-3 text-on-surface text-center font-stat-lg"
                    type="number" value={boy} onChange={(e) => setBoy(e.target.value)} min="50" max="300"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="font-label-mono text-label-mono text-on-surface-variant uppercase">Kilo (kg)</label>
                  <input
                    className="bg-surface-container-low border border-outline-variant rounded-lg p-3 text-on-surface text-center font-stat-lg"
                    type="number" value={kilo} onChange={(e) => setKilo(e.target.value)} min="20" max="500"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="font-label-mono text-label-mono text-on-surface-variant uppercase">Yaş</label>
                  <input
                    className="bg-surface-container-low border border-outline-variant rounded-lg p-3 text-on-surface text-center font-stat-lg"
                    type="number" value={yas} onChange={(e) => setYas(e.target.value)} min="1" max="120"
                  />
                </div>
              </div>
            </section>

            <section className="md:col-span-4 bento-card p-6 rounded-2xl flex flex-col justify-between">
              <h3 className="font-headline-md text-headline-md mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">wc</span>
                Cinsiyet
              </h3>
              <div className="flex flex-col gap-3">
                <label className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${cinsiyet === 'Erkek' ? 'bg-surface-container-high border-primary' : 'bg-surface-container-low border-outline-variant hover:border-on-surface-variant'}`}>
                  <span className="font-label-mono text-label-mono uppercase">Erkek</span>
                  <input className="text-primary focus:ring-0 bg-transparent border-primary" name="gender" type="radio" checked={cinsiyet === 'Erkek'} onChange={() => setCinsiyet('Erkek')} />
                </label>
                <label className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${cinsiyet === 'Kadin' ? 'bg-surface-container-high border-primary' : 'bg-surface-container-low border-outline-variant hover:border-on-surface-variant'}`}>
                  <span className="font-label-mono text-label-mono uppercase">Kadın</span>
                  <input className="text-primary focus:ring-0 bg-transparent border-outline-variant" name="gender" type="radio" checked={cinsiyet === 'Kadin'} onChange={() => setCinsiyet('Kadin')} />
                </label>
              </div>
            </section>

            <section className="md:col-span-12 bento-card p-6 rounded-2xl">
              <h3 className="font-headline-md text-headline-md mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">bolt</span>
                Aktivite Seviyesi
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {AKTIVITE_OPTIONS.map((opt) => (
                  <label key={opt.value} className="relative cursor-pointer">
                    <input className="peer sr-only" name="activity" type="radio" checked={aktiflik === opt.value} onChange={() => setAktiflik(opt.value)} />
                    <div className={`p-4 rounded-xl border transition-all ${aktiflik === opt.value ? 'border-primary bg-surface-container-high' : 'border-outline-variant bg-surface-container-low'}`}>
                      <p className="font-label-mono text-label-mono uppercase mb-1">{opt.label}</p>
                      <p className="text-[10px] text-on-surface-variant leading-tight">{opt.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </section>

            <section className="md:col-span-12 bento-card p-6 rounded-2xl">
              <h3 className="font-headline-md text-headline-md mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">target</span>
                Hedef
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {HEDEF_OPTIONS.map((opt) => (
                  <label key={opt.value} className="relative cursor-pointer group">
                    <input className="peer sr-only" name="goal" type="radio" checked={hedef === opt.value} onChange={() => setHedef(opt.value)} />
                    <div className={`p-6 rounded-2xl border text-center transition-all hover:bg-surface-container-high ${hedef === opt.value ? 'border-primary active-left-accent' : 'border-outline-variant bg-surface-container-low'}`}>
                      <span className="material-symbols-outlined text-4xl mb-4 text-primary group-hover:scale-110 transition-transform inline-block">{opt.icon}</span>
                      <h4 className="font-display-lg text-headline-md text-on-surface mb-1">{opt.label}</h4>
                      <p className="font-label-mono text-[10px] text-on-surface-variant uppercase tracking-widest">{opt.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </section>

            {hata && <p className="md:col-span-12 text-brand-red text-sm">{hata}</p>}
            {mesaj && <p className="md:col-span-12 text-tertiary text-sm">{mesaj}</p>}

            <div className="md:col-span-12 flex justify-end items-center gap-4 py-6">
              <button className="px-12 py-3 bg-[#E8313F] text-white rounded-lg font-headline-md text-body-md shadow-[0_0_20px_rgba(232,49,63,0.3)] hover:scale-105 active:scale-95 transition-all" type="submit" disabled={kaydediliyor}>
                {kaydediliyor ? 'KAYDEDİLİYOR...' : 'KAYDET'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

export default Profile;