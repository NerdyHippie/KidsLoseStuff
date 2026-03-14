import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../api';
import type { Item, School } from '../types';
import ClaimModal from '../components/ClaimModal';
import styles from './Gallery.module.css';

export default function Gallery() {
  const { slug } = useParams<{ slug: string }>();
  const [school, setSchool] = useState<School | null>(null);
  const [items, setItems]   = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState('');
  const [claimItem, setClaimItem] = useState<Item | null>(null);
  const [claimedIds, setClaimedIds] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<'all' | 'unclaimed' | 'claimed'>('all');

  useEffect(() => {
    if (!slug) return;
    api.gallery(slug)
      .then(d => { setSchool(d.school); setItems(d.items); })
      .catch(() => setError('Gallery not found.'))
      .finally(() => setLoading(false));
  }, [slug]);

  const handleClaimed = (itemId: string) => {
    setClaimedIds(prev => new Set([...prev, itemId]));
    setItems(prev => prev.map(i => i.id === itemId ? { ...i, status: 'claimed' } : i));
    setClaimItem(null);
  };

  const filtered = items.filter(i => filter === 'all' ? true : i.status === filter);
  const unclaimed = items.filter(i => i.status === 'unclaimed').length;

  if (loading) return (
    <div className={styles.center}><span className="spinner spinner-dark" /></div>
  );

  if (error || !school) return (
    <div className={styles.center}>
      <div className={styles.errorBox}>
        <div className={styles.errorIcon}>📭</div>
        <h2>Gallery not found</h2>
        <p>Check the link and try again.</p>
      </div>
    </div>
  );

  return (
    <div className={styles.page}>
      {/* Hero */}
      <header className={styles.hero}>
        <div className={styles.heroInner}>
          <div className={styles.heroTag}>Kids Lose Stuff</div>
          <h1 className={styles.heroTitle}>{school.name}</h1>
          <p className={styles.heroSub}>
            Recognize something? Tap <strong>Claim This Item</strong> and enter your
            child's initials and teacher's name — we'll get it back to their homeroom.
          </p>
          <div className={styles.heroBadge}>
            <span className={styles.dot} />
            <strong>{unclaimed}</strong>&nbsp;item{unclaimed !== 1 ? 's' : ''} waiting to be claimed
          </div>
        </div>
        <div className={styles.heroWave}>
          <svg viewBox="0 0 1440 60" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0,30 C360,60 1080,0 1440,30 L1440,60 L0,60 Z" fill="#FAF8F4"/>
          </svg>
        </div>
      </header>

      {/* Filter bar */}
      <div className={styles.filterBar}>
        <div className="container">
          <div className={styles.filters}>
            {(['all', 'unclaimed', 'claimed'] as const).map(f => (
              <button
                key={f}
                className={`${styles.filterBtn} ${filter === f ? styles.filterActive : ''}`}
                onClick={() => setFilter(f)}
              >
                {f === 'all' ? `All (${items.length})` :
                 f === 'unclaimed' ? `Unclaimed (${items.filter(i=>i.status==='unclaimed').length})` :
                 `Claimed (${items.filter(i=>i.status==='claimed').length})`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid */}
      <main className={styles.main}>
        <div className="container">
          {filtered.length === 0 ? (
            <div className={styles.empty}>
              <p className={styles.emptyIcon}>🎉</p>
              <p>No {filter !== 'all' ? filter : ''} items right now!</p>
            </div>
          ) : (
            <div className={styles.grid}>
              {filtered.map((item, i) => (
                <article
                  key={item.id}
                  className={`${styles.itemCard} card`}
                  style={{ animationDelay: `${i * 40}ms` }}
                >
                  <div className={styles.imgWrap}>
                    <img
                      src={`/api/images/${encodeURIComponent(item.image_key ?? '')}`}
                      alt={item.description}
                      className={styles.img}
                      loading="lazy"
                    />
                    <div className={styles.statusBadge}>
                      <span className={`badge badge-${item.status}`}>{item.status}</span>
                    </div>
                  </div>
                  <div className={styles.cardBody}>
                    <p className={styles.desc}>{item.description}</p>
                    {item.status === 'claimed' ? (
                      <div className={styles.claimInfo}>
                        <span className={styles.claimIcon}>✓</span>
                        Claimed by <strong>{item.initials}</strong> · {item.teacher_name}'s class
                      </div>
                    ) : (
                      <button
                        className="btn btn-accent"
                        style={{ width: '100%', justifyContent: 'center' }}
                        onClick={() => !claimedIds.has(item.id) && setClaimItem(item)}
                        disabled={claimedIds.has(item.id)}
                      >
                        {claimedIds.has(item.id) ? '✓ Claimed' : 'Claim This Item'}
                      </button>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className={styles.footer}>
        <p>Items are removed from this gallery once they've been returned to their owner.</p>
      </footer>

      {claimItem && (
        <ClaimModal
          item={claimItem}
          onClose={() => setClaimItem(null)}
          onClaimed={handleClaimed}
        />
      )}
    </div>
  );
}
