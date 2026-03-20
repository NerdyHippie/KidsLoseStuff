import { useEffect, useRef, useState } from 'react';
import { LOCALE_ORDER, LOCALES, type Locale } from '../i18n';
import styles from './LanguagePicker.module.css';

interface Props {
  locale: Locale;
  onChange: (l: Locale) => void;
}

export default function LanguagePicker({ locale, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  return (
    <div className={styles.root} ref={ref}>
      <button
        className={styles.trigger}
        onClick={() => setOpen(o => !o)}
        aria-label="Select language"
        aria-expanded={open}
      >
        <span className={styles.globe}>🌐</span>
        <span className={styles.langName}>{LOCALES[locale].langName}</span>
        <span className={styles.caret}>{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <ul className={styles.dropdown} role="listbox">
          {LOCALE_ORDER.map(l => (
            <li
              key={l}
              role="option"
              aria-selected={l === locale}
              className={`${styles.option} ${l === locale ? styles.active : ''}`}
              onClick={() => { onChange(l); setOpen(false); }}
            >
              {LOCALES[l].langName}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
