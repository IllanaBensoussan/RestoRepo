import { useState } from 'react';
import { Button, Icon } from '../ds';
import { useApp } from '../ctx';
import { entryIngredientId, entryName, findIngredient, newEntry, uid } from '../lib/pantry';

export function Shopping() {
  const { t, lang, user, data, update, household, shareInvite, toast } = useApp();
  const [text, setText] = useState('');
  const [unknown, setUnknown] = useState(false);
  const items = data.shopping.slice().sort((a, b) => Number(a.done) - Number(b.done));
  const memberName = (id?: string) => household?.members.find((m) => m.uid === id)?.name;

  const toggle = (id: string) => update((d) => ({ ...d, shopping: d.shopping.map((s) => (s.id === id ? { ...s, done: !s.done } : s)) }));
  const add = () => {
    const name = text.trim();
    if (!name) return;
    // Only catalogue ingredients go on the list, so recipes can tell they are on it.
    const ingredientId = findIngredient(name);
    if (!ingredientId) return setUnknown(true);
    update((d) => (d.shopping.some((s) => s.ingredientId === ingredientId && !s.done) ? d : { ...d, shopping: [...d.shopping, { id: uid(), ingredientId, done: false, addedBy: user.uid }] }));
    setText('');
  };
  // Bought items go into the household's fridge, with the catalogue's usual quantity and shelf life.
  const store = () => {
    const ids = data.shopping.filter((s) => s.done).map(entryIngredientId).filter((id): id is string => Boolean(id));
    update((d) => ({ ...d, pantry: [...d.pantry, ...ids.map((id) => newEntry(id, { source: 'manual' }))], shopping: d.shopping.filter((s) => !s.done) }));
    toast(t('storedBought', { n: ids.length }));
  };

  return (
    <div className="screen">
      <div className="titlerow">
        <h1 className="display">{t('listTitle')}</h1>
        {household && <Button variant="secondary" size="sm" icon="share" onClick={shareInvite}>{t('shareList')}</Button>}
      </div>
      {household && household.members.length <= 1 && <p className="muted">{t('listShareHint')}</p>}
      <form className="addrow" onSubmit={(e) => { e.preventDefault(); add(); }}>
        <input className="field" placeholder={t('addItem')} value={text} onChange={(e) => { setText(e.target.value); setUnknown(false); }} />
        <Button type="submit" variant="secondary" icon="plus" aria-label={t('add')} />
      </form>
      {unknown && <p className="error" role="alert">{t('unknownIngredient')}</p>}
      {items.length === 0 ? (
        <p className="muted">{t('listEmpty')}</p>
      ) : (
        <div className="lines">
          {items.map((s) => {
            const by = s.addedBy !== user.uid ? memberName(s.addedBy) : undefined;
            return (
              <div key={s.id} className={`rf-line${s.done ? ' rf-line-ignored' : ''}`}>
                <button type="button" className="rf-check" role="checkbox" aria-checked={s.done} aria-label={t('bought')} onClick={() => toggle(s.id)}>
                  {s.done && <Icon name="check" size={16} />}
                </button>
                <div className="rf-line-main">
                  <div className="rf-line-name">{entryName(s, lang)}</div>
                  {by && <div className="line-by">{t('addedBy', { name: by })}</div>}
                </div>
              </div>
            );
          })}
        </div>
      )}
      {items.some((s) => s.done) && (
        <div className="sheet-actions">
          <Button variant="secondary" icon="fridge" onClick={store}>{t('storeBought')}</Button>
          <Button variant="ghost" icon="x" onClick={() => update((d) => ({ ...d, shopping: d.shopping.filter((s) => !s.done) }))}>{t('clearBought')}</Button>
        </div>
      )}
    </div>
  );
}
