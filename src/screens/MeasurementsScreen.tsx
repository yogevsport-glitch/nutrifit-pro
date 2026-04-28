import React, { useState, useEffect, useRef } from 'react';
import { collection, addDoc, query, orderBy, onSnapshot, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../firebase';
import { AppUser, Measurement, Skinfold, ProgressPhoto } from '../types';
import { Icons, Modal, Label, Empty, AIBox, Spinner } from '../components/UI';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface Props { user: AppUser; clientId?: string; }

type Tab = 'general' | 'circumferences' | 'skinfolds' | 'gallery';

const MeasurementsScreen: React.FC<Props> = ({ user, clientId }) => {
  const uid = clientId || user.uid;
  const [tab, setTab] = useState<Tab>('general');
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [skinfolds, setSkinfolds] = useState<Skinfold[]>([]);
  const [photos, setPhotos] = useState<ProgressPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const [mForm, setMForm] = useState<Partial<Measurement>>({ date: new Date().toISOString().slice(0, 10) });
  const [sfForm, setSfForm] = useState<Partial<Skinfold>>({ date: new Date().toISOString().slice(0, 10) });

  // Load data
  useEffect(() => {
    const qM = query(collection(db, 'users', uid, 'measurements'), orderBy('date', 'desc'));
    const unM = onSnapshot(qM, s => { setMeasurements(s.docs.map(d => ({ id: d.id, ...d.data() } as Measurement))); setLoading(false); });
    const qS = query(collection(db, 'users', uid, 'skinfolds'), orderBy('date', 'desc'));
    const unS = onSnapshot(qS, s => setSkinfolds(s.docs.map(d => ({ id: d.id, ...d.data() } as Skinfold))));
    const qP = query(collection(db, 'users', uid, 'photos'), orderBy('date', 'desc'));
    const unP = onSnapshot(qP, s => setPhotos(s.docs.map(d => ({ id: d.id, ...d.data() } as ProgressPhoto))));
    return () => { unM(); unS(); unP(); };
  }, [uid]);

  // Save measurement
  const saveMeasurement = async () => {
    setSaving(true);
    try {
      // Auto-calculate BMI if height & weight present
      const { weight, height } = mForm as any;
      const bmi = weight && height ? +(weight / ((height / 100) ** 2)).toFixed(1) : undefined;
      const lbm = weight && mForm.bodyFat ? +(weight * (1 - mForm.bodyFat / 100)).toFixed(1) : undefined;
      const bmr = weight && height && user ? calcBMR(weight, height, user) : undefined;
      const tdee = bmr ? +(bmr * 1.55).toFixed(0) : undefined;

      await addDoc(collection(db, 'users', uid, 'measurements'), {
        ...mForm, bmi, lbm, bmr, tdee,
        createdAt: serverTimestamp(),
      });
      setIsAddOpen(false);
      setMForm({ date: new Date().toISOString().slice(0, 10) });
    } catch (e: any) { alert('שגיאה: ' + e.message); }
    setSaving(false);
  };

  // Save skinfold
  const saveSkinfold = async () => {
    setSaving(true);
    try {
      const { chest = 0, abdomen = 0, thigh = 0 } = sfForm as any;
      const sum3 = chest + abdomen + thigh;
      const age = 45; // TODO: get from user profile
      const density = 1.0994921 - (0.0009929 * sum3) + (0.0000023 * sum3 ** 2) - (0.0001392 * age);
      const fatPercent = +((4.95 / density - 4.50) * 100).toFixed(1);
      await addDoc(collection(db, 'users', uid, 'skinfolds'), { ...sfForm, fatPercent, createdAt: serverTimestamp() });
      setSfForm({ date: new Date().toISOString().slice(0, 10) });
    } catch (e: any) { alert('שגיאה: ' + e.message); }
    setSaving(false);
  };

  // Upload photo
  const uploadPhoto = async (file: File) => {
    setUploading(true);
    try {
      const storageRef = ref(storage, `photos/${uid}/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      await addDoc(collection(db, 'users', uid, 'photos'), {
        clientId: uid, url,
        date: new Date().toISOString().slice(0, 10),
        weight: measurements[0]?.weight,
        createdAt: serverTimestamp(),
      });
    } catch (e: any) { alert('שגיאה בהעלאה: ' + e.message); }
    setUploading(false);
  };

  const deletePhoto = async (photo: ProgressPhoto) => {
    if (!confirm('למחוק תמונה זו?')) return;
    try {
      if (photo.id) await deleteDoc(doc(db, 'users', uid, 'photos', photo.id));
      const storageRef = ref(storage, photo.url);
      await deleteObject(storageRef).catch(() => {});
    } catch (e: any) { alert('שגיאה: ' + e.message); }
  };

  const chartData = measurements.slice(0, 10).reverse();
  const latest = measurements[0];

  const tabs: { key: Tab; label: string }[] = [
    { key: 'general', label: '📊 מדדים' },
    { key: 'circumferences', label: '📏 היקפים' },
    { key: 'skinfolds', label: '📐 כפלי עור' },
    { key: 'gallery', label: '🖼️ גלריה' },
  ];

  return (
    <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 11, color: 'rgba(180,165,150,.4)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 2 }}>מעקב</div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: '#b4a596' }}>מדדים</h2>
        </div>
        <button onClick={() => { setIsAddOpen(true); }} className="btn-primary" style={{ width: 'auto', padding: '9px 14px', fontSize: 12 }}>
          <Icons.plus size={15} /> מדידה חדשה
        </button>
      </div>

      <div className="sub-tabs">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} className={`sub-tab ${tab === t.key ? 'active' : ''}`}>{t.label}</button>
        ))}
      </div>

      {/* GENERAL */}
      {tab === 'general' && (
        <>
          {latest && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 7 }}>
              {[
                ['⚖️ משקל', latest.weight, 'ק"ג'],
                ['🏋️ שומן', latest.bodyFat, '%'],
                ['💪 LBM', latest.lbm, 'ק"ג'],
                ['📐 BMI', latest.bmi, ''],
                ['⚡ BMR', latest.bmr, 'kcal'],
                ['🔥 TDEE', latest.tdee, 'kcal'],
                ['🩸 ויסצרלי', latest.visceral, ''],
                ['💧 TBW', latest.tbw, '%'],
                ['📅 תאריך', latest.date, ''],
              ].map(([l, v, u]) => (
                <div key={String(l)} className="card-sm stat-card" style={{ position: 'relative', overflow: 'hidden' }}>
                  <div style={{ fontSize: 9, color: 'rgba(180,165,150,.4)', marginBottom: 2 }}>{l}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#b4a596' }}>{v ?? '—'}<span style={{ fontSize: 9, color: 'rgba(180,165,150,.4)' }}>{v ? ' '+u : ''}</span></div>
                </div>
              ))}
            </div>
          )}

          {chartData.length > 1 && (
            <>
              {[
                { key: 'weight', label: 'משקל', color: '#832727', unit: 'ק"ג' },
                { key: 'bodyFat', label: 'שומן גוף %', color: '#c4813a', unit: '%' },
                { key: 'lbm', label: 'מסת שריר LBM', color: '#4a7ab5', unit: 'ק"ג' },
              ].map(g => (
                <div key={g.key} className="card">
                  <div style={{ fontSize: 11, color: 'rgba(180,165,150,.5)', marginBottom: 10, fontWeight: 600, letterSpacing: .5, textTransform: 'uppercase' }}>{g.label}</div>
                  <ResponsiveContainer width="100%" height={90}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(180,165,150,.05)" />
                      <XAxis dataKey="date" tick={{ fontSize: 9, fill: 'rgba(180,165,150,.4)' }} axisLine={false} tickLine={false} />
                      <YAxis hide domain={['auto', 'auto']} />
                      <Tooltip contentStyle={{ background: '#261e1a', border: '1px solid rgba(180,165,150,.18)', borderRadius: 10, fontSize: 11, color: '#b4a596' }} formatter={(v: any) => [`${v} ${g.unit}`, g.label]} />
                      <Line type="monotone" dataKey={g.key} stroke={g.color} strokeWidth={2} dot={{ fill: g.color, r: 3 }} activeDot={{ r: 5 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ))}
            </>
          )}

          {measurements.length === 0 && !loading && (
            <Empty icon={<Icons.chart size={36} />} text="אין מדידות עדיין"
              action={<button onClick={() => setIsAddOpen(true)} className="btn-primary" style={{ width: 'auto', padding: '9px 18px', fontSize: 12, margin: '0 auto' }}>+ הוסף מדידה ראשונה</button>} />
          )}

          {latest && <AIBox>
            {`משקל: ${latest.weight} ק"ג | שומן: ${latest.bodyFat}% | LBM: ${latest.lbm} ק"ג. ` +
             `גירעון מומלץ: 500 kcal/יום. יעד חלבון: ${Math.round((latest.lbm || 60) * 1.6)}g/יום (ACSM 2022).`}
          </AIBox>}
        </>
      )}

      {/* CIRCUMFERENCES */}
      {tab === 'circumferences' && (
        <>
          <div className="card">
            <div style={{ fontSize: 11, color: 'rgba(180,165,150,.5)', marginBottom: 12, fontWeight: 600, letterSpacing: .5, textTransform: 'uppercase' }}>היקפי גוף (ס"מ)</div>
            {latest ? (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(180,165,150,.07)' }}>
                    {['מיקום','נוכחי','יעד','שינוי'].map(h => <th key={h} style={{ padding: '5px 3px', color: 'rgba(180,165,150,.4)', fontWeight: 500, fontSize: 9, textTransform: 'uppercase', letterSpacing: .5 }}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['מותן', latest.waist, 80],
                    ['ירך', latest.hips, 90],
                    ['חזה', latest.chest, 95],
                    ['זרוע', latest.arm, 35],
                    ['ירך', latest.thigh, 55],
                    ['שוק', latest.calf, 38],
                  ].map(([l, v, goal]) => {
const diff = v && goal ? (Number(v) - Number(goal)) : null;
                    return (
                      <tr key={String(l)} style={{ borderBottom: '1px solid rgba(180,165,150,.05)' }}>
                        <td style={{ padding: '6px 3px', color: 'rgba(180,165,150,.6)' }}>{l}</td>
                        <td style={{ padding: '6px 3px', textAlign: 'center', fontWeight: 700, color: '#b4a596' }}>{v ?? '—'}</td>
                        <td style={{ padding: '6px 3px', textAlign: 'center', color: 'rgba(180,165,150,.4)' }}>{goal}</td>
                        <td style={{ padding: '6px 3px', textAlign: 'center', color: diff ? (diff > 0 ? '#c45050' : '#4a9e6e') : 'rgba(180,165,150,.4)', fontSize: 11 }}>
                          {diff !== null ? (diff > 0 ? `+${diff}` : diff) : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : <Empty text="אין נתוני היקפים" />}
          </div>
        </>
      )}

      {/* SKINFOLDS */}
      {tab === 'skinfolds' && (
        <>
          <div className="card">
            <div style={{ fontSize: 11, color: 'rgba(180,165,150,.5)', marginBottom: 4, fontWeight: 600, letterSpacing: .5, textTransform: 'uppercase' }}>כפלי עור — Jackson-Pollock</div>
            <div style={{ fontSize: 11, color: 'rgba(180,165,150,.4)', lineHeight: 1.6, marginBottom: 12 }}>מדוד בצד ימין של הגוף. קח את הקפל, החזק 2-3 שניות.</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {[
                { id: 'chest', label: 'חזה', desc: 'קפל אלכסוני בין הדופן לבית השחי' },
                { id: 'abdomen', label: 'בטן', desc: 'קפל אנכי, 2 ס"מ מהטבור' },
                { id: 'thigh', label: 'ירך', desc: 'קפל אנכי, אמצע הירך הקדמית' },
                { id: 'triceps', label: 'טריצפס', desc: 'קפל אנכי, אחורי הזרוע' },
                { id: 'subscapular', label: 'שכמה', desc: '1 ס"מ מתחת לשכמה, זווית 45°' },
              ].map(site => (
                <div key={site.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px solid rgba(180,165,150,.06)' }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#832727' }}>{site.label}</div>
                    <div style={{ fontSize: 10, color: 'rgba(180,165,150,.4)', marginTop: 1, maxWidth: 180 }}>{site.desc}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {['נוכחי','יעד'].map((lbl, idx) => (
                      <div key={lbl}>
                        <div style={{ fontSize: 8, color: 'rgba(180,165,150,.35)', textAlign: 'center', marginBottom: 3 }}>{lbl}</div>
                        <input type="number" min="1" max="99"
                          value={(sfForm as any)[site.id] || ''}
                          onChange={e => setSfForm(f => ({ ...f, [site.id]: +e.target.value }))}
                          style={{ width: 52, background: 'rgba(180,165,150,.06)', border: '1px solid rgba(180,165,150,.18)', borderRadius: 8, padding: '5px 6px', fontSize: 12, color: '#b4a596', textAlign: 'center', outline: 'none' }}
                          disabled={idx === 1} placeholder="מ״מ" />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {skinfolds[0] && (
              <div style={{ marginTop: 12, padding: 12, background: 'rgba(131,39,39,.1)', borderRadius: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 11, color: 'rgba(180,165,150,.6)' }}>שומן מחושב (JP3)</span>
                <span style={{ fontSize: 22, fontWeight: 800, color: '#832727' }}>{skinfolds[0].fatPercent}%</span>
              </div>
            )}
            <button onClick={saveSkinfold} disabled={saving} className="btn-primary" style={{ marginTop: 12 }}>
              {saving ? <Spinner size={16} /> : '💾 שמור מדידת כפלי עור'}
            </button>
          </div>

          {skinfolds.length > 1 && (
            <div className="card">
              <div style={{ fontSize: 11, color: 'rgba(180,165,150,.5)', marginBottom: 10, fontWeight: 600, letterSpacing: .5, textTransform: 'uppercase' }}>מגמת שומן</div>
              <ResponsiveContainer width="100%" height={90}>
                <LineChart data={skinfolds.slice(0, 8).reverse()}>
                  <XAxis dataKey="date" tick={{ fontSize: 9, fill: 'rgba(180,165,150,.4)' }} axisLine={false} tickLine={false} />
                  <YAxis hide domain={['auto', 'auto']} />
                  <Tooltip contentStyle={{ background: '#261e1a', border: '1px solid rgba(180,165,150,.18)', borderRadius: 10, fontSize: 11, color: '#b4a596' }} formatter={(v: any) => [`${v}%`, 'שומן']} />
                  <Line type="monotone" dataKey="fatPercent" stroke="#832727" strokeWidth={2} dot={{ fill: '#832727', r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </>
      )}

      {/* GALLERY */}
      {tab === 'gallery' && (
        <>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }}
            onChange={e => e.target.files?.[0] && uploadPhoto(e.target.files[0])} />
          <button onClick={() => fileRef.current?.click()} disabled={uploading} className="btn-primary">
            {uploading ? <><Spinner size={16} /> מעלה...</> : <><Icons.upload size={16} /> העלה תמונת התקדמות</>}
          </button>

          {photos.length === 0 ? (
            <Empty icon={<Icons.photo size={36} />} text="אין תמונות התקדמות עדיין" />
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 7 }}>
              {photos.map(p => (
                <div key={p.id} style={{ position: 'relative', aspectRatio: '1', borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(180,165,150,.1)' }}>
                  <img src={p.url} alt="Progress" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(transparent, rgba(14,11,9,.9))', padding: '8px 6px 5px' }}>
                    <div style={{ fontSize: 9, color: '#b4a596', fontWeight: 600 }}>{p.date}</div>
                    {p.weight && <div style={{ fontSize: 8, color: 'rgba(180,165,150,.5)' }}>{p.weight} ק"ג</div>}
                  </div>
                  <button onClick={() => deletePhoto(p)}
                    style={{ position: 'absolute', top: 5, left: 5, width: 24, height: 24, background: 'rgba(131,39,39,.8)', border: 'none', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icons.x size={12} color="#f5ede8" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Add Measurement Modal */}
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="📊 מדידה חדשה">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <div style={{ gridColumn: '1 / -1' }}>
            <Label>תאריך</Label>
            <input type="date" className="form-input" value={mForm.date} onChange={e => setMForm(f => ({ ...f, date: e.target.value }))} />
          </div>
          {[
            { key: 'weight', label: 'משקל (ק"ג)', ph: '75' },
            { key: 'bodyFat', label: 'שומן גוף (%)', ph: '20' },
            { key: 'height', label: 'גובה (ס"מ)', ph: '170' },
            { key: 'visceral', label: 'שומן ויסצרלי', ph: '10' },
            { key: 'tbw', label: 'מים בגוף (%)', ph: '55' },
            { key: 'waist', label: 'מותן (ס"מ)', ph: '85' },
            { key: 'hips', label: 'ירכיים (ס"מ)', ph: '95' },
            { key: 'chest', label: 'חזה (ס"מ)', ph: '100' },
            { key: 'arm', label: 'זרוע (ס"מ)', ph: '32' },
            { key: 'thigh', label: 'ירך (ס"מ)', ph: '55' },
            { key: 'calf', label: 'שוק (ס"מ)', ph: '38' },
          ].map(f => (
            <div key={f.key}>
              <Label>{f.label}</Label>
              <input type="number" className="form-input" placeholder={f.ph}
                value={(mForm as any)[f.key] || ''}
                onChange={e => setMForm(prev => ({ ...prev, [f.key]: e.target.value ? +e.target.value : undefined }))} />
            </div>
          ))}
          <div style={{ gridColumn: '1 / -1' }}>
            <Label>הערות</Label>
            <textarea className="form-input" rows={2} placeholder="הערות..." style={{ resize: 'none' }}
              value={mForm.notes || ''} onChange={e => setMForm(f => ({ ...f, notes: e.target.value }))} />
          </div>
        </div>
        <button onClick={saveMeasurement} disabled={saving} className="btn-primary" style={{ marginTop: 14 }}>
          {saving ? <Spinner size={16} /> : '💾 שמור מדידה'}
        </button>
      </Modal>
    </div>
  );
};

// BMR calculation (Mifflin-St Jeor)
function calcBMR(weight: number, height: number, user: AppUser): number {
  const age = 35; // Default age
  const base = 10 * weight + 6.25 * height - 5 * age;
  return Math.round(base - 161); // Female formula
}

export default MeasurementsScreen;
