import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../App';
import { api } from '../api';
import type { Item, School } from '../types';
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
  const [copied, setCopied]     = useState(false);

  const effectiveSchoolId = selectedSchool ?? me?.schoolId ?? null;

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
    if (me?.role === 'superadmin') {
      api.schools().then(d => {
        setSchools(d.schools);
        if (!selectedSchool && d.schools.length > 0) setSelectedSchool(d.schools[0].id);
      });
    } else {
      loadItems();
    }
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

  const copyGalleryLink = () => {
    const school = schools.find(s => s.id === effectiveSchoolId);
    const slug   = school?.slug ?? '';
    if (!slug) return;
    navigator.clipboard.writeText(`${window.location.origin}/gallery/${slug}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const currentSchool = schools.find(s => s.id === effectiveSchoolId);
  const gallerySlug   = me?.role === 'superadmin'
    ? currentSchool?.slug
    : undefined; // staff use the share button which reads from their schoolId

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
            <ShareButton schoolId={effectiveSchoolId} schools={schools} me={me} />
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

        {/* Filter bar */}
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

        {/* Items table */}
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

function ShareButton({ schoolId, schools, me }: {
  schoolId: string | null;
  schools: import('../types').School[];
  me: import('../types').Me | null;
}) {
  const [copied, setCopied] = useState(false);

  const getSlug = () => {
    if (me?.role === 'superadmin') return schools.find(s => s.id === schoolId)?.slug ?? '';
    // For staff/schooladmin, we need to find the slug from schools or rely on a stored slug
    // Since staff only have one school we can request gallery via the dashboard
    return schools.find(s => s.id === schoolId)?.slug ?? '';
  };

  const copy = () => {
    const slug = getSlug();
    if (!slug) return;
    navigator.clipboard.writeText(`${window.location.origin}/gallery/${slug}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // For non-superadmin, fetch school info once
  const [slug, setSlug] = useState('');
  useEffect(() => {
    if (me?.role !== 'superadmin' && schoolId) {
      // fetch schools list to get slug — use dashboard which returns school info
      api.schools().then(d => {
        const s = d.schools.find(s => s.id === schoolId);
        if (s) setSlug(s.slug);
      }).catch(() => {
        // staff can't list all schools — use a workaround: we store the slug in the JWT or
        // the gallery link is displayed on the admin panel; for staff, show gallery link differently
      });
    }
  }, [schoolId, me?.role]);

  const effectiveSlug = me?.role === 'superadmin' ? getSlug() : slug;

  if (!effectiveSlug) return null;

  return (
    <a
      href={`/gallery/${effectiveSlug}`}
      target="_blank"
      rel="noreferrer"
      className="btn btn-ghost"
    >
      🔗 View Gallery
    </a>
  );
}

function formatDate(ts: number): string {
  return new Date(ts * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
