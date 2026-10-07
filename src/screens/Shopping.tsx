import { useState } from 'react';
import { Button, Icon } from '../ds';
import { useApp } from '../ctx';
import { entryName, uid } from '../lib/pantry';

export function Shopping() {
  const { t, lang, data, update } = useApp();
  const [text, setText] = useState('');
  const items = data.shopping.slice().sort((a, b) => Number(a.done) - Number(b.done));

  const toggle = (id: string) => update((d) => ({ ...d, shopping: d.shopping.map((s) => (s.id === id ? { ...s, done: !s.done } : s)) }));
  const add = () => {
    const name = text.trim();
    if (!name) return;
    update((d) => ({ ...d, shopping: [...d.shopping, { id: uid(), ingredientId: null, name, done: false }] }));
    setText('');
  };

  return (
    <div className="screen">
      <h1 className="display">{t('listTitle')}</h1>
      <form className="addrow" onSubmit={(e) => { e.preventDefault(); add(); }}>
        <input className="field" placeholder={t('addItem')} value={text} onChange={(e) => setText(e.target.value)} />
        <Button type="submit" variant="secondary" icon="plus" aria-label={t('add')} />
      </form>
      {items.length === 0 ? (
        <p className="muted">{t('listEmpty')}</p>
      ) : (
        <div className="lines">
          {items.map((s) => (
            <div key={s.id} className={`rf-line${s.done ? ' rf-line-ignored' : ''}`}>
              <button type="button" className="rf-check" role="checkbox" aria-checked={s.done} aria-label={t('bought')} onClick={() => toggle(s.id)}>
                {s.done && <Icon name="check" size={16} />}
              </button>
              <div className="rf-line-main"><div className="rf-line-name">{entryName(s, lang)}</div></div>
            </div>
          ))}
        </div>
      )}
      {items.some((s) => s.done) && (
        <Button variant="ghost" icon="x" onClick={() => update((d) => ({ ...d, shopping: d.shopping.filter((s) => !s.done) }))}>{t('clearBought')}</Button>
      )}
    </div>
  );
}
