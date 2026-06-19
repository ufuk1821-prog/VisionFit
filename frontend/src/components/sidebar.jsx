import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, Home, Camera, History, Dumbbell, ClipboardList, Salad, Utensils, Footprints, Timer, Award, Settings, User, LogOut, Image } from 'lucide-react';
import logoImg from '../assets/logo.png';

const NAV_ITEMS = [
  { path: '/', label: 'Ana Sayfa', icon: Home },
  { path: '/dashboard', label: 'Kamera', icon: Camera },
  { path: '/plank', label: 'Fotoğraflı Analiz', icon: Image },
  { path: '/history', label: 'Geçmiş Antrenmanlar', icon: History },
  { path: '/exercises', label: 'Egzersiz Kütüphanesi', icon: Dumbbell },
  { path: '/workout-notebook', label: 'Antrenman Defteri', icon: ClipboardList },
  { path: '/diet', label: 'Diyet Önerisi', icon: Salad },
  { path: '/nutrition', label: 'Beslenme Takibi', icon: Utensils },
  { path: '/steps', label: 'Adım Sayacı', icon: Footprints },
  { path: '/timer', label: 'Kronometre & Zamanlayıcı', icon: Timer },
  { path: '/badges', label: 'Rozetlerim', icon: Award },
  { path: '/settings', label: 'Ayarlar', icon: Settings },
  { path: '/profile', label: 'Profilim', icon: User },
];

function Sidebar() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  const go = (path) => {
    setOpen(false);
    navigate(path);
  };

  const toggleOpen = () => setOpen((prev) => !prev);

  return (
    <>
      <button className="menu-btn" onClick={toggleOpen}>
        {open ? <X size={20} color="var(--accent)" /> : <Menu size={20} color="var(--accent)" />}
      </button>

      {open && <div className="sidebar-overlay" onClick={() => setOpen(false)} />}

      <div className={`sidebar ${open ? 'open' : ''}`}>
        <img src={logoImg} alt="VisionFit" className="sidebar-logo-img" />
        <nav className="sidebar-nav">
          {NAV_ITEMS.map(({ path, label, icon: Icon }) => (
            <button
              key={path}
              className={location.pathname === path ? 'active' : ''}
              onClick={() => go(path)}
            >
              <Icon size={18} />
              {label}
            </button>
          ))}
        </nav>
        <button className="sidebar-logout" onClick={handleLogout} style={{ flexShrink: 0 }}>
          <LogOut size={18} />
          Çıkış Yap
        </button>
      </div>
    </>
  );
}

export default Sidebar;