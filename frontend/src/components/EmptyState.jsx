function CameraIllustration() {
  return (
    <svg viewBox="0 0 120 120" width="100" height="100">
      <rect x="20" y="38" width="80" height="56" rx="10" fill="none" stroke="var(--border)" strokeWidth="3" />
      <rect x="42" y="26" width="36" height="16" rx="4" fill="none" stroke="var(--border)" strokeWidth="3" />
      <circle cx="60" cy="66" r="18" fill="none" stroke="var(--border)" strokeWidth="3" />
      <circle cx="60" cy="66" r="8" fill="var(--border)" />
      <line x1="30" y1="100" x2="90" y2="100" stroke="var(--accent)" strokeWidth="4" strokeLinecap="round" />
      <line x1="38" y1="108" x2="82" y2="108" stroke="var(--accent)" strokeWidth="4" strokeLinecap="round" opacity="0.4" />
    </svg>
  );
}

function PlateIllustration() {
  return (
    <svg viewBox="0 0 120 120" width="100" height="100">
      <circle cx="60" cy="60" r="38" fill="none" stroke="var(--border)" strokeWidth="3" />
      <circle cx="60" cy="60" r="24" fill="none" stroke="var(--border)" strokeWidth="3" />
      <line x1="28" y1="20" x2="28" y2="50" stroke="var(--accent)" strokeWidth="4" strokeLinecap="round" />
      <line x1="22" y1="20" x2="22" y2="38" stroke="var(--accent)" strokeWidth="4" strokeLinecap="round" />
      <line x1="34" y1="20" x2="34" y2="38" stroke="var(--accent)" strokeWidth="4" strokeLinecap="round" />
      <path d="M92 20 C92 30 84 34 84 44 L84 100" fill="none" stroke="var(--accent)" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

function FootprintIllustration() {
  return (
    <svg viewBox="0 0 120 120" width="100" height="100">
      <ellipse cx="48" cy="46" rx="14" ry="20" fill="none" stroke="var(--border)" strokeWidth="3" transform="rotate(-12 48 46)" />
      <circle cx="40" cy="22" r="4" fill="var(--border)" />
      <circle cx="50" cy="18" r="4.5" fill="var(--border)" />
      <circle cx="60" cy="18" r="4" fill="var(--border)" />
      <circle cx="68" cy="22" r="3.5" fill="var(--border)" />
      <ellipse cx="76" cy="86" rx="14" ry="20" fill="none" stroke="var(--accent)" strokeWidth="3" transform="rotate(12 76 86)" />
      <circle cx="66" cy="62" r="3.5" fill="var(--accent)" />
      <circle cx="74" cy="58" r="4" fill="var(--accent)" />
      <circle cx="84" cy="58" r="4.5" fill="var(--accent)" />
      <circle cx="92" cy="62" r="4" fill="var(--accent)" />
    </svg>
  );
}

function NotebookIllustration() {
  return (
    <svg viewBox="0 0 120 120" width="100" height="100">
      <rect x="26" y="18" width="68" height="84" rx="6" fill="none" stroke="var(--border)" strokeWidth="3" />
      <line x1="38" y1="38" x2="82" y2="38" stroke="var(--border)" strokeWidth="3" strokeLinecap="round" />
      <line x1="38" y1="54" x2="82" y2="54" stroke="var(--border)" strokeWidth="3" strokeLinecap="round" />
      <line x1="38" y1="70" x2="68" y2="70" stroke="var(--border)" strokeWidth="3" strokeLinecap="round" />
      <circle cx="84" cy="84" r="18" fill="var(--bg)" stroke="var(--accent)" strokeWidth="3" />
      <line x1="84" y1="76" x2="84" y2="92" stroke="var(--accent)" strokeWidth="3" strokeLinecap="round" />
      <line x1="76" y1="84" x2="92" y2="84" stroke="var(--accent)" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

const ILLUSTRATIONS = {
  camera: CameraIllustration,
  plate: PlateIllustration,
  footprint: FootprintIllustration,
  notebook: NotebookIllustration,
};

function EmptyState({ type, title, description }) {
  const Illustration = ILLUSTRATIONS[type] || CameraIllustration;

  return (
    <div className="empty-state">
      <Illustration />
      <div className="empty-state-title">{title}</div>
      {description && <div className="empty-state-desc">{description}</div>}
    </div>
  );
}

export default EmptyState;