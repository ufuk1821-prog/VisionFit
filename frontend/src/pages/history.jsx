import { useEffect, useState } from 'react';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, Minus, Activity, Zap } from 'lucide-react';
import Sidebar from '../components/sidebar';
import EmptyState from '../components/EmptyState';

const HAREKET_BILGI = {
  squat_session: { etiket: 'Squat - Tüm Vücut Analizi', tip: 'oturum' },
  dogru_squat: { etiket: 'Squat - Anlık Kayıt', tip: 'anlik' },
  yanlis_squat: { etiket: 'Squat - Anlık Kayıt', tip: 'anlik' },
};

const FILTRE_OPTIONS = [
  { value: 'tumu', label: 'Tümü' },
  { value: 'oturum', label: 'Oturum Analizleri' },
  { value: 'anlik', label: 'Anlık Kayıtlar' },
];

function skorRengi(skor) {
  if (skor >= 75) return 'var(--accent)';
  if (skor >= 50) return 'var(--accent-blue)';
  return 'var(--danger)';
}

function TrendIcon({ fark }) {
  if (fark > 0) return <TrendingUp size={14} />;
  if (fark < 0) return <TrendingDown size={14} />;
  return <Minus size={14} />;
}

function History() {
  const [kayitlar, setKayitlar] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filtre, setFiltre] = useState('tumu');
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

  const tipBelirle = (hareketAdi) => HAREKET_BILGI[hareketAdi]?.tip ?? 'anlik';
  const etiketBelirle = (hareketAdi) => HAREKET_BILGI[hareketAdi]?.etiket ?? hareketAdi;

  const oturumKayitlari = kayitlar.filter((k) => tipBelirle(k.hareket_adi) === 'oturum');

  const grafikVerisi = [...oturumKayitlari]
    .reverse()
    .map((k) => ({
      tarih: new Date(k.tarih).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' }),
      skor: k.eminlik_skoru,
    }));

  const filtrelenmisKayitlar = kayitlar.filter((k) => {
    if (filtre === 'tumu') return true;
    return tipBelirle(k.hareket_adi) === filtre;
  });

  const sonOturumFarki = oturumKayitlari.length >= 2
    ? Math.round((oturumKayitlari[0].eminlik_skoru - oturumKayitlari[1].eminlik_skoru) * 10) / 10
    : null;

  return (
    <div>
      <Sidebar />
      <div className="section-title">Geçmiş Antrenmanlar</div>

      {loading && <p className="loading-text">Yükleniyor...</p>}
      {error && <p className="error-text">{error}</p>}

      {!loading && !error && kayitlar.length === 0 && (
        <EmptyState
          type="camera"
          title="Henüz antrenman kaydı yok"
          description="Kamera sayfasından bir antrenman analizi yaparak ilk kaydını oluştur."
        />
      )}

      {!loading && oturumKayitlari.length > 1 && (
        <div className="chart-card">
          <div className="card-title" style={{ marginBottom: '16px' }}>Genel Skor Gelişimi (Oturum Analizleri)</div>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={grafikVerisi}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="tarih" stroke="var(--text-muted)" fontSize={12} />
              <YAxis stroke="var(--text-muted)" fontSize={12} domain={[0, 100]} />
              <Tooltip
                contentStyle={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '8px' }}
                labelStyle={{ color: 'var(--text)' }}
              />
              <Line type="monotone" dataKey="skor" stroke="var(--accent)" strokeWidth={2} dot={{ fill: 'var(--accent)' }} name="Genel Skor (%)" />
            </LineChart>
          </ResponsiveContainer>

          {sonOturumFarki !== null && (
            <div className={`comparison-delta ${sonOturumFarki > 0 ? 'up' : sonOturumFarki < 0 ? 'down' : 'same'}`} style={{ marginTop: '12px' }}>
              <TrendIcon fark={sonOturumFarki} />
              {sonOturumFarki > 0 ? `Son oturumda önceki oturuma göre +${sonOturumFarki} puan` : sonOturumFarki < 0 ? `Son oturumda önceki oturuma göre ${sonOturumFarki} puan` : 'Son oturum önceki oturumla aynı skorda'}
            </div>
          )}
        </div>
      )}

      {!loading && kayitlar.length > 0 && (
        <>
          <div className="tab-switcher">
            {FILTRE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                className={`tab-btn ${filtre === opt.value ? 'active' : ''}`}
                onClick={() => setFiltre(opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div className="history-card-list">
            {filtrelenmisKayitlar.map((k) => {
              const tip = tipBelirle(k.hareket_adi);
              const etiket = etiketBelirle(k.hareket_adi);

              if (tip === 'oturum') {
                const [skorKismi, detayKismi] = k.antrenor_notu.split(' | ');
                const iyiDurum = detayKismi === 'Tüm kategoriler iyi';

                return (
                  <div className="history-card" key={k.id}>
                    <div className="history-card-header">
                      <span className="history-badge oturum">
                        <Zap size={14} /> {etiket}
                      </span>
                      <span className="history-date">{new Date(k.tarih).toLocaleString('tr-TR')}</span>
                    </div>
                    <div className="history-card-body">
                      <div className="history-score" style={{ color: skorRengi(k.eminlik_skoru) }}>
                        %{k.eminlik_skoru}
                      </div>
                      <div className="history-detail">
                        <div className="history-angle">Ortalama Diz Açısı: {k.diz_acisi}°</div>
                        {iyiDurum ? (
                          <div className="history-note good">Tüm kategorilerde formunuz iyiydi.</div>
                        ) : (
                          <div className="history-note">Geliştirilecek alanlar: {detayKismi}</div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <div className="history-card" key={k.id}>
                  <div className="history-card-header">
                    <span className="history-badge anlik">
                      <Activity size={14} /> {etiket}
                    </span>
                    <span className="history-date">{new Date(k.tarih).toLocaleString('tr-TR')}</span>
                  </div>
                  <div className="history-card-body">
                    <div className="history-score" style={{ color: skorRengi(k.eminlik_skoru), fontSize: '1.4rem' }}>
                      %{k.eminlik_skoru}
                    </div>
                    <div className="history-detail">
                      <div className="history-angle">Diz Açısı: {k.diz_acisi}°</div>
                      <div className="history-note">{k.antrenor_notu}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

export default History;