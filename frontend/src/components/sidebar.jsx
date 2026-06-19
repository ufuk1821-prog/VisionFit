import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { Menu, X, Home, Camera, History, Dumbbell, ClipboardList, Salad, Utensils, Footprints, Timer, Award, Settings, User, LogOut, Image } from 'lucide-react';

const NAV_ITEMS = [
  { path: '/', label: 'Panel', icon: Home },
  { path: '/dashboard', label: 'Kamera Analizi', icon: Camera },
  { path: '/plank', label: 'Fotoğraf Analizi', icon: Image },
  { path: '/history', label: 'Geçmiş', icon: History },
  { path: '/exercises', label: 'Kütüphane', icon: Dumbbell },
  { path: '/workout-notebook', label: 'Günlük', icon: ClipboardList },
  { path: '/diet', label: 'Diyet', icon: Salad },
  { path: '/nutrition', label: 'Beslenme', icon: Utensils },
  { path: '/steps', label: 'Adımlar', icon: Footprints },
  { path: '/timer', label: 'Kronometre', icon: Timer },
  { path: '/badges', label: 'Rozetler', icon: Award },
  { path: '/profile', label: 'Profil', icon: User },
  { path: '/settings', label: 'Ayarlar', icon: Settings },
];

function Sidebar() {
  const [open, setOpen] = useState(false);
  const [kullanici, setKullanici] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    axios.get(`${import.meta.env.VITE_API_URL}/api/users/me`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then((res) => setKullanici(res.data)).catch(() => {});
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  const go = (path) => {
    setOpen(false);
    navigate(path);
  };

  const toggleOpen = () => setOpen((prev) => !prev);

  const adHarfi = kullanici?.ad ? kullanici.ad.charAt(0).toUpperCase() : 'V';

  return (
    <>
      <button className="menu-btn" onClick={toggleOpen}>
        {open ? <X size={20} color="var(--accent)" /> : <Menu size={20} color="var(--accent)" />}
      </button>

      {open && <div className="sidebar-overlay" onClick={() => setOpen(false)} />}

      <div className={`sidebar ${open ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <h1 className="sidebar-brand-title">VisionFit</h1>
          <p className="sidebar-brand-sub">PERFORMANS TELEMETRİSİ</p>
        </div>
        <nav className="sidebar-nav">
          {NAV_ITEMS.map(({ path, label, icon: Icon }) => (
            <button
              key={path}
              className={location.pathname === path ? 'active' : ''}
              onClick={() => go(path)}
            >
              <Icon size={18} />
              <span>{label}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="sidebar-profile-card">
            <div className="sidebar-profile-avatar">{adHarfi}</div>
            <div>
              <p className="sidebar-profile-name">{kullanici ? `${kullanici.ad} ${kullanici.soyad}` : 'Sporcu'}</p>
              <p className="sidebar-profile-sub">Üye</p>
            </div>
          </div>
          <button className="sidebar-logout" onClick={handleLogout}>
            <LogOut size={16} />
            ÇIKIŞ YAP
          </button>
        </div>
      </div>
    </>
  );
}

export default Sidebar;