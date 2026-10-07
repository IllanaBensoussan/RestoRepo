import { Button, Icon, PantryItem, RecipeCard } from '../ds';
import { useApp } from '../ctx';
import { CATEGORIES } from '../data';
import { formatDate } from '../i18n';
import { daysLeft, entryName, expiry, ingredientName, matchRecipes, startOfDay } from '../lib/pantry';

export function Home() {
  const { t, lang, user, data, go, update, toast } = useApp();
  const now = Date.now();
  const fresh = data.pantry.filter((e) => daysLeft(e, now) >= 0);
  const soon = fresh.filter((e) => daysLeft(e, now) <= 3).sort((a, b) => a.expiresAt - b.expiresAt);
  const matches = matchRecipes(data.pantry, now);
  const ready = matches.filter((m) => m.missing.length === 0);
  const [hero, ...rest] = matches;

  function lastReceipt() {
    if (!data.lastReceiptAt) return t('noReceipt');
    const d = Math.round((startOfDay(now) - startOfDay(data.lastReceiptAt)) / 86_400_000);
    return t('lastReceipt', { when: d <= 0 ? t('todayLower') : d === 1 ? t('yesterday') : t('daysAgo', { n: d }) });
  }

  function addToList(id: string) {
    update((d) => (d.shopping.some((s) => s.ingredientId === id && !s.done) ? d : { ...d, shopping: [...d.shopping, { id: `${id}-${Date.now()}`, ingredientId: id, done: false }] }));
    toast(t('addedToList', { name: ingredientName(id, lang) }));
  }

  const card = (m: (typeof matches)[number], size: 'md' | 'sm') => (
    <RecipeCard
      key={m.recipe.id}
      size={size}
      image={m.recipe.image}
      imageAlt={m.recipe.title[lang]}
      title={m.recipe.title[lang]}
      time={`${m.recipe.minutes} ${t('min')}${size === 'md' ? ` · ${t(m.recipe.difficulty)}` : ''}`}
      have={m.have.length}
      total={m.recipe.ingredients.length}
      matchLabel={size === 'md' ? t('ingredients') : t('ingr')}
      readyLabel={t('allInFridge')}
      missing={m.missing.map((id) => ingredientName(id, lang))}
      onOpen={() => go('recipes', { recipe: m.recipe.id })}
      onMissing={(name) => {
        const id = m.missing.find((x) => ingredientName(x, lang) === name);
        if (id) addToList(id);
      }}
    />
  );

  return (
    <div className="screen">
      <header>
        <div className="date">{formatDate(new Date(now), lang)}</div>
        <h1 className="hello">{t('hello', { name: user.name.split(' ')[0] })}</h1>
        <p className="sub">{t('helloSub')}</p>
      </header>

      <div className="stats">
        <button type="button" className="stat" onClick={() => go('pantry')}><b>{fresh.length}</b><span>{t('statItems')}</span></button>
        <button type="button" className="stat warn" onClick={() => go('pantry')}><b>{soon.length}</b><span>{t('statSoon')}</span></button>
        <button type="button" className="stat" onClick={() => go('recipes')}><b>{ready.length}</b><span>{t('statRecipes')}</span></button>
      </div>

      <div className="scanrow">
        <span className="scan-mark"><Icon name="receipt" size={24} /></span>
        <div className="scan-txt"><b>{t('shopping')}</b><span>{lastReceipt()}</span></div>
        <Button variant="scan" size="sm" icon="camera" onClick={() => go('scan')}>{t('scanShort')}</Button>
      </div>

      {hero && (
        <section className="sec">
          <div className="sec-h">
            <h2>{hero.missing.length === 0 ? t('readyToCook') : t('almost')}</h2>
            <button type="button" className="linkbtn" onClick={() => go('recipes')}>{t('seeAll')}</button>
          </div>
          {card(hero, 'md')}
          {rest.length > 0 && <div className="rail">{rest.map((m) => card(m, 'sm'))}</div>}
        </section>
      )}

      <section className="sec">
        <div className="sec-h">
          <h2>{t('useSoon')}</h2>
          <button type="button" className="linkbtn" onClick={() => go('pantry')}>{t('myFridge')}</button>
        </div>
        {soon.length === 0 ? (
          <p className="muted">{t('nothingSoon')}</p>
        ) : (
          <div className="list">
            {soon.slice(0, 4).map((e) => {
              const x = expiry(e, t, now);
              return <PantryItem key={e.id} name={entryName(e, lang)} quantity={e.quantity} meta={CATEGORIES[e.category][lang]} source={e.source} expiryTone={x.tone} expiryLabel={x.label} />;
            })}
          </div>
        )}
      </section>
    </div>
  );
}
