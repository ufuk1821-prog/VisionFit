import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import logoImg from '../assets/logo.png';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [needsVerification, setNeedsVerification] = useState(false);
  const [resendMessage, setResendMessage] = useState('');
  const [yukleniyor, setYukleniyor] = useState(false);
  const [resending, setResending] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setNeedsVerification(false);
    setResendMessage('');
    setYukleniyor(true);
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/login`, {
        email: email,
        sifre: password,
      });
      localStorage.setItem('token', response.data.token);
      window.location.href = '/';
    } catch (err) {
      if (err.response?.status === 403) {
        setError(err.response.data.detail);
        setNeedsVerification(true);
      } else {
        setError('Giriş başarısız. Email veya şifre hatalı.');
      }
    } finally {
      setYukleniyor(false);
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
    <main className="relative z-10 min-h-screen flex items-center justify-center p-gutter">
      <div className="fixed inset-0 pointer-events-none" style={{ background: 'radial-gradient(circle at 0% 0%, rgba(232, 49, 63, 0.08) 0%, transparent 50%)' }}></div>
      <div className="fixed inset-0 pointer-events-none" style={{ background: 'radial-gradient(circle at 100% 100%, rgba(232, 49, 63, 0.08) 0%, transparent 50%)' }}></div>

      <div className="w-full max-w-[420px] bg-surface-container border border-outline-variant p-10 rounded-lg shadow-2xl relative">
        <div className="flex flex-col items-center mb-8">
          <div className="w-20 h-20 mb-6 transition-transform hover:scale-105 duration-500" style={{ filter: 'drop-shadow(0 0 20px rgba(232,49,63,0.5))' }}>
            <img alt="VisionFit Logo" className="w-full h-full object-contain" src={logoImg} />
          </div>
          <h1 className="font-display-lg text-display-lg-mobile md:text-headline-md uppercase tracking-tight text-white">VisionFit</h1>
          <p className="font-label-mono text-label-mono text-outline tracking-[0.3em] mt-2">EN İYİ HALİNE ULAŞ.</p>
        </div>

        {error && <p className="text-brand-red text-sm text-center mb-4">{error}</p>}
        {needsVerification && (
          <div className="text-center mb-4">
            <button type="button" className="font-label-mono text-label-mono text-brand-red hover:underline uppercase bg-transparent border-none cursor-pointer" onClick={handleResend} disabled={resending}>
              {resending ? 'Gönderiliyor...' : 'Doğrulama E-postasını Yeniden Gönder'}
            </button>
            {resendMessage && <p className="text-brand-red text-sm mt-2">{resendMessage}</p>}
          </div>
        )}

        <form className="space-y-6" onSubmit={handleLogin}>
          <div className="space-y-2">
            <label className="font-label-mono text-label-mono text-outline-variant uppercase">E-posta</label>
            <div className="relative">
              <input
                className="w-full bg-surface-container-low border border-outline-variant text-on-surface px-4 py-3 rounded-md transition-all focus:border-brand-red placeholder:text-surface-variant"
                placeholder="ornek@visionfit.com" type="email"
                value={email} onChange={(e) => setEmail(e.target.value)} required
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="font-label-mono text-label-mono text-outline-variant uppercase">Şifre</label>
              <a className="font-label-mono text-label-mono text-brand-red hover:underline uppercase" href="#">Şifremi Unuttum</a>
            </div>
            <div className="relative">
              <input
                className="w-full bg-surface-container-low border border-outline-variant text-on-surface px-4 py-3 rounded-md transition-all focus:border-brand-red placeholder:text-surface-variant"
                placeholder="••••••••" type="password"
                value={password} onChange={(e) => setPassword(e.target.value)} required
              />
            </div>
          </div>

          <button
            className="group relative w-full bg-brand-red hover:bg-brand-red/90 text-white font-label-mono font-bold py-4 rounded-md transition-all active:scale-[0.98] overflow-hidden shadow-[0_0_20px_rgba(232,49,63,0.2)]"
            type="submit" disabled={yukleniyor}
          >
            <span className="relative z-10">{yukleniyor ? 'GİRİŞ YAPILIYOR...' : 'GİRİŞ YAP'}</span>
            <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-on-surface-variant font-body-sm">
            Hesabın yok mu?
            <Link className="text-brand-red font-bold hover:text-white transition-colors ml-1" to="/register">Kayıt Ol</Link>
          </p>
        </div>

        <div className="absolute -bottom-4 -right-4 pointer-events-none">
          <p className="font-label-mono text-[10px] text-outline-variant/30 uppercase tracking-widest" style={{ transform: 'rotate(90deg)', transformOrigin: 'left' }}>
            Auth_Ver_4.02 // Secure_Layer
          </p>
        </div>
      </div>
    </main>
  );
}

export default Login;