import { getCatalog, type Catalog } from '../catalog';
import { NON_FOOD } from '../data';

export interface ParsedLine {
  id: string;
  raw: string;
  ingredientId: string | null;
  quantity?: string;
  price?: number;
  status: 'matched' | 'review' | 'ignored';
}

/** Lower case, no accents, punctuation as spaces. Keeps Hebrew letters. */
export function normalize(s: string) {
  return ` ${s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/œ/g, 'oe')
    .replace(/[֑-ׇ]/g, '')
    .replace(/[^a-z0-9א-ת]+/g, ' ')
    .trim()} `;
}

// Receipt keywords, longest first, rebuilt when the catalogue changes.
let keywordsFor: Catalog | null = null;
let KEYWORDS: { id: string; k: string }[] = [];
function keywords() {
  const c = getCatalog();
  if (c !== keywordsFor) {
    keywordsFor = c;
    KEYWORDS = c.ingredients.flatMap((i) => i.keywords.map((k) => ({ id: i.id, k: normalize(k).trim() }))).sort((a, b) => b.k.length - a.k.length);
  }
  return KEYWORDS;
}
const NON_FOOD_N = NON_FOOD.map((k) => normalize(k).trim());

// A keyword matches at the start of a word, so "tomates" finds "tomate" but "maillot" does not find "ail".
function hasWord(text: string, kw: string) {
  return text.includes(` ${kw}`);
}

export function matchIngredient(text: string): string | null {
  const n = normalize(text);
  for (const { id, k } of keywords()) if (hasWord(n, k)) return id;
  return null;
}

const SKIP = /(total|sous[- ]?total|tva|vat|carte|cb |visa|mastercard|cash|change|rendu|subtotal|tax|מע"?מ|סה"?כ|סך הכל|לתשלום|עודף|אשראי|מזומן|הנחה|remise|discount)/i;
const PRICE = /(-?\d{1,4}[.,]\d{2})(?!\d)/g;
const WEIGHT = /(\d+(?:[.,]\d+)?)\s?(kg|g|gr|l|ml|cl|ק"?ג|גר|ליטר|מ"?ל)\b/i;
const COUNT = /(?:^|\s)(?:x\s?(\d{1,2})|(\d{1,2})\s?x)(?:\s|$)/i;

const UNIT: Record<string, string> = { kg: 'kg', g: 'g', gr: 'g', l: 'L', ml: 'ml', cl: 'cl', 'ק"ג': 'kg', 'קג': 'kg', 'גר': 'g', 'ליטר': 'L', 'מ"ל': 'ml', 'מל': 'ml' };

export function parseReceipt(text: string): ParsedLine[] {
  const out: ParsedLine[] = [];
  for (const rawLine of text.split(/\r?\n/)) {
    const raw = rawLine.replace(/\s+/g, ' ').trim();
    if (raw.length < 3 || SKIP.test(raw)) continue;
    const prices = [...raw.matchAll(PRICE)].map((m) => parseFloat(m[1].replace(',', '.')));
    const label = raw.replace(PRICE, ' ').replace(/[*#]+/g, ' ').replace(/\s+/g, ' ').trim();
    if (!/[a-zA-Zא-ת]{3,}/.test(label)) continue;
    const price = prices.length ? prices[prices.length - 1] : undefined;
    if (price !== undefined && price < 0) continue; // discount lines
    const n = normalize(label);
    const nonFood = NON_FOOD_N.some((k) => hasWord(n, k));
    const ingredientId = nonFood ? null : matchIngredient(label);
    // Lines with neither a price nor a known product are header/footer noise.
    if (price === undefined && !ingredientId) continue;

    let quantity: string | undefined;
    const w = label.match(WEIGHT);
    if (w) quantity = `${w[1].replace('.', ',')} ${UNIT[w[2].toLowerCase()] ?? w[2]}`;
    else {
      const c = label.match(COUNT);
      if (c) quantity = c[1] || c[2];
    }

    out.push({
      id: `${out.length}-${Math.random().toString(36).slice(2, 7)}`,
      raw: label,
      ingredientId,
      quantity,
      price,
      status: nonFood ? 'ignored' : ingredientId ? 'matched' : 'review',
    });
  }
  return out;
}
