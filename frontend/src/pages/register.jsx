import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

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
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const passwordValid = PASSWORD_RULES.every((rule) => rule.test(password));

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

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
      setSuccess('Kayıt başarılı! Giriş sayfasına yönlendiriliyorsunuz...');
      setTimeout(() => navigate('/login'), 1800);
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
    <div className="auth-box fade-in">
      <h2>Kayıt Ol</h2>
      {error && <p className="error-text">{error}</p>}
      {success && <p className="success-text">{success}</p>}
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
        <button type="submit" className="submit-btn" disabled={loading || !!success}>
          {loading ? 'Kaydediliyor...' : 'Hesap Oluştur'}
        </button>
      </form>
      <Link to="/login" className="link-text">Zaten hesabın var mı? Giriş Yap</Link>
    </div>
  );
}

export default Register;