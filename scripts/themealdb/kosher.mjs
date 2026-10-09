// Kosher filter for TheMealDB recipes, run before anything is translated.
// It only judges what a recipe is made of: forbidden animals and products, meat with dairy,
// meat with fish. Whether each product is certified, or the meat slaughtered and koshered,
// can't be told from a recipe; that is up to whoever cooks it.

// Phrases that contain a matching word but aren't that food, and what they are instead.
const REWRITES = {
  'coconut milk': '', 'coconut cream': '', 'creamed coconut': '', 'almond milk': '', 'oat milk': '', 'soy milk': '',
  'soya milk': '', 'rice milk': '', 'peanut butter': '', 'almond butter': '', 'cashew butter': '', 'cocoa butter': '',
  'butter beans': '', 'butter bean': '', 'cream of tartar': '', 'kidney beans': '', 'kidney bean': '',
  'oyster mushrooms': '', 'oyster mushroom': '', 'blood orange': '', 'blood oranges': '', 'vegetable stock': '',
  'vegetable broth': '', 'vegetarian sausage': '', 'vegetarian sausages': '', 'vegan': '',
  'goat cheese': 'cheese', 'goats cheese': 'cheese', 'goat s cheese': 'cheese', 'duck egg': 'egg', 'duck eggs': 'egg',
  'quail egg': 'egg', 'quail eggs': 'egg',
};

const FORBIDDEN = [
  // Pig
  'pork', 'bacon', 'ham', 'hams', 'gammon', 'lard', 'prosciutto', 'pancetta', 'chorizo', 'salami', 'pepperoni',
  'guanciale', 'speck', 'black pudding', 'crackling', 'frankfurter', 'frankfurters', 'boar',
  // Other forbidden animals and products
  'rabbit', 'hare', 'horse', 'frog', 'frogs', 'snail', 'snails', 'escargot', 'kangaroo', 'crocodile', 'alligator',
  'suet', 'blood', 'gelatin', 'gelatine', 'lardon', 'lardons', 'marshmallow', 'marshmallows',
  // British mincemeat is traditionally made with suet.
  'mincemeat',
  // Seafood without fins and scales
  'shrimp', 'shrimps', 'prawn', 'prawns', 'crab', 'crabs', 'lobster', 'lobsters', 'crayfish', 'langoustine', 'langoustines',
  'mussel', 'mussels', 'clam', 'clams', 'oyster', 'oysters', 'scallop', 'scallops', 'cockle', 'cockles', 'whelk', 'whelks',
  'squid', 'calamari', 'octopus', 'cuttlefish', 'sea urchin', 'krill', 'conch', 'conchs',
  // Fish without scales
  'eel', 'eels', 'catfish', 'monkfish', 'shark', 'swordfish', 'sturgeon', 'caviar', 'skate',
];

// A sausage is pork unless it says otherwise.
const SAUSAGE = /\b(sausage|sausages)\b/;
const KOSHER_SAUSAGE = /\b(beef|chicken|turkey|lamb|merguez)\b/;

const MEAT = [
  'beef', 'veal', 'lamb', 'mutton', 'goat', 'venison', 'chicken', 'turkey', 'duck', 'goose', 'quail', 'pigeon', 'pheasant',
  'partridge', 'mince', 'steak', 'steaks', 'brisket', 'sirloin', 'ribeye', 'rump', 'oxtail', 'liver', 'livers', 'kidney',
  'kidneys', 'meat', 'meatballs', 'bone', 'bones', 'gravy', 'dripping', 'merguez', 'sausage', 'sausages',
];

const DAIRY = [
  'milk', 'butter', 'buttermilk', 'cream', 'creme fraiche', 'cheese', 'cheddar', 'parmesan', 'parmigiano', 'pecorino',
  'mozzarella', 'ricotta', 'mascarpone', 'feta', 'halloumi', 'paneer', 'gruyere', 'emmental', 'brie', 'camembert',
  'stilton', 'gorgonzola', 'yogurt', 'yoghurt', 'ghee', 'custard', 'whey', 'fromage frais', 'quark', 'white chocolate',
];

const FISH = [
  'fish', 'salmon', 'tuna', 'cod', 'haddock', 'hake', 'mackerel', 'sardine', 'sardines', 'anchovy', 'anchovies', 'trout',
  'sea bass', 'seabass', 'bream', 'tilapia', 'herring', 'herrings', 'kipper', 'kippers', 'pollock', 'plaice', 'sole',
  'halibut', 'snapper', 'carp', 'pike', 'worcestershire',
];

const words = (list) => new RegExp(`\\b(${list.map((w) => w.replace(/ /g, '\\s+')).join('|')})\\b`);
const FORBIDDEN_RE = words(FORBIDDEN);
const MEAT_RE = words(MEAT);
const DAIRY_RE = words(DAIRY);
const FISH_RE = words(FISH);

export function normalize(text) {
  let t = ` ${text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z]+/g, ' ')} `;
  for (const [from, to] of Object.entries(REWRITES)) t = t.replaceAll(` ${from} `, ` ${to} `);
  return t;
}

/**
 * @param {{ title: string, category?: string, ingredients: { name: string }[] }} recipe
 * @returns {{ ok: boolean, issues: string[] }}
 */
export function checkKosher({ title, category, ingredients }) {
  const issues = [];
  if (category && /^pork$/i.test(category)) issues.push('category: Pork');

  const forbidden = (where, text) => {
    const t = normalize(text);
    const m = t.match(FORBIDDEN_RE);
    if (m) issues.push(`${where}: ${m[1]}`);
    else if (SAUSAGE.test(t) && !KOSHER_SAUSAGE.test(t)) issues.push(`${where}: sausage (pork unless stated otherwise)`);
  };
  forbidden('title', title);
  for (const i of ingredients) forbidden('ingredient', i.name);

  const find = (re) => ingredients.map((i) => i.name).filter((n) => re.test(normalize(n)));
  const meat = find(MEAT_RE);
  const dairy = find(DAIRY_RE);
  const fish = find(FISH_RE);
  if (meat.length && dairy.length) issues.push(`meat with dairy: ${meat.join(', ')} + ${dairy.join(', ')}`);
  if (meat.length && fish.length) issues.push(`meat with fish: ${meat.join(', ')} + ${fish.join(', ')}`);

  return { ok: issues.length === 0, issues };
}

/** Ingredient name and measure pairs from a TheMealDB meal (strIngredient1..20, strMeasure1..20). */
export function mealIngredients(meal) {
  const list = [];
  for (let n = 1; n <= 20; n++) {
    const name = meal[`strIngredient${n}`]?.trim();
    if (name) list.push({ name, measure: meal[`strMeasure${n}`]?.trim() ?? '' });
  }
  return list;
}
