import { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Dumbbell, Salad, Footprints, BarChart3, Mail } from 'lucide-react';
import logoImg from '../assets/logo.png';

const PASSWORD_RULES = [
  { test: (p) => p.length >= 8, label: 'En az 8 karakter' },
  { test: (p) => /[A-Z]/.test(p), label: 'En az 1 büyük harf' },
  { test: (p) => /[!@#$%^&*(),.?":{}|<>_\-+=]/.test(p), label: 'En az 1 özel karakter (!@#$% vb.)' },
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
          {success ? (
            <div style={{ textAlign: 'center' }}>
              <Mail size={48} color="var(--accent)" style={{ margin: '0 auto 16px' }} />
              <h2>E-postanı Kontrol Et</h2>
              <p style={{ color: 'var(--text-muted)', margin: '12px 0 24px' }}>
                <strong>{email}</strong> adresine bir doğrulama bağlantısı gönderdik. Hesabını aktifleştirmek için
                e-postandaki bağlantıya tıkla, ardından giriş yapabilirsin.
              </p>
              <Link to="/login" className="submit-btn" style={{ display: 'block', textDecoration: 'none' }}>Giriş Sayfasına Git</Link>
            </div>
          ) : (
            <>
              <h2>Kayıt Ol</h2>
              {error && <p className="error-text">{error}</p>}
              <form onSubmit={handleRegister}>
                <div className="form-group">
                  <label>Ad</label>
                  <input type="text" value={ad} onChange={(e) => setAd(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label>Soyad</label>
                  <input type="text" value={soyad} onChange={(e) => setSoyad(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label>Şifre</label>
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                  {password.length > 0 && (
                    <div className="password-rules">
                      {PASSWORD_RULES.map((rule) => (
                        <span key={rule.label} className={`password-rule ${rule.test(password) ? 'valid' : ''}`}>
                          {rule.test(password) ? '✓' : '○'} {rule.label}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="form-group">
                  <label>Şifre Tekrar</label>
                  <input
                    type="password"
                    value={passwordConfirm}
                    onChange={(e) => setPasswordConfirm(e.target.value)}
                    required
                    style={{ borderColor: passwordConfirm && password !== passwordConfirm ? 'var(--danger)' : undefined }}
                  />
                  {passwordConfirm && password !== passwordConfirm && (
                    <span style={{ color: 'var(--danger)', fontSize: '0.82rem', marginTop: '4px' }}>Şifreler eşleşmiyor.</span>
                  )}
                </div>
                <button type="submit" className="submit-btn" disabled={loading}>
                  {loading ? 'Kaydediliyor...' : 'Hesap Oluştur'}
                </button>
              </form>
              <Link to="/login" className="link-text">Zaten hesabın var mı? Giriş Yap</Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default Register;