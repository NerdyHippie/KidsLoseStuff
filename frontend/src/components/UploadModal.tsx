import { useState, useRef } from 'react';
import { api } from '../api';

interface Props {
  schoolId: string;
  onClose: () => void;
  onUploaded: () => void;
  onRefresh?: () => void;
}

export default function UploadModal({ schoolId, onClose, onUploaded, onRefresh }: Props) {
  const [file, setFile]               = useState<File | null>(null);
  const [preview, setPreview]         = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState('');
  const [successCount, setSuccessCount] = useState(0);
  const inputRef                      = useRef<HTMLInputElement>(null);

  const handleFile = (f: File) => {
    // Compress if needed (max 1200px) using canvas
    const reader = new FileReader();
    reader.onload = e => {
      const img = new Image();
      img.onload = () => {
        const MAX = 1200;
        const scale = Math.min(1, MAX / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width  = Math.round(img.width  * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(blob => {
          if (!blob) return;
          const compressed = new File([blob], f.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' });
          setFile(compressed);
          setPreview(URL.createObjectURL(compressed));
        }, 'image/jpeg', 0.82);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(f);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f?.type.startsWith('image/')) handleFile(f);
  };

  const reset = () => {
    setFile(null);
    setPreview(null);
    setDescription('');
    setError('');
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleSubmit = async (addAnother = false) => {
    if (!file) { setError('Please select a photo.'); return; }
    setLoading(true); setError('');
    try {
      await api.uploadItem(schoolId, description.trim(), file);
      if (addAnother) {
        onRefresh?.();
        setSuccessCount(c => c + 1);
        reset();
      } else {
        onUploaded();
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Upload failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 480 }}>
        <h2>Add Lost Item</h2>
        <p className="subtitle">
          Take or select a photo of the item, then add a short description.
          {successCount > 0 && (
            <span style={{
              marginLeft: 8,
              background: 'var(--success)', color: '#fff',
              borderRadius: 999, padding: '2px 10px',
              fontSize: 12, fontWeight: 600,
            }}>
              {successCount} added ✓
            </span>
          )}
        </p>

        {/* Drop zone */}
        <div
          onClick={() => inputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={e => e.preventDefault()}
          style={{
            border: `2px dashed ${preview ? 'var(--success)' : 'var(--border)'}`,
            borderRadius: 12, overflow: 'hidden',
            cursor: 'pointer', marginBottom: 20,
            minHeight: 180, display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            background: '#FAFAF8', transition: 'border-color 0.2s',
            position: 'relative',
          }}
        >
          {preview ? (
            <img src={preview} alt="preview" style={{ width: '100%', maxHeight: 280, objectFit: 'cover' }} />
          ) : (
            <div style={{ textAlign: 'center', padding: 24, color: 'var(--muted)' }}>
              <div style={{ fontSize: 40, marginBottom: 10 }}>📷</div>
              <p style={{ fontWeight: 600, fontSize: 14, color: 'var(--text)' }}>Tap to take or choose a photo</p>
              <p style={{ fontSize: 12, marginTop: 4 }}>Or drag & drop here</p>
            </div>
          )}
        </div>

        {/* Hidden file input — capture=environment opens camera on mobile */}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="environment"
          style={{ display: 'none' }}
          onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
        />

        {preview && (
          <button
            className="btn btn-ghost btn-sm"
            style={{ marginTop: -12, marginBottom: 16, fontSize: 12 }}
            onClick={reset}
          >
            ✕ Remove photo
          </button>
        )}

        <div className="field" style={{ marginBottom: 8 }}>
          <label htmlFor="desc">Description <span style={{ color: 'var(--muted)', fontWeight: 400 }}>(optional)</span></label>
          <input
            id="desc"
            className="input"
            placeholder="e.g. Blue Nike hoodie, size M"
            value={description}
            maxLength={200}
            onChange={e => setDescription(e.target.value)}
          />
          <span style={{ fontSize: 12, color: 'var(--muted)', textAlign: 'right' }}>
            {description.length}/200
          </span>
        </div>

        {error && <p style={{ color: 'var(--danger)', fontSize: 13, marginBottom: 8 }}>{error}</p>}

        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={onClose}>
            {successCount > 0 ? 'Done' : 'Cancel'}
          </button>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-ghost" onClick={() => handleSubmit(true)} disabled={loading || !file}>
              {loading ? <span className="spinner" /> : '+ Add Another'}
            </button>
            <button className="btn btn-primary" onClick={() => handleSubmit(false)} disabled={loading || !file}>
              {loading ? <span className="spinner" /> : '📤 Upload & Close'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
