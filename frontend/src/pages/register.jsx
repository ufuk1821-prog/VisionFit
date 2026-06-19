import { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const PASSWORD_RULES = [
  { test: (p) => p.length >= 8, label: 'Minimum 8 karakter' },
  { test: (p) => /[A-Z]/.test(p), label: 'En az bir büyük harf' },
  { test: (p) => /[@$!%*?&]/.test(p), label: 'En az bir özel karakter (@$!%*?&)' },
];

function Register() {
  const [ad, setAd] = useState('');
  const [soyad, setSoyad] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState('');
  const [resending, setResending] = useState(false);

  const passwordValid = PASSWORD_RULES.every((rule) => rule.test(password));

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    if (!passwordValid) {
      setError('Şifre gereksinimleri karşılanmıyor.');
      return;
    }
    if (password !== passwordConfirm) {
      setError('Şifreler eşleşmiyor.');
      return;
    }
    setLoading(true);
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/register`, {
        ad, soyad, email, sifre: password,
      });
      setSuccess(true);
    } catch (err) {
      const detail = err.response?.data?.detail;
      if (detail === 'Bu email zaten kayitli.') {
        setError('Bu email adresiyle zaten bir hesap mevcut. Giriş yapmayı deneyin.');
      } else {
        setError(detail || 'Kayıt başarısız. Lütfen tekrar deneyin.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setResendMessage('');
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/resend-verification`, { email });
      setResendMessage(res.data.mesaj);
    } catch {
      setResendMessage('Bir hata oluştu, tekrar deneyin.');
    } finally {
      setResending(false);
    }
  };

  return (
    <main className="relative z-10 w-full max-w-[500px] mx-auto my-10">
      <div className="bg-surface-container rounded-xl border border-outline-variant shadow-2xl overflow-hidden">
        <div className="px-8 pt-10 pb-6 text-center">
          <h1 className="font-display-lg text-display-lg-mobile md:text-display-lg text-primary mb-2 uppercase tracking-tighter">VisionFit</h1>
          <p className="font-label-mono text-label-mono text-on-surface-variant uppercase tracking-widest">Performans Telemetrisi Kayıt Sistemi</p>
        </div>

        {success ? (
          <div className="px-8 pb-10 text-center">
            <span className="material-symbols-outlined text-primary" style={{ fontSize: '48px' }}>mail</span>
            <h2 className="font-headline-md text-headline-md mt-4 mb-2">E-postanı Kontrol Et</h2>
            <p className="text-on-surface-variant font-body-sm mb-6">
              <strong>{email}</strong> adresine bir doğrulama bağlantısı gönderdik. Hesabını aktifleştirmek için e-postandaki bağlantıya tıkla, ardından giriş yapabilirsin.
            </p>
            <Link to="/login" className="w-full bg-primary-container text-on-primary-container font-headline-md py-4 rounded-lg hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 uppercase no-underline">
              Giriş Sayfasına Git
            </Link>
            <button
              className="mt-4 bg-transparent border-none text-primary cursor-pointer font-body-sm"
              onClick={handleResend} disabled={resending}
            >
              {resending ? 'Gönderiliyor...' : 'E-postayı Tekrar Gönder'}
            </button>
            {resendMessage && <p className="text-on-surface-variant text-sm mt-2">{resendMessage}</p>}
          </div>
        ) : (
          <form className="px-8 pb-10 space-y-6" onSubmit={handleRegister}>
            <div className="grid grid-cols-2 gap-bento-gap">
              <div className="space-y-1.5">
                <label className="font-label-mono text-label-mono text-on-surface-variant uppercase" htmlFor="firstName">AD</label>
                <input
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-4 py-3 text-on-surface focus:border-primary outline-none transition-all placeholder-on-surface-variant/30"
                  id="firstName" placeholder="İSİM" required type="text"
                  value={ad} onChange={(e) => setAd(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <label className="font-label-mono text-label-mono text-on-surface-variant uppercase" htmlFor="lastName">SOYAD</label>
                <input
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-4 py-3 text-on-surface focus:border-primary outline-none transition-all placeholder-on-surface-variant/30"
                  id="lastName" placeholder="SOYİSİM" required type="text"
                  value={soyad} onChange={(e) => setSoyad(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="font-label-mono text-label-mono text-on-surface-variant uppercase" htmlFor="email">E-POSTA ADRESİ</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/50">mail</span>
                <input
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg pl-12 pr-4 py-3 text-on-surface focus:border-primary outline-none transition-all placeholder-on-surface-variant/30"
                  id="email" placeholder="example@visionfit.ai" required type="email"
                  value={email} onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="font-label-mono text-label-mono text-on-surface-variant uppercase" htmlFor="password">ŞİFRE</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/50">lock</span>
                <input
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg pl-12 pr-4 py-3 text-on-surface focus:border-primary outline-none transition-all placeholder-on-surface-variant/30"
                  id="password" placeholder="••••••••" required type="password"
                  value={password} onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <div className="bg-surface-container-high/50 rounded-lg p-4 space-y-2 border border-outline-variant/30">
              {PASSWORD_RULES.map((rule) => {
                const valid = rule.test(password);
                return (
                  <div key={rule.label} className={`flex items-center gap-3 font-label-mono text-[10px] uppercase tracking-wider transition-colors duration-200 ${valid ? 'text-primary' : 'text-on-surface-variant'}`}>
                    <span className="material-symbols-outlined text-[16px]">{valid ? 'check_circle' : 'radio_button_unchecked'}</span>
                    {rule.label}
                  </div>
                );
              })}
            </div>

            <div className="space-y-1.5">
              <label className="font-label-mono text-label-mono text-on-surface-variant uppercase">ŞİFRE TEKRAR</label>
              <input
                className="w-full bg-surface-container-lowest border rounded-lg px-4 py-3 text-on-surface focus:border-primary outline-none transition-all placeholder-on-surface-variant/30"
                style={{ borderColor: passwordConfirm && password !== passwordConfirm ? '#E8313F' : undefined }}
                placeholder="••••••••" type="password" required
                value={passwordConfirm} onChange={(e) => setPasswordConfirm(e.target.value)}
              />
              {passwordConfirm && password !== passwordConfirm && (
                <span className="text-brand-red text-xs">Şifreler eşleşmiyor.</span>
              )}
            </div>

            {error && <p className="text-brand-red text-sm text-center">{error}</p>}

            <button
              className="w-full bg-primary-container text-on-primary-container font-headline-md py-4 rounded-lg hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 uppercase"
              type="submit" disabled={loading}
            >
              {loading ? 'KAYDEDİLİYOR...' : 'KAYIT OL'}
              <span className="material-symbols-outlined">arrow_forward</span>
            </button>

            <div className="text-center pt-2">
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Zaten hesabın var mı?
                <Link className="text-primary font-bold hover:underline underline-offset-4 ml-1" to="/login">Giriş Yap</Link>
              </p>
            </div>
          </form>
        )}
      </div>

      <div className="mt-8 grid grid-cols-3 gap-bento-gap opacity-30">
        <div className="h-[1px] bg-outline"></div>
        <div className="font-label-mono text-[8px] text-center text-outline uppercase tracking-widest">SECURE_ENCRYPTION_V4.0</div>
        <div className="h-[1px] bg-outline"></div>
      </div>
    </main>
  );
}

export default Register;