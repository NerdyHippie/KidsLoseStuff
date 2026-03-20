import { useState } from 'react';
import { api } from '../api';
import type { Item } from '../types';

interface Props {
  item: Item;
  onClose: () => void;
  onClaimed: (itemId: string) => void;
}

export default function ClaimModal({ item, onClose, onClaimed }: Props) {
  const [initials, setInitials]       = useState('');
  const [teacher, setTeacher]         = useState('');
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState('');
  const [confirmed, setConfirmed]     = useState(false);

  const handleSubmit = async () => {
    const init = initials.trim().toUpperCase();
    const tchr = teacher.trim();
    if (!init) { setError('Please enter your child\'s initials.'); return; }
    if (!tchr) { setError('Please enter the teacher\'s name.'); return; }
    setLoading(true); setError('');
    try {
      await api.claimItem(item.id, init, tchr);
      setConfirmed(true);
      setTimeout(() => onClaimed(item.id), 2000);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
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
            <h2 style={{ marginBottom: 8 }}>Claim Recorded!</h2>
            <p style={{ color: 'var(--muted)', fontSize: 14 }}>
              Faculty will deliver the item to the homeroom. Keep an eye out!
            </p>
          </div>
        ) : (
          <>
            <h2>Claim This Item</h2>
            <p className="subtitle">
              "{item.description}" — enter your child's initials and teacher's name.
              Faculty will drop it off at their homeroom.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="field">
                <label htmlFor="initials">Child's Initials</label>
                <input
                  id="initials"
                  className="input"
                  placeholder="e.g. A.M."
                  value={initials}
                  maxLength={5}
                  onChange={e => setInitials(e.target.value)}
                  style={{ textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}
                />
                <span style={{ fontSize: 12, color: 'var(--muted)' }}>
                  First and last initials only — no full name needed.
                </span>
              </div>

              <div className="field">
                <label htmlFor="teacher">Teacher's Name</label>
                <input
                  id="teacher"
                  className="input"
                  placeholder="e.g. Mrs. Smith"
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
              <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
              <button
                className="btn btn-accent"
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? <span className="spinner" /> : 'Submit Claim'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
