import React, { useState } from 'react';
import { signInWithPopup } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, googleProvider, db, COACH_EMAILS } from '../firebase';
import { AppUser } from '../types';
import { Spinner } from '../components/UI';

interface Props { onLogin: (user: AppUser) => void; }

const LoginScreen: React.FC<Props> = ({ onLogin }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGoogle = async () => {
    setLoading(true); setError('');
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const { user } = result;
      const isCoach = COACH_EMAILS.includes(user.email || '');
      const userRef = doc(db, 'users', user.uid);
      const snap = await getDoc(userRef);

      let userData: AppUser;
      if (snap.exists()) {
        const data = snap.data();
        userData = {
          uid: user.uid,
          name: user.displayName || data.name || 'משתמש',
          email: user.email || '',
          role: isCoach ? 'coach' : (data.role || 'client'),
          avatar: user.photoURL || data.avatar,
          ...data,
        } as AppUser;
        await setDoc(userRef, { lastLogin: new Date().toISOString(), photoURL: user.photoURL }, { merge: true });
      } else {
        userData = {
          uid: user.uid,
          name: user.displayName || 'משתמש',
          email: user.email || '',
          role: isCoach ? 'coach' : 'client',
          avatar: user.photoURL || undefined,
          createdAt: new Date().toISOString(),
        };
        await setDoc(userRef, userData);
      }
      onLogin(userData);
    } catch (e: any) {
      setError(e.message || 'שגיאה בהתחברות');
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0e0b09', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, position: 'relative' }}>
      {/* Background texture */}
      <div style={{ position: 'fixed', inset: 0, backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(180,165,150,.02) 1px, transparent 0)', backgroundSize: '22px 22px', pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', top: '20%', left: '50%', transform: 'translateX(-50%)', width: 400, height: 400, background: 'radial-gradient(circle, rgba(131,39,39,.08) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <div className="fade-up" style={{ width: '100%', maxWidth: 360, textAlign: 'center', position: 'relative' }}>
        {/* Logo */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 72, height: 72, background: 'rgba(131,39,39,.15)', border: '1px solid rgba(131,39,39,.3)', borderRadius: 20, marginBottom: 20 }}>
            <svg width={34} height={34} viewBox="0 0 24 24" fill="none" stroke="#832727" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
          </div>
          <h1 style={{ fontSize: 32, fontWeight: 900, color: '#b4a596', letterSpacing: -1, lineHeight: 1 }}>
            NutriFit<span style={{ color: '#832727' }}>Pro</span>
          </h1>
          <p style={{ fontSize: 11, color: 'rgba(180,165,150,.4)', marginTop: 8, letterSpacing: 2, textTransform: 'uppercase' }}>
            by Y-Sport • Yogev Markanti
          </p>
        </div>

        {/* Card */}
        <div className="card" style={{ padding: 28, textAlign: 'right' }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: '#b4a596', marginBottom: 6 }}>ברוך הבא 👋</h2>
          <p style={{ fontSize: 13, color: 'rgba(180,165,150,.5)', marginBottom: 24, lineHeight: 1.6 }}>
            התחבר עם חשבון Google שלך. המאמן ומתאמנים נכנסים אוטומטית לממשק המתאים להם.
          </p>

          <button onClick={handleGoogle} disabled={loading}
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, background: 'rgba(180,165,150,.06)', border: '1px solid rgba(180,165,150,.18)', borderRadius: 14, padding: '13px 20px', cursor: loading ? 'not-allowed' : 'pointer', transition: 'all .2s', color: '#b4a596', fontSize: 14, fontWeight: 600 }}
            onMouseEnter={e => !loading && ((e.currentTarget.style.background = 'rgba(131,39,39,.12)', e.currentTarget.style.borderColor = 'rgba(131,39,39,.3)'))}
            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(180,165,150,.06)', e.currentTarget.style.borderColor = 'rgba(180,165,150,.18)')}>
            {loading ? <Spinner size={20} /> : (
              <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.283 10.356h-8.327v3.451h4.792c-.446 2.193-2.313 3.453-4.792 3.453a5.27 5.27 0 0 1-5.279-5.28 5.27 5.27 0 0 1 5.279-5.279c1.259 0 2.397.447 3.29 1.178l2.6-2.599c-1.584-1.381-3.615-2.233-5.89-2.233a8.908 8.908 0 0 0-8.934 8.934 8.907 8.907 0 0 0 8.934 8.934c4.467 0 8.529-3.249 8.529-8.934 0-.528-.081-1.097-.202-1.625z"/>
              </svg>
            )}
            {loading ? 'מתחבר...' : 'המשך עם Google'}
          </button>

          {error && (
            <div style={{ marginTop: 14, padding: '10px 14px', background: 'rgba(131,39,39,.15)', border: '1px solid rgba(131,39,39,.25)', borderRadius: 10, fontSize: 12, color: '#832727' }}>
              {error}
            </div>
          )}
        </div>

        <p style={{ fontSize: 10, color: 'rgba(180,165,150,.25)', marginTop: 20, lineHeight: 1.6 }}>
          מתאמנים — בקש ממאמנך לחבר אותך לאפליקציה
        </p>
      </div>
    </div>
  );
};

export default LoginScreen;
