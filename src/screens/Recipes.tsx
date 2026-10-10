import { useState } from 'react';
import { Button, Icon, IngredientChip, MatchMeter, RecipeBadges, RecipeCard, RecipeImage, type RecipeBadge } from '../ds';
import { COURSES, KASHRUT, recipeImage, sourceById, type Course, type Kashrut, type Recipe } from '../catalog';
import { useApp } from '../ctx';
import type { T } from '../i18n';
import { recipeUrl, share } from '../lib/links';
import { entryIngredientId, ingredientName, matchRecipes } from '../lib/pantry';
import { PlanSheet, RecipesSwitch } from './Menu';

const PAGE = 24;

export function recipeBadges(r: Recipe, t: T): RecipeBadge[] {
  return [{ label: t(r.course), tone: 'course' }, { label: t(r.kashrut), tone: r.kashrut }];
}

export function Recipes({ openId, onOpen }: { openId?: string; onOpen: (id?: string) => void }) {
  const { t, lang, user, data, update, toast } = useApp();
  const [course, setCourse] = useState<Course | null>(null);
  const [kashrut, setKashrut] = useState<Kashrut | null>(null);
  const [shown, setShown] = useState(PAGE);
  const [planning, setPlanning] = useState(false);
  const matches = matchRecipes(data.pantry);

  function addToList(ids: string[]) {
    update((d) => {
      const pending = new Set(d.shopping.filter((s) => !s.done).map(entryIngredientId));
      const add = ids.filter((id) => !pending.has(id)).map((id, i) => ({ id: `${id}-${Date.now()}-${i}`, ingredientId: id, done: false, addedBy: user.uid }));
      return { ...d, shopping: [...d.shopping, ...add] };
    });
    toast(t('addedToList', { name: ids.map((id) => ingredientName(id, lang)).join(', ') }));
  }

  const m = openId ? matches.find((x) => x.recipe.id === openId) : undefined;
  if (m) {
    const r = m.recipe;
    const qty = (ref: string) => r.ingredients.find((i) => i.ref === ref)?.qty;
    const source = sourceById(r.source.id);
    return (
      <div className="screen">
        <button type="button" className="backbtn" onClick={() => onOpen(undefined)}><Icon name="back" className="rtl-flip" />{t('back')}</button>
        <div className="detail-media"><RecipeImage src={recipeImage(r)} alt={r.title[lang]} /></div>
        <RecipeBadges badges={recipeBadges(r, t)} />
        <div className="titlerow">
          <h1 className="title">{r.title[lang]}</h1>
          <Button variant="secondary" size="sm" icon="share" onClick={() => void share({ title: r.title[lang], text: t('recipeShareText', { title: r.title[lang] }), url: recipeUrl(r.id) }, () => toast(t('linkCopied')))}>{t('share')}</Button>
        </div>
        <div className="rf-recipe-meta"><Icon name="clock" size={16} /><span>{r.minutes} {t('min')} · {t(r.difficulty)}</span></div>
        <MatchMeter have={m.have.length} total={r.ingredients.length} label={t('ingredients')} />
        <p className="muted">{t('servings', { n: r.servings })}</p>
        <Button variant="secondary" icon="calendar" onClick={() => setPlanning(true)}>{t('addToMenu')}</Button>
        {planning && <PlanSheet recipe={r} onClose={() => setPlanning(false)} />}
        {m.have.length > 0 && (
          <section className="sec">
            <h2 className="grouph">{t('youHave')}</h2>
            <div className="rf-row">{m.have.map((id) => <IngredientChip key={id} state="have" quantity={qty(id)}>{ingredientName(id, lang)}</IngredientChip>)}</div>
          </section>
        )}
        {m.missing.length > 0 && (
          <section className="sec">
            <h2 className="grouph">{t('youMiss')}</h2>
            <div className="rf-row">{m.missing.map((id) => <IngredientChip key={id} state="missing" quantity={qty(id)} onClick={() => addToList([id])}>{ingredientName(id, lang)}</IngredientChip>)}</div>
            <Button variant="secondary" icon="list" onClick={() => addToList(m.missing)}>{t('addMissing')}</Button>
          </section>
        )}
        <section className="sec">
          <h2 className="grouph">{t('steps')}</h2>
          <ol className="steps">{r.steps[lang].map((s, i) => <li key={i}>{s}</li>)}</ol>
        </section>
        {source && (
          <a className="source" href={r.source.url ?? source.url} target="_blank" rel="noopener noreferrer">
            <span className="source-label">{t('source')}</span>
            {source.logo && <img className="source-logo" src={source.logo} alt="" />}
            <span>{t('seeOnSource', { name: source.name })}</span>
          </a>
        )}
      </div>
    );
  }

  const list = matches.filter((x) => (!course || x.recipe.course === course) && (!kashrut || x.recipe.kashrut === kashrut));
  const pick = <V,>(set: (v: V) => void) => (v: V) => { set(v); setShown(PAGE); };

  return (
    <div className="screen">
      <h1 className="display">{t('recipesTitle')}</h1>
      <RecipesSwitch on="recipes" />
      <div className="filters" role="group" aria-label={t('allCourses')}>
        <button type="button" aria-pressed={course === null} onClick={() => pick(setCourse)(null)}>{t('allCourses')}</button>
        {COURSES.map((c) => <button key={c} type="button" aria-pressed={course === c} onClick={() => pick(setCourse)(course === c ? null : c)}>{t(c)}</button>)}
      </div>
      <div className="filters" role="group" aria-label={t('anyKashrut')}>
        {KASHRUT.map((k) => <button key={k} type="button" className={`filter-${k}`} aria-pressed={kashrut === k} onClick={() => pick(setKashrut)(kashrut === k ? null : k)}>{t(k)}</button>)}
      </div>
      {list.length === 0 && <p className="muted">{t('noRecipes')}</p>}
      <div className="cards">
        {list.slice(0, shown).map((x) => (
          <RecipeCard
            key={x.recipe.id}
            image={recipeImage(x.recipe)}
            imageAlt={x.recipe.title[lang]}
            badges={recipeBadges(x.recipe, t)}
            title={x.recipe.title[lang]}
            time={`${x.recipe.minutes} ${t('min')} · ${t(x.recipe.difficulty)}`}
            have={x.have.length}
            total={x.recipe.ingredients.length}
            matchLabel={t('ingredients')}
            readyLabel={t('allInFridge')}
            missingLabel={t('missingToBuy')}
            missing={x.missing.map((id) => ingredientName(id, lang))}
            onOpen={() => onOpen(x.recipe.id)}
            onMissing={(name) => {
              const id = x.missing.find((i) => ingredientName(i, lang) === name);
              if (id) addToList([id]);
            }}
          />
        ))}
      </div>
      {list.length > shown && <Button variant="secondary" onClick={() => setShown((n) => n + PAGE)}>{t('showMore')}</Button>}
    </div>
  );
}
