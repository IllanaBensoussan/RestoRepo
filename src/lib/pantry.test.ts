import { beforeAll, describe, expect, it } from 'vitest';
import ingredients from '../../catalog/ingredients.json';
import recipes from '../../catalog/recipes.json';
import { makeCatalog, setCatalog, type Ingredient, type Recipe } from '../catalog';
import { available, findIngredient, newEntry, type PantryEntry } from './pantry';

beforeAll(() => setCatalog(makeCatalog('ready', ingredients as Ingredient[], recipes as Recipe[])));

describe('ingredients added by name', () => {
  it('finds the catalogue key from a name in any language or a keyword', () => {
    expect(findIngredient('Tomates')).toBe('tomato');
    expect(findIngredient('tomatoes')).toBe('tomato');
    expect(findIngredient('עגבניות')).toBe('tomato');
    expect(findIngredient('  tomates cerises ')).toBe('cherry-tomato');
    expect(findIngredient('tomates bio')).toBe('tomato');
    expect(findIngredient('truc inconnu')).toBeNull();
  });

  it('stores an entry under its ingredient key, so recipes see it', () => {
    const e = newEntry(findIngredient('tomates')!, { source: 'manual' });
    expect(e.ingredientId).toBe('tomato');
    expect(e.name).toBeUndefined();
    expect(available([e]).has('tomato')).toBe(true);
  });

  it('counts entries saved by name only before this fix', () => {
    const now = Date.now();
    const old: PantryEntry = { id: 'x', ingredientId: null, name: 'tomates', category: 'grocery', source: 'manual', addedAt: now, expiresAt: now + 86_400_000 };
    expect(available([old], now).has('tomato')).toBe(true);
  });
});
