import { useEffect, type ReactNode } from 'react';
import { Icon } from '../ds';

export function Sheet({ title, onClose, closeLabel, children }: { title: string; onClose: () => void; closeLabel: string; children: ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="sheet-wrap" onClick={onClose}>
      <div className="sheet" role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <div className="sheet-h">
          <h2>{title}</h2>
          <button type="button" className="iconbtn" onClick={onClose} aria-label={closeLabel}><Icon name="x" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}
