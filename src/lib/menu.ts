// The household's menu: which recipe is planned for which meal of which day.
import { ingredientById, type Recipe } from '../catalog';
import type { Lang } from '../i18n';
import { available, entryIngredientId, type PantryEntry, type ShoppingEntry } from './pantry';

export type Meal = 'lunch' | 'dinner';
export const MEALS: Meal[] = ['lunch', 'dinner'];

export interface MenuEntry {
  id: string;
  /** Local day, as YYYY-MM-DD. */
  date: string;
  meal: Meal;
  recipeId: string;
  /** Who planned it, for a menu shared with the household. */
  addedBy?: string;
}

const pad = (n: number) => String(n).padStart(2, '0');

/** The local day of a date, as YYYY-MM-DD. */
export function dayKey(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function parseDay(key: string) {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(d: Date, n: number) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
}

/** Weeks start on Monday in French, on Sunday in Israel (English and Hebrew). */
export const firstDay = (lang: Lang) => (lang === 'fr' ? 1 : 0);

export function weekStart(d: Date, lang: Lang) {
  const back = (d.getDay() - firstDay(lang) + 7) % 7;
  return addDays(d, -back);
}

/** The seven days of the week that starts on `start`. */
export function weekDays(start: Date) {
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

/** Meals planned between two days (inclusive), by date then lunch before dinner. */
export function mealsBetween(menu: MenuEntry[], from: string, to: string) {
  return menu
    .filter((m) => m.date >= from && m.date <= to)
    .sort((a, b) => a.date.localeCompare(b.date) || MEALS.indexOf(a.meal) - MEALS.indexOf(b.meal));
}

/**
 * What the planned recipes still need: the ingredients missing from the fridge that aren't
 * already waiting on the shopping list. Each one once, in the order the menu needs them.
 */
export function menuNeeds(planned: MenuEntry[], recipes: (id: string) => Recipe | undefined, pantry: PantryEntry[], shopping: ShoppingEntry[], now = Date.now()) {
  const have = available(pantry, now);
  const pending = new Set<string>();
  for (const s of shopping) {
    if (s.done) continue;
    const id = entryIngredientId(s);
    if (!id) continue;
    pending.add(id);
    const g = ingredientById(id)?.group;
    if (g) pending.add(g);
  }
  const needs: string[] = [];
  for (const m of planned) {
    for (const { ref } of recipes(m.recipeId)?.ingredients ?? []) {
      if (!have.has(ref) && !pending.has(ref) && !needs.includes(ref)) needs.push(ref);
    }
  }
  return needs;
}

/** Plans a recipe for a meal, replacing whatever was planned for it. */
export function setMeal(menu: MenuEntry[], date: string, meal: Meal, recipeId: string, id: string, addedBy?: string): MenuEntry[] {
  return [...menu.filter((m) => m.date !== date || m.meal !== meal), { id, date, meal, recipeId, addedBy }];
}
