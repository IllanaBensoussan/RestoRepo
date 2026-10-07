import { Button, Icon, IngredientChip, MatchMeter, RecipeCard, RecipeImage } from '../ds';
import { useApp } from '../ctx';
import { ingredientName, matchRecipes } from '../lib/pantry';

export function Recipes({ openId, onOpen }: { openId?: string; onOpen: (id?: string) => void }) {
  const { t, lang, data, update, toast } = useApp();
  const matches = matchRecipes(data.pantry);

  function addToList(ids: string[]) {
    update((d) => {
      const pending = new Set(d.shopping.filter((s) => !s.done).map((s) => s.ingredientId));
      const add = ids.filter((id) => !pending.has(id)).map((id, i) => ({ id: `${id}-${Date.now()}-${i}`, ingredientId: id, done: false }));
      return { ...d, shopping: [...d.shopping, ...add] };
    });
    toast(t('addedToList', { name: ids.map((id) => ingredientName(id, lang)).join(', ') }));
  }

  const m = openId ? matches.find((x) => x.recipe.id === openId) : undefined;
  if (m) {
    const r = m.recipe;
    return (
      <div className="screen">
        <button type="button" className="backbtn" onClick={() => onOpen(undefined)}><Icon name="back" className="rtl-flip" />{t('back')}</button>
        <div className="detail-media"><RecipeImage src={r.image} alt={r.title[lang]} /></div>
        <h1 className="title">{r.title[lang]}</h1>
        <div className="rf-recipe-meta"><Icon name="clock" size={16} /><span>{r.minutes} {t('min')} · {t(r.difficulty)}</span></div>
        <MatchMeter have={m.have.length} total={r.ingredients.length} label={t('ingredients')} />
        {m.have.length > 0 && (
          <section className="sec">
            <h2 className="grouph">{t('youHave')}</h2>
            <div className="rf-row">{m.have.map((id) => <IngredientChip key={id} state="have">{ingredientName(id, lang)}</IngredientChip>)}</div>
          </section>
        )}
        {m.missing.length > 0 && (
          <section className="sec">
            <h2 className="grouph">{t('youMiss')}</h2>
            <div className="rf-row">{m.missing.map((id) => <IngredientChip key={id} state="missing" onClick={() => addToList([id])}>{ingredientName(id, lang)}</IngredientChip>)}</div>
            <Button variant="secondary" icon="list" onClick={() => addToList(m.missing)}>{t('addMissing')}</Button>
          </section>
        )}
        <section className="sec">
          <h2 className="grouph">{t('steps')}</h2>
          <ol className="steps">{r.steps[lang].map((s, i) => <li key={i}>{s}</li>)}</ol>
        </section>
      </div>
    );
  }

  return (
    <div className="screen">
      <h1 className="display">{t('recipesTitle')}</h1>
      <div className="cards">
        {matches.map((x) => (
          <RecipeCard
            key={x.recipe.id}
            image={x.recipe.image}
            imageAlt={x.recipe.title[lang]}
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
    </div>
  );
}
