import { describe, expect, it } from 'vitest';
import { matchIngredient, parseReceipt } from './receipt';

describe('matchIngredient', () => {
  it('finds French, English and Hebrew names', () => {
    expect(matchIngredient('TOMATE CERISE 250G')).toBe('cherry-tomato');
    expect(matchIngredient('OEUFS PLEIN AIR X12')).toBe('egg');
    expect(matchIngredient('Whole milk 1L')).toBe('milk');
    expect(matchIngredient('חלב תנובה 3%')).toBe('milk');
    expect(matchIngredient('עגבניות')).toBe('tomato');
  });
  it('prefers the longest keyword and whole-word starts', () => {
    expect(matchIngredient('AILES DE POULET')).toBe('chicken');
    expect(matchIngredient('MAILLOT')).toBeNull();
  });
});

describe('parseReceipt', () => {
  const text = [
    'SUPER MARCHE',
    'TOMATE CERISE 250G      12,90',
    'LAIT DEMI ECREME 1L      6,50',
    'SAC CABAS                0,10',
    'PRODUIT INCONNU          9,99',
    'REMISE                  -2,00',
    'TOTAL                   27,49',
  ].join('\n');
  const lines = parseReceipt(text);

  it('keeps product lines and drops totals, headers and discounts', () => {
    expect(lines.map((l) => l.raw)).toEqual(['TOMATE CERISE 250G', 'LAIT DEMI ECREME 1L', 'SAC CABAS', 'PRODUIT INCONNU']);
  });
  it('reads price, quantity and status', () => {
    expect(lines[0]).toMatchObject({ ingredientId: 'cherry-tomato', price: 12.9, quantity: '250 g', status: 'matched' });
    expect(lines[1]).toMatchObject({ ingredientId: 'milk', quantity: '1 L' });
    expect(lines[2].status).toBe('ignored');
    expect(lines[3].status).toBe('review');
  });
});
