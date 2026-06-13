import { useEffect, useState } from 'react';
import axios from 'axios';
import Sidebar from '../components/Sidebar';

const AKTIVITE_OPTIONS = [
  { value: 'yuruyus', label: 'Yürüyüş' },
  { value: 'tempolu_yuruyus', label: 'Tempolu Yürüyüş' },
  { value: 'kosu', label: 'Koşu' },
  { value: 'tempolu_kosu', label: 'Tempolu Koşu' },
];

function Steps() {
  const [adimSayisi, setAdimSayisi] = useState('');
  const [aktiviteTipi, setAktiviteTipi] = useState('');
  const [kayitlar, setKayitlar] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const token = localStorage.getItem('token');

  const fetchKayitlar = () => {
    axios.get(`${import.meta.env.VITE_API_URL}/api/steps`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then((res) => {
      setKayitlar(res.data);
    }).catch(() => {});
  };

  useEffect(() => {
    fetchKayitlar();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/steps`,
        { adim_sayisi: parseInt(adimSayisi, 10), aktivite_tipi: aktiviteTipi },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAdimSayisi('');
      setAktiviteTipi('');
      fetchKayitlar();
    } catch (err) {
      if (err.response && err.response.data && err.response.data.detail) {
        setError(err.response.data.detail);
      } else {
        setError('Kayit eklenemedi.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Sidebar />
      <div className="section-title">Adım Sayacı</div>

      <div className="auth-box">
        {error && <p className="error-text">{error}</p>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Adım Sayısı</label>
            <input
              type="number"
              value={adimSayisi}
              onChange={(e) => setAdimSayisi(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Aktivite Türü</label>
            <select value={aktiviteTipi} onChange={(e) => setAktiviteTipi(e.target.value)} required>
              <option value="">Seçiniz</option>
              {AKTIVITE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? 'Kaydediliyor...' : 'Kaydet'}
          </button>
        </form>
      </div>

      <div className="section-title">Geçmiş Kayıtlar</div>

      {kayitlar.length === 0 && <p className="loading-text">Henüz kayıt yok.</p>}

      {kayitlar.length > 0 && (
        <table className="history-table">
          <thead>
            <tr>
              <th>Adım Sayısı</th>
              <th>Aktivite</th>
              <th>Yakılan Kalori</th>
              <th>Tarih</th>
            </tr>
          </thead>
          <tbody>
            {kayitlar.map((k) => (
              <tr key={k.id}>
                <td>{k.adim_sayisi}</td>
                <td>{AKTIVITE_OPTIONS.find((o) => o.value === k.aktivite_tipi)?.label ?? k.aktivite_tipi}</td>
                <td>{k.yakilan_kalori} kcal</td>
                <td>{new Date(k.tarih).toLocaleString('tr-TR')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default Steps;