import { useEffect } from 'react';

interface Props {
  src: string;
  alt: string;
  onClose: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  onClaim?: () => void;
}

const NAV_BTN: React.CSSProperties = {
  position: 'absolute', top: '50%', transform: 'translateY(-50%)',
  background: 'rgba(255,255,255,0.12)',
  border: '1px solid rgba(255,255,255,0.22)',
  borderRadius: '50%', width: 48, height: 48,
  color: '#fff', fontSize: 22, cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  transition: 'background 0.15s',
  zIndex: 2,
  // keep arrows off-screen edges on small screens
  margin: '0 4px',
};

export default function Lightbox({ src, alt, onClose, onPrev, onNext, onClaim }: Props) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape')      onClose();
      if (e.key === 'ArrowLeft')   onPrev?.();
      if (e.key === 'ArrowRight')  onNext?.();
    };
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [onClose, onPrev, onNext]);

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.88)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '56px 72px 48px',
        cursor: 'zoom-out',
        backdropFilter: 'blur(4px)',
      }}
    >
      {/* Close */}
      <button
        onClick={onClose}
        style={{
          position: 'absolute', top: 14, right: 14,
          background: 'rgba(255,255,255,0.15)',
          border: '1px solid rgba(255,255,255,0.25)',
          borderRadius: '50%', width: 40, height: 40,
          color: '#fff', fontSize: 18, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 2,
        }}
        aria-label="Close"
      >✕</button>

      {/* Prev */}
      {onPrev && (
        <button
          onClick={e => { e.stopPropagation(); onPrev(); }}
          style={{ ...NAV_BTN, left: 12 }}
          aria-label="Previous photo"
        >‹</button>
      )}

      {/* Image */}
      <img
        src={src}
        alt={alt}
        onClick={e => e.stopPropagation()}
        style={{
          maxWidth: '100%', maxHeight: '100%',
          borderRadius: 10,
          boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
          cursor: 'default',
          objectFit: 'contain',
          transition: 'opacity 0.15s',
        }}
      />

      {/* Next */}
      {onNext && (
        <button
          onClick={e => { e.stopPropagation(); onNext(); }}
          style={{ ...NAV_BTN, right: 12 }}
          aria-label="Next photo"
        >›</button>
      )}

      {/* Claim button */}
      {onClaim && (
        <button
          onClick={e => { e.stopPropagation(); onClaim(); }}
          style={{
            position: 'absolute', bottom: alt ? 60 : 20,
            left: '50%', transform: 'translateX(-50%)',
            background: 'var(--accent)', color: '#fff',
            border: 'none', borderRadius: 8,
            padding: '10px 24px', fontSize: 14, fontWeight: 600,
            cursor: 'pointer', whiteSpace: 'nowrap',
            boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
            zIndex: 2,
          }}
        >
          Claim This Item
        </button>
      )}

      {/* Caption */}
      {alt && (
        <div style={{
          position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(0,0,0,0.55)', color: '#fff',
          padding: '6px 16px', borderRadius: 999,
          fontSize: 13, fontWeight: 500,
          whiteSpace: 'nowrap', maxWidth: '70vw',
          overflow: 'hidden', textOverflow: 'ellipsis',
          backdropFilter: 'blur(8px)',
          zIndex: 2,
        }}>
          {alt}
        </div>
      )}
    </div>
  );
}
