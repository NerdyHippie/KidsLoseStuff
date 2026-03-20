import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import type { School, FacultyMember } from '../types';
import styles from './AdminPanel.module.css';

export default function AdminPanel() {
  const [schools, setSchools]         = useState<School[]>([]);
  const [selected, setSelected]       = useState<School | null>(null);
  const [faculty, setFaculty]         = useState<FacultyMember[]>([]);
  const [loading, setLoading]         = useState(true);
  const [facultyLoading, setFLoding]  = useState(false);

  // New school form
  const [newName, setNewName]   = useState('');
  const [newSlug, setNewSlug]   = useState('');
  const [schoolErr, setSchoolErr] = useState('');
  const [schoolSaving, setSchoolSaving] = useState(false);

  // New faculty form
  const [fEmail, setFEmail]   = useState('');
  const [fName, setFName]     = useState('');
  const [fRole, setFRole]     = useState('staff');
  const [fErr, setFErr]       = useState('');
  const [fSaving, setFSaving] = useState(false);

  const loadSchools = async () => {
    setLoading(true);
    try {
      const d = await api.schools();
      setSchools(d.schools);
      if (d.schools.length > 0 && !selected) setSelected(d.schools[0]);
    } finally { setLoading(false); }
  };

  const loadFaculty = async (schoolId: string) => {
    setFLoding(true);
    try {
      const d = await api.getFaculty(schoolId);
      setFaculty(d.faculty);
    } finally { setFLoding(false); }
  };

  useEffect(() => { loadSchools(); }, []);
  useEffect(() => { if (selected) loadFaculty(selected.id); }, [selected]);

  const handleAddSchool = async () => {
    const name = newName.trim();
    const slug = newSlug.trim().toLowerCase().replace(/\s+/g, '-');
    if (!name || !slug) { setSchoolErr('Both fields required'); return; }
    setSchoolSaving(true); setSchoolErr('');
    try {
      const s = await api.createSchool(name, slug);
      setSchools(prev => [...prev, s as unknown as School]);
      setSelected(s as unknown as School);
      setNewName(''); setNewSlug('');
    } catch (e: unknown) {
      setSchoolErr(e instanceof Error ? e.message : 'Failed');
    } finally { setSchoolSaving(false); }
  };

  const handleAddFaculty = async () => {
    if (!selected) return;
    const email = fEmail.trim().toLowerCase();
    if (!email) { setFErr('Email required'); return; }
    setFSaving(true); setFErr('');
    try {
      const m = await api.addFaculty(selected.id, email, fName.trim(), fRole);
      setFaculty(prev => [...prev, m as unknown as FacultyMember]);
      setFEmail(''); setFName(''); setFRole('staff');
    } catch (e: unknown) {
      setFErr(e instanceof Error ? e.message : 'Failed');
    } finally { setFSaving(false); }
  };

  const handleRemoveFaculty = async (f: FacultyMember) => {
    if (!selected) return;
    if (!confirm(`Remove ${f.email} from ${selected.name}?`)) return;
    await api.removeFaculty(selected.id, f.id);
    setFaculty(prev => prev.filter(m => m.id !== f.id));
  };

  const galleryUrl = selected ? `${window.location.origin}/gallery/${selected.slug}` : '';

  return (
    <div className={styles.page}>
      <nav className="navbar">
        <div className="navbar-inner">
          <span className="navbar-brand">Kids Lose <span>Stuff</span> — Admin</span>
          <Link to="/dashboard" className="btn btn-ghost btn-sm" style={{ color: '#fff', borderColor: 'rgba(255,255,255,0.3)' }}>
            📊 View Dashboard
          </Link>
        </div>
      </nav>

      <div className="container" style={{ padding: '32px 20px' }}>
        <div className={styles.layout}>

          {/* ── Left: Schools ─────────────────────────────── */}
          <aside className={styles.sidebar}>
            <h2 className={styles.sectionTitle}>Schools</h2>

            {loading ? <span className="spinner spinner-dark" /> : (
              <ul className={styles.schoolList}>
                {schools.map(s => (
                  <li
                    key={s.id}
                    className={`${styles.schoolItem} ${selected?.id === s.id ? styles.schoolActive : ''}`}
                    onClick={() => setSelected(s)}
                  >
                    <span className={styles.schoolName}>{s.name}</span>
                    <span className={styles.schoolSlug}>/{s.slug}</span>
                  </li>
                ))}
              </ul>
            )}

            {/* Add school form */}
            <div className={`card ${styles.addForm}`}>
              <h3 className={styles.addTitle}>Add School</h3>
              <div className="field" style={{ marginBottom: 10 }}>
                <label>School Name</label>
                <input className="input" placeholder="Lincoln Elementary" value={newName}
                  onChange={e => { setNewName(e.target.value); setNewSlug(e.target.value.toLowerCase().replace(/\s+/g,'-').replace(/[^a-z0-9-]/g,'')); }} />
              </div>
              <div className="field" style={{ marginBottom: 10 }}>
                <label>URL Slug</label>
                <input className="input" placeholder="lincoln-elementary" value={newSlug}
                  onChange={e => setNewSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g,''))} />
                <span style={{ fontSize: 11, color: 'var(--muted)' }}>
                  Gallery will be at /gallery/{newSlug || '…'}
                </span>
              </div>
              {schoolErr && <p style={{ color: 'var(--danger)', fontSize: 13, marginBottom: 8 }}>{schoolErr}</p>}
              <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}
                onClick={handleAddSchool} disabled={schoolSaving}>
                {schoolSaving ? <span className="spinner" /> : '+ Add School'}
              </button>
            </div>
          </aside>

          {/* ── Right: Faculty ────────────────────────────── */}
          <main className={styles.main}>
            {!selected ? (
              <div className={styles.empty}>
                <p style={{ fontSize: 32 }}>🏫</p>
                <p>Select or create a school to manage its faculty.</p>
              </div>
            ) : (
              <>
                <div className={styles.schoolHeader}>
                  <div>
                    <h2 className={styles.schoolTitle}>{selected.name}</h2>
                    <a href={galleryUrl} target="_blank" rel="noreferrer" className={styles.galleryLink}>
                      🔗 {galleryUrl}
                    </a>
                  </div>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => { navigator.clipboard.writeText(galleryUrl); }}
                  >
                    Copy Link
                  </button>
                </div>

                <div className={`card ${styles.addFacultyForm}`}>
                  <h3 className={styles.addTitle}>Add Faculty Member</h3>
                  <div className={styles.facultyFormRow}>
                    <div className="field" style={{ flex: 2 }}>
                      <label>Google Email</label>
                      <input className="input" type="email" placeholder="teacher@school.edu"
                        value={fEmail} onChange={e => setFEmail(e.target.value)} />
                    </div>
                    <div className="field" style={{ flex: 2 }}>
                      <label>Display Name</label>
                      <input className="input" placeholder="Mrs. Smith (optional)"
                        value={fName} onChange={e => setFName(e.target.value)} />
                    </div>
                    <div className="field" style={{ flex: 1 }}>
                      <label>Role</label>
                      <select className="input" value={fRole} onChange={e => setFRole(e.target.value)}>
                        <option value="staff">Staff</option>
                        <option value="volunteer">Volunteer</option>
                        <option value="schooladmin">School Admin</option>
                      </select>
                    </div>
                    <div className="field" style={{ justifyContent: 'flex-end' }}>
                      <label style={{ visibility: 'hidden' }}>Add</label>
                      <button className="btn btn-primary" onClick={handleAddFaculty} disabled={fSaving}>
                        {fSaving ? <span className="spinner" /> : '+ Add'}
                      </button>
                    </div>
                  </div>
                  {fErr && <p style={{ color: 'var(--danger)', fontSize: 13, marginTop: 8 }}>{fErr}</p>}
                </div>

                <div className={styles.roleNote}>
                  <strong>Staff</strong> and <strong>Volunteer</strong> can upload items and mark them as returned.&nbsp;
                  <strong>School Admin</strong> can also manage the team for their school.
                </div>

                {facultyLoading ? (
                  <div style={{ padding: 40, textAlign: 'center' }}><span className="spinner spinner-dark" /></div>
                ) : faculty.length === 0 ? (
                  <div className={styles.empty}><p>No faculty members yet. Add one above.</p></div>
                ) : (
                  <div className={`card ${styles.facultyTableWrap}`}>
                    <table className={styles.table}>
                      <thead>
                        <tr>
                          <th>Email</th>
                          <th>Name</th>
                          <th>Role</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {faculty.map(f => (
                          <tr key={f.id}>
                            <td>{f.email}</td>
                            <td>{f.name || <span style={{ color: 'var(--muted)' }}>—</span>}</td>
                            <td>
                              <span className={`badge ${f.role === 'schooladmin' ? 'badge-claimed' : 'badge-unclaimed'}`}>
                                {f.role}
                              </span>
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              <button className="btn btn-danger btn-sm" onClick={() => handleRemoveFaculty(f)}>
                                Remove
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
