// The ingredient and recipe catalogue. Firestore (`ingredients`, `recipes`) is the source of
// truth; the copy bundled from catalog/*.json is used until it loads, and when it can't.
import { useSyncExternalStore } from 'react';
import bundledIngredients from '../catalog/ingredients.json';
import bundledRecipes from '../catalog/recipes.json';
import type { Category } from './data';
import type { L10n, Lang } from './i18n';

export interface Ingredient {
  id: string;
  /** Recipes can ask for a group: a cherry tomato counts as a tomato. */
  group?: string;
  name: L10n;
  category: Category;
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
  minutes: number;
  difficulty: 'easy' | 'medium';
  servings: number;
  tags: string[];
  ingredients: RecipeIngredient[];
  steps: Record<Lang, string[]>;
}

export interface Catalog {
  ingredients: Ingredient[];
  recipes: Recipe[];
  byId: Map<string, Ingredient>;
  /** First ingredient of each group, for naming a group. */
  byGroup: Map<string, Ingredient>;
}

export function makeCatalog(ingredients: Ingredient[], recipes: Recipe[]): Catalog {
  const byId = new Map(ingredients.map((i) => [i.id, i]));
  const byGroup = new Map<string, Ingredient>();
  for (const i of ingredients) if (i.group && !byGroup.has(i.group)) byGroup.set(i.group, i);
  return { ingredients, recipes, byId, byGroup };
}

let current = makeCatalog(bundledIngredients as Ingredient[], bundledRecipes as Recipe[]);
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

export function ingredientName(ref: string, lang: Lang) {
  return (current.byId.get(ref) ?? current.byGroup.get(ref))?.name[lang] ?? ref;
}

export function recipeImage(r: Recipe) {
  if (!r.image) return null;
  return /^https?:\/\//.test(r.image) ? r.image : `${import.meta.env.BASE_URL}${r.image}`;
}
