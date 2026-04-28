import React, { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { AppUser, Client, Payment, Alert, Measurement } from '../types';
import { StatCard, MacroBar, AIBox, Icons, Empty, Badge } from '../components/UI';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

interface Props {
  user: AppUser;
  onNavigate: (screen: string, data?: any) => void;
}

const DashboardScreen: React.FC<Props> = ({ user, onNavigate }) => {
  const isCoach = user.role === 'coach';

  return isCoach
    ? <CoachDashboard user={user} onNavigate={onNavigate} />
    : <ClientDashboard user={user} onNavigate={onNavigate} />;
};

// ── COACH DASHBOARD ───────────────────────────────────────
const CoachDashboard: React.FC<Props> = ({ user, onNavigate }) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const qC = query(collection(db, 'users'), where('role', '==', 'client'));
    const unC = onSnapshot(qC, s => { setClients(s.docs.map(d => ({ id: d.id, ...d.data() } as Client))); setLoading(false); });
    const qP = query(collection(db, 'payments'), orderBy('createdAt', 'desc'), limit(20));
    const unP = onSnapshot(qP, s => setPayments(s.docs.map(d => ({ id: d.id, ...d.data() } as Payment))));
    const qA = query(collection(db, 'alerts'), where('done', '==', false), orderBy('date', 'asc'), limit(5));
    const unA = onSnapshot(qA, s => setAlerts(s.docs.map(d => ({ id: d.id, ...d.data() } as Alert))));
    return () => { unC(); unP(); unA(); };
  }, []);

  const totalIncome = payments.filter(p => p.status === 'paid').reduce((s, p) => s + p.amount, 0);
  const pending = payments.filter(p => p.status === 'pending').length;
  const overdue = payments.filter(p => p.status === 'overdue').length;

  // Income chart mock (last 6 months)
  const incomeData = ['נוב', 'דצ', 'ינו', 'פבר', 'מרץ', 'אפר'].map((m, i) => ({
    month: m, income: 5000 + i * 700 + Math.random() * 800
  }));

  return (
    <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: 14 }}>
      {/* Welcome */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 11, color: 'rgba(180,165,150,.4)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 2 }}>לוח בקרה</div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#b4a596', lineHeight: 1.1 }}>שלום, {user.name?.split(' ')[0]} 👋</h1>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {alerts.length > 0 && (
            <button onClick={() => onNavigate('alerts')} style={{ position: 'relative', background: 'rgba(131,39,39,.12)', border: '1px solid rgba(131,39,39,.25)', borderRadius: 10, padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, color: '#832727', fontSize: 11, fontWeight: 600 }}>
              <Icons.bell size={14} color="#832727" />
              {alerts.length}
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 7 }}>
        <StatCard label="💰 הכנסה" value={`₪${(totalIncome / 1000).toFixed(0)}K`} change="החודש" changeUp />
        <StatCard label="👥 לקוחות" value={clients.length} change="פעילים" changeUp />
        <StatCard label="⏳ ממתין" value={pending} change="תשלומים" />
        <StatCard label="❗ באיחור" value={overdue} change="לטיפול" />
      </div>

      {/* Income Chart */}
      <div className="card">
        <div style={{ fontSize: 11, color: 'rgba(180,165,150,.5)', marginBottom: 12, fontWeight: 600, letterSpacing: .5, textTransform: 'uppercase' }}>הכנסות חודשיות</div>
        <ResponsiveContainer width="100%" height={120}>
          <AreaChart data={incomeData}>
            <defs>
              <linearGradient id="incGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#832727" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#832727" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <XAxis dataKey="month" tick={{ fontSize: 10, fill: 'rgba(180,165,150,.4)' }} axisLine={false} tickLine={false} />
            <YAxis hide />
            <Tooltip contentStyle={{ background: '#261e1a', border: '1px solid rgba(180,165,150,.18)', borderRadius: 10, fontSize: 12, color: '#b4a596' }} formatter={(v: any) => [`₪${Math.round(v).toLocaleString()}`, 'הכנסה']} />
            <Area type="monotone" dataKey="income" stroke="#832727" strokeWidth={2} fill="url(#incGrad)" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div style={{ fontSize: 11, color: 'rgba(180,165,150,.5)', fontWeight: 600, letterSpacing: .5, textTransform: 'uppercase' }}>תזכורות דחופות</div>
            <button onClick={() => onNavigate('alerts')} style={{ fontSize: 10, color: '#832727', background: 'none', border: 'none', cursor: 'pointer' }}>הכל ←</button>
          </div>
          {alerts.slice(0, 3).map(a => (
            <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid rgba(180,165,150,.07)' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#832727', flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#b4a596' }}>{a.message}</div>
                <div style={{ fontSize: 10, color: 'rgba(180,165,150,.4)', marginTop: 1 }}>{a.clientName} • {a.date}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Recent clients */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ fontSize: 11, color: 'rgba(180,165,150,.5)', fontWeight: 600, letterSpacing: .5, textTransform: 'uppercase' }}>לקוחות אחרונים</div>
          <button onClick={() => onNavigate('clients')} style={{ fontSize: 10, color: '#832727', background: 'none', border: 'none', cursor: 'pointer' }}>הכל ←</button>
        </div>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 52 }} />)}
          </div>
        ) : clients.length === 0 ? (
          <Empty icon={<Icons.users size={32} />} text="אין לקוחות עדיין"
            action={<button onClick={() => onNavigate('clients')} className="btn-primary" style={{ width: 'auto', padding: '8px 16px', fontSize: 12, margin: '0 auto' }}>+ הוסף לקוח</button>} />
        ) : (
          clients.slice(0, 5).map(c => (
            <div key={c.uid || c.id} onClick={() => onNavigate('client-profile', c)}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid rgba(180,165,150,.07)', cursor: 'pointer' }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(131,39,39,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#832727', flexShrink: 0 }}>
                {(c.name || '?').charAt(0)}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#b4a596' }}>{c.name}</div>
                <div style={{ fontSize: 10, color: 'rgba(180,165,150,.4)' }}>{c.goal || 'ללא מטרה מוגדרת'}</div>
              </div>
              <Badge status={c.paymentStatus || 'pending'} />
            </div>
          ))
        )}
      </div>

      {/* Quick AI */}
      <AIBox>
        מבוסס על {clients.length} לקוחות פעילים — הכנסה ממוצעת ללקוח: ₪{clients.length ? Math.round(totalIncome / clients.length).toLocaleString() : 0}/חודש. 
        {overdue > 0 ? ` ${overdue} לקוחות באיחור — שלח תזכורת WhatsApp.` : ' כל התשלומים מסודרים. 💪'}
      </AIBox>
    </div>
  );
};

// ── CLIENT DASHBOARD ──────────────────────────────────────
const ClientDashboard: React.FC<Props> = ({ user, onNavigate }) => {
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [waterGlasses, setWaterGlasses] = useState(7);

  useEffect(() => {
    const q = query(collection(db, 'users', user.uid, 'measurements'), orderBy('date', 'desc'), limit(10));
    return onSnapshot(q, s => setMeasurements(s.docs.map(d => ({ id: d.id, ...d.data() } as Measurement))));
  }, [user.uid]);

  const latest = measurements[0];
  const weightData = measurements.slice(0, 8).reverse().map(m => ({ date: m.date.slice(5), weight: m.weight }));

  return (
    <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: 14 }}>
      <div>
        <div style={{ fontSize: 11, color: 'rgba(180,165,150,.4)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 2 }}>שלום,</div>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#b4a596' }}>{user.name?.split(' ')[0]} 👋</h1>
      </div>

      {/* Calorie ring */}
      <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <svg width={90} height={90} viewBox="0 0 90 90" style={{ flexShrink: 0 }}>
          <circle cx={45} cy={45} r={38} fill="none" stroke="rgba(180,165,150,.06)" strokeWidth={8} />
          <circle cx={45} cy={45} r={38} fill="none" stroke="#832727" strokeWidth={8}
            strokeDasharray="238.76" strokeDashoffset="71.6" strokeLinecap="round" transform="rotate(-90 45 45)" />
          <text x={45} y={40} textAnchor="middle" fill="#b4a596" fontSize={16} fontWeight={800} fontFamily="Outfit">1,750</text>
          <text x={45} y={54} textAnchor="middle" fill="rgba(180,165,150,.4)" fontSize={9} fontFamily="Outfit">מתוך 2,000</text>
        </svg>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 10, color: 'rgba(180,165,150,.4)', marginBottom: 8, letterSpacing: .5, textTransform: 'uppercase' }}>מאקרו יומי</div>
          <MacroBar label="חלבון"   value={53}  max={67}  color="#4a9e6e" />
          <MacroBar label="פחמימות" value={190} max={200} color="#c4813a" />
          <MacroBar label="שומן"    value={53}  max={67}  color="#832727" />
          <MacroBar label="סיבים"   value={18}  max={25}  color="#4a7ab5" />
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 7 }}>
        <StatCard label="⚖️ משקל" value={latest?.weight || '—'} unit='ק"ג' change={latest ? 'עדכון אחרון' : 'לא מוגדר'} />
        <StatCard label="🏋️ שומן" value={latest?.bodyFat ? `${latest.bodyFat}%` : '—'} change={latest?.goalWeight ? `יעד: ${latest.goalWeight} ק"ג` : ''} changeUp />
        <StatCard label="👟 צעדים" value="7,240" change="72% מהיעד" changeUp />
        <StatCard label="🔥 TDEE" value={latest?.tdee || '—'} unit="kcal" />
      </div>

      {/* Water tracker */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <div style={{ fontSize: 11, color: 'rgba(180,165,150,.5)', fontWeight: 600, letterSpacing: .5, textTransform: 'uppercase' }}>💧 מים היום</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#4a7ab5' }}>{waterGlasses * 200} מ"ל</div>
        </div>
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
          {Array.from({ length: 13 }, (_, i) => (
            <div key={i} onClick={() => setWaterGlasses(i < waterGlasses ? i : i + 1)}
              style={{ width: 28, height: 36, border: `1.5px solid ${i < waterGlasses ? '#4a7ab5' : 'rgba(180,165,150,.18)'}`, borderRadius: '0 0 5px 5px', cursor: 'pointer', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: i < waterGlasses ? '100%' : '0', background: 'rgba(74,122,181,.5)', transition: 'height .2s' }} />
            </div>
          ))}
        </div>
        <div style={{ fontSize: 9, color: 'rgba(180,165,150,.3)', marginTop: 7 }}>לחץ לעדכן • 200 מ"ל לכוס</div>
      </div>

      {/* Weight chart */}
      {weightData.length > 1 && (
        <div className="card">
          <div style={{ fontSize: 11, color: 'rgba(180,165,150,.5)', marginBottom: 10, fontWeight: 600, letterSpacing: .5, textTransform: 'uppercase' }}>מגמת משקל</div>
          <ResponsiveContainer width="100%" height={100}>
            <AreaChart data={weightData}>
              <defs>
                <linearGradient id="wGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#832727" stopOpacity={0.25}/>
                  <stop offset="95%" stopColor="#832727" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{ fontSize: 9, fill: 'rgba(180,165,150,.4)' }} axisLine={false} tickLine={false} />
              <YAxis hide domain={['auto','auto']} />
              <Tooltip contentStyle={{ background: '#261e1a', border: '1px solid rgba(180,165,150,.18)', borderRadius: 10, fontSize: 11, color: '#b4a596' }} />
              <Area type="monotone" dataKey="weight" stroke="#832727" strokeWidth={2} fill="url(#wGrad)" dot={{ fill: '#832727', r: 3 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      <AIBox>
        {latest
          ? `משקל נוכחי: ${latest.weight} ק"ג. גירעון מומלץ: 500 kcal/יום. יעד חלבון: ${Math.round((latest.lbm || (latest.weight! * 0.7)) * 1.6)}g/יום (ACSM 2022).`
          : 'הוסף מדידה ראשונה כדי לקבל המלצות AI מותאמות אישית.'}
      </AIBox>

      <button onClick={() => onNavigate('measurements')} className="btn-ghost">
        <Icons.activity size={16} /> הוסף מדידה
      </button>
    </div>
  );
};

export default DashboardScreen;
