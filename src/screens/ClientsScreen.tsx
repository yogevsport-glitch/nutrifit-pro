import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { Client } from '../types';
import { Icons, Empty, Badge, Modal, Label, Spinner } from '../components/UI';

interface Props { onClientSelect: (client: Client) => void; }

const PLANS = [
  { id: 'basic',     label: 'בסיסי — תזונה',          price: 650  },
  { id: 'premium',   label: 'פרמיום — תזונה + אימון',  price: 1200 },
  { id: 'vip',       label: 'VIP — אישי מלא',           price: 2200 },
  { id: 'quarterly', label: 'רבעוני',                   price: 3200 },
];

const GOALS = ['ירידה בשומן','עלייה בשרירים','שמירה על כושר','שיפור ביצועים','בריאות כללית'];

const COLORS = ['#832727','#c4813a','#4a7ab5','#4a9e6e','#7a5a9e','#9e6e4a'];

const defaultForm = {
  name: '', email: '', phone: '', age: '', height: '', weight: '',
  goalWeight: '', fat: '', goal: GOALS[0], plan: 'premium', notes: '',
};

const ClientsScreen: React.FC<Props> = ({ onClientSelect }) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'users'), where('role', '==', 'client'));
    return onSnapshot(q, snap => {
      setClients(snap.docs.map(d => ({ uid: d.id, ...d.data() } as Client)));
      setLoading(false);
    });
  }, []);

  const filtered = clients.filter(c =>
    !search || (c.name || '').includes(search) || (c.email || '').includes(search) || (c.phone || '').includes(search)
  );

  const handleAdd = async () => {
    if (!form.name.trim()) { alert('נא להזין שם לקוח'); return; }
    setSaving(true);
    try {
      const colorIndex = clients.length % COLORS.length;
      const plan = PLANS.find(p => p.id === form.plan);
      const newClient: any = {
        name:          form.name.trim(),
        email:         form.email.trim(),
        phone:         form.phone.trim(),
        age:           form.age ? Number(form.age) : null,
        height:        form.height ? Number(form.height) : null,
        weight:        form.weight ? Number(form.weight) : null,
        goalWeight:    form.goalWeight ? Number(form.goalWeight) : null,
        fat:           form.fat ? Number(form.fat) : null,
        goal:          form.goal,
        plan:          form.plan,
        planLabel:     plan?.label,
        paymentAmount: plan?.price,
        paymentStatus: 'pending',
        notes:         form.notes,
        role:          'client',
        color:         COLORS[colorIndex],
        active:        true,
        createdAt:     serverTimestamp(),
      };
      // Use email as doc ID if provided (allows client to login and find their data)
      if (form.email) {
        const docId = form.email.replace(/[^a-zA-Z0-9]/g, '_');
        await setDoc(doc(db, 'users', docId), newClient);
      } else {
        await addDoc(collection(db, 'users'), newClient);
      }
      setIsAddOpen(false);
      setForm(defaultForm);
    } catch (e: any) { alert('שגיאה: ' + e.message); }
    setSaving(false);
  };

  const handleDelete = async (uid: string) => {
    try {
      await deleteDoc(doc(db, 'users', uid));
    } catch (e: any) { alert('שגיאה: ' + e.message); }
    setDeleteConfirm(null);
  };

  const sendWA = (c: Client, e: React.MouseEvent) => {
    e.stopPropagation();
    const msg = encodeURIComponent(`שלום ${c.name}! 👋\nהתחבר לאפליקציה NutriFit Pro:\nhttps://nutrifit-pro.netlify.app\n— Y-Sport 💪`);
    window.open(`https://wa.me/?text=${msg}`, '_blank');
  };

  const totalIncome = clients.filter(c => c.paymentStatus === 'paid').reduce((s, c) => s + (c.paymentAmount || 0), 0);

  return (
    <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 11, color: 'rgba(180,165,150,.4)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 2 }}>ניהול</div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: '#b4a596' }}>מתאמנים</h2>
        </div>
        <button onClick={() => setIsAddOpen(true)} className="btn-primary" style={{ width: 'auto', padding: '9px 16px', fontSize: 12 }}>
          <Icons.plus size={15} /> הוסף מתאמן
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 7 }}>
        <div className="card-sm stat-card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#b4a596' }}>{clients.length}</div>
          <div style={{ fontSize: 9, color: 'rgba(180,165,150,.4)', marginTop: 2 }}>מתאמנים</div>
        </div>
        <div className="card-sm stat-card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#4a9e6e' }}>₪{(totalIncome / 1000).toFixed(0)}K</div>
          <div style={{ fontSize: 9, color: 'rgba(180,165,150,.4)', marginTop: 2 }}>הכנסה</div>
        </div>
        <div className="card-sm stat-card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#832727' }}>{clients.filter(c => c.paymentStatus === 'overdue').length}</div>
          <div style={{ fontSize: 9, color: 'rgba(180,165,150,.4)', marginTop: 2 }}>באיחור</div>
        </div>
      </div>

      {/* Search */}
      <div style={{ position: 'relative' }}>
        <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)' }}>
          <Icons.search size={15} color="rgba(180,165,150,.4)" />
        </div>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="חפש לקוח..." className="form-input" style={{ paddingRight: 36 }} />
      </div>

      {/* List */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 80, borderRadius: 16 }} />)}
        </div>
      ) : filtered.length === 0 ? (
        <Empty icon={<Icons.users size={36} />}
          text={search ? 'לא נמצאו תוצאות' : 'אין מתאמנים עדיין'}
          action={!search ? <button onClick={() => setIsAddOpen(true)} className="btn-primary" style={{ width: 'auto', padding: '9px 18px', fontSize: 12, margin: '0 auto' }}>+ הוסף מתאמן ראשון</button> : undefined} />
      ) : (
        filtered.map(c => (
          <div key={c.uid || c.email} onClick={() => onClientSelect(c)}
            className="card" style={{ cursor: 'pointer', transition: 'border-color .2s' }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(131,39,39,.4)')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(180,165,150,.09)')}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 10 }}>
              <div style={{ width: 40, height: 40, borderRadius: 11, background: `${c.color || '#832727'}22`, border: `1px solid ${c.color || '#832727'}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: c.color || '#832727', flexShrink: 0 }}>
                {(c.name || '?').charAt(0)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#b4a596' }}>{c.name}</div>
                <div style={{ fontSize: 10, color: 'rgba(180,165,150,.4)', marginTop: 1 }}>{c.phone} {c.phone && c.email ? '•' : ''} {c.email}</div>
              </div>
              <div style={{ textAlign: 'left', flexShrink: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#b4a596' }}>₪{(c.paymentAmount || 0).toLocaleString()}</div>
                <Badge status={c.paymentStatus || 'pending'} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 5, marginBottom: 10 }}>
              {[
                ['משקל', c.weight ? `${c.weight}` : '—', 'ק"ג'],
                ['יעד', c.goalWeight ? `${c.goalWeight}` : '—', 'ק"ג'],
                ['שומן', c.fat ? `${c.fat}` : '—', '%'],
                ['תכנית', c.plan || '—', ''],
              ].map(([l, v, u]) => (
                <div key={l} style={{ background: 'rgba(180,165,150,.05)', borderRadius: 8, padding: '5px 7px', textAlign: 'center' }}>
                  <div style={{ fontSize: 8, color: 'rgba(180,165,150,.35)', marginBottom: 1 }}>{l}</div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#b4a596' }}>{v}<span style={{ fontSize: 8, color: 'rgba(180,165,150,.4)' }}>{u}</span></div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 6 }} onClick={e => e.stopPropagation()}>
              <button onClick={e => sendWA(c, e)}
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, background: 'rgba(37,209,102,.08)', border: '1px solid rgba(37,209,102,.2)', borderRadius: 8, padding: '6px 0', fontSize: 10, color: '#25D166', cursor: 'pointer', fontWeight: 600 }}>
                <Icons.wa size={13} color="#25D166" /> WhatsApp
              </button>
              <button onClick={e => { e.stopPropagation(); onClientSelect(c); }}
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, background: 'rgba(131,39,39,.08)', border: '1px solid rgba(131,39,39,.2)', borderRadius: 8, padding: '6px 0', fontSize: 10, color: '#832727', cursor: 'pointer', fontWeight: 600 }}>
                <Icons.user size={13} color="#832727" /> פרופיל
              </button>
              <button onClick={e => { e.stopPropagation(); setDeleteConfirm(c.uid || c.email || ''); }}
                style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(180,165,150,.05)', border: '1px solid rgba(180,165,150,.12)', borderRadius: 8, cursor: 'pointer' }}>
                <Icons.trash size={13} color="rgba(180,165,150,.4)" />
              </button>
            </div>
          </div>
        ))
      )}

      {/* Add Client Modal */}
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="➕ מתאמן חדש">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <Label>שם מלא *</Label>
              <input className="form-input" placeholder="שם ושם משפחה" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div>
              <Label>טלפון</Label>
              <input className="form-input" type="tel" placeholder="050-0000000" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
            </div>
            <div>
              <Label>מייל</Label>
              <input className="form-input" type="email" placeholder="name@mail.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            </div>
            <div>
              <Label>גיל</Label>
              <input className="form-input" type="number" placeholder="35" value={form.age} onChange={e => setForm(f => ({ ...f, age: e.target.value }))} />
            </div>
            <div>
              <Label>גובה (ס"מ)</Label>
              <input className="form-input" type="number" placeholder="170" value={form.height} onChange={e => setForm(f => ({ ...f, height: e.target.value }))} />
            </div>
            <div>
              <Label>משקל (ק"ג)</Label>
              <input className="form-input" type="number" placeholder="75" value={form.weight} onChange={e => setForm(f => ({ ...f, weight: e.target.value }))} />
            </div>
            <div>
              <Label>יעד משקל</Label>
              <input className="form-input" type="number" placeholder="65" value={form.goalWeight} onChange={e => setForm(f => ({ ...f, goalWeight: e.target.value }))} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <Label>מטרה</Label>
              <select className="form-input" value={form.goal} onChange={e => setForm(f => ({ ...f, goal: e.target.value }))}>
                {GOALS.map(g => <option key={g}>{g}</option>)}
              </select>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <Label>תכנית</Label>
              <select className="form-input" value={form.plan} onChange={e => setForm(f => ({ ...f, plan: e.target.value }))}>
                {PLANS.map(p => <option key={p.id} value={p.id}>{p.label} — ₪{p.price}</option>)}
              </select>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <Label>הערות / מגבלות רפואיות</Label>
              <textarea className="form-input" rows={2} placeholder="פציעות, אלרגיות..." value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} style={{ resize: 'none' }} />
            </div>
          </div>
          <button onClick={handleAdd} disabled={saving} className="btn-primary">
            {saving ? <Spinner size={16} /> : <><Icons.plus size={16} /> שמור מתאמן</>}
          </button>
        </div>
      </Modal>

      {/* Delete confirm */}
      <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="מחיקת מתאמן">
        <p style={{ fontSize: 13, color: 'rgba(180,165,150,.7)', marginBottom: 20 }}>האם אתה בטוח שרוצה למחוק את המתאמן? פעולה זו אינה הפיכה.</p>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setDeleteConfirm(null)} className="btn-ghost" style={{ flex: 1 }}>ביטול</button>
          <button onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
            className="btn-primary" style={{ flex: 1, background: '#832727' }}>מחק</button>
        </div>
      </Modal>
    </div>
  );
};

export default ClientsScreen;
