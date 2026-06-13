import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Sidebar() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

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
        <span></span><span></span><span></span>
      </button>

      {open && <div className="sidebar-overlay" onClick={() => setOpen(false)} />}

      <div className={`sidebar ${open ? 'open' : ''}`}>
        <div className="sidebar-header">VisionFit</div>
        <nav className="sidebar-nav">
          <button onClick={() => go('/dashboard')}>Kamera</button>
          <button onClick={() => go('/history')}>Gecmis Antrenmanlar</button>
          <button onClick={() => go('/profile')}>Profilim</button>
          <button onClick={() => go('/diet')}>Diyet Onerisi</button>
          <button onClick={() => go('/steps')}>Adim Sayaci</button>
        </nav>
        <button className="sidebar-logout" onClick={handleLogout}>Cikis Yap</button>
      </div>
    </>
  );
}

export default Sidebar;