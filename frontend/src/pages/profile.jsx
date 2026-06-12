import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function Profile() {
  const [ad, setAd] = useState('');
  const [soyad, setSoyad] = useState('');
  const [email, setEmail] = useState('');
  const [boy, setBoy] = useState('');
  const [kilo, setKilo] = useState('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  useEffect(() => {
    axios.get(`${import.meta.env.VITE_API_URL}/api/users/me`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then((res) => {
      setAd(res.data.ad);
      setSoyad(res.data.soyad);
      setEmail(res.data.email);
      setBoy(res.data.boy ?? '');
      setKilo(res.data.kilo ?? '');
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setMessage('');
    try {
      await axios.put(`${import.meta.env.VITE_API_URL}/api/users/me`, {
        ad: ad,
        soyad: soyad,
        boy: boy === '' ? null : parseFloat(boy),
        kilo: kilo === '' ? null : parseFloat(kilo),
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessage('Profil basariyla guncellendi.');
    } catch (err) {
      setMessage('Guncelleme basarisiz oldu.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  if (loading) {
    return <p className="loading-text">Yukleniyor...</p>;
  }

  return (
    <div>
      <div className="top-bar">
        <div className="nav-links">
          <button className="nav-btn" onClick={() => navigate('/dashboard')}>Kameraya Don</button>
          <button className="nav-btn" onClick={() => navigate('/history')}>Gecmis Antrenmanlar</button>
        </div>
        <button className="logout-btn" onClick={handleLogout}>Cikis Yap</button>
      </div>

      <div className="auth-box">
        <h2>Profilim</h2>
        {message && <p className="loading-text">{message}</p>}
        <form onSubmit={handleSave}>
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
            <input type="email" value={email} disabled />
          </div>
          <div className="form-group">
            <label>Boy (cm)</label>
            <input type="number" step="0.1" value={boy} onChange={(e) => setBoy(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Kilo (kg)</label>
            <input type="number" step="0.1" value={kilo} onChange={(e) => setKilo(e.target.value)} />
          </div>
          <button type="submit" className="submit-btn">Kaydet</button>
        </form>
      </div>
    </div>
  );
}

export default Profile;