// The ingredient, recipe and source catalogue. It comes only from Firestore (`ingredients`,
// `recipes`, `sources`); the app bundles no copy. Firestore's device cache keeps it offline.
import { useSyncExternalStore } from 'react';
import type { Category } from './data';
import type { L10n, Lang } from './i18n';

/** Meat (בשרי), dairy (חלבי) or neither (פרווה). Fish and eggs are parve. */
export type Kashrut = 'meat' | 'dairy' | 'parve';
export const KASHRUT: Kashrut[] = ['meat', 'dairy', 'parve'];

export type Course = 'starter' | 'main' | 'side' | 'dessert' | 'breakfast';
export const COURSES: Course[] = ['starter', 'main', 'side', 'dessert', 'breakfast'];

export interface Ingredient {
  id: string;
  /** Recipes can ask for a group: a cherry tomato counts as a tomato. */
  group?: string;
  name: L10n;
  category: Category;
  /** Meat or dairy; absent for parve. */
  kashrut?: 'meat' | 'dairy';
  /** Days it keeps once bought. */
  shelfDays: number;
  /** Words that recognise it on a receipt, in any language. */
  keywords: string[];
  defaultQty?: string;
}

export interface RecipeIngredient {
  /** An ingredient id or a group. */
  ref: string;
  qty?: string;
}

export interface Recipe {
  id: string;
  title: L10n;
  /** Photo of the finished dish: a URL, or a path relative to the site. */
  image: string | null;
  course: Course;
  kashrut: Kashrut;
  /** Where the recipe comes from: a `sources` id, and the recipe's page there. */
  source: { id: string; url: string | null };
  minutes: number;
  difficulty: 'easy' | 'medium';
  servings: number;
  tags: string[];
  ingredients: RecipeIngredient[];
  steps: Record<Lang, string[]>;
}

export interface Source {
  id: string;
  name: string;
  url: string;
  /** Logo URL, when the source has one. */
  logo: string | null;
}

export interface Catalog {
  /** loading until Firestore answers; unavailable without Firebase (demo) or on error. */
  status: 'loading' | 'ready' | 'unavailable';
  ingredients: Ingredient[];
  recipes: Recipe[];
  sources: Source[];
  byId: Map<string, Ingredient>;
  /** First ingredient of each group, for naming a group. */
  byGroup: Map<string, Ingredient>;
  sourceById: Map<string, Source>;
}

export function makeCatalog(status: Catalog['status'], ingredients: Ingredient[] = [], recipes: Recipe[] = [], sources: Source[] = []): Catalog {
  const byId = new Map(ingredients.map((i) => [i.id, i]));
  const byGroup = new Map<string, Ingredient>();
  for (const i of ingredients) if (i.group && !byGroup.has(i.group)) byGroup.set(i.group, i);
  return { status, ingredients, recipes, sources, byId, byGroup, sourceById: new Map(sources.map((s) => [s.id, s])) };
}

let current = makeCatalog('loading');
const listeners = new Set<() => void>();

export const getCatalog = () => current;

export function setCatalog(c: Catalog) {
  current = c;
  listeners.forEach((l) => l());
}

export function useCatalog() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    getCatalog,
  );
}

export const ingredientById = (id: string) => current.byId.get(id);
export const sourceById = (id: string) => current.sourceById.get(id);

export function ingredientName(ref: string, lang: Lang) {
  return (current.byId.get(ref) ?? current.byGroup.get(ref))?.name[lang] ?? ref;
}

export function recipeImage(r: Recipe) {
  if (!r.image) return null;
  return /^https?:\/\//.test(r.image) ? r.image : `${import.meta.env.BASE_URL}${r.image}`;
}
