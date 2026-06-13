import { useState } from 'react';
import axios from 'axios';
import { KeyRound, Trash2, AlertTriangle } from 'lucide-react';
import Sidebar from '../components/sidebar';

function Settings() {
  const [mevcutSifre, setMevcutSifre] = useState('');
  const [yeniSifre, setYeniSifre] = useState('');
  const [yeniSifreTekrar, setYeniSifreTekrar] = useState('');
  const [sifreMesaj, setSifreMesaj] = useState('');
  const [sifreHata, setSifreHata] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteHata, setDeleteHata] = useState('');
  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };
  const apiUrl = import.meta.env.VITE_API_URL;

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setSifreMesaj('');
    setSifreHata('');

    if (yeniSifre !== yeniSifreTekrar) {
      setSifreHata('Yeni şifreler eşleşmiyor.');
      return;
    }

    if (yeniSifre.length < 6) {
      setSifreHata('Yeni şifre en az 6 karakter olmalıdır.');
      return;
    }

    try {
      await axios.put(`${apiUrl}/api/users/me/password`, {
        mevcut_sifre: mevcutSifre,
        yeni_sifre: yeniSifre,
      }, { headers });

      setSifreMesaj('Şifre başarıyla güncellendi.');
      setMevcutSifre('');
      setYeniSifre('');
      setYeniSifreTekrar('');
    } catch (err) {
      setSifreHata(err.response?.data?.detail || 'Şifre güncellenemedi.');
    }
  };

  const handleDeleteAccount = async () => {
    setDeleteHata('');
    try {
      await axios.delete(`${apiUrl}/api/users/me`, { headers });
      localStorage.removeItem('token');
      window.location.href = '/login';
    } catch (err) {
      setDeleteHata('Hesap silinemedi.');
    }
  };

  return (
    <div>
      <Sidebar />
      <div className="section-title">Ayarlar</div>

      <div className="auth-box">
        <h2><KeyRound size={20} style={{ verticalAlign: 'middle', marginRight: '8px' }} />Şifre Değiştir</h2>

        {sifreMesaj && <p style={{ color: 'var(--accent)', textAlign: 'center', marginBottom: '16px' }}>{sifreMesaj}</p>}
        {sifreHata && <p className="error-text">{sifreHata}</p>}

        <form onSubmit={handlePasswordChange}>
          <div className="form-group">
            <label>Mevcut Şifre</label>
            <input type="password" value={mevcutSifre} onChange={(e) => setMevcutSifre(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Yeni Şifre</label>
            <input type="password" value={yeniSifre} onChange={(e) => setYeniSifre(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Yeni Şifre (Tekrar)</label>
            <input type="password" value={yeniSifreTekrar} onChange={(e) => setYeniSifreTekrar(e.target.value)} required />
          </div>
          <button type="submit" className="submit-btn">Şifreyi Güncelle</button>
        </form>
      </div>

      <div className="auth-box danger-zone">
        <h2 style={{ color: 'var(--danger)' }}><AlertTriangle size={20} style={{ verticalAlign: 'middle', marginRight: '8px' }} />Hesabı Sil</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '16px', textAlign: 'center' }}>
          Bu işlem geri alınamaz. Tüm antrenman geçmişi, adım kayıtları ve beslenme verileri silinir.
        </p>
        {deleteHata && <p className="error-text">{deleteHata}</p>}
        <button className="danger-btn" onClick={() => setShowDeleteModal(true)}>
          <Trash2 size={18} />
          Hesabımı Sil
        </button>
      </div>

      {showDeleteModal && (
        <div className="food-modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="food-modal" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ color: 'var(--danger)', marginBottom: '12px' }}>Emin misiniz?</h2>
            <p style={{ color: 'var(--text)', marginBottom: '20px' }}>
              Hesabınız ve tüm verileriniz kalıcı olarak silinecek. Bu işlem geri alınamaz.
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button className="submit-btn" style={{ background: 'var(--surface-2)', color: 'var(--text)' }} onClick={() => setShowDeleteModal(false)}>
                Vazgeç
              </button>
              <button className="submit-btn" style={{ background: 'var(--danger)', color: '#fff' }} onClick={handleDeleteAccount}>
                Evet, Sil
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Settings;