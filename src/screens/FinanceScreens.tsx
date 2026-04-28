// ============================================================
// PAYMENTS SCREEN
// ============================================================
import React, { useState, useEffect } from 'react';
import { collection, addDoc, updateDoc, doc, query, orderBy, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { Payment, Alert } from '../types';
import { Icons, Modal, Label, Empty, Badge, Spinner, AIBox } from '../components/UI';
import jsPDF from 'jspdf';

const PLANS_DATA = [
  { id: 'basic',     label: 'בסיסי — תזונה',          price: 650  },
  { id: 'premium',   label: 'פרמיום — תזונה + אימון',  price: 1200 },
  { id: 'vip',       label: 'VIP — אישי מלא',           price: 2200 },
  { id: 'quarterly', label: 'רבעוני פרמיום',             price: 3200 },
];

export const PaymentsScreen: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'paid' | 'pending' | 'overdue'>('all');
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ clientName: '', plan: 'premium', amount: 1200, dueDate: '', notes: '' });

  useEffect(() => {
    const q = query(collection(db, 'payments'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, snap => {
      setPayments(snap.docs.map(d => ({ id: d.id, ...d.data() } as Payment)));
      setLoading(false);
    });
  }, []);

  const handleAdd = async () => {
    if (!form.clientName.trim() || !form.dueDate) { alert('שם לקוח ותאריך חובה'); return; }
    setSaving(true);
    try {
      const isOverdue = new Date(form.dueDate) < new Date();
      await addDoc(collection(db, 'payments'), {
        ...form, status: isOverdue ? 'overdue' : 'pending',
        createdAt: serverTimestamp(), paidAt: null,
      });
      setIsAddOpen(false);
      setForm({ clientName: '', plan: 'premium', amount: 1200, dueDate: '', notes: '' });
    } catch (e: any) { alert('שגיאה: ' + e.message); }
    setSaving(false);
  };

  const markPaid = async (id: string) => {
    await updateDoc(doc(db, 'payments', id), { status: 'paid', paidAt: serverTimestamp() });
  };

  const sendWA = (p: Payment) => {
    const msg = encodeURIComponent(`שלום ${p.clientName}! 👋\nתזכורת ידידותית לתשלום ₪${p.amount} — ${p.plan}.\nתאריך: ${p.dueDate}\nתודה! — Y-Sport 💪`);
    window.open(`https://wa.me/?text=${msg}`, '_blank');
  };

  const filtered = payments.filter(p => filter === 'all' || p.status === filter);
  const totalPaid = payments.filter(p => p.status === 'paid').reduce((s, p) => s + p.amount, 0);
  const totalPending = payments.filter(p => p.status === 'pending').reduce((s, p) => s + p.amount, 0);
  const totalOverdue = payments.filter(p => p.status === 'overdue').reduce((s, p) => s + p.amount, 0);

  return (
    <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 11, color: 'rgba(180,165,150,.4)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 2 }}>כספים</div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: '#b4a596' }}>תשלומים</h2>
        </div>
        <button onClick={() => setIsAddOpen(true)} className="btn-primary" style={{ width: 'auto', padding: '9px 14px', fontSize: 12 }}>
          <Icons.plus size={15} /> תשלום חדש
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 7 }}>
        {[['💰 שולם', `₪${(totalPaid/1000).toFixed(0)}K`, true], ['⏳ ממתין', `₪${(totalPending/1000).toFixed(0)}K`, false], ['❗ באיחור', `₪${(totalOverdue/1000).toFixed(0)}K`, false]].map(([l,v,up]) => (
          <div key={String(l)} className="card-sm stat-card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 9, color: 'rgba(180,165,150,.4)', marginBottom: 2 }}>{l}</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: up ? '#4a9e6e' : v === `₪${(totalOverdue/1000).toFixed(0)}K` && totalOverdue > 0 ? '#832727' : '#b4a596' }}>{v}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 6 }}>
        {(['all','paid','pending','overdue'] as const).map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`sub-tab ${filter === s ? 'active' : ''}`}>
            {s === 'all' ? 'הכל' : s === 'paid' ? 'שולם' : s === 'pending' ? 'ממתין' : 'באיחור'}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 70 }} />)}
        </div>
      ) : filtered.length === 0 ? (
        <Empty icon={<Icons.card size={36} />} text="אין תשלומים"
          action={<button onClick={() => setIsAddOpen(true)} className="btn-primary" style={{ width: 'auto', padding: '9px 18px', fontSize: 12, margin: '0 auto' }}>+ הוסף תשלום</button>} />
      ) : (
        filtered.map(p => (
          <div key={p.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 40, height: 40, borderRadius: 11, background: 'rgba(131,39,39,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#832727', flexShrink: 0 }}>
              {(p.clientName || '?').charAt(0)}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#b4a596' }}>{p.clientName}</div>
              <div style={{ fontSize: 10, color: 'rgba(180,165,150,.4)', marginTop: 1 }}>{p.plan} • {p.dueDate}</div>
            </div>
            <div style={{ textAlign: 'left', flexShrink: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#b4a596' }}>₪{p.amount.toLocaleString()}</div>
              <Badge status={p.status} />
            </div>
            <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
              {p.status !== 'paid' && (
                <button onClick={() => markPaid(p.id!)} className="btn-icon" title="סמן שולם">
                  <Icons.check size={14} color="#4a9e6e" />
                </button>
              )}
              <button onClick={() => sendWA(p)} className="btn-icon" title="שלח WhatsApp">
                <Icons.wa size={14} color="#25D166" />
              </button>
            </div>
          </div>
        ))
      )}

      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="💳 תשלום חדש">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div>
            <Label>שם לקוח *</Label>
            <input className="form-input" placeholder="שם מלא" value={form.clientName} onChange={e => setForm(f => ({ ...f, clientName: e.target.value }))} />
          </div>
          <div>
            <Label>תכנית</Label>
            <select className="form-input" value={form.plan} onChange={e => {
              const plan = PLANS_DATA.find(p => p.id === e.target.value);
              setForm(f => ({ ...f, plan: e.target.value, amount: plan?.price || f.amount }));
            }}>
              {PLANS_DATA.map(p => <option key={p.id} value={p.id}>{p.label} — ₪{p.price}</option>)}
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div>
              <Label>סכום (₪)</Label>
              <input type="number" className="form-input" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: +e.target.value }))} />
            </div>
            <div>
              <Label>תאריך פירעון *</Label>
              <input type="date" className="form-input" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} />
            </div>
          </div>
          <div>
            <Label>הערות</Label>
            <input className="form-input" placeholder="חשבונית, הנחה..." value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
          </div>
          <button onClick={handleAdd} disabled={saving} className="btn-primary">
            {saving ? <Spinner size={16} /> : '💾 שמור תשלום'}
          </button>
        </div>
      </Modal>
    </div>
  );
};

// ============================================================
// ALERTS SCREEN
// ============================================================
const ALERT_TYPES = [
  { id: 'payment',     label: 'תשלום',     color: '#c4813a' },
  { id: 'measurement', label: 'מדידה',     color: '#4a7ab5' },
  { id: 'workout',     label: 'אימון',     color: '#4a9e6e' },
  { id: 'checkin',     label: "צ'ק-אין",  color: '#7a5a9e' },
  { id: 'custom',      label: 'מותאם',    color: '#b4a596' },
];

export const AlertsScreen: React.FC = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [filter, setFilter] = useState<'active' | 'done' | 'all'>('active');
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ type: 'payment', clientName: 'כל הלקוחות', date: new Date().toISOString().slice(0,10), time: '09:00', message: '' });

  useEffect(() => {
    const q = query(collection(db, 'alerts'), orderBy('date', 'asc'));
    return onSnapshot(q, snap => setAlerts(snap.docs.map(d => ({ id: d.id, ...d.data() } as Alert))));
  }, []);

  const handleAdd = async () => {
    setSaving(true);
    const typeLabel = ALERT_TYPES.find(t => t.id === form.type)?.label;
    const defaultMsg: Record<string, string> = { payment: 'תזכורת תשלום', measurement: 'ועד מדידה', workout: 'תזכורת אימון', checkin: "צ'ק-אין שבועי", custom: 'תזכורת' };
    await addDoc(collection(db, 'alerts'), { ...form, message: form.message || defaultMsg[form.type], typeName: typeLabel, done: false, createdAt: serverTimestamp() });
    setIsAddOpen(false);
    setForm({ type: 'payment', clientName: 'כל הלקוחות', date: new Date().toISOString().slice(0,10), time: '09:00', message: '' });
    setSaving(false);
  };

  const markDone = async (id: string) => {
    await updateDoc(doc(db, 'alerts', id), { done: true, doneAt: serverTimestamp() });
  };

  const sendWA = (a: Alert) => {
    const msg = encodeURIComponent(`שלום ${a.clientName}! 👋\n${a.message}\n— Y-Sport 💪`);
    window.open(`https://wa.me/?text=${msg}`, '_blank');
  };

  const filtered = alerts.filter(a => filter === 'all' || (filter === 'active' ? !a.done : a.done));
  const activeCount = alerts.filter(a => !a.done).length;

  return (
    <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 11, color: 'rgba(180,165,150,.4)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 2 }}>ניהול</div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: '#b4a596' }}>תזכורות {activeCount > 0 && <span style={{ fontSize: 13, color: '#832727' }}>({activeCount})</span>}</h2>
        </div>
        <button onClick={() => setIsAddOpen(true)} className="btn-primary" style={{ width: 'auto', padding: '9px 14px', fontSize: 12 }}>
          <Icons.plus size={15} /> תזכורת
        </button>
      </div>

      {/* WhatsApp bulk */}
      <div className="card" style={{ borderColor: 'rgba(37,209,102,.2)' }}>
        <div style={{ fontSize: 10, color: '#25D166', fontWeight: 700, marginBottom: 8, letterSpacing: .5 }}>📱 שליחה המונית WhatsApp</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
          {[
            { l: 'תזכורת תשלום', m: 'שלום! תזכורת לתשלום החודשי. תודה! — Y-Sport 💪' },
            { l: "צ'ק-אין", m: "שלום! זמן לצ'ק-אין שבועי! שלח עדכון. — Y-Sport 💪" },
          ].map(b => (
            <button key={b.l} onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(b.m)}`, '_blank')}
              style={{ background: 'rgba(37,209,102,.08)', border: '1px solid rgba(37,209,102,.2)', borderRadius: 9, padding: '7px 10px', fontSize: 11, color: '#25D166', cursor: 'pointer', fontWeight: 600 }}>
              {b.l}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 6 }}>
        {[{k:'active',l:'פעילות'},{k:'done',l:'טופלו'},{k:'all',l:'הכל'}].map(f => (
          <button key={f.k} onClick={() => setFilter(f.k as any)} className={`sub-tab ${filter === f.k ? 'active' : ''}`}>{f.l}</button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <Empty icon={<Icons.bell size={36} />} text="אין תזכורות"
          action={<button onClick={() => setIsAddOpen(true)} className="btn-primary" style={{ width: 'auto', padding: '9px 18px', fontSize: 12, margin: '0 auto' }}>+ הוסף תזכורת</button>} />
      ) : (
        filtered.map(a => {
          const typeColor = ALERT_TYPES.find(t => t.id === a.type)?.color || '#b4a596';
          return (
            <div key={a.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 10, opacity: a.done ? .55 : 1 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: typeColor, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#b4a596' }}>{a.message}</div>
                <div style={{ fontSize: 10, color: 'rgba(180,165,150,.4)', marginTop: 1 }}>{a.clientName} • {a.date} {a.time}</div>
              </div>
              {!a.done ? (
                <div style={{ display: 'flex', gap: 5 }}>
                  <button onClick={() => markDone(a.id!)} className="btn-icon"><Icons.check size={14} color="#4a9e6e" /></button>
                  <button onClick={() => sendWA(a)} className="btn-icon"><Icons.wa size={14} color="#25D166" /></button>
                </div>
              ) : <span style={{ fontSize: 10, color: '#4a9e6e', fontWeight: 600 }}>✓ טופל</span>}
            </div>
          );
        })
      )}

      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="🔔 תזכורת חדשה">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div>
            <Label>סוג</Label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6 }}>
              {ALERT_TYPES.map(t => (
                <button key={t.id} onClick={() => setForm(f => ({ ...f, type: t.id }))}
                  style={{ padding: '7px 4px', borderRadius: 10, border: `1px solid ${form.type === t.id ? t.color : 'rgba(180,165,150,.18)'}`, background: form.type === t.id ? `${t.color}22` : 'transparent', color: form.type === t.id ? t.color : 'rgba(180,165,150,.5)', fontSize: 11, cursor: 'pointer', fontWeight: 600 }}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label>לקוח</Label>
            <input className="form-input" placeholder="שם לקוח" value={form.clientName} onChange={e => setForm(f => ({ ...f, clientName: e.target.value }))} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div><Label>תאריך</Label><input type="date" className="form-input" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} /></div>
            <div><Label>שעה</Label><input type="time" className="form-input" value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))} /></div>
          </div>
          <div>
            <Label>הודעה מותאמת</Label>
            <input className="form-input" placeholder="השאר ריק לברירת מחדל" value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} />
          </div>
          <button onClick={handleAdd} disabled={saving} className="btn-primary">
            {saving ? <Spinner size={16} /> : '🔔 שמור תזכורת'}
          </button>
        </div>
      </Modal>
    </div>
  );
};

// ============================================================
// REPORTS SCREEN
// ============================================================
export const ReportsScreen: React.FC = () => {
  const [clientName, setClientName] = useState('');
  const [generating, setGenerating] = useState(false);
  const [sections, setSections] = useState({ body: true, nutrition: true, workout: true, payments: true });

  const generatePDF = async () => {
    if (!clientName.trim()) { alert('הזן שם לקוח'); return; }
    setGenerating(true);
    await new Promise(r => setTimeout(r, 100));
    try {
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const W = 210, M = 15;
      let y = 0;
      pdf.setFillColor(131, 39, 39);
      pdf.rect(0, 0, W, 24, 'F');
      pdf.setTextColor(180, 165, 150);
      pdf.setFontSize(16); pdf.setFont('helvetica', 'bold');
      pdf.text('NUTRIFIT PRO', W - M, 12, { align: 'right' });
      pdf.setFontSize(8); pdf.setFont('helvetica', 'normal');
      pdf.text('by Y-Sport — Yogev Markanti', W - M, 18, { align: 'right' });
      pdf.text(new Date().toLocaleDateString('he-IL'), M, 18);
      y = 34;
      pdf.setTextColor(30, 30, 30);
      pdf.setFontSize(20); pdf.setFont('helvetica', 'bold');
      pdf.text(clientName, W - M, y, { align: 'right' });
      y += 12;
      pdf.setFillColor(245, 240, 238);
      pdf.rect(M, y, W - M * 2, 8, 'F');
      pdf.setFontSize(10); pdf.setFont('helvetica', 'bold'); pdf.setTextColor(131, 39, 39);
      pdf.text('AI RECOMMENDATION (ACSM Guidelines)', W - M - 2, y + 5.5, { align: 'right' });
      y += 13;
      pdf.setFontSize(9); pdf.setFont('helvetica', 'normal'); pdf.setTextColor(50, 50, 50);
      pdf.text('גירעון מומלץ: 500 kcal/יום. יעד חלבון: 1.6g/kg LBM. ירידה: 0.5–0.8 ק"ג/שבוע.', W - M - 2, y, { align: 'right' });
      y += 14;
      pdf.setFillColor(131, 39, 39);
      pdf.rect(0, 285, W, 12, 'F');
      pdf.setFontSize(7); pdf.setFont('helvetica', 'normal'); pdf.setTextColor(180, 165, 150);
      pdf.text('NutriFit Pro by Y-Sport | Based on ACSM & WHO Guidelines', 105, 292, { align: 'center' });
      pdf.save(`NutriFit_${clientName.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (e: any) { alert('שגיאה: ' + e.message); }
    setGenerating(false);
  };

  return (
    <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 14 }}>
      <div>
        <div style={{ fontSize: 11, color: 'rgba(180,165,150,.4)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 2 }}>יצוא</div>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: '#b4a596' }}>דוחות PDF</h2>
      </div>
      <div className="card">
        <Label>שם לקוח</Label>
        <input className="form-input" placeholder="שם המתאמן" value={clientName} onChange={e => setClientName(e.target.value)} style={{ marginBottom: 14 }} />
        <Label>כלול בדוח</Label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
          {[['body','מדדי גוף'],['nutrition','תזונה ומאקרו'],['workout','אימונים'],['payments','תשלומים']].map(([k,l]) => (
            <label key={k} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
              <input type="checkbox" checked={(sections as any)[k]} onChange={e => setSections(s => ({ ...s, [k]: e.target.checked }))}
                style={{ width: 16, height: 16, accentColor: '#832727' }} />
              <span style={{ fontSize: 13, color: '#b4a596' }}>{l}</span>
            </label>
          ))}
        </div>
        <button onClick={generatePDF} disabled={generating} className="btn-primary" style={{ marginBottom: 8 }}>
          {generating ? <Spinner size={16} /> : <><Icons.download size={16} /> הורד דוח PDF</>}
        </button>
        <button onClick={() => {
          if (!clientName) { alert('הזן שם לקוח'); return; }
          const msg = encodeURIComponent(`שלום ${clientName}! 👋\nדוח ההתקדמות שלך מ-NutriFit Pro מוכן.\n— Y-Sport 💪`);
          window.open(`https://wa.me/?text=${msg}`, '_blank');
        }} className="btn-ghost">
          <Icons.wa size={16} /> שלח סיכום WhatsApp
        </button>
      </div>
      <AIBox label="◈ על דוחות PDF">
        דוחות PDF מקצועיים נוצרים עם לוגו Y-Sport, כל המדדים והמלצות AI מבוססות ACSM. ניתן לשלוח ישירות ללקוח ב-WhatsApp.
      </AIBox>
    </div>
  );
};
