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
  const [diet, setDiet] = useState(null);
  const [dietError, setDietError] = useState('');
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  const fetchProfile = () => {
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
  };

  const fetchDiet = () => {
    axios.get(`${import.meta.env.VITE_API_URL}/api/users/me/diet`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then((res) => {
      setDiet(res.data);
      setDietError('');
    }).catch(() => {
      setDiet(null);
      setDietError('Diyet onerisi icin boy ve kilo bilgisi gereklidir.');
    });
  };

  useEffect(() => {
    fetchProfile();
    fetchDiet();
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
      fetchDiet();
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

      <div className="section-title">Diyet Onerisi</div>

      {dietError && <p className="error-text">{dietError}</p>}

      {diet && (
        <div className="main-wrapper">
          <div className="dashboard" style={{ width: '100%' }}>
            <div className="card status-card">
              <div className="card-title">Vucut Kitle Indeksi</div>
              <div className="card-value">{diet.bmi}</div>
            </div>
            <div className="card angle-card">
              <div className="card-title">Kategori</div>
              <div className="card-value">{diet.kategori}</div>
            </div>
            <div className="card confidence-card">
              <div className="card-title">Gunluk Kalori Onerisi</div>
              <div className="card-value">{diet.gunluk_kalori_onerisi} kcal</div>
            </div>
            <div className="card status-card">
              <div className="card-title">Tavsiye</div>
              <div className="card-value" style={{ fontSize: '1rem' }}>{diet.oneri_mesaji}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Profile;