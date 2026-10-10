import { describe, expect, it } from 'vitest';
import { parseLink } from './links';

describe('parseLink', () => {
  it('reads recipe and invitation links', () => {
    expect(parseLink('/recette/mealdb-52772')).toEqual({ kind: 'recipe', id: 'mealdb-52772' });
    expect(parseLink('/foyer/a1b2c3/')).toEqual({ kind: 'invite', code: 'a1b2c3' });
  });
  it('ignores other addresses', () => {
    expect(parseLink('/')).toBeNull();
    expect(parseLink('/recette/')).toBeNull();
    expect(parseLink('/autre/x')).toBeNull();
  });
});
