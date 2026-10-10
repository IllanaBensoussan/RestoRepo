import { getCatalog, ingredientById, type Recipe } from '../catalog';
import type { Category } from '../data';
import type { BadgeTone } from '../ds';
import type { Lang, T } from '../i18n';
import { matchIngredient, normalize } from './receipt';

export interface PantryEntry {
  id: string;
  ingredientId: string | null;
  /** Free name, for products not in the catalogue. */
  name?: string;
  quantity?: string;
  category: Category;
  source: 'receipt' | 'manual';
  addedAt: number;
  expiresAt: number;
}

export interface ShoppingEntry {
  id: string;
  ingredientId: string | null;
  name?: string;
  done: boolean;
}

const DAY = 86_400_000;

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

export function startOfDay(t: number) {
  const d = new Date(t);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function daysLeft(e: PantryEntry, now = Date.now()) {
  return Math.round((startOfDay(e.expiresAt) - startOfDay(now)) / DAY);
}

export function expiry(e: PantryEntry, t: T, now = Date.now()): { tone: BadgeTone; label: string } {
  const d = daysLeft(e, now);
  if (d < 0) return { tone: 'expired', label: t('expired') };
  if (d === 0) return { tone: 'today', label: t('today') };
  if (d <= 3) return { tone: 'soon', label: d === 1 ? t('day') : t('days', { n: d }) };
  return { tone: 'fresh', label: t('fresh') };
}

/**
 * The catalogue ingredient a typed name stands for: one of its names, in any language, or one of
 * its keywords, then a keyword at the start of a word ("tomates bio" → tomato). Null when none fits.
 */
export function findIngredient(name: string): string | null {
  const n = normalize(name).trim();
  if (!n) return null;
  const exact = getCatalog().ingredients.find((i) => [...Object.values(i.name), ...i.keywords].some((w) => normalize(w).trim() === n));
  return exact?.id ?? matchIngredient(name);
}

type Named = { ingredientId: string | null; name?: string };

/** The entry's ingredient key, also for entries saved by name only before the catalogue knew them. */
export function entryIngredientId(e: Named) {
  return e.ingredientId ?? (e.name ? findIngredient(e.name) : null);
}

export function entryName(e: Named, lang: Lang) {
  const id = entryIngredientId(e);
  const ing = id ? ingredientById(id) : undefined;
  return ing ? ing.name[lang] : e.name || '';
}

export function newEntry(ingredientId: string | null, opts: { name?: string; quantity?: string; source: 'receipt' | 'manual'; now?: number }): PantryEntry {
  const now = opts.now ?? Date.now();
  if (!ingredientId && opts.name) ingredientId = findIngredient(opts.name);
  const ing = ingredientId ? ingredientById(ingredientId) : undefined;
  return {
    id: uid(),
    ingredientId,
    name: ing ? undefined : opts.name,
    quantity: opts.quantity || ing?.defaultQty,
    category: ing?.category ?? 'grocery',
    source: opts.source,
    addedAt: now,
    expiresAt: now + (ing?.shelfDays ?? 7) * DAY,
  };
}

/** Ids and groups the pantry can supply, ignoring expired items. */
export function available(pantry: PantryEntry[], now = Date.now()) {
  const have = new Set<string>();
  for (const e of pantry) {
    const id = entryIngredientId(e);
    if (!id || daysLeft(e, now) < 0) continue;
    have.add(id);
    const g = ingredientById(id)?.group;
    if (g) have.add(g);
  }
  return have;
}

export interface RecipeMatch {
  recipe: Recipe;
  have: string[];
  missing: string[];
  /** Days left on the soonest-expiring ingredient it uses (lower = cook it first). */
  urgency: number;
}

export function matchRecipes(pantry: PantryEntry[], now = Date.now()): RecipeMatch[] {
  const have = available(pantry, now);
  return getCatalog().recipes.map((recipe) => {
    const refs = recipe.ingredients.map((i) => i.ref);
    const h = refs.filter((i) => have.has(i));
    const m = refs.filter((i) => !have.has(i));
    let urgency = Infinity;
    for (const e of pantry) {
      const id = entryIngredientId(e);
      if (!id) continue;
      const ing = ingredientById(id);
      if (refs.includes(id) || (ing?.group && refs.includes(ing.group))) {
        const d = daysLeft(e, now);
        if (d >= 0) urgency = Math.min(urgency, d);
      }
    }
    return { recipe, have: h, missing: m, urgency };
  }).sort((a, b) => b.have.length / b.recipe.ingredients.length - a.have.length / a.recipe.ingredients.length || a.urgency - b.urgency);
}

export { ingredientName } from '../catalog';
