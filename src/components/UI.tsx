import React from 'react';

// ── ICON COMPONENT ────────────────────────────────────────
interface IconProps { size?: number; color?: string; }
const mkIcon = (paths: React.ReactNode) => ({ size = 18, color }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color || 'currentColor'} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    {paths}
  </svg>
);

export const Icons = {
  grid:      mkIcon(<><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>),
  users:     mkIcon(<><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>),
  nutrition: mkIcon(<><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></>),
  dumbbell:  mkIcon(<><path d="M6 4v16M18 4v16M3 8h4M17 8h4M3 16h4M17 16h4M7 12h10"/></>),
  chart:     mkIcon(<><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></>),
  card:      mkIcon(<><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></>),
  bell:      mkIcon(<><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></>),
  bolt:      mkIcon(<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>),
  file:      mkIcon(<><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></>),
  settings:  mkIcon(<><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></>),
  logout:    mkIcon(<><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></>),
  plus:      mkIcon(<><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>),
  search:    mkIcon(<><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>),
  x:         mkIcon(<><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>),
  check:     mkIcon(<polyline points="20 6 9 17 4 12"/>),
  up:        mkIcon(<><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></>),
  send:      mkIcon(<><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></>),
  trash:     mkIcon(<><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6M9 6V4h6v2"/></>),
  edit:      mkIcon(<><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></>),
  photo:     mkIcon(<><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></>),
  video:     mkIcon(<><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></>),
  download:  mkIcon(<><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></>),
  calendar:  mkIcon(<><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>),
  trophy:    mkIcon(<><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/></>),
  chevronL:  mkIcon(<polyline points="15 18 9 12 15 6"/>),
  chevronR:  mkIcon(<polyline points="9 18 15 12 9 6"/>),
  menu:      mkIcon(<><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></>),
  info:      mkIcon(<><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></>),
  google:    mkIcon(<><path d="M20.283 10.356h-8.327v3.451h4.792c-.446 2.193-2.313 3.453-4.792 3.453a5.27 5.27 0 0 1-5.279-5.28 5.27 5.27 0 0 1 5.279-5.279c1.259 0 2.397.447 3.29 1.178l2.6-2.599c-1.584-1.381-3.615-2.233-5.89-2.233a8.908 8.908 0 0 0-8.934 8.934 8.907 8.907 0 0 0 8.934 8.934c4.467 0 8.529-3.249 8.529-8.934 0-.528-.081-1.097-.202-1.625z"/></>),
  drop:      mkIcon(<path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>),
  activity:  mkIcon(<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>),
  user:      mkIcon(<><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></>),
  upload:    mkIcon(<><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></>),
  flame:     mkIcon(<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>),
  wa:        mkIcon(<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>),
};

// ── SECTION TITLE ────────────────────────────────────────
export const SectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ fontSize: 9, color: 'rgba(74,61,53,.9)', fontWeight: 600, letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 9 }}>
    {children}
  </div>
);

// ── STAT CARD ────────────────────────────────────────────
export const StatCard: React.FC<{
  label: string; value: string | number; unit?: string;
  change?: string; changeUp?: boolean; icon?: string;
}> = ({ label, value, unit, change, changeUp }) => (
  <div className="card-sm stat-card" style={{ position: 'relative', overflow: 'hidden' }}>
    <div style={{ fontSize: 9, color: 'rgba(180,165,150,.45)', marginBottom: 3, letterSpacing: .3 }}>{label}</div>
    <div style={{ fontSize: 17, fontWeight: 700, color: '#b4a596', lineHeight: 1.1 }}>
      {value}{unit && <span style={{ fontSize: 9, color: 'rgba(180,165,150,.5)', fontWeight: 400 }}> {unit}</span>}
    </div>
    {change && (
      <div style={{ fontSize: 9, marginTop: 3, color: changeUp ? '#4a9e6e' : '#c45050' }}>{change}</div>
    )}
  </div>
);

// ── MACRO BAR ────────────────────────────────────────────
export const MacroBar: React.FC<{ label: string; value: number; max: number; color: string }> = ({ label, value, max, color }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6 }}>
    <div style={{ fontSize: 10, color: 'rgba(180,165,150,.6)', width: 54 }}>{label}</div>
    <div className="macro-bar-bg">
      <div className="macro-bar-fill" style={{ width: `${Math.min(100, (value / max) * 100)}%`, background: color }} />
    </div>
    <div style={{ fontSize: 10, color: '#b4a596', fontWeight: 600, width: 34, textAlign: 'left' }}>{value}g</div>
  </div>
);

// ── AI BOX ───────────────────────────────────────────────
export const AIBox: React.FC<{ label?: string; children: React.ReactNode }> = ({ label = '◈ ניתוח AI — ACSM / WHO', children }) => (
  <div className="ai-box">
    <div style={{ fontSize: 9, color: '#832727', fontWeight: 700, letterSpacing: .8, textTransform: 'uppercase', marginBottom: 5 }}>{label}</div>
    <div style={{ fontSize: 12, color: 'rgba(180,165,150,.8)', lineHeight: 1.65, position: 'relative' }}>{children}</div>
  </div>
);

// ── MODAL ────────────────────────────────────────────────
export const Modal: React.FC<{
  isOpen: boolean; onClose: () => void;
  title: string; children: React.ReactNode;
}> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-box fade-up">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <h3 style={{ fontSize: 18, fontWeight: 800, color: '#b4a596' }}>{title}</h3>
          <button onClick={onClose} className="btn-icon"><Icons.x size={16} /></button>
        </div>
        {children}
      </div>
    </div>
  );
};

// ── SPINNER ───────────────────────────────────────────────
export const Spinner: React.FC<{ size?: number }> = ({ size = 20 }) => (
  <div style={{ width: size, height: size, border: `2px solid rgba(131,39,39,.3)`, borderTopColor: '#832727', borderRadius: '50%', animation: 'spin .8s linear infinite' }} />
);

// ── EMPTY STATE ───────────────────────────────────────────
export const Empty: React.FC<{ icon?: React.ReactNode; text: string; action?: React.ReactNode }> = ({ icon, text, action }) => (
  <div style={{ textAlign: 'center', padding: '40px 20px', color: 'rgba(180,165,150,.35)' }}>
    {icon && <div style={{ marginBottom: 12, opacity: .4 }}>{icon}</div>}
    <div style={{ fontSize: 13, marginBottom: action ? 16 : 0 }}>{text}</div>
    {action}
  </div>
);

// ── BADGE ────────────────────────────────────────────────
export const Badge: React.FC<{ status: 'paid' | 'pending' | 'overdue' | string }> = ({ status }) => {
  const map: Record<string, { label: string; cls: string }> = {
    paid:    { label: 'שולם',   cls: 'badge-paid'    },
    pending: { label: 'ממתין',  cls: 'badge-pending' },
    overdue: { label: 'באיחור', cls: 'badge-overdue' },
  };
  const { label, cls } = map[status] || { label: status, cls: 'badge-pending' };
  return (
    <span className={cls} style={{ fontSize: 9, padding: '3px 9px', borderRadius: 20, fontWeight: 600, letterSpacing: .3, display: 'inline-block' }}>
      {label}
    </span>
  );
};

// ── FORM LABEL ────────────────────────────────────────────
export const Label: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ fontSize: 10, color: 'rgba(180,165,150,.5)', letterSpacing: .5, textTransform: 'uppercase', marginBottom: 6, fontWeight: 600 }}>
    {children}
  </div>
);
