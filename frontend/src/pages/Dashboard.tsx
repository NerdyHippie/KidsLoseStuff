import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../App';
import { api } from '../api';
import type { Item, School, FacultyMember } from '../types';
import UploadModal from '../components/UploadModal';
import styles from './Dashboard.module.css';

export default function Dashboard() {
  const { me, refresh: refreshAuth } = useAuth();
  const [items, setItems]       = useState<Item[]>([]);
  const [loading, setLoading]   = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [filter, setFilter]     = useState<'all' | 'unclaimed' | 'claimed'>('all');
  const [schools, setSchools]   = useState<School[]>([]);
  const [selectedSchool, setSelectedSchool] = useState<string | null>(null);
  const [tab, setTab]           = useState<'items' | 'team'>('items');

  const effectiveSchoolId = selectedSchool ?? me?.schoolId ?? null;
  const canManageTeam = me?.role === 'schooladmin' || me?.role === 'superadmin';

  const loadItems = useCallback(async () => {
    if (!effectiveSchoolId) return;
    setLoading(true);
    try {
      const data = await api.dashboard(effectiveSchoolId);
      setItems(data.items);
    } catch { /* handled */ }
    finally { setLoading(false); }
  }, [effectiveSchoolId]);

  useEffect(() => {
    api.schools().then(d => {
      setSchools(d.schools);
      if (!selectedSchool && d.schools.length > 0) setSelectedSchool(d.schools[0].id);
    }).catch(() => {});
  }, [me]);

  useEffect(() => { loadItems(); }, [loadItems]);

  const handleDelete = async (itemId: string) => {
    if (!confirm('Mark as returned and permanently delete this item + photo?')) return;
    setDeleting(itemId);
    try {
      await api.deleteItem(itemId);
      setItems(prev => prev.filter(i => i.id !== itemId));
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Delete failed');
    } finally { setDeleting(null); }
  };

  const handleLogout = async () => {
    await api.logout();
    refreshAuth();
  };

  const currentSchool = schools.find(s => s.id === effectiveSchoolId);
  const filtered = items.filter(i => filter === 'all' ? true : i.status === filter);
  const unclaimed = items.filter(i => i.status === 'unclaimed').length;
  const claimed   = items.filter(i => i.status === 'claimed').length;

  return (
    <div className={styles.page}>
      {/* Navbar */}
      <nav className="navbar">
        <div className="navbar-inner">
          <span className="navbar-brand">Kids Lose <span>Stuff</span></span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {me?.role === 'superadmin' && (
              <Link to="/admin" className="btn btn-ghost btn-sm" style={{ color: '#fff', borderColor: 'rgba(255,255,255,0.3)' }}>
                ⚙️ Admin
              </Link>
            )}
            <span className={styles.userBadge}>{me?.email}</span>
            <button className="btn btn-ghost btn-sm" style={{ color: '#fff', borderColor: 'rgba(255,255,255,0.3)' }} onClick={handleLogout}>
              Sign out
            </button>
          </div>
        </div>
      </nav>

      <div className="container" style={{ padding: '32px 20px' }}>

        {/* School selector (superadmin only) */}
        {me?.role === 'superadmin' && schools.length > 0 && (
          <div className={styles.schoolBar}>
            <label htmlFor="school-select" style={{ fontSize: 13, fontWeight: 600 }}>School:</label>
            <select
              id="school-select"
              className="input"
              style={{ width: 'auto', minWidth: 200 }}
              value={selectedSchool ?? ''}
              onChange={e => setSelectedSchool(e.target.value)}
            >
              {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        )}

        {/* Header row */}
        <div className={styles.pageHeader}>
          <div>
            <h1 className={styles.pageTitle}>
              {me?.role === 'superadmin' ? (currentSchool?.name ?? 'Select a school') : (me?.schoolName ?? 'Dashboard')}
            </h1>
            <p className={styles.pageSub}>Manage lost items and process claims</p>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {currentSchool && (
              <a href={`/gallery/${currentSchool.slug}`} target="_blank" rel="noreferrer" className="btn btn-ghost">
                🔗 View Gallery
              </a>
            )}
            {effectiveSchoolId && (
              <button className="btn btn-accent" onClick={() => setShowUpload(true)}>
                + Add Item
              </button>
            )}
          </div>
        </div>

        {/* Stats row */}
        <div className={styles.stats}>
          <StatCard label="Total Items" value={items.length} icon="📦" />
          <StatCard label="Unclaimed"   value={unclaimed}    icon="⏳" color="var(--accent)" />
          <StatCard label="Claimed"     value={claimed}      icon="✅" color="var(--success)" />
        </div>

        {/* Tabs */}
        {canManageTeam && (
          <div className={styles.tabs}>
            <button className={`${styles.tab} ${tab === 'items' ? styles.tabActive : ''}`} onClick={() => setTab('items')}>
              📦 Items
            </button>
            <button className={`${styles.tab} ${tab === 'team' ? styles.tabActive : ''}`} onClick={() => setTab('team')}>
              👥 Manage Team
            </button>
          </div>
        )}

        {/* Items tab */}
        {tab === 'items' && (
          <>
            <div className={styles.filterRow}>
              {(['all', 'unclaimed', 'claimed'] as const).map(f => (
                <button
                  key={f}
                  className={`${styles.filterBtn} ${filter === f ? styles.filterActive : ''}`}
                  onClick={() => setFilter(f)}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                  {f !== 'all' && <span className={styles.filterCount}>
                    {f === 'unclaimed' ? unclaimed : claimed}
                  </span>}
                </button>
              ))}
            </div>

            {loading ? (
              <div className={styles.loadingCenter}><span className="spinner spinner-dark" /></div>
            ) : filtered.length === 0 ? (
              <div className={styles.empty}>
                <p className={styles.emptyIcon}>{filter === 'claimed' ? '🎉' : '📭'}</p>
                <p style={{ fontWeight: 600 }}>
                  {filter === 'claimed' ? 'No claimed items' : filter === 'unclaimed' ? 'No unclaimed items!' : 'No items yet'}
                </p>
                <p style={{ fontSize: 14, color: 'var(--muted)', marginTop: 8 }}>
                  {filter === 'all' && 'Add your first item with the button above.'}
                </p>
              </div>
            ) : (
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Photo</th>
                      <th>Description</th>
                      <th>Status</th>
                      <th>Claimed By</th>
                      <th>Homeroom Teacher</th>
                      <th>Added</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(item => (
                      <tr key={item.id} className={item.status === 'claimed' ? styles.claimedRow : ''}>
                        <td>
                          <img
                            src={`/api/images/${encodeURIComponent(item.image_key ?? '')}`}
                            alt={item.description}
                            className={styles.thumb}
                          />
                        </td>
                        <td className={styles.descCell}>{item.description}</td>
                        <td><span className={`badge badge-${item.status}`}>{item.status}</span></td>
                        <td className={styles.initialsCell}>
                          {item.initials ? <strong>{item.initials}</strong> : <span className={styles.dash}>—</span>}
                        </td>
                        <td>{item.teacher_name ?? <span className={styles.dash}>—</span>}</td>
                        <td className={styles.dateCell}>{formatDate(item.created_at)}</td>
                        <td>
                          <button
                            className="btn btn-success btn-sm"
                            disabled={deleting === item.id}
                            onClick={() => handleDelete(item.id)}
                            title="Mark as returned and delete permanently"
                          >
                            {deleting === item.id
                              ? <span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />
                              : '✓ Returned'}
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

        {/* Team tab */}
        {tab === 'team' && effectiveSchoolId && (
          <TeamPanel schoolId={effectiveSchoolId} />
        )}
      </div>

      {showUpload && effectiveSchoolId && (
        <UploadModal
          schoolId={effectiveSchoolId}
          onClose={() => setShowUpload(false)}
          onUploaded={() => { setShowUpload(false); loadItems(); }}
        />
      )}
    </div>
  );
}

// ── Team Panel ──────────────────────────────────────────────────────────────

function TeamPanel({ schoolId }: { schoolId: string }) {
  const [members, setMembers]   = useState<FacultyMember[]>([]);
  const [loading, setLoading]   = useState(true);
  const [fEmail, setFEmail]     = useState('');
  const [fName, setFName]       = useState('');
  const [fRole, setFRole]       = useState('staff');
  const [fErr, setFErr]         = useState('');
  const [fSaving, setFSaving]   = useState(false);

  const load = async () => {
    setLoading(true);
    try { const d = await api.getFaculty(schoolId); setMembers(d.faculty); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [schoolId]);

  const handleAdd = async () => {
    const email = fEmail.trim().toLowerCase();
    if (!email) { setFErr('Email required'); return; }
    setFSaving(true); setFErr('');
    try {
      const m = await api.addFaculty(schoolId, email, fName.trim(), fRole);
      setMembers(prev => [...prev, m as unknown as FacultyMember]);
      setFEmail(''); setFName(''); setFRole('staff');
    } catch (e: unknown) {
      setFErr(e instanceof Error ? e.message : 'Failed');
    } finally { setFSaving(false); }
  };

  const handleRemove = async (m: FacultyMember) => {
    if (!confirm(`Remove ${m.email}?`)) return;
    await api.removeFaculty(schoolId, m.id);
    setMembers(prev => prev.filter(x => x.id !== m.id));
  };

  const roleColor: Record<string, string> = {
    schooladmin: 'badge-claimed',
    staff:       'badge-unclaimed',
    volunteer:   'badge-unclaimed',
  };

  return (
    <div>
      <div className={`card ${styles.teamAddForm}`}>
        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 14 }}>Add Team Member</h3>
        <div className={styles.teamFormRow}>
          <div className="field" style={{ flex: 2 }}>
            <label>Google Email</label>
            <input className="input" type="email" placeholder="person@school.edu"
              value={fEmail} onChange={e => setFEmail(e.target.value)} />
          </div>
          <div className="field" style={{ flex: 2 }}>
            <label>Display Name <span style={{ color: 'var(--muted)', fontWeight: 400 }}>(optional)</span></label>
            <input className="input" placeholder="Mrs. Garcia"
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
            <button className="btn btn-primary" onClick={handleAdd} disabled={fSaving}>
              {fSaving ? <span className="spinner" /> : '+ Add'}
            </button>
          </div>
        </div>
        {fErr && <p style={{ color: 'var(--danger)', fontSize: 13, marginTop: 8 }}>{fErr}</p>}
        <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 10, borderTop: '1px solid var(--border)', paddingTop: 10 }}>
          <strong>Staff</strong> and <strong>Volunteer</strong> can upload items and mark them returned.&nbsp;
          <strong>School Admin</strong> can also manage the team.
        </p>
      </div>

      {loading ? (
        <div className={styles.loadingCenter}><span className="spinner spinner-dark" /></div>
      ) : members.length === 0 ? (
        <div className={styles.empty}><p>No team members yet.</p></div>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr><th>Email</th><th>Name</th><th>Role</th><th></th></tr>
            </thead>
            <tbody>
              {members.map(m => (
                <tr key={m.id}>
                  <td>{m.email}</td>
                  <td>{m.name || <span style={{ color: 'var(--muted)' }}>—</span>}</td>
                  <td><span className={`badge ${roleColor[m.role] ?? 'badge-unclaimed'}`}>{m.role}</span></td>
                  <td style={{ textAlign: 'right' }}>
                    <button className="btn btn-danger btn-sm" onClick={() => handleRemove(m)}>Remove</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────────────────────

function StatCard({ label, value, icon, color = 'var(--primary)' }: {
  label: string; value: number; icon: string; color?: string;
}) {
  return (
    <div className={`card ${styles.statCard}`}>
      <div className={styles.statIcon}>{icon}</div>
      <div className={styles.statValue} style={{ color }}>{value}</div>
      <div className={styles.statLabel}>{label}</div>
    </div>
  );
}

function formatDate(ts: number): string {
  return new Date(ts * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

