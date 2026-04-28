import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db, COACH_EMAILS } from './firebase';
import { AppUser, Screen, Client } from './types';
import { Icons, Spinner } from './components/UI';

// Screens
import LoginScreen from './screens/LoginScreen';
import DashboardScreen from './screens/DashboardScreen';
import ClientsScreen from './screens/ClientsScreen';
import MeasurementsScreen from './screens/MeasurementsScreen';
import ExercisesScreen from './screens/ExercisesScreen';
import { PaymentsScreen, AlertsScreen, ReportsScreen } from './screens/FinanceScreens';

// ── NAVIGATION CONFIG ────────────────────────────────────
const coachNav = [
  { key: 'dashboard',   label: 'לוח בקרה',  icon: 'grid'     },
  { key: 'clients',     label: 'מתאמנים',   icon: 'users'    },
  { key: 'payments',    label: 'תשלומים',   icon: 'card'     },
  { key: 'alerts',      label: 'תזכורות',   icon: 'bell'     },
  { key: 'exercises',   label: 'תרגילים',   icon: 'dumbbell' },
  { key: 'reports',     label: 'דוחות',     icon: 'file'     },
];

const clientNav = [
  { key: 'dashboard',     label: 'לוח שלי',  icon: 'grid'     },
  { key: 'measurements',  label: 'מדדים',    icon: 'activity' },
  { key: 'nutrition',     label: 'תזונה',    icon: 'nutrition'},
  { key: 'workout',       label: 'אימון',    icon: 'dumbbell' },
];

// ── SIMPLE ICON RENDERER ──────────────────────────────────
const NavIcon: React.FC<{ name: string; size: number }> = ({ name, size }) => {
  const Icon = (Icons as any)[name];
  return Icon ? <Icon size={size} /> : null;
};

// ── PLACEHOLDER SCREENS ───────────────────────────────────
const NutritionScreen: React.FC<{ user: AppUser }> = ({ user }) => (
  <div className="fade-up" style={{ padding: 14 }}>
    <div style={{ fontSize: 11, color: 'rgba(180,165,150,.4)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 2 }}>תזונה</div>
    <h2 style={{ fontSize: 22, fontWeight: 800, color: '#b4a596', marginBottom: 16 }}>תפריט</h2>
    <div className="card">
      <div style={{ fontSize: 13, color: 'rgba(180,165,150,.6)', lineHeight: 1.7 }}>
        התפריט שלך ייטען כאן. המאמן שלך יבנה תפריט מותאם אישית.
      </div>
    </div>
  </div>
);

const WorkoutScreen: React.FC<{ user: AppUser }> = ({ user }) => (
  <div className="fade-up" style={{ padding: 14 }}>
    <div style={{ fontSize: 11, color: 'rgba(180,165,150,.4)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 2 }}>אימון</div>
    <h2 style={{ fontSize: 22, fontWeight: 800, color: '#b4a596', marginBottom: 16 }}>תכנית אימון</h2>
    <div className="card">
      <div style={{ fontSize: 13, color: 'rgba(180,165,150,.6)', lineHeight: 1.7 }}>
        תכנית האימון שלך תופיע כאן לאחר שהמאמן יבנה אותה.
      </div>
    </div>
  </div>
);

// ── SIDEBAR ───────────────────────────────────────────────
const Sidebar: React.FC<{
  user: AppUser; current: Screen; onNav: (s: Screen) => void; onLogout: () => void; isOpen: boolean; onClose: () => void;
}> = ({ user, current, onNav, onLogout, isOpen, onClose }) => {
  const nav = user.role === 'coach' ? coachNav : clientNav;

  return (
    <>
      {isOpen && (
        <div onClick={onClose}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', backdropFilter: 'blur(4px)', zIndex: 90 }} />
      )}
      <aside style={{
        position: 'fixed', top: 0, right: 0, height: '100%', width: 260,
        background: '#0e0b09', borderLeft: '1px solid rgba(180,165,150,.09)',
        zIndex: 100, display: 'flex', flexDirection: 'column', padding: 24,
        transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform .25s ease',
      }}>
        {/* Logo */}
        <div style={{ marginBottom: 32, paddingBottom: 20, borderBottom: '1px solid rgba(180,165,150,.07)' }}>
          <div style={{ fontSize: 20, fontWeight: 900, color: '#b4a596', letterSpacing: -0.5 }}>
            NutriFit<span style={{ color: '#832727' }}>Pro</span>
          </div>
          <div style={{ fontSize: 9, color: 'rgba(180,165,150,.35)', marginTop: 4, letterSpacing: 2, textTransform: 'uppercase' }}>by Y-Sport</div>
        </div>

        {/* User */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
          {user.avatar ? (
            <img src={user.avatar} alt="" style={{ width: 36, height: 36, borderRadius: 10, objectFit: 'cover' }} />
          ) : (
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(131,39,39,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#832727' }}>
              {user.name?.charAt(0)}
            </div>
          )}
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#b4a596' }}>{user.name}</div>
            <div style={{ fontSize: 9, color: 'rgba(180,165,150,.4)', textTransform: 'uppercase', letterSpacing: 1 }}>
              {user.role === 'coach' ? '🏋️ מאמן' : '👤 מתאמן'}
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
          {nav.map(item => {
            const isActive = current === item.key;
            return (
              <button key={item.key} onClick={() => { onNav(item.key as Screen); onClose(); }}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 12, border: 'none', background: isActive ? 'rgba(131,39,39,.15)' : 'transparent', color: isActive ? '#832727' : 'rgba(180,165,150,.5)', cursor: 'pointer', textAlign: 'right', fontFamily: 'Outfit', fontSize: 13, fontWeight: isActive ? 700 : 400, transition: 'all .15s', borderRight: isActive ? '2px solid #832727' : '2px solid transparent' }}>
                <NavIcon name={item.icon} size={17} />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Logout */}
        <button onClick={onLogout}
          style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 12, border: 'none', background: 'transparent', color: 'rgba(180,165,150,.35)', cursor: 'pointer', fontFamily: 'Outfit', fontSize: 12, marginTop: 16 }}>
          <Icons.logout size={16} />
          התנתק
        </button>
      </aside>
    </>
  );
};

// ── BOTTOM NAV (mobile) ────────────────────────────────────
const BottomNav: React.FC<{ user: AppUser; current: Screen; onNav: (s: Screen) => void }> = ({ user, current, onNav }) => {
  const nav = user.role === 'coach' ? coachNav.slice(0, 5) : clientNav;
  return (
    <div className="tab-nav" style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50, maxWidth: 430, margin: '0 auto', paddingBottom: 'env(safe-area-inset-bottom, 0px)', boxShadow: '0 -1px 0 rgba(180,165,150,.07)' }}>
      {nav.map(item => (
        <button key={item.key} onClick={() => onNav(item.key as Screen)}
          className={`tab-btn ${current === item.key ? 'active' : ''}`}>
          <NavIcon name={item.icon} size={18} />
          {item.label}
        </button>
      ))}
    </div>
  );
};

// ── HEADER ────────────────────────────────────────────────
const Header: React.FC<{ user: AppUser; onMenuOpen: () => void }> = ({ user, onMenuOpen }) => (
  <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: '#141009', borderBottom: '1px solid rgba(180,165,150,.09)', flexShrink: 0, position: 'sticky', top: 0, zIndex: 40 }}>
    <div style={{ fontSize: 18, fontWeight: 900, color: '#b4a596', letterSpacing: -0.5 }}>
      NutriFit<span style={{ color: '#832727' }}>Pro</span>
    </div>
    <button onClick={onMenuOpen} className="btn-icon">
      <Icons.menu size={18} />
    </button>
  </header>
);

// ── APP ───────────────────────────────────────────────────
const App: React.FC = () => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [screen, setScreen] = useState<Screen>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, fbUser => {
      if (fbUser) {
        const userRef = doc(db, 'users', fbUser.uid);
        const unsubUser = onSnapshot(userRef, snap => {
          if (snap.exists()) {
            const data = snap.data();
            setUser({
              uid: fbUser.uid,
              name: fbUser.displayName || data.name || 'משתמש',
              email: fbUser.email || '',
              role: COACH_EMAILS.includes(fbUser.email || '') ? 'coach' : (data.role || 'client'),
              avatar: fbUser.photoURL || data.avatar,
              ...data,
            } as AppUser);
          } else {
            const isCoach = COACH_EMAILS.includes(fbUser.email || '');
            const newUser: AppUser = {
              uid: fbUser.uid,
              name: fbUser.displayName || 'משתמש',
              email: fbUser.email || '',
              role: isCoach ? 'coach' : 'client',
              avatar: fbUser.photoURL || undefined,
              createdAt: new Date().toISOString(),
            };
            setUser(newUser);
          }
          setAuthReady(true);
        });
        return () => unsubUser();
      } else {
        setUser(null);
        setAuthReady(true);
      }
    });
    return unsub;
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    setUser(null);
    setScreen('dashboard');
  };

  const handleNav = (s: Screen, data?: any) => {
    if (s === 'client-profile' && data) setSelectedClient(data);
    setScreen(s);
  };

  // Loading
  if (!authReady) {
    return (
      <div style={{ minHeight: '100vh', background: '#0e0b09', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
        <div style={{ fontSize: 24, fontWeight: 900, color: '#b4a596' }}>NutriFit<span style={{ color: '#832727' }}>Pro</span></div>
        <Spinner size={24} />
      </div>
    );
  }

  // Not logged in
  if (!user) return <LoginScreen onLogin={u => { setUser(u); setScreen('dashboard'); }} />;

  // Render screen
  const renderScreen = () => {
    switch (screen) {
      case 'dashboard':    return <DashboardScreen user={user} onNavigate={handleNav} />;
      case 'clients':      return <ClientsScreen onClientSelect={c => handleNav('measurements', c)} />;
      case 'measurements': return <MeasurementsScreen user={user} clientId={selectedClient?.uid} />;
      case 'exercises':    return <ExercisesScreen />;
      case 'payments':     return <PaymentsScreen />;
      case 'alerts':       return <AlertsScreen />;
      case 'reports':      return <ReportsScreen />;
      case 'nutrition':    return <NutritionScreen user={user} />;
      case 'workout':      return <WorkoutScreen user={user} />;
      default:             return <DashboardScreen user={user} onNavigate={handleNav} />;
    }
  };

  return (
    <div style={{ maxWidth: 430, margin: '0 auto', height: '100vh', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
      {/* Texture */}
      <div style={{ position: 'fixed', inset: 0, backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(180,165,150,.018) 1px, transparent 0)', backgroundSize: '22px 22px', pointerEvents: 'none', zIndex: 0 }} />

      <Header user={user} onMenuOpen={() => setSidebarOpen(true)} />

      <Sidebar user={user} current={screen} onNav={s => setScreen(s)} onLogout={handleLogout} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Content */}
      <main style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', paddingBottom: 70, position: 'relative', zIndex: 1 }}>
        {renderScreen()}
      </main>

      <BottomNav user={user} current={screen} onNav={s => setScreen(s)} />
    </div>
  );
};

export default App;
