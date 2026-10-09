import { describe, expect, it } from 'vitest';
import { checkKosher, mealIngredients } from './kosher.mjs';

const recipe = (names, extra = {}) => ({ title: 'Dish', ingredients: names.map((name) => ({ name })), ...extra });

describe('checkKosher', () => {
  it('accepts meat without dairy, and dairy with fish', () => {
    expect(checkKosher(recipe(['Chicken Breast', 'Olive Oil', 'Garlic', 'Coconut Milk'])).ok).toBe(true);
    expect(checkKosher(recipe(['Salmon', 'Butter', 'Lemon', 'Double Cream'])).ok).toBe(true);
    expect(checkKosher(recipe(['Butter Beans', 'Peanut Butter', 'Beef', 'Cream of Tartar'])).ok).toBe(true);
    expect(checkKosher(recipe(['Chicken', 'Vegetable Stock', 'Duck Eggs', 'Blood Orange'])).ok).toBe(true);
  });

  it('rejects pork, shellfish and other forbidden foods', () => {
    expect(checkKosher(recipe(['Bacon', 'Eggs'])).ok).toBe(false);
    expect(checkKosher(recipe(['King Prawns', 'Rice'])).ok).toBe(false);
    expect(checkKosher(recipe(['Gelatine Leafs', 'Sugar'])).ok).toBe(false);
    expect(checkKosher(recipe(['Suet', 'Flour'])).ok).toBe(false);
    expect(checkKosher(recipe(['Rice'], { category: 'Pork' })).ok).toBe(false);
    expect(checkKosher(recipe(['Rice'], { title: 'Ham Hock Colcannon' })).ok).toBe(false);
  });

  it('treats a sausage as pork unless it says what it is', () => {
    expect(checkKosher(recipe(['Sausages', 'Onion'])).ok).toBe(false);
    expect(checkKosher(recipe(['Beef Sausages', 'Onion'])).ok).toBe(true);
  });

  it('rejects meat with dairy, and meat with fish', () => {
    const dairy = checkKosher(recipe(['Minced Beef', 'Cheddar Cheese']));
    expect(dairy.ok).toBe(false);
    expect(dairy.issues[0]).toMatch(/meat with dairy/);
    expect(checkKosher(recipe(['Chicken Stock', 'Butter'])).ok).toBe(false);
    expect(checkKosher(recipe(['Lamb', 'Greek Yogurt'])).ok).toBe(false);
    expect(checkKosher(recipe(['Lamb', 'Goats Cheese'])).ok).toBe(false);
    expect(checkKosher(recipe(['Beef', 'Worcestershire Sauce'])).ok).toBe(false);
  });
});

describe('mealIngredients', () => {
  it('reads the numbered fields and skips the empty ones', () => {
    const meal = { strIngredient1: 'Eggs', strMeasure1: '4', strIngredient2: ' Tomatoes ', strMeasure2: '400g ', strIngredient3: '', strIngredient4: null };
    expect(mealIngredients(meal)).toEqual([
      { name: 'Eggs', measure: '4' },
      { name: 'Tomatoes', measure: '400g' },
    ]);
  });
});
