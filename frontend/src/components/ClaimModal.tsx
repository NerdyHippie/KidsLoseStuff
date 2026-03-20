import { useState } from 'react';
import { api } from '../api';
import type { Item } from '../types';
import { LOCALES, type Locale } from '../i18n';

interface Props {
  item: Item;
  locale: Locale;
  onClose: () => void;
  onClaimed: (itemId: string) => void;
}

export default function ClaimModal({ item, locale, onClose, onClaimed }: Props) {
  const t = LOCALES[locale];
  const [initials, setInitials]   = useState('');
  const [teacher, setTeacher]     = useState('');
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const [confirmed, setConfirmed] = useState(false);

  const handleSubmit = async () => {
    const init = initials.trim().toUpperCase();
    const tchr = teacher.trim();
    if (!init) { setError(t.errorInitials); return; }
    if (!tchr) { setError(t.errorTeacher);  return; }
    setLoading(true); setError('');
    try {
      await api.claimItem(item.id, init, tchr);
      setConfirmed(true);
      setTimeout(() => onClaimed(item.id), 2000);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : t.errorGeneric);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        {confirmed ? (
          <div style={{ textAlign: 'center', padding: '8px 0' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
            <h2 style={{ marginBottom: 8 }}>{t.successTitle}</h2>
            <p style={{ color: 'var(--muted)', fontSize: 14 }}>{t.successBody}</p>
          </div>
        ) : (
          <>
            <h2>{t.claimTitle}</h2>
            <p className="subtitle">{t.claimSubtitle(item.description || '')}</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="field">
                <label htmlFor="initials">{t.initialsLabel}</label>
                <input
                  id="initials"
                  className="input"
                  placeholder={t.initialsPlaceholder}
                  value={initials}
                  maxLength={5}
                  onChange={e => setInitials(e.target.value)}
                  style={{ textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}
                />
                <span style={{ fontSize: 12, color: 'var(--muted)' }}>{t.initialsHint}</span>
              </div>

              <div className="field">
                <label htmlFor="teacher">{t.teacherLabel}</label>
                <input
                  id="teacher"
                  className="input"
                  placeholder={t.teacherPlaceholder}
                  value={teacher}
                  maxLength={80}
                  onChange={e => setTeacher(e.target.value)}
                />
              </div>

              {error && (
                <p style={{ color: 'var(--danger)', fontSize: 13, marginTop: -8 }}>{error}</p>
              )}
            </div>

            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={onClose}>{t.cancel}</button>
              <button
                className="btn btn-accent"
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? <span className="spinner" /> : t.submit}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
