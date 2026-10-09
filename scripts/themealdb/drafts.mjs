// What the TheMealDB import and its review page share: where the files are, and what an approved draft needs.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { checkKosher } from './kosher.mjs';

const root = new URL('../../', import.meta.url);
export const files = {
  dir: new URL('imports/themealdb/', root),
  drafts: new URL('imports/themealdb/drafts.json', root),
  excluded: new URL('imports/themealdb/excluded.json', root),
  ingredients: new URL('catalog/ingredients.json', root),
  recipes: new URL('catalog/recipes.json', root),
  sources: new URL('catalog/sources.json', root),
  tokens: new URL('src/ds/tokens.css', root),
};

export const readJson = (f, fallback) => (existsSync(f) ? JSON.parse(readFileSync(f, 'utf8')) : fallback);
export const writeJson = (f, data) => writeFileSync(f, `${JSON.stringify(data, null, 1)}\n`);

export const ID_PREFIX = 'mealdb-';
export const LANGS = ['fr', 'en', 'he'];
export const TAGS = ['veggie', 'vegan', 'fish', 'meat', 'quick', 'oven', 'soup', 'salad', 'pasta', 'sweet', 'asian', 'israeli'];
export const STATUSES = ['pending', 'needs-ingredients', 'approved', 'rejected'];
export const COURSES = ['starter', 'main', 'side', 'dessert', 'breakfast'];
export const SOURCE_ID = 'themealdb';

/** TheMealDB's own category, as the course it usually is. Soups and salads are starters. */
export function courseOf(meal) {
  const c = { Starter: 'starter', Side: 'side', Dessert: 'dessert', Breakfast: 'breakfast' }[meal.strCategory];
  if (c) return c;
  return /\b(soup|salad|broth)\b/i.test(meal.strMeal) ? 'starter' : 'main';
}

/** Meat, dairy or parve, from the catalogue ingredients a recipe uses (a group counts as its members). */
export function kashrutOf(refs, ingredients) {
  const kinds = new Set(refs.flatMap((ref) => ingredients.filter((i) => i.id === ref || i.group === ref).map((i) => i.kashrut ?? 'parve')));
  if (kinds.has('meat') && kinds.has('dairy')) return null;
  return kinds.has('meat') ? 'meat' : kinds.has('dairy') ? 'dairy' : 'parve';
}

/** Why a draft can't go into the catalogue yet, in French for the reviewer; empty when it can. */
export function draftProblems(draft, ingredients) {
  const knownRefs = new Set(ingredients.map((i) => i.id));
  const r = draft.recipe;
  const problems = [];
  const verdict = checkKosher({ title: draft.source.name, category: draft.source.category, ingredients: draft.original.ingredients });
  if (!verdict.ok) problems.push(`pas kasher (${verdict.issues.join('; ')})`);
  if (!r.ingredients.length) problems.push('aucun ingrédient');
  const refs = r.ingredients.map((i) => i.ref);
  for (const ref of refs) if (!knownRefs.has(ref)) problems.push(`ingrédient inconnu « ${ref} »`);
  if (new Set(refs).size !== refs.length) problems.push('un ingrédient apparaît deux fois');
  for (const l of LANGS) {
    if (!r.title[l]?.trim()) problems.push(`pas de titre en ${l}`);
    if (!r.steps[l]?.length || r.steps[l].some((s) => !s.trim())) problems.push(`une étape est vide en ${l}`);
    else if (r.steps[l].length !== r.steps.fr.length) problems.push(`pas le même nombre d’étapes en ${l} qu’en fr`);
  }
  if (!(r.minutes > 0) || !(r.servings > 0)) problems.push('le temps et les portions doivent être au-dessus de 0');
  if (!['easy', 'medium'].includes(r.difficulty)) problems.push('la difficulté doit être easy ou medium');
  if (!COURSES.includes(r.course)) problems.push('pas de catégorie (entrée, plat…)');
  const kashrut = kashrutOf(r.ingredients.map((i) => i.ref), ingredients);
  if (!kashrut) problems.push('viande et lait dans la même recette');
  else if (r.kashrut !== kashrut) problems.push(`l’annotation devrait être « ${kashrut} »`);
  if (r.source?.id !== SOURCE_ID) problems.push('pas de source');
  return problems;
}
