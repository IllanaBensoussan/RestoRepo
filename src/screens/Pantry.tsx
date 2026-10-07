import { useState } from 'react';
import { Button, PantryItem, ReceiptScan } from '../ds';
import { useApp } from '../ctx';
import { CATEGORIES, CATEGORY_ORDER } from '../data';
import { entryName, expiry, type PantryEntry } from '../lib/pantry';
import { Sheet } from './Sheet';

export function Pantry() {
  const { t, lang, data, update, go } = useApp();
  const [open, setOpen] = useState<PantryEntry | null>(null);
  const now = Date.now();

  if (data.pantry.length === 0) {
    return (
      <div className="screen">
        <h1 className="display">{t('pantryTitle')}</h1>
        <ReceiptScan
          title={t('pantryEmptyTitle')}
          hint={t('pantryEmptyHint')}
          scanLabel={t('scanReceipt')}
          uploadLabel={t('uploadReceipt')}
          manualLabel={t('addByHand')}
          onScan={() => go('scan')}
          onUpload={() => go('scan')}
          onManual={() => go('scan', { manual: true })}
        />
      </div>
    );
  }

  const groups = CATEGORY_ORDER.map((c) => ({ c, items: data.pantry.filter((e) => e.category === c).sort((a, b) => a.expiresAt - b.expiresAt) })).filter((g) => g.items.length);
  const remove = (id: string) => {
    update((d) => ({ ...d, pantry: d.pantry.filter((e) => e.id !== id) }));
    setOpen(null);
  };

  return (
    <div className="screen">
      <div className="titlerow">
        <h1 className="display">{t('pantryTitle')}</h1>
        <Button variant="secondary" size="sm" icon="plus" onClick={() => go('scan', { manual: true })}>{t('addByHand')}</Button>
      </div>
      {groups.map(({ c, items }) => (
        <section key={c} className="sec">
          <h2 className="grouph">{CATEGORIES[c][lang]}</h2>
          <div className="list">
            {items.map((e) => {
              const x = expiry(e, t, now);
              return <PantryItem key={e.id} name={entryName(e, lang)} quantity={e.quantity} meta={new Date(e.addedAt).toLocaleDateString(lang)} source={e.source} expiryTone={x.tone} expiryLabel={x.label} onClick={() => setOpen(e)} />;
            })}
          </div>
        </section>
      ))}
      {open && (
        <Sheet title={entryName(open, lang)} onClose={() => setOpen(null)} closeLabel={t('close')}>
          <p className="muted">{[open.quantity, CATEGORIES[open.category][lang], expiry(open, t, now).label].filter(Boolean).join(' · ')}</p>
          <div className="sheet-actions">
            <Button variant="primary" icon="check" block onClick={() => remove(open.id)}>{t('used')}</Button>
            <Button variant="secondary" icon="x" block onClick={() => remove(open.id)}>{t('remove')}</Button>
          </div>
        </Sheet>
      )}
    </div>
  );
}
