import { useEffect, useState } from 'react';
import axios from 'axios';
import Sidebar from '../components/sidebar';

const AKTIFLIK_OPTIONS = [
  { value: 'sedanter', label: 'Sedanter (Hareket etmiyorum veya çok az hareket ediyorum.)' },
  { value: 'az_hareketli', label: 'Az hareketli (Hafif hareketli bir yaşam, haftada 1-3 gün egzersiz yapıyorum.)' },
  { value: 'orta_hareketli', label: 'Orta derece hareketli (Hareketli bir yaşam, haftada 3-5 gün egzersiz yapıyorum.)' },
  { value: 'cok_hareketli', label: 'Çok hareketli (Çok hareketli bir yaşam, haftada 6-7 gün egzersiz yapıyorum.)' },
  { value: 'asiri_hareketli', label: 'Aşırı hareketli (Profesyonel sporcu veya atlet seviyesinde aktivite.)' },
];

const HEDEF_OPTIONS = [
  { value: 'kilo_verme', label: 'Kilo Verme' },
  { value: 'kilo_koruma', label: 'Kilo Koruma' },
  { value: 'kilo_alma', label: 'Kilo Alma' },
];

function Profile() {
  const [ad, setAd] = useState('');
  const [soyad, setSoyad] = useState('');
  const [email, setEmail] = useState('');
  const [boy, setBoy] = useState('');
  const [kilo, setKilo] = useState('');
  const [yas, setYas] = useState('');
  const [cinsiyet, setCinsiyet] = useState('');
  const [aktiflikSeviyesi, setAktiflikSeviyesi] = useState('');
  const [hedef, setHedef] = useState('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
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
      setYas(res.data.yas ?? '');
      setCinsiyet(res.data.cinsiyet ?? '');
      setAktiflikSeviyesi(res.data.aktiflik_seviyesi ?? '');
      setHedef(res.data.hedef ?? '');
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
        ad,
        soyad,
        boy: boy === '' ? null : parseFloat(boy),
        kilo: kilo === '' ? null : parseFloat(kilo),
        yas: yas === '' ? null : parseInt(yas, 10),
        cinsiyet: cinsiyet === '' ? null : cinsiyet,
        aktiflik_seviyesi: aktiflikSeviyesi === '' ? null : aktiflikSeviyesi,
        hedef: hedef === '' ? null : hedef,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessage('Profil başarıyla güncellendi.');
    } catch (err) {
      setMessage('Güncelleme başarısız oldu.');
    }
  };

  if (loading) {
    return <p className="loading-text">Yükleniyor...</p>;
  }

  return (
    <div>
      <Sidebar />
      <div className="section-title">Profilim</div>

      <div className="auth-box">
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
            <label>E-posta</label>
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
          <div className="form-group">
            <label>Yaş</label>
            <input type="number" value={yas} onChange={(e) => setYas(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Cinsiyet</label>
            <select value={cinsiyet} onChange={(e) => setCinsiyet(e.target.value)}>
              <option value="">Seçiniz</option>
              <option value="Erkek">Erkek</option>
              <option value="Kadin">Kadın</option>
            </select>
          </div>
          <div className="form-group">
            <label>Aktiflik Seviyesi</label>
            <select value={aktiflikSeviyesi} onChange={(e) => setAktiflikSeviyesi(e.target.value)}>
              <option value="">Seçiniz</option>
              {AKTIFLIK_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Hedef</label>
            <select value={hedef} onChange={(e) => setHedef(e.target.value)}>
              <option value="">Seçiniz</option>
              {HEDEF_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <button type="submit" className="submit-btn">Kaydet</button>
        </form>
      </div>
    </div>
  );
}

export default Profile;