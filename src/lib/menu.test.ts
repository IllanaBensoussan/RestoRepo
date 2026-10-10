import { beforeAll, describe, expect, it } from 'vitest';
import ingredients from '../../catalog/ingredients.json';
import recipes from '../../catalog/recipes.json';
import { makeCatalog, recipeById, setCatalog, type Ingredient, type Recipe } from '../catalog';
import { dayKey, mealsBetween, menuNeeds, setMeal, weekDays, weekStart, type MenuEntry } from './menu';
import { newEntry } from './pantry';

beforeAll(() => setCatalog(makeCatalog('ready', ingredients as Ingredient[], recipes as Recipe[])));

describe('weeks', () => {
  it('start on Monday in French and on Sunday in Israel', () => {
    const fri = new Date(2026, 9, 9);
    expect(dayKey(weekStart(fri, 'fr'))).toBe('2026-10-05');
    expect(dayKey(weekStart(fri, 'he'))).toBe('2026-10-04');
    expect(dayKey(weekStart(new Date(2026, 9, 4), 'he'))).toBe('2026-10-04');
    expect(dayKey(weekStart(new Date(2026, 9, 4), 'fr'))).toBe('2026-09-28');
  });

  it('has seven days, across months', () => {
    expect(weekDays(new Date(2026, 9, 26)).map(dayKey)).toEqual(['2026-10-26', '2026-10-27', '2026-10-28', '2026-10-29', '2026-10-30', '2026-10-31', '2026-11-01']);
  });
});

describe('the menu', () => {
  const r = recipes[0] as Recipe;

  it('keeps one recipe per meal', () => {
    let menu: MenuEntry[] = [];
    menu = setMeal(menu, '2026-10-12', 'dinner', 'a', '1');
    menu = setMeal(menu, '2026-10-12', 'lunch', 'b', '2');
    menu = setMeal(menu, '2026-10-12', 'dinner', 'c', '3');
    expect(mealsBetween(menu, '2026-10-12', '2026-10-12').map((m) => [m.meal, m.recipeId])).toEqual([['lunch', 'b'], ['dinner', 'c']]);
    expect(mealsBetween(menu, '2026-10-13', '2026-10-19')).toEqual([]);
  });

  it('needs what is neither in the fridge nor on the list, once', () => {
    const refs = r.ingredients.map((i) => i.ref);
    const planned = setMeal(setMeal([], '2026-10-12', 'lunch', r.id, '1'), '2026-10-13', 'dinner', r.id, '2');
    expect(menuNeeds(planned, recipeById, [], [])).toEqual([...new Set(refs)]);

    const [first, second, ...rest] = refs;
    const fridge = [newEntry(first, { source: 'manual' })];
    const list = [{ id: 's', ingredientId: second, done: false }];
    expect(menuNeeds(planned, recipeById, fridge, list)).toEqual([...new Set(rest)].filter((x) => x !== first && x !== second));
  });

  it('skips recipes no longer in the catalogue', () => {
    expect(menuNeeds(setMeal([], '2026-10-12', 'lunch', 'gone', '1'), recipeById, [], [])).toEqual([]);
  });
});
