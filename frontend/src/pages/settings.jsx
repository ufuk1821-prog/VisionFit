import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/sidebar';

function Settings() {
  const [mevcutSifre, setMevcutSifre] = useState('');
  const [yeniSifre, setYeniSifre] = useState('');
  const [yeniSifreTekrar, setYeniSifreTekrar] = useState('');
  const [mesaj, setMesaj] = useState('');
  const [hata, setHata] = useState('');
  const [yukleniyor, setYukleniyor] = useState(false);
  const [silModalAcik, setSilModalAcik] = useState(false);
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  const sifreGuncelle = async (e) => {
    e.preventDefault();
    setHata('');
    setMesaj('');
    if (yeniSifre !== yeniSifreTekrar) {
      setHata('Yeni şifreler eşleşmiyor.');
      return;
    }
    setYukleniyor(true);
    try {
      await axios.put(
        `${import.meta.env.VITE_API_URL}/api/users/me/password`,
        { mevcut_sifre: mevcutSifre, yeni_sifre: yeniSifre },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMesaj('Şifreniz başarıyla güncellendi.');
      setMevcutSifre('');
      setYeniSifre('');
      setYeniSifreTekrar('');
    } catch (err) {
      setHata(err.response?.data?.detail || 'Şifre güncellenemedi.');
    } finally {
      setYukleniyor(false);
    }
  };

  const hesabiSil = async () => {
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      localStorage.removeItem('token');
      navigate('/login');
    } catch {
      setHata('Hesap silinemedi, lütfen tekrar deneyin.');
      setSilModalAcik(false);
    }
  };

  return (
    <div>
      <Sidebar />

      <main className="md:ml-64 pt-20 md:pt-10 px-gutter min-h-screen">
        <div className="max-w-5xl mx-auto pb-20">
          <header className="mb-10">
            <h2 className="font-display-lg text-display-lg-mobile md:text-display-lg mb-2">AYARLAR</h2>
            <div className="h-1 w-12 bg-primary-container rounded-full mb-4"></div>
            <p className="font-body-md text-on-surface-variant max-w-xl">
              Sistem tercihlerini, güvenlik protokollerini ve hesap verilerini bu panel üzerinden yönetebilirsiniz.
            </p>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-bento-gap">
            <section className="col-span-1 md:col-span-4 bento-card p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-6">
                  <span className="material-symbols-outlined text-primary">palette</span>
                  <h3 className="font-label-mono text-label-mono uppercase">GÖRÜNÜM</h3>
                </div>
                <p className="font-body-sm text-on-surface-variant mb-6 leading-relaxed">
                  Arayüz temasını çalışma ortamınıza göre optimize edin. Karanlık mod yüksek odaklı analizler için önerilir.
                </p>
              </div>
              <div className="space-y-4">
                <label className="flex items-center justify-between p-4 bg-surface-container-low rounded-lg border border-outline-variant cursor-pointer group active:scale-95 transition-all">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined group-hover:text-primary transition-colors">dark_mode</span>
                    <span className="font-body-md">Karanlık Mod</span>
                  </div>
                  <input checked readOnly className="form-radio text-brand-red focus:ring-brand-red h-5 w-5 bg-surface-container" name="theme" type="radio" />
                </label>
                <label className="flex items-center justify-between p-4 bg-surface-container-low rounded-lg border border-outline-variant cursor-pointer group active:scale-95 transition-all opacity-50">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined group-hover:text-primary transition-colors">light_mode</span>
                    <span className="font-body-md">Aydınlık Mod</span>
                  </div>
                  <input className="form-radio text-brand-red focus:ring-brand-red h-5 w-5 bg-surface-container" name="theme" type="radio" disabled />
                </label>
              </div>
            </section>

            <section className="col-span-1 md:col-span-8 bento-card p-6">
              <div className="flex items-center gap-2 mb-6">
                <span className="material-symbols-outlined text-primary">lock</span>
                <h3 className="font-label-mono text-label-mono uppercase">GÜVENLİK PROTOKOLÜ</h3>
              </div>
              <form className="space-y-6" onSubmit={sifreGuncelle}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex flex-col space-y-2">
                    <label className="font-label-mono text-label-mono text-on-surface-variant">MEVCUT ŞİFRE</label>
                    <div className="relative">
                      <input
                        className="input-technical w-full pl-10"
                        placeholder="••••••••"
                        type="password"
                        value={mevcutSifre}
                        onChange={(e) => setMevcutSifre(e.target.value)}
                        required
                      />
                      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">key</span>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <p className="text-xs text-on-surface-variant italic opacity-60">Kimlik doğrulaması için mevcut şifrenizi girmeniz zorunludur.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex flex-col space-y-2">
                    <label className="font-label-mono text-label-mono text-on-surface-variant">YENİ ŞİFRE</label>
                    <div className="relative">
                      <input
                        className="input-technical w-full pl-10"
                        placeholder="Min. 8 karakter"
                        type="password"
                        value={yeniSifre}
                        onChange={(e) => setYeniSifre(e.target.value)}
                        required
                        minLength={8}
                      />
                      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">lock_open</span>
                    </div>
                  </div>
                  <div className="flex flex-col space-y-2">
                    <label className="font-label-mono text-label-mono text-on-surface-variant">YENİ ŞİFRE (TEKRAR)</label>
                    <div className="relative">
                      <input
                        className="input-technical w-full pl-10"
                        placeholder="Şifreyi doğrulayın"
                        type="password"
                        value={yeniSifreTekrar}
                        onChange={(e) => setYeniSifreTekrar(e.target.value)}
                        required
                      />
                      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">verified</span>
                    </div>
                  </div>
                </div>

                {hata && <p className="text-brand-red text-sm">{hata}</p>}
                {mesaj && <p className="text-tertiary text-sm">{mesaj}</p>}

                <div className="pt-4 flex justify-end">
                  <button className="btn-primary-red flex items-center gap-2" type="submit" disabled={yukleniyor}>
                    <span className="material-symbols-outlined">save</span>
                    {yukleniyor ? 'GÜNCELLENİYOR...' : 'ŞİFREYİ GÜNCELLE'}
                  </button>
                </div>
              </form>
            </section>

            <section className="col-span-1 md:col-span-4 bento-card p-6 bg-[#161616]">
              <div className="flex items-center gap-2 mb-4">
                <span className="material-symbols-outlined text-primary">data_usage</span>
                <h3 className="font-label-mono text-label-mono uppercase">VERİ ANALİTİĞİ</h3>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <span className="font-body-sm text-on-surface-variant">Bulut Depolama</span>
                  <span className="font-label-mono text-primary">SINIRSIZ</span>
                </div>
                <div className="w-full h-1 bg-surface-container-high rounded-full overflow-hidden">
                  <div className="h-full bg-brand-red w-full"></div>
                </div>
                <p className="text-[10px] font-label-mono text-on-surface-variant uppercase leading-tight">
                  Veriler bulut sunucusunda anlık senkronize edilir
                </p>
              </div>
            </section>

            <section className="col-span-1 md:col-span-8 bento-card p-6 border-on-primary-fixed-variant bg-on-primary-fixed-variant/5">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="max-w-md">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="material-symbols-outlined text-brand-red">warning</span>
                    <h3 className="font-label-mono text-label-mono uppercase text-brand-red">TEHLİKELİ BÖLGE</h3>
                  </div>
                  <p className="font-body-sm text-on-surface leading-relaxed">
                    Hesabınızı sildiğinizde tüm performans verileriniz, analiz geçmişiniz ve kişisel tercihleriniz <strong>kalıcı olarak silinecektir.</strong> Bu işlem geri alınamaz.
                  </p>
                </div>
                <div className="flex-shrink-0">
                  <button
                    className="px-6 py-3 border border-brand-red/30 text-brand-red hover:bg-brand-red hover:text-white transition-all font-bold rounded-lg flex items-center gap-2 group"
                    onClick={() => setSilModalAcik(true)}
                  >
                    <span className="material-symbols-outlined group-hover:animate-pulse">delete_forever</span>
                    HESABI KALICI OLARAK SİL
                  </button>
                </div>
              </div>
            </section>

            <section className="col-span-1 md:col-span-12 h-40 bento-card overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-r from-background via-transparent to-background"></div>
              <div className="relative z-10 flex h-full items-center justify-center">
                <div className="text-center">
                  <span className="font-label-mono text-label-mono uppercase tracking-[0.4em] opacity-40">VisionFit Sistem Aktif</span>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>

      {silModalAcik && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[1100] flex items-center justify-center p-5" onClick={() => setSilModalAcik(false)}>
          <div className="bg-surface-container border border-brand-red rounded-xl p-7 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-headline-md text-headline-md text-brand-red mb-3">Emin misiniz?</h3>
            <p className="font-body-sm text-on-surface-variant mb-6">Bu işlem geri alınamaz. Hesabınız ve tüm verileriniz kalıcı olarak silinecektir.</p>
            <div className="flex gap-3 justify-end">
              <button className="px-5 py-2.5 rounded-lg border border-outline-variant text-on-surface-variant" onClick={() => setSilModalAcik(false)}>Vazgeç</button>
              <button className="px-5 py-2.5 rounded-lg bg-brand-red text-white font-bold" onClick={hesabiSil}>Evet, Sil</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Settings;