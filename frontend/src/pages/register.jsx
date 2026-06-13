import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

function Register() {
  const [ad, setAd] = useState('');
  const [soyad, setSoyad] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== passwordConfirm) {
      setError('Şifreler eşleşmiyor.');
      return;
    }

    if (password.length < 6) {
      setError('Şifre en az 6 karakter olmalıdır.');
      return;
    }

    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/register`, {
        ad, soyad, email, sifre: password,
      });
      alert('Kayıt başarılı! Giriş yapabilirsiniz.');
      navigate('/login');
    } catch (err) {
      setError('Kayıt başarısız. Bu email zaten kullanılıyor olabilir.');
    }
  };

  return (
    <div className="auth-box">
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
        <button type="submit" className="submit-btn" disabled={password !== passwordConfirm && passwordConfirm.length > 0}>
          Hesap Oluştur
        </button>
      </form>
      <Link to="/login" className="link-text">Zaten hesabın var mı? Giriş Yap</Link>
    </div>
  );
}

export default Register;