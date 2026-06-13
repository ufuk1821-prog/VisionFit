import { useEffect, useState } from 'react';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Sidebar from '../components/sidebar';

function History() {
  const [kayitlar, setKayitlar] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const token = localStorage.getItem('token');

  useEffect(() => {
    axios.get(`${import.meta.env.VITE_API_URL}/api/analyze/history`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then((res) => {
      setKayitlar(res.data);
      setLoading(false);
    }).catch(() => {
      setError('Veriler yüklenemedi.');
      setLoading(false);
    });
  }, []);

  const grafikVerisi = [...kayitlar]
    .reverse()
    .map((k) => ({
      tarih: new Date(k.tarih).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' }),
      guven: k.eminlik_skoru,
    }));

  return (
    <div>
      <Sidebar />
      <div className="section-title">Geçmiş Antrenmanlar</div>

      {loading && <p className="loading-text">Yükleniyor...</p>}
      {error && <p className="error-text">{error}</p>}

      {!loading && !error && kayitlar.length === 0 && (
        <p className="loading-text">Henüz antrenman kaydı yok.</p>
      )}

      {!loading && kayitlar.length > 1 && (
        <div className="chart-card">
          <div className="card-title" style={{ marginBottom: '16px' }}>Güven Skoru Gelişimi</div>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={grafikVerisi}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="tarih" stroke="var(--text-muted)" fontSize={12} />
              <YAxis stroke="var(--text-muted)" fontSize={12} domain={[0, 100]} />
              <Tooltip
                contentStyle={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '8px' }}
                labelStyle={{ color: 'var(--text)' }}
              />
              <Line type="monotone" dataKey="guven" stroke="var(--accent)" strokeWidth={2} dot={{ fill: 'var(--accent)' }} name="Güven Skoru (%)" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {!loading && kayitlar.length > 0 && (
        <table className="history-table">
          <thead>
            <tr>
              <th>Hareket</th>
              <th>Antrenör Notu</th>
              <th>Diz Açısı</th>
              <th>Güven</th>
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