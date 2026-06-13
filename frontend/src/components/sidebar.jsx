import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Menu, Home, Camera, History, User, Salad, Footprints, Award, Utensils, Settings, Dumbbell, LogOut } from 'lucide-react';

const NAV_ITEMS = [
  { path: '/', label: 'Ana Sayfa', icon: Home },
  { path: '/dashboard', label: 'Kamera', icon: Camera },
  { path: '/history', label: 'Geçmiş Antrenmanlar', icon: History },
  { path: '/exercises', label: 'Egzersiz Kütüphanesi', icon: Dumbbell },
  { path: '/profile', label: 'Profilim', icon: User },
  { path: '/diet', label: 'Diyet Önerisi', icon: Salad },
  { path: '/nutrition', label: 'Beslenme Takibi', icon: Utensils },
  { path: '/steps', label: 'Adım Sayacı', icon: Footprints },
  { path: '/badges', label: 'Rozetlerim', icon: Award },
  { path: '/settings', label: 'Ayarlar', icon: Settings },
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

  return (
    <>
      <button className="menu-btn" onClick={() => setOpen(true)}>
        <Menu size={20} color="var(--accent)" />
      </button>

      {open && <div className="sidebar-overlay" onClick={() => setOpen(false)} />}

      <div className={`sidebar ${open ? 'open' : ''}`}>
        <div className="sidebar-header">VisionFit</div>
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
        <button className="sidebar-logout" onClick={handleLogout}>
          <LogOut size={18} />
          Çıkış Yap
        </button>
      </div>
    </>
  );
}

export default Sidebar;