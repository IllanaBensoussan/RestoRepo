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

export interface Ingredient {
  id: string;
  /** Recipes ask for a group; a cherry tomato counts as a tomato. */
  group?: string;
  name: L10n;
  category: Category;
  /** Days it keeps once bought. */
  shelfDays: number;
  /** Words to recognise it on a receipt (any language, lower case, no accents). */
  keywords: string[];
  defaultQty?: string;
}

export const INGREDIENTS: Ingredient[] = [
  { id: 'egg', name: { fr: 'Œufs', en: 'Eggs', he: 'ביצים' }, category: 'dairy', shelfDays: 21, keywords: ['oeuf', 'oeufs', 'egg', 'eggs', 'ביצים', 'ביצה'], defaultQty: '12' },
  { id: 'tomato', name: { fr: 'Tomates', en: 'Tomatoes', he: 'עגבניות' }, category: 'veg', shelfDays: 6, keywords: ['tomate', 'tomato', 'עגבני'], defaultQty: '1 kg' },
  { id: 'cherry-tomato', group: 'tomato', name: { fr: 'Tomates cerises', en: 'Cherry tomatoes', he: 'עגבניות שרי' }, category: 'veg', shelfDays: 5, keywords: ['tomate cerise', 'tomates cerises', 'cherry tomato', 'שרי'], defaultQty: '250 g' },
  { id: 'pepper', name: { fr: 'Poivrons', en: 'Bell peppers', he: 'פלפלים' }, category: 'veg', shelfDays: 7, keywords: ['poivron', 'bell pepper', 'פלפל'], defaultQty: '3' },
  { id: 'onion', name: { fr: 'Oignons', en: 'Onions', he: 'בצל' }, category: 'veg', shelfDays: 30, keywords: ['oignon', 'onion', 'בצל'], defaultQty: '1 kg' },
  { id: 'garlic', name: { fr: 'Ail', en: 'Garlic', he: 'שום' }, category: 'veg', shelfDays: 30, keywords: ['ail', 'garlic', 'שום'], defaultQty: '1' },
  { id: 'cucumber', name: { fr: 'Concombre', en: 'Cucumber', he: 'מלפפון' }, category: 'veg', shelfDays: 7, keywords: ['concombre', 'cucumber', 'מלפפון', 'מלפפונים'], defaultQty: '4' },
  { id: 'carrot', name: { fr: 'Carottes', en: 'Carrots', he: 'גזר' }, category: 'veg', shelfDays: 21, keywords: ['carotte', 'carrot', 'גזר'], defaultQty: '1 kg' },
  { id: 'potato', name: { fr: 'Pommes de terre', en: 'Potatoes', he: 'תפוחי אדמה' }, category: 'veg', shelfDays: 30, keywords: ['pomme de terre', 'pommes de terre', 'potato', 'תפוחי אדמה', 'תפוא'], defaultQty: '2 kg' },
  { id: 'lemon', name: { fr: 'Citron', en: 'Lemon', he: 'לימון' }, category: 'fruit', shelfDays: 21, keywords: ['citron', 'lemon', 'לימון'], defaultQty: '3' },
  { id: 'apple', name: { fr: 'Pommes', en: 'Apples', he: 'תפוחים' }, category: 'fruit', shelfDays: 21, keywords: ['pomme', 'apple', 'תפוח עץ', 'תפוחים'], defaultQty: '1 kg' },
  { id: 'banana', name: { fr: 'Bananes', en: 'Bananas', he: 'בננות' }, category: 'fruit', shelfDays: 5, keywords: ['banane', 'banana', 'בננה', 'בננות'], defaultQty: '1 kg' },
  { id: 'basil', name: { fr: 'Basilic', en: 'Basil', he: 'בזיליקום' }, category: 'herbs', shelfDays: 5, keywords: ['basilic', 'basil', 'בזיליקום'], defaultQty: '1' },
  { id: 'parsley', name: { fr: 'Persil', en: 'Parsley', he: 'פטרוזיליה' }, category: 'herbs', shelfDays: 6, keywords: ['persil', 'parsley', 'פטרוזיליה'], defaultQty: '1' },
  { id: 'milk', name: { fr: 'Lait', en: 'Milk', he: 'חלב' }, category: 'dairy', shelfDays: 6, keywords: ['lait', 'milk', 'חלב'], defaultQty: '1 L' },
  { id: 'yogurt', name: { fr: 'Yaourt', en: 'Yogurt', he: 'יוגורט' }, category: 'dairy', shelfDays: 14, keywords: ['yaourt', 'yogourt', 'yogurt', 'יוגורט'], defaultQty: '4' },
  { id: 'feta', name: { fr: 'Feta', en: 'Feta', he: 'פטה' }, category: 'dairy', shelfDays: 14, keywords: ['feta', 'פטה', 'בולגרית'], defaultQty: '200 g' },
  { id: 'cheese', name: { fr: 'Fromage', en: 'Cheese', he: 'גבינה' }, category: 'dairy', shelfDays: 14, keywords: ['fromage', 'cheese', 'גבינה', 'גבינת'], defaultQty: '200 g' },
  { id: 'butter', name: { fr: 'Beurre', en: 'Butter', he: 'חמאה' }, category: 'dairy', shelfDays: 30, keywords: ['beurre', 'butter', 'חמאה'], defaultQty: '200 g' },
  { id: 'chicken', name: { fr: 'Poulet', en: 'Chicken', he: 'עוף' }, category: 'meat', shelfDays: 2, keywords: ['poulet', 'chicken', 'עוף', 'חזה עוף', 'פרגית'], defaultQty: '500 g' },
  { id: 'bread', name: { fr: 'Pain', en: 'Bread', he: 'לחם' }, category: 'bakery', shelfDays: 3, keywords: ['pain', 'baguette', 'bread', 'לחם', 'חלה'], defaultQty: '1' },
  { id: 'pasta', name: { fr: 'Pâtes', en: 'Pasta', he: 'פסטה' }, category: 'grocery', shelfDays: 365, keywords: ['pates', 'spaghetti', 'penne', 'pasta', 'פסטה', 'ספגטי'], defaultQty: '500 g' },
  { id: 'rice', name: { fr: 'Riz', en: 'Rice', he: 'אורז' }, category: 'grocery', shelfDays: 365, keywords: ['riz', 'rice', 'אורז'], defaultQty: '1 kg' },
  { id: 'lentils', name: { fr: 'Lentilles', en: 'Lentils', he: 'עדשים' }, category: 'grocery', shelfDays: 365, keywords: ['lentille', 'lentil', 'עדשים'], defaultQty: '500 g' },
  { id: 'olives', name: { fr: 'Olives', en: 'Olives', he: 'זיתים' }, category: 'grocery', shelfDays: 60, keywords: ['olive noire', 'olives', 'olive', 'זיתים'], defaultQty: '1' },
  { id: 'olive-oil', name: { fr: 'Huile d’olive', en: 'Olive oil', he: 'שמן זית' }, category: 'grocery', shelfDays: 365, keywords: ['huile olive', 'huile d olive', 'olive oil', 'שמן זית'], defaultQty: '1 L' },
];

const BY_ID = new Map(INGREDIENTS.map((i) => [i.id, i]));
export const ingredientById = (id: string) => BY_ID.get(id);

/** Receipt lines that never go in the fridge. */
export const NON_FOOD = ['sac', 'consigne', 'lessive', 'essuie tout', 'papier toilette', 'bag', 'deposit', 'detergent', 'שקית', 'פיקדון', 'פקדון', 'סבון', 'נייר טואלט', 'אקונומיקה', 'מגבונים'];

const IMG = `${import.meta.env.BASE_URL}recipes/`;

export interface Recipe {
  id: string;
  title: L10n;
  image: string;
  minutes: number;
  difficulty: 'easy' | 'medium';
  /** Ingredient ids or groups. */
  ingredients: string[];
  steps: Record<'fr' | 'en' | 'he', string[]>;
}

export const RECIPES: Recipe[] = [
  {
    id: 'shakshuka',
    title: { fr: 'Shakshuka aux poivrons', en: 'Pepper shakshuka', he: 'שקשוקה עם פלפלים' },
    image: IMG + 'shakshuka.svg',
    minutes: 25,
    difficulty: 'easy',
    ingredients: ['egg', 'tomato', 'pepper', 'onion', 'garlic', 'olive-oil'],
    steps: {
      fr: ['Fais revenir l’oignon et les poivrons émincés dans l’huile d’olive, 8 minutes.', 'Ajoute l’ail et les tomates coupées, sale, poivre, laisse compoter 10 minutes.', 'Creuse des puits, casse les œufs dedans, couvre et cuis 5 à 6 minutes.'],
      en: ['Soften the sliced onion and peppers in olive oil for 8 minutes.', 'Add the garlic and chopped tomatoes, season, and simmer for 10 minutes.', 'Make wells, crack in the eggs, cover and cook for 5 to 6 minutes.'],
      he: ['מטגנים את הבצל והפלפלים הפרוסים בשמן זית, 8 דקות.', 'מוסיפים שום ועגבניות קצוצות, מתבלים ומבשלים 10 דקות.', 'יוצרים גומות, שוברים לתוכן את הביצים, מכסים ומבשלים 5–6 דקות.'],
    },
  },
  {
    id: 'lentil-soup',
    title: { fr: 'Soupe de lentilles', en: 'Lentil soup', he: 'מרק עדשים' },
    image: IMG + 'soupe-lentilles.svg',
    minutes: 40,
    difficulty: 'easy',
    ingredients: ['lentils', 'carrot', 'onion', 'garlic', 'olive-oil', 'lemon'],
    steps: {
      fr: ['Fais suer l’oignon, l’ail et les carottes en dés dans l’huile d’olive.', 'Ajoute les lentilles rincées et 1,5 L d’eau, cuis 30 minutes.', 'Mixe à moitié, sale, et sers avec un filet de citron.'],
      en: ['Sweat the onion, garlic and diced carrots in olive oil.', 'Add the rinsed lentils and 1.5 L of water, cook for 30 minutes.', 'Blend half of it, season, and serve with a squeeze of lemon.'],
      he: ['מאדים בצל, שום וגזר חתוך לקוביות בשמן זית.', 'מוסיפים עדשים שטופות ו־1.5 ליטר מים, מבשלים 30 דקות.', 'טוחנים חצי, מתבלים ומגישים עם מעט לימון.'],
    },
  },
  {
    id: 'tomato-pasta',
    title: { fr: 'Pâtes tomate basilic', en: 'Tomato basil pasta', he: 'פסטה עגבניות ובזיליקום' },
    image: IMG + 'pates-tomate.svg',
    minutes: 20,
    difficulty: 'easy',
    ingredients: ['pasta', 'tomato', 'garlic', 'olive-oil', 'basil'],
    steps: {
      fr: ['Cuis les pâtes dans une grande casserole d’eau salée.', 'Pendant ce temps, fais revenir l’ail dans l’huile, ajoute les tomates et laisse réduire 10 minutes.', 'Mélange les pâtes à la sauce et ajoute le basilic au moment de servir.'],
      en: ['Cook the pasta in a large pot of salted water.', 'Meanwhile, fry the garlic in oil, add the tomatoes and reduce for 10 minutes.', 'Toss the pasta in the sauce and add the basil just before serving.'],
      he: ['מבשלים את הפסטה בסיר גדול של מים רותחים ומומלחים.', 'בינתיים מטגנים שום בשמן, מוסיפים עגבניות ומצמצמים 10 דקות.', 'מערבבים את הפסטה ברוטב ומוסיפים בזיליקום לפני ההגשה.'],
    },
  },
  {
    id: 'greek-salad',
    title: { fr: 'Salade grecque', en: 'Greek salad', he: 'סלט יווני' },
    image: IMG + 'salade-grecque.svg',
    minutes: 10,
    difficulty: 'easy',
    ingredients: ['tomato', 'cucumber', 'onion', 'pepper', 'feta', 'olives'],
    steps: {
      fr: ['Coupe les tomates, le concombre et le poivron en gros morceaux.', 'Ajoute l’oignon en fines lamelles et les olives.', 'Pose la feta sur le dessus, arrose d’huile d’olive et sers.'],
      en: ['Cut the tomatoes, cucumber and pepper into large chunks.', 'Add thinly sliced onion and the olives.', 'Top with the feta, drizzle with olive oil and serve.'],
      he: ['חותכים עגבניות, מלפפון ופלפל לחתיכות גדולות.', 'מוסיפים בצל פרוס דק וזיתים.', 'מניחים מעל את הפטה, מזלפים שמן זית ומגישים.'],
    },
  },
];
