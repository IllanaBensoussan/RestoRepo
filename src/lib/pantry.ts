import { INGREDIENTS, RECIPES, ingredientById, type Category, type Recipe } from '../data';
import type { BadgeTone } from '../ds';
import type { Lang, T } from '../i18n';

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

export function entryName(e: { ingredientId: string | null; name?: string }, lang: Lang) {
  const ing = e.ingredientId ? ingredientById(e.ingredientId) : undefined;
  return ing ? ing.name[lang] : e.name || '';
}

export function newEntry(ingredientId: string | null, opts: { name?: string; quantity?: string; source: 'receipt' | 'manual'; now?: number }): PantryEntry {
  const now = opts.now ?? Date.now();
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
    if (!e.ingredientId || daysLeft(e, now) < 0) continue;
    have.add(e.ingredientId);
    const g = ingredientById(e.ingredientId)?.group;
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
  return RECIPES.map((recipe) => {
    const h = recipe.ingredients.filter((i) => have.has(i));
    const m = recipe.ingredients.filter((i) => !have.has(i));
    let urgency = Infinity;
    for (const e of pantry) {
      if (!e.ingredientId) continue;
      const ing = ingredientById(e.ingredientId);
      if (recipe.ingredients.includes(e.ingredientId) || (ing?.group && recipe.ingredients.includes(ing.group))) {
        const d = daysLeft(e, now);
        if (d >= 0) urgency = Math.min(urgency, d);
      }
    }
    return { recipe, have: h, missing: m, urgency };
  }).sort((a, b) => b.have.length / b.recipe.ingredients.length - a.have.length / a.recipe.ingredients.length || a.urgency - b.urgency);
}

export const ingredientName = (id: string, lang: Lang) => ingredientById(id)?.name[lang] ?? INGREDIENTS.find((i) => i.group === id)?.name[lang] ?? id;
