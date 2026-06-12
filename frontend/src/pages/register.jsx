import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

function Register() {
  const [ad, setAd] = useState('');
  const [soyad, setSoyad] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/register`, {
        ad: ad,
        soyad: soyad,
        email: email,
        sifre: password,
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
          <input
            type="text"
            value={ad}
            onChange={(e) => setAd(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label>Soyad</label>
          <input
            type="text"
            value={soyad}
            onChange={(e) => setSoyad(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label>Şifre</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="submit-btn">Hesap Oluştur</button>
      </form>
      <Link to="/login" className="link-text">Zaten hesabın var mı? Giriş Yap</Link>
    </div>
  );
}

export default Register;