import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { Dumbbell, Salad, Footprints, BarChart3 } from 'lucide-react';
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
    <div className="auth-layout">
      <div className="auth-side-panel">
        <img src={logoImg} alt="VisionFit" className="auth-side-logo" />
        <h2>En İyi Haline Ulaş</h2>
        <p>Yapay zeka destekli antrenman analizi, kişiye özel diyet planı ve gelişim takibi tek platformda.</p>
        <div className="auth-feature-list">
          <div className="auth-feature-item"><Dumbbell size={18} /> Kamera ile Form Analizi</div>
          <div className="auth-feature-item"><Salad size={18} /> Kişiye Özel Diyet Önerisi</div>
          <div className="auth-feature-item"><Footprints size={18} /> Adım ve Aktivite Takibi</div>
          <div className="auth-feature-item"><BarChart3 size={18} /> Gelişim Grafikleri</div>
        </div>
      </div>

      <div className="auth-form-panel">
        <div className="auth-box fade-in">
          <h2>Giriş Yap</h2>
          {error && <p className="error-text">{error}</p>}
          {needsVerification && (
            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
              <button type="button" className="link-text" style={{ background: 'none', border: 'none', cursor: 'pointer' }} onClick={handleResend} disabled={resending}>
                {resending ? 'Gönderiliyor...' : 'Doğrulama E-postasını Yeniden Gönder'}
              </button>
              {resendMessage && <p style={{ color: 'var(--accent)', fontSize: '0.85rem', marginTop: '8px' }}>{resendMessage}</p>}
            </div>
          )}
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label>E-posta</label>
              <input
                type="email"
                placeholder="ornek@visionfit.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label style={{ marginBottom: 0 }}>Şifre</label>
                <a href="#" className="link-text" style={{ margin: 0, fontSize: '0.7rem' }}>Şifremi Unuttum</a>
              </div>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="submit-btn" disabled={yukleniyor}>
              {yukleniyor ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
            </button>
          </form>
          <Link to="/register" className="link-text">Hesabın yok mu? Kayıt Ol</Link>
        </div>
      </div>
    </div>
  );
}

export default Login;