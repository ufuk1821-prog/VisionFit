import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function History() {
  const [kayitlar, setKayitlar] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  useEffect(() => {
    axios.get(`${import.meta.env.VITE_API_URL}/api/analyze/history`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then((res) => {
      setKayitlar(res.data);
      setLoading(false);
    }).catch(() => {
      setError('Veriler yuklenemedi.');
      setLoading(false);
    });
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  return (
    <div>
      <div className="top-bar">
        <div className="nav-links">
          <button className="nav-btn" onClick={() => navigate('/dashboard')}>Kameraya Don</button>
          <button className="nav-btn" onClick={() => navigate('/profile')}>Profilim</button>
        </div>
        <button className="logout-btn" onClick={handleLogout}>Cikis Yap</button>
      </div>

      <div className="section-title">Gecmis Antrenmanlar</div>

      {loading && <p className="loading-text">Yukleniyor...</p>}
      {error && <p className="error-text">{error}</p>}

      {!loading && !error && kayitlar.length === 0 && (
        <p className="loading-text">Henuz antrenman kaydı yok.</p>
      )}

      {!loading && kayitlar.length > 0 && (
        <table className="history-table">
          <thead>
            <tr>
              <th>Hareket</th>
              <th>Antrenor Notu</th>
              <th>Diz Acisi</th>
              <th>Eminlik</th>
              <th>Tarih</th>
            </tr>
          </thead>
          <tbody>
            {kayitlar.map((k) => (
              <tr key={k.id}>
                <td>{k.hareket_adi}</td>
                <td>{k.antrenor_notu}</td>
                <td>{k.diz_acisi}°</td>
                <td>%{k.eminlik_skoru}</td>
                <td>{new Date(k.tarih).toLocaleString('tr-TR')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default History;