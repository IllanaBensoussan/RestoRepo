import type { L10n } from './i18n';

export type Category = 'veg' | 'fruit' | 'dairy' | 'meat' | 'grocery' | 'bakery' | 'herbs';

export const CATEGORIES: Record<Category, L10n> = {
  veg: { fr: 'Légumes', en: 'Vegetables', he: 'ירקות' },
  fruit: { fr: 'Fruits', en: 'Fruit', he: 'פירות' },
  herbs: { fr: 'Herbes', en: 'Herbs', he: 'עשבי תיבול' },
  dairy: { fr: 'Crèmerie', en: 'Dairy', he: 'מוצרי חלב' },
  meat: { fr: 'Viande et poisson', en: 'Meat and fish', he: 'בשר ודגים' },
  bakery: { fr: 'Boulangerie', en: 'Bakery', he: 'מאפים' },
  grocery: { fr: 'Épicerie', en: 'Pantry', he: 'מזווה' },
};

export const CATEGORY_ORDER: Category[] = ['veg', 'fruit', 'herbs', 'dairy', 'meat', 'bakery', 'grocery'];

/** Receipt lines that never go in the fridge. */
export const NON_FOOD = ['sac', 'consigne', 'lessive', 'essuie tout', 'papier toilette', 'bag', 'deposit', 'detergent', 'שקית', 'פיקדון', 'פקדון', 'סבון', 'נייר טואלט', 'אקונומיקה', 'מגבונים'];
