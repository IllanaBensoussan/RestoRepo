import { describe, expect, it } from 'vitest';
import ingredients from '../catalog/ingredients.json';
import recipes from '../catalog/recipes.json';
import { CATEGORIES } from './data';
import { LANGS } from './i18n';

const ids = new Set(ingredients.map((i) => i.id));
const groups = new Set(ingredients.flatMap((i) => ('group' in i && i.group ? [i.group] : [])));

describe('catalog', () => {
  it('has unique, Firestore-safe ids', () => {
    for (const list of [ingredients, recipes]) {
      const seen = list.map((x) => x.id);
      expect(new Set(seen).size).toBe(seen.length);
      for (const id of seen) expect(id).toMatch(/^[a-z0-9-]+$/);
    }
  });

  it('names every ingredient in all three languages, in a known category', () => {
    for (const i of ingredients) {
      for (const l of LANGS) expect(i.name[l], `${i.id}.${l}`).toBeTruthy();
      expect(Object.keys(CATEGORIES)).toContain(i.category);
      expect(i.keywords.length, i.id).toBeGreaterThan(0);
      if ('group' in i && i.group) expect(ids.has(i.group), `${i.id} group`).toBe(true);
    }
  });

  it('only uses ingredients that exist, with steps in all three languages', () => {
    for (const r of recipes) {
      for (const { ref } of r.ingredients) expect(ids.has(ref) || groups.has(ref), `${r.id} → ${ref}`).toBe(true);
      for (const l of LANGS) {
        expect(r.title[l], `${r.id}.title.${l}`).toBeTruthy();
        expect(r.steps[l as keyof typeof r.steps].length, `${r.id}.steps.${l}`).toBe(r.steps.fr.length);
      }
    }
  });
});
