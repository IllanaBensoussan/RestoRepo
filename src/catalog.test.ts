import { describe, expect, it } from 'vitest';
import ingredients from '../catalog/ingredients.json';
import recipes from '../catalog/recipes.json';
import sources from '../catalog/sources.json';
import { COURSES, KASHRUT, type Ingredient, type Recipe } from './catalog';
import { CATEGORIES } from './data';
import { LANGS } from './i18n';

const ings = ingredients as Ingredient[];
const recs = recipes as Recipe[];
const byId = new Map(ings.map((i) => [i.id, i]));
const groups = new Set(ings.flatMap((i) => (i.group ? [i.group] : [])));
const sourceIds = new Set(sources.map((s) => s.id));

/** Kashrut of an ingredient or group: a group is meat or dairy when one of its members is. */
function kashrutOf(ref: string) {
  const found = new Set(ings.filter((i) => i.id === ref || i.group === ref).map((i) => i.kashrut ?? 'parve'));
  return found.has('meat') ? 'meat' : found.has('dairy') ? 'dairy' : 'parve';
}

describe('catalog', () => {
  it('has unique, Firestore-safe ids', () => {
    for (const list of [ings, recs, sources]) {
      const seen = list.map((x) => x.id);
      expect(new Set(seen).size).toBe(seen.length);
      for (const id of seen) expect(id).toMatch(/^[a-z0-9-]+$/);
    }
  });

  it('names every ingredient in all three languages, in a known category', () => {
    for (const i of ings) {
      for (const l of LANGS) expect(i.name[l], `${i.id}.${l}`).toBeTruthy();
      expect(Object.keys(CATEGORIES)).toContain(i.category);
      expect(i.keywords.length, i.id).toBeGreaterThan(0);
      if (i.group) expect(byId.has(i.group), `${i.id} group`).toBe(true);
      if (i.kashrut) expect(['meat', 'dairy'], i.id).toContain(i.kashrut);
    }
  });

  it('gives every source a name, a site and an optional logo', () => {
    for (const s of sources) {
      expect(s.name, s.id).toBeTruthy();
      expect(s.url, s.id).toMatch(/^https:\/\//);
      if (s.logo) expect(s.logo, s.id).toMatch(/^https:\/\//);
    }
  });

  it('only uses ingredients that exist, with steps in all three languages', () => {
    for (const r of recs) {
      expect(r.ingredients.length, r.id).toBeGreaterThan(0);
      const refs = r.ingredients.map((i) => i.ref);
      expect(new Set(refs).size, `${r.id} lists an ingredient twice`).toBe(refs.length);
      for (const ref of refs) expect(byId.has(ref) || groups.has(ref), `${r.id} → ${ref}`).toBe(true);
      for (const l of LANGS) {
        expect(r.title[l], `${r.id}.title.${l}`).toBeTruthy();
        expect(r.steps[l].length, `${r.id}.steps.${l}`).toBe(r.steps.fr.length);
        for (const s of r.steps[l]) expect(s.trim(), `${r.id}.steps.${l}`).toBeTruthy();
      }
    }
  });

  it('files every recipe under a course and a source', () => {
    for (const r of recs) {
      expect(COURSES, r.id).toContain(r.course);
      expect(sourceIds.has(r.source.id), `${r.id} source`).toBe(true);
      if (r.source.url) expect(r.source.url, r.id).toMatch(/^https:\/\//);
      expect(r.minutes, r.id).toBeGreaterThan(0);
      expect(r.servings, r.id).toBeGreaterThan(0);
      expect(['easy', 'medium'], r.id).toContain(r.difficulty);
    }
  });

  it('marks every recipe meat, dairy or parve, as its ingredients are, never meat and dairy', () => {
    for (const r of recs) {
      expect(KASHRUT, r.id).toContain(r.kashrut);
      const kinds = new Set(r.ingredients.map((i) => kashrutOf(i.ref)));
      expect(kinds.has('meat') && kinds.has('dairy'), `${r.id} mixes meat and dairy`).toBe(false);
      const expected = kinds.has('meat') ? 'meat' : kinds.has('dairy') ? 'dairy' : 'parve';
      expect(r.kashrut, r.id).toBe(expected);
    }
  });
});
