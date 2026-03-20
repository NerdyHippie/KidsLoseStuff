import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../api';
import type { Item, School } from '../types';
import ClaimModal from '../components/ClaimModal';
import Lightbox from '../components/Lightbox';
import LanguagePicker from '../components/LanguagePicker';
import { LOCALES, detectLocale, type Locale } from '../i18n';
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
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [locale, setLocale] = useState<Locale>(detectLocale);

  const t = LOCALES[locale];

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

  const lightboxItem = lightboxIndex !== null ? filtered[lightboxIndex] : null;

  if (loading) return (
    <div className={styles.center}><span className="spinner spinner-dark" /></div>
  );

  if (error || !school) return (
    <div className={styles.center}>
      <div className={styles.errorBox}>
        <div className={styles.errorIcon}>📭</div>
        <h2>{t.galleryNotFound}</h2>
        <p>{t.checkLink}</p>
      </div>
    </div>
  );

  return (
    <div className={styles.page}>
      {/* Hero */}
      <header className={styles.hero}>
        {/* Language picker — top-right corner */}
        <div className={styles.langPickerWrap}>
          <LanguagePicker locale={locale} onChange={setLocale} />
        </div>

        <div className={styles.heroInner}>
          <div className={styles.heroTag}>Kids Lose Stuff</div>
          <h1 className={styles.heroTitle}>{school.name}</h1>
          <p className={styles.heroSub}>
            {t.heroSub.split('Claim This Item').length > 1
              ? <>{t.heroSub.split(t.claimBtn)[0]}<strong>{t.claimBtn}</strong>{t.heroSub.split(t.claimBtn)[1]}</>
              : t.heroSub}
          </p>
          <div className={styles.heroBadge}>
            <span className={styles.dot} />
            {t.itemsWaiting(unclaimed)}
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
                {f === 'all'       ? t.filterAll(items.length) :
                 f === 'unclaimed' ? t.filterUnclaimed(items.filter(i => i.status === 'unclaimed').length) :
                                    t.filterClaimed(items.filter(i => i.status === 'claimed').length)}
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
              <p>{t.noItems(filter)}</p>
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
                      src={api.imageUrl(item.image_key ?? '')}
                      alt={item.description || 'Lost item'}
                      className={styles.img}
                      loading="lazy"
                      style={{ cursor: 'zoom-in' }}
                      onClick={() => setLightboxIndex(i)}
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
                        {t.claimedBadge.replace('✓ ', '')}
                      </div>
                    ) : (
                      <button
                        className="btn btn-accent"
                        style={{ width: '100%', justifyContent: 'center' }}
                        onClick={() => !claimedIds.has(item.id) && setClaimItem(item)}
                        disabled={claimedIds.has(item.id)}
                      >
                        {claimedIds.has(item.id) ? t.claimedBadge : t.claimBtn}
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
        <p>{t.footer}</p>
      </footer>

      {claimItem && (
        <ClaimModal
          item={claimItem}
          locale={locale}
          onClose={() => setClaimItem(null)}
          onClaimed={handleClaimed}
        />
      )}

      {lightboxItem && (
        <Lightbox
          src={api.imageUrl(lightboxItem.image_key ?? '')}
          alt={lightboxItem.description || 'Lost item'}
          onClose={() => setLightboxIndex(null)}
          onPrev={lightboxIndex! > 0 ? () => setLightboxIndex(i => i! - 1) : undefined}
          onNext={lightboxIndex! < filtered.length - 1 ? () => setLightboxIndex(i => i! + 1) : undefined}
          onClaim={lightboxItem.status === 'unclaimed' && !claimedIds.has(lightboxItem.id) ? () => {
            setClaimItem(lightboxItem);
            setLightboxIndex(null);
          } : undefined}
        />
      )}
    </div>
  );
}
