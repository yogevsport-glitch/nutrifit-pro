import React, { useState, useEffect, useRef } from 'react';
import { collection, addDoc, getDocs, deleteDoc, doc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';
import { Exercise } from '../types';
import { Icons, Modal, Label, Empty, Spinner } from '../components/UI';

const CATEGORIES = ['הכל','חזה','גב','כתפיים','ביצפס','טריצפס','רגל קדמית','רגל אחורית','ישבן','ליבה','אירובי'];

const defaultForm: Partial<Exercise> = {
  name: '', muscleGroup: 'חזה', equipment: '', description: '',
  sets: '4', reps: '10-12', weight: '', rest: '90 שניות',
};

const ExercisesScreen: React.FC = () => {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('הכל');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [form, setForm] = useState<Partial<Exercise>>(defaultForm);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const q = query(collection(db, 'exercises'), orderBy('name'));
    getDocs(q).then(snap => {
      setExercises(snap.docs.map(d => ({ id: d.id, ...d.data() } as Exercise)));
      setLoading(false);
    });
  }, []);

  const filtered = exercises.filter(e => {
    const matchCat = category === 'הכל' || e.muscleGroup === category;
    const matchSearch = !search || e.name.includes(search) || (e.muscleGroup || '').includes(search);
    return matchCat && matchSearch;
  });

  const handleAdd = async () => {
    if (!form.name?.trim()) { alert('נא להזין שם תרגיל'); return; }
    setSaving(true);
    try {
      let videoUrl = form.videoUrl;
      if (videoFile) {
        setUploading(true);
        const storageRef = ref(storage, `videos/${Date.now()}_${videoFile.name}`);
        await uploadBytes(storageRef, videoFile);
        videoUrl = await getDownloadURL(storageRef);
        setUploading(false);
      }
      const newEx = await addDoc(collection(db, 'exercises'), { ...form, videoUrl, createdAt: serverTimestamp() });
      setExercises(prev => [...prev, { ...form, videoUrl, id: newEx.id } as Exercise]);
      setIsAddOpen(false);
      setForm(defaultForm);
      setVideoFile(null);
    } catch (e: any) { alert('שגיאה: ' + e.message); }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('למחוק תרגיל זה?')) return;
    await deleteDoc(doc(db, 'exercises', id));
    setExercises(prev => prev.filter(e => e.id !== id));
  };

  return (
    <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 11, color: 'rgba(180,165,150,.4)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 2 }}>מאגר</div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: '#b4a596' }}>תרגילים</h2>
        </div>
        <button onClick={() => setIsAddOpen(true)} className="btn-primary" style={{ width: 'auto', padding: '9px 14px', fontSize: 12 }}>
          <Icons.plus size={15} /> תרגיל חדש
        </button>
      </div>

      {/* Search */}
      <div style={{ position: 'relative' }}>
        <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)' }}>
          <Icons.search size={15} color="rgba(180,165,150,.4)" />
        </div>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="חפש תרגיל..." className="form-input" style={{ paddingRight: 36 }} />
      </div>

      {/* Categories */}
      <div className="sub-tabs">
        {CATEGORIES.map(c => (
          <button key={c} onClick={() => setCategory(c)} className={`sub-tab ${category === c ? 'active' : ''}`}>{c}</button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: 80 }} />)}
        </div>
      ) : filtered.length === 0 ? (
        <Empty icon={<Icons.dumbbell size={36} />}
          text={search || category !== 'הכל' ? 'לא נמצאו תרגילים' : 'המאגר ריק — הוסף תרגיל ראשון'}
          action={<button onClick={() => setIsAddOpen(true)} className="btn-primary" style={{ width: 'auto', padding: '9px 18px', fontSize: 12, margin: '0 auto' }}>+ הוסף תרגיל</button>} />
      ) : (
        filtered.map(ex => (
          <div key={ex.id} className="card" style={{ display: 'flex', gap: 12 }}>
            <div style={{ width: 44, height: 44, background: 'rgba(131,39,39,.12)', border: '1px solid rgba(131,39,39,.2)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icons.dumbbell size={20} color="#832727" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#b4a596', marginBottom: 3 }}>{ex.name}</div>
              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 4 }}>
                {[ex.muscleGroup, ex.equipment].filter(Boolean).map(tag => (
                  <span key={tag} style={{ fontSize: 9, color: 'rgba(180,165,150,.5)', background: 'rgba(180,165,150,.07)', padding: '2px 7px', borderRadius: 8 }}>{tag}</span>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 10, fontSize: 10, color: 'rgba(180,165,150,.4)' }}>
                {ex.sets && <span>סטים: {ex.sets}</span>}
                {ex.reps && <span>חזרות: {ex.reps}</span>}
                {ex.rest && <span>מנוחה: {ex.rest}</span>}
              </div>
              {ex.videoUrl && (
                <a href={ex.videoUrl} target="_blank" rel="noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 5, fontSize: 10, color: '#832727' }}>
                  <Icons.video size={12} color="#832727" /> צפה בסרטון
                </a>
              )}
            </div>
            <button onClick={() => handleDelete(ex.id)} className="btn-icon" style={{ width: 30, height: 30, alignSelf: 'flex-start' }}>
              <Icons.trash size={13} color="rgba(180,165,150,.4)" />
            </button>
          </div>
        ))
      )}

      {/* Add Modal */}
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="💪 תרגיל חדש">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div>
            <Label>שם תרגיל *</Label>
            <input className="form-input" placeholder="שם התרגיל" value={form.name || ''} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div>
              <Label>קבוצת שריר</Label>
              <select className="form-input" value={form.muscleGroup || ''} onChange={e => setForm(f => ({ ...f, muscleGroup: e.target.value }))}>
                {CATEGORIES.filter(c => c !== 'הכל').map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <Label>ציוד</Label>
              <input className="form-input" placeholder="מוט, משקולות..." value={form.equipment || ''} onChange={e => setForm(f => ({ ...f, equipment: e.target.value }))} />
            </div>
            <div>
              <Label>סטים</Label>
              <input className="form-input" placeholder="4" value={form.sets || ''} onChange={e => setForm(f => ({ ...f, sets: e.target.value }))} />
            </div>
            <div>
              <Label>חזרות</Label>
              <input className="form-input" placeholder="8-12" value={form.reps || ''} onChange={e => setForm(f => ({ ...f, reps: e.target.value }))} />
            </div>
            <div>
              <Label>משקל</Label>
              <input className="form-input" placeholder="60kg" value={form.weight || ''} onChange={e => setForm(f => ({ ...f, weight: e.target.value }))} />
            </div>
            <div>
              <Label>מנוחה</Label>
              <input className="form-input" placeholder="90 שניות" value={form.rest || ''} onChange={e => setForm(f => ({ ...f, rest: e.target.value }))} />
            </div>
          </div>
          <div>
            <Label>תיאור / הוראות ביצוע</Label>
            <textarea className="form-input" rows={3} placeholder="הוראות ביצוע..." style={{ resize: 'none' }}
              value={form.description || ''} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>
          <div>
            <Label>קישור לסרטון YouTube (או העלה קובץ)</Label>
            <input className="form-input" placeholder="https://youtube.com/..." value={form.videoUrl || ''}
              onChange={e => setForm(f => ({ ...f, videoUrl: e.target.value }))} />
          </div>
          <div>
            <Label>או העלה קובץ וידאו</Label>
            <input ref={fileRef} type="file" accept="video/*" style={{ display: 'none' }}
              onChange={e => setVideoFile(e.target.files?.[0] || null)} />
            <button onClick={() => fileRef.current?.click()} className="btn-ghost" style={{ textAlign: 'center' }}>
              <Icons.upload size={15} />
              {videoFile ? videoFile.name : 'בחר קובץ וידאו'}
            </button>
          </div>
          <button onClick={handleAdd} disabled={saving || uploading} className="btn-primary">
            {saving || uploading ? <Spinner size={16} /> : <><Icons.plus size={16} /> שמור תרגיל</>}
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default ExercisesScreen;
