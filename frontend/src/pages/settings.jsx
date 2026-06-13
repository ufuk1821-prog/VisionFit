import { useState, useEffect } from 'react';
import axios from 'axios';
import { AnimatePresence, motion } from 'framer-motion';
import { KeyRound, Trash2, AlertTriangle, Sun, Moon } from 'lucide-react';
import Sidebar from '../components/sidebar';

const overlayVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

const modalVariants = {
  initial: { opacity: 0, scale: 0.9, y: 16 },
  animate: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.92, y: 12 },
};

function Settings() {
  const [mevcutSifre, setMevcutSifre] = useState('');
  const [yeniSifre, setYeniSifre] = useState('');
  const [yeniSifreTekrar, setYeniSifreTekrar] = useState('');
  const [sifreMesaj, setSifreMesaj] = useState('');
  const [sifreHata, setSifreHata] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteHata, setDeleteHata] = useState('');
  const [theme, setTheme] = useState('dark');
  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };
  const apiUrl = import.meta.env.VITE_API_URL;

  useEffect(() => {
    const saved = localStorage.getItem('theme') || 'dark';
    setTheme(saved);
  }, []);

  const handleThemeChange = (value) => {
    setTheme(value);
    localStorage.setItem('theme', value);
    document.documentElement.setAttribute('data-theme', value);
  };

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
        <h2>Görünüm</h2>

        <div className="theme-toggle-row">
          <div
            className={`theme-option ${theme === 'dark' ? 'active' : ''}`}
            onClick={() => handleThemeChange('dark')}
          >
            <div className="theme-preview dark" />
            <span>
              <Moon size={16} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
              Koyu Tema
            </span>
          </div>
          <div
            className={`theme-option ${theme === 'light' ? 'active' : ''}`}
            onClick={() => handleThemeChange('light')}
          >
            <div className="theme-preview light" />
            <span>
              <Sun size={16} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
              Açık Tema
            </span>
          </div>
        </div>
      </div>

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

      <AnimatePresence>
        {showDeleteModal && (
          <motion.div
            className="food-modal-overlay"
            onClick={() => setShowDeleteModal(false)}
            variants={overlayVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.2 }}
          >
            <motion.div
              className="food-modal"
              onClick={(e) => e.stopPropagation()}
              variants={modalVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.25, ease: [0.34, 1.56, 0.64, 1] }}
            >
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
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default Settings;