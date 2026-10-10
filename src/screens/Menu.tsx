import { useMemo, useState } from 'react';
import { Button, Icon } from '../ds';
import { recipeById, type Recipe } from '../catalog';
import { useApp } from '../ctx';
import { formatDay, type Lang, type T } from '../i18n';
import { addDays, dayKey, MEALS, mealsBetween, menuNeeds, parseDay, setMeal, weekDays, weekStart, type Meal, type MenuEntry } from '../lib/menu';
import { ingredientName, matchRecipes, uid } from '../lib/pantry';
import { normalize } from '../lib/receipt';
import { Sheet } from './Sheet';

/** "Lunch · Monday 12", for a meal of a day. */
export function mealLabel(date: string, meal: Meal, t: T, lang: Lang) {
  return `${t(meal)} · ${formatDay(parseDay(date), lang, { weekday: 'long', day: 'numeric' })}`;
}

/** A planned meal: its recipe, opened on tap, and a button to take it off the menu. */
export function MealRow({ entry, label, onRemove }: { entry: MenuEntry; label: string; onRemove?: () => void }) {
  const { t, lang, user, data, household, go } = useApp();
  const r = recipeById(entry.recipeId);
  const m = r && matchRecipes(data.pantry).find((x) => x.recipe.id === r.id);
  const by = entry.addedBy && entry.addedBy !== user.uid ? household?.members.find((x) => x.uid === entry.addedBy)?.name : undefined;
  return (
    <div className="mslot">
      <button type="button" className="mslot-main" disabled={!r} onClick={() => r && go('recipes', { recipe: r.id })}>
        <span className="mslot-meal">{label}</span>
        <span className="mslot-title">{r ? r.title[lang] : t('recipeGone')}</span>
        {r && (
          <span className="mslot-meta">
            {r.minutes} {t('min')}
            {m && ` · ${m.have.length}/${r.ingredients.length} ${t('ingr')}`}
            {by && ` · ${t('plannedBy', { name: by })}`}
          </span>
        )}
      </button>
      {onRemove && <button type="button" className="iconbtn" onClick={onRemove} aria-label={t('removeFromMenu')}><Icon name="x" size={18} /></button>}
    </div>
  );
}

export function Menu() {
  const { t, lang, user, data, update, toast } = useApp();
  const today = dayKey(new Date());
  const [offset, setOffset] = useState(0);
  const [picking, setPicking] = useState<{ date: string; meal: Meal } | null>(null);

  const start = addDays(weekStart(new Date(), lang), offset * 7);
  const days = weekDays(start);
  const from = dayKey(days[0]), to = dayKey(days[6]);
  const planned = mealsBetween(data.menu, from, to);
  // Only meals still to come need shopping for.
  const ahead = planned.filter((m) => m.date >= today);
  const needs = menuNeeds(ahead, recipeById, data.pantry, data.shopping);
  const range = `${formatDay(days[0], lang, { day: 'numeric', month: 'short' })} – ${formatDay(days[6], lang, { day: 'numeric', month: 'short' })}`;

  const remove = (id: string) => update((d) => ({ ...d, menu: d.menu.filter((m) => m.id !== id) }));
  const plan = (r: Recipe) => {
    if (!picking) return;
    const { date, meal } = picking;
    update((d) => ({ ...d, menu: setMeal(d.menu, date, meal, r.id, uid(), user.uid) }));
    setPicking(null);
  };
  const addNeeds = () => {
    update((d) => ({ ...d, shopping: [...d.shopping, ...needs.map((id) => ({ id: uid(), ingredientId: id, done: false, addedBy: user.uid }))] }));
    toast(t('addedNeeds', { n: needs.length }));
  };
  const clearWeek = () => {
    if (!window.confirm(t('confirmClearWeek'))) return;
    const ids = new Set(planned.map((m) => m.id));
    update((d) => ({ ...d, menu: d.menu.filter((m) => !ids.has(m.id)) }));
  };

  return (
    <div className="screen">
      <h1 className="display">{t('menuTitle')}</h1>
      <div className="weeknav">
        <button type="button" className="iconbtn" onClick={() => setOffset((o) => o - 1)} aria-label={t('prevWeek')}><Icon name="back" className="rtl-flip" /></button>
        <div className="weeknav-label">
          <b>{range}</b>
          {offset !== 0 && <button type="button" className="linkbtn" onClick={() => setOffset(0)}>{t('thisWeek')}</button>}
        </div>
        <button type="button" className="iconbtn" onClick={() => setOffset((o) => o + 1)} aria-label={t('nextWeek')}><Icon name="forward" className="rtl-flip" /></button>
      </div>

      {planned.length === 0 && <p className="muted">{t('menuEmpty')}</p>}

      {days.map((day) => {
        const date = dayKey(day);
        return (
          <section key={date} className={`mday${date === today ? ' mday-today' : ''}${date < today ? ' mday-past' : ''}`}>
            <h2 className="grouph">
              <span className="mday-name">{formatDay(day, lang, { weekday: 'long', day: 'numeric' })}</span>
              {date === today && <span className="mday-badge">{t('today')}</span>}
            </h2>
            {MEALS.map((meal) => {
              const entry = planned.find((m) => m.date === date && m.meal === meal);
              return entry ? (
                <MealRow key={meal} entry={entry} label={t(meal)} onRemove={() => remove(entry.id)} />
              ) : (
                <button key={meal} type="button" className="mslot mslot-empty" onClick={() => setPicking({ date, meal })}>
                  <span className="mslot-meal">{t(meal)}</span>
                  <span className="mslot-add"><Icon name="plus" size={16} />{t('pickRecipe')}</span>
                </button>
              );
            })}
          </section>
        );
      })}

      {ahead.length > 0 && (
        <div className="sheet-actions">
          {needs.length > 0
            ? <Button variant="secondary" icon="list" onClick={addNeeds}>{t('weekNeeds', { n: needs.length })}</Button>
            : <p className="muted">{t('weekReady')}</p>}
          {needs.length > 0 && <p className="muted">{needs.map((id) => ingredientName(id, lang)).join(', ')}</p>}
        </div>
      )}
      {planned.length > 0 && <Button variant="ghost" icon="x" onClick={clearWeek}>{t('clearWeek')}</Button>}

      {picking && <RecipePicker title={mealLabel(picking.date, picking.meal, t, lang)} onPick={plan} onClose={() => setPicking(null)} />}
    </div>
  );
}

const SHOWN = 30;

/** Picks a recipe for a meal: the ones the fridge covers best first, or a search by name. */
function RecipePicker({ title, onPick, onClose }: { title: string; onPick: (r: Recipe) => void; onClose: () => void }) {
  const { t, lang, data } = useApp();
  const [q, setQ] = useState('');
  const matches = useMemo(() => matchRecipes(data.pantry), [data.pantry]);
  const query = normalize(q).trim();
  const list = (query ? matches.filter((m) => Object.values(m.recipe.title).some((s) => normalize(s).includes(query))) : matches).slice(0, SHOWN);
  return (
    <Sheet title={title} onClose={onClose} closeLabel={t('close')}>
      <input className="field" type="search" placeholder={t('searchRecipe')} aria-label={t('searchRecipe')} value={q} onChange={(e) => setQ(e.target.value)} autoFocus />
      {list.length === 0 ? <p className="muted">{t('noRecipes')}</p> : (
        <div className="picker-list">
          {list.map(({ recipe: r, have }) => (
            <button key={r.id} type="button" className="mpick" onClick={() => onPick(r)}>
              <span className="mslot-title">{r.title[lang]}</span>
              <span className="mslot-meta">{t(r.course)} · {r.minutes} {t('min')} · {have.length}/{r.ingredients.length} {t('ingr')}</span>
            </button>
          ))}
        </div>
      )}
    </Sheet>
  );
}

/** From a recipe: plans it for a meal in the coming week. */
export function PlanSheet({ recipe, onClose }: { recipe: Recipe; onClose: () => void }) {
  const { t, lang, user, data, update, toast } = useApp();
  const days = weekDays(new Date());
  const plan = (date: string, meal: Meal) => {
    update((d) => ({ ...d, menu: setMeal(d.menu, date, meal, recipe.id, uid(), user.uid) }));
    toast(t('addedToMenu', { title: recipe.title[lang], when: mealLabel(date, meal, t, lang) }));
    onClose();
  };
  return (
    <Sheet title={t('addToMenu')} onClose={onClose} closeLabel={t('close')}>
      <p className="muted">{t('addToMenuHint')}</p>
      <div className="plan-days">
        {days.map((day) => {
          const date = dayKey(day);
          return (
            <div key={date} className="plan-day">
              <span className="plan-day-name">{formatDay(day, lang, { weekday: 'long', day: 'numeric' })}</span>
              <div className="filters">
                {MEALS.map((meal) => {
                  const current = data.menu.find((m) => m.date === date && m.meal === meal);
                  const here = current?.recipeId === recipe.id;
                  const other = current && !here ? recipeById(current.recipeId)?.title[lang] : undefined;
                  return (
                    <button key={meal} type="button" aria-pressed={here} title={other} onClick={() => plan(date, meal)}>
                      {t(meal)}{other && ' •'}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </Sheet>
  );
}
