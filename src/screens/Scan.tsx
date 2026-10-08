import { useMemo, useRef, useState } from 'react';
import { Button, IngredientChip, ReceiptLine, ReceiptScan } from '../ds';
import { useApp } from '../ctx';
import { ingredientById, useCatalog } from '../catalog';
import { formatPrice } from '../i18n';
import { newEntry } from '../lib/pantry';
import { normalize, parseReceipt, type ParsedLine } from '../lib/receipt';
import { Sheet } from './Sheet';

type Phase = { k: 'start' } | { k: 'reading'; pct: number } | { k: 'review'; lines: ParsedLine[] };

export function Scan({ manual, onManualClose }: { manual: boolean; onManualClose: () => void }) {
  const { t, lang, update, toast, go } = useApp();
  const [phase, setPhase] = useState<Phase>({ k: 'start' });
  const [error, setError] = useState<string | null>(null);
  const [fixing, setFixing] = useState<string | null>(null);
  const camera = useRef<HTMLInputElement>(null);
  const upload = useRef<HTMLInputElement>(null);

  async function onFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    setPhase({ k: 'reading', pct: 0 });
    try {
      const { readReceipt } = await import('../lib/ocr');
      const text = await readReceipt(file, (pct) => setPhase({ k: 'reading', pct }));
      const lines = parseReceipt(text);
      if (lines.length === 0) {
        setError(t('nothingFound'));
        setPhase({ k: 'start' });
      } else setPhase({ k: 'review', lines });
    } catch (err) {
      console.error(err);
      setError(t('readError'));
      setPhase({ k: 'start' });
    }
  }

  function setLines(fn: (l: ParsedLine[]) => ParsedLine[]) {
    setPhase((p) => (p.k === 'review' ? { k: 'review', lines: fn(p.lines) } : p));
  }

  function confirm(lines: ParsedLine[]) {
    const keep = lines.filter((l) => l.status !== 'ignored');
    const now = Date.now();
    update((d) => ({
      ...d,
      lastReceiptAt: now,
      pantry: [...d.pantry, ...keep.map((l) => newEntry(l.ingredientId, { name: l.raw.toLowerCase(), quantity: l.quantity, source: 'receipt', now }))],
    }));
    toast(t('added', { n: keep.length }));
    setPhase({ k: 'start' });
    go('pantry');
  }

  const inputs = (
    <>
      <input ref={camera} type="file" accept="image/*" capture="environment" hidden onChange={(e) => { void onFile(e.target.files?.[0]); e.target.value = ''; }} />
      <input ref={upload} type="file" accept="image/jpeg,image/png,image/heic,image/webp,application/pdf,.pdf" hidden onChange={(e) => { void onFile(e.target.files?.[0]); e.target.value = ''; }} />
    </>
  );

  let body;
  if (phase.k === 'reading') {
    body = (
      <div className="reading" role="status">
        <div className="rf-meter-track"><div className="rf-meter-fill" style={{ inlineSize: `${phase.pct}%` }} /></div>
        <p className="muted">{t('reading', { pct: phase.pct })}</p>
      </div>
    );
  } else if (phase.k === 'review') {
    const kept = phase.lines.filter((l) => l.status !== 'ignored').length;
    body = (
      <>
        <h1 className="display">{t('reviewTitle')}</h1>
        <p className="muted">{t('reviewHint')}</p>
        <div className="lines">
          {phase.lines.map((l) => {
            const ing = l.ingredientId ? ingredientById(l.ingredientId) : undefined;
            return (
              <ReceiptLine
                key={l.id}
                name={
                  <button type="button" className="line-fix" onClick={() => setFixing(l.id)}>
                    {ing ? ing.name[lang] : l.raw.toLowerCase()}
                  </button>
                }
                raw={l.raw}
                quantity={l.quantity}
                price={l.price !== undefined ? formatPrice(l.price, lang) : undefined}
                status={l.status}
                statusLabel={t('checkLine')}
                toggleLabel={t('keepLine')}
                onToggle={() => setLines((ls) => ls.map((x) => (x.id === l.id ? { ...x, status: x.status === 'ignored' ? (x.ingredientId ? 'matched' : 'review') : 'ignored' } : x)))}
              />
            );
          })}
        </div>
        <div className="sheet-actions">
          <Button variant="primary" icon="check" block disabled={kept === 0} onClick={() => confirm(phase.lines)}>{t('addToFridge', { n: kept })}</Button>
          <Button variant="ghost" block onClick={() => setPhase({ k: 'start' })}>{t('cancel')}</Button>
        </div>
        {fixing && (
          <IngredientPicker
            onClose={() => setFixing(null)}
            onPick={(id) => {
              setLines((ls) => ls.map((x) => (x.id === fixing ? { ...x, ingredientId: id, status: 'matched' } : x)));
              setFixing(null);
            }}
          />
        )}
      </>
    );
  } else {
    body = (
      <>
        <ReceiptScan
          title={t('scanTitle')}
          hint={t('scanHint')}
          scanLabel={t('scanReceipt')}
          uploadLabel={t('uploadReceipt')}
          manualLabel={t('addByHand')}
          onScan={() => camera.current?.click()}
          onUpload={() => upload.current?.click()}
          onManual={() => go('scan', { manual: true })}
        />
        {error && <p className="error" role="alert">{error}</p>}
      </>
    );
  }

  return (
    <div className="screen">
      {inputs}
      {body}
      {manual && <ManualAdd onClose={onManualClose} />}
    </div>
  );
}

function useSearch(q: string) {
  const { lang } = useApp();
  const catalog = useCatalog();
  return useMemo(() => {
    const n = normalize(q).trim();
    const list = catalog.ingredients.slice().sort((a, b) => a.name[lang].localeCompare(b.name[lang], lang));
    return n ? list.filter((i) => normalize(Object.values(i.name).join(' ') + ' ' + i.keywords.join(' ')).includes(n)) : list;
  }, [q, lang, catalog]);
}

function IngredientPicker({ onPick, onClose }: { onPick: (id: string) => void; onClose: () => void }) {
  const { t, lang } = useApp();
  const [q, setQ] = useState('');
  const list = useSearch(q);
  return (
    <Sheet title={t('chooseIngredient')} onClose={onClose} closeLabel={t('close')}>
      <input className="field" autoFocus placeholder={t('search')} value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="rf-row picker">
        {list.map((i) => <IngredientChip key={i.id} state="have" onClick={() => onPick(i.id)}>{i.name[lang]}</IngredientChip>)}
      </div>
    </Sheet>
  );
}

function ManualAdd({ onClose }: { onClose: () => void }) {
  const { t, lang, update, toast } = useApp();
  const [q, setQ] = useState('');
  const [picked, setPicked] = useState<string | null>(null);
  const [qty, setQty] = useState('');
  const list = useSearch(q);
  const ing = picked ? ingredientById(picked) : undefined;

  function add() {
    const name = q.trim();
    if (!ing && !name) return;
    update((d) => ({ ...d, pantry: [...d.pantry, newEntry(ing ? ing.id : null, { name, quantity: qty.trim() || undefined, source: 'manual' })] }));
    toast(t('added', { n: 1 }));
    setPicked(null);
    setQ('');
    setQty('');
  }

  return (
    <Sheet title={t('manualTitle')} onClose={onClose} closeLabel={t('close')}>
      <label className="flabel">{t('ingredientName')}
        <input className="field" autoFocus placeholder={t('search')} value={ing ? ing.name[lang] : q} onChange={(e) => { setPicked(null); setQ(e.target.value); }} />
      </label>
      {!ing && (
        <div className="rf-row picker">
          {list.slice(0, 18).map((i) => <IngredientChip key={i.id} state="have" onClick={() => { setPicked(i.id); setQty(i.defaultQty || ''); }}>{i.name[lang]}</IngredientChip>)}
        </div>
      )}
      <label className="flabel">{t('quantity')}
        <input className="field" value={qty} placeholder={ing?.defaultQty} onChange={(e) => setQty(e.target.value)} />
      </label>
      <Button variant="primary" icon="plus" block disabled={!ing && !q.trim()} onClick={add}>{t('add')}</Button>
    </Sheet>
  );
}
