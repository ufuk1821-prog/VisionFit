import { useNavigate, useLocation } from 'react-router-dom';
import logoImg from '../assets/logo.png';

const NAV_ITEMS = [
  { path: '/', label: 'PANEL', icon: 'dashboard', text: 'text-on-surface-variant' },
  { path: '/dashboard', label: 'KAMERA ANALİZİ', icon: 'videocam', text: 'text-brand-red' },
  { path: '/plank', label: 'FOTOĞRAF ANALİZİ', icon: 'photo_camera', text: 'text-purple-400' },
  { path: '/history', label: 'GEÇMİŞ', icon: 'history', text: 'text-emerald-400' },
  { path: '/exercises', label: 'KÜTÜPHANE', icon: 'menu_book', text: 'text-indigo-400' },
  { path: '/workout-notebook', label: 'GÜNLÜK', icon: 'edit_note', text: 'text-pink-400' },
  { path: '/diet', label: 'DİYET', icon: 'restaurant', text: 'text-amber-400' },
  { path: '/nutrition', label: 'BESLENME', icon: 'nutrition', text: 'text-blue-400' },
  { path: '/steps', label: 'ADIMLAR', icon: 'directions_run', text: 'text-orange-400' },
  { path: '/timer', label: 'ZAMANLAYICI', icon: 'timer', text: 'text-teal-400' },
  { path: '/badges', label: 'ROZETLER', icon: 'military_tech', text: 'text-sky-300' },
  { path: '/settings', label: 'AYARLAR', icon: 'settings', text: 'text-on-surface-variant' },
  { path: '/profile', label: 'PROFİLİM', icon: 'person', text: 'text-on-surface-variant' },
];

const MOBILE_NAV_ITEMS = [
  { path: '/', label: 'PANEL', icon: 'dashboard' },
  { path: '/dashboard', label: 'ANALİZ', icon: 'videocam' },
  { path: '/diet', label: 'DİYET', icon: 'restaurant' },
  { path: '/history', label: 'GEÇMİŞ', icon: 'history' },
  { path: '/profile', label: 'PROFİL', icon: 'person' },
];

function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  const ad = (() => {
    try {
      const cached = localStorage.getItem('kullaniciAdi');
      return cached || 'Sporcu';
    } catch {
      return 'Sporcu';
    }
  })();

  const navButtonClass = (active) => {
    const base = 'flex items-center w-full text-left px-6 py-3 border-l-[3px] transition-all duration-200 cursor-pointer';
    const activeClass = 'border-brand-red bg-surface-container-high text-on-surface font-bold';
    const inactiveClass = 'border-transparent text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest';
    return `${base} ${active ? activeClass : inactiveClass}`;
  };

  return (
    <>
      <aside className="hidden md:flex flex-col h-screen fixed left-0 top-0 py-section-padding bg-surface-container border-r border-outline-variant w-64 z-50">
        <div className="px-6 mb-10 flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
          <img src={logoImg} alt="VisionFit Logo" className="w-9 h-9 object-contain" />
          <div>
            <h1 className="text-headline-md font-display-lg font-black text-primary tracking-tighter uppercase leading-none">VisionFit</h1>
            <p className="text-[9px] font-label-mono text-on-surface-variant tracking-widest mt-1 opacity-60">EN İYİ HALİNE ULAŞ.</p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto scrollbar-hide">
          <div className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const active = location.pathname === item.path;
              return (
                <button key={item.path} type="button" className={navButtonClass(active)} onClick={() => navigate(item.path)}>
                  <span className={`material-symbols-outlined mr-3 ${item.text}`}>{item.icon}</span>
                  <span className="font-label-mono text-label-mono uppercase">{item.label}</span>
                </button>
              );
            })}
          </div>
        </nav>

        <div className="px-6 mt-auto pt-10">
          <div className="flex items-center gap-3 p-3 bg-surface-container-low rounded-lg mb-4">
            <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container font-bold">
              {ad.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-body-sm font-bold">{ad}</p>
              <p className="text-[10px] text-on-surface-variant opacity-70">VisionFit Üyesi</p>
            </div>
          </div>
          <button
            type="button"
            className="w-full py-2 border border-outline-variant text-label-mono uppercase tracking-widest text-[10px] hover:bg-error-container hover:text-white transition-colors duration-200"
            onClick={handleLogout}
          >
            ÇIKIŞ YAP
          </button>
        </div>
      </aside>

      <nav className="fixed bottom-0 left-0 w-full md:hidden bg-surface-container border-t border-outline-variant grid grid-cols-5 h-16 z-50">
        {MOBILE_NAV_ITEMS.map((item) => {
          const active = location.pathname === item.path;
          return (
            <button
              key={item.path}
              type="button"
              className={`flex flex-col items-center justify-center cursor-pointer ${active ? 'text-primary' : 'text-on-surface-variant'}`}
              onClick={() => navigate(item.path)}
            >
              <span className="material-symbols-outlined" style={active ? { fontVariationSettings: "'FILL' 1" } : undefined}>{item.icon}</span>
              <span className="text-[8px] font-label-mono mt-1">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
}

export default Sidebar;