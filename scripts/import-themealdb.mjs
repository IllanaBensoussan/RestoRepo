// Imports recipes from TheMealDB (https://www.themealdb.com) in two steps, with a human review between them.
//
// 1. Draft: fetches every recipe, drops the ones that aren't kosher (scripts/themealdb/kosher.mjs), then has
//    Claude double-check kashrut, translate to French and Hebrew, split the steps, estimate time and difficulty,
//    and match each ingredient to catalog/ingredients.json. Results go to imports/themealdb/drafts.json with
//    status "pending" (or "needs-ingredients" when an ingredient isn't in the catalogue), and what was left out
//    goes to imports/themealdb/excluded.json with the reasons. Recipes already in either file are skipped, so
//    running it again only translates new recipes.
//
//      ANTHROPIC_API_KEY=... node scripts/import-themealdb.mjs              # draft every new recipe
//      ANTHROPIC_API_KEY=... node scripts/import-themealdb.mjs --limit 5    # at most 5, to try it out
//      node scripts/import-themealdb.mjs --dry-run                          # fetch and filter only, no Claude
//      ANTHROPIC_API_KEY=... node scripts/import-themealdb.mjs --redo 52772,52773   # draft these again
//
// 2. Review: in drafts.json, read each draft, fix the texts if needed, and set "status" to "approved" or
//    "rejected".
//
// 3. Publish: copies the approved drafts into catalog/recipes.json (ids "mealdb-<id>"), and removes imported
//    recipes whose draft is no longer approved. Push, and the catalog workflow uploads them to Firestore.
//
//      node scripts/import-themealdb.mjs --publish
//
// THEMEALDB_API_KEY defaults to "1", TheMealDB's test key.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { parseArgs } from 'node:util';
import { checkKosher, mealIngredients } from './themealdb/kosher.mjs';

const root = new URL('../', import.meta.url);
const dir = new URL('imports/themealdb/', root);
const files = {
  drafts: new URL('drafts.json', dir),
  excluded: new URL('excluded.json', dir),
  ingredients: new URL('catalog/ingredients.json', root),
  recipes: new URL('catalog/recipes.json', root),
};
const readJson = (f, fallback) => (existsSync(f) ? JSON.parse(readFileSync(f, 'utf8')) : fallback);
const writeJson = (f, data) => writeFileSync(f, `${JSON.stringify(data, null, 1)}\n`);

const ID_PREFIX = 'mealdb-';
const LANGS = ['fr', 'en', 'he'];
const TAGS = ['veggie', 'vegan', 'fish', 'meat', 'quick', 'oven', 'soup', 'salad', 'pasta', 'sweet', 'asian', 'israeli'];
const MODEL = 'claude-opus-5-5';
const PARALLEL = 3;

const { values: args } = parseArgs({
  options: {
    publish: { type: 'boolean' },
    'dry-run': { type: 'boolean' },
    limit: { type: 'string' },
    redo: { type: 'string' },
  },
});

const ingredients = readJson(files.ingredients);
const refs = ingredients.map((i) => i.id);

if (args.publish) publish();
else await draft();

// ---------------------------------------------------------------------------------------------------------------
// Draft

async function draft() {
  mkdirSync(dir, { recursive: true });
  let drafts = readJson(files.drafts, []);
  let excluded = readJson(files.excluded, []);
  const redo = new Set(args.redo ? args.redo.split(',').map((s) => s.trim()) : []);
  if (redo.size) {
    drafts = drafts.filter((d) => !redo.has(d.source.id));
    excluded = excluded.filter((e) => !redo.has(e.id));
  }
  const seen = new Set([...drafts.map((d) => d.source.id), ...excluded.map((e) => e.id)]);
  const save = () => {
    drafts.sort((a, b) => a.source.id.localeCompare(b.source.id));
    excluded.sort((a, b) => a.id.localeCompare(b.id));
    writeJson(files.drafts, drafts);
    writeJson(files.excluded, excluded);
  };

  const meals = await fetchAllMeals();
  console.log(`TheMealDB: ${meals.length} recipes, ${seen.size} already handled`);

  const todo = [];
  let filtered = 0;
  for (const meal of meals) {
    if (seen.has(meal.idMeal)) continue;
    const verdict = checkKosher({ title: meal.strMeal, category: meal.strCategory, ingredients: mealIngredients(meal) });
    if (verdict.ok) todo.push(meal);
    else {
      excluded.push({ id: meal.idMeal, name: meal.strMeal, by: 'filter', issues: verdict.issues });
      filtered++;
    }
  }
  save();
  console.log(`Not kosher: ${filtered} more excluded. To translate: ${todo.length}`);
  if (args['dry-run'] || !todo.length) return;

  const limit = args.limit ? Number(args.limit) : Infinity;
  const queue = todo.slice(0, limit);
  const claude = await makeClaude();
  let done = 0;
  const worker = async () => {
    for (let meal = queue.shift(); meal; meal = queue.shift()) {
      const label = `${meal.idMeal} ${meal.strMeal}`;
      try {
        const result = await claude(meal);
        if (result.excluded) excluded.push(result.excluded);
        else drafts.push(result.draft);
        save();
        console.log(`[${++done}] ${label}: ${result.excluded ? `excluded (${result.excluded.issues.join('; ')})` : result.draft.status}`);
      } catch (e) {
        console.error(`[skip] ${label}: ${e.message}`);
      }
    }
  };
  await Promise.all(Array.from({ length: PARALLEL }, worker));
  const count = (s) => drafts.filter((d) => d.status === s).length;
  console.log(`Drafts: ${count('pending')} to review, ${count('needs-ingredients')} need ingredients, ${count('approved')} approved. Excluded: ${excluded.length}`);
}

async function fetchAllMeals() {
  const key = process.env.THEMEALDB_API_KEY || '1';
  const byId = new Map();
  for (const letter of 'abcdefghijklmnopqrstuvwxyz0123456789') {
    const res = await fetch(`https://www.themealdb.com/api/json/v1/${key}/search.php?f=${letter}`);
    if (!res.ok) throw new Error(`TheMealDB answered ${res.status} for "${letter}"`);
    const { meals } = await res.json();
    for (const m of meals ?? []) byId.set(m.idMeal, m);
  }
  return [...byId.values()];
}

async function makeClaude() {
  const { default: Anthropic } = await import('@anthropic-ai/sdk');
  const { betaZodOutputFormat } = await import('@anthropic-ai/sdk/helpers/beta/zod');
  const { z } = await import('zod');

  const L10n = z.object({ en: z.string(), fr: z.string(), he: z.string() });
  const Output = z.object({
    kosher: z.object({ ok: z.boolean(), issues: z.array(z.string()) }),
    title: L10n,
    steps: z.object({ en: z.array(z.string()), fr: z.array(z.string()), he: z.array(z.string()) }),
    minutes: z.number().int(),
    // Allowed values are in the prompt and checked below: the output schema doesn't enforce enums.
    difficulty: z.string(),
    servings: z.number().int(),
    tags: z.array(z.string()),
    ingredients: z.array(
      z.object({
        source: z.string(),
        use: z.enum(['ref', 'staple', 'missing']),
        ref: z.string().nullable(),
        qty: z.string().nullable(),
      }),
    ),
    notes: z.array(z.string()),
  });

  const client = new Anthropic();
  const system = systemPrompt();

  return async (meal) => {
    const original = { ingredients: mealIngredients(meal), instructions: meal.strInstructions?.trim() ?? '' };
    const source = {
      id: meal.idMeal,
      name: meal.strMeal,
      category: meal.strCategory,
      area: meal.strArea,
      url: `https://www.themealdb.com/meal/${meal.idMeal}`,
      video: meal.strYoutube || null,
    };

    let out;
    for (let attempt = 1; ; attempt++) {
      const response = await client.beta.messages.parse({
        model: MODEL,
        max_tokens: 16000,
        betas: ['server-side-fallback-2026-07-01'],
        fallbacks: 'default',
        output_config: { effort: 'medium', format: betaZodOutputFormat(Output) },
        system: [{ type: 'text', text: system, cache_control: { type: 'ephemeral' } }],
        messages: [
          {
            role: 'user',
            content: JSON.stringify({ name: meal.strMeal, category: meal.strCategory, cuisine: meal.strArea, ...original }, null, 1),
          },
        ],
      });
      if (response.stop_reason === 'refusal') throw new Error('Claude declined this recipe');
      if (response.stop_reason === 'max_tokens') throw new Error('answer cut off');
      out = response.parsed_output;
      const counts = LANGS.map((l) => out?.steps[l].length);
      if (out && counts[0] > 0 && counts.every((c) => c === counts[0])) break;
      if (attempt === 2) throw new Error(`steps differ between languages (${counts.join('/')})`);
    }

    if (!out.kosher.ok) return { excluded: { id: meal.idMeal, name: meal.strMeal, by: 'claude', issues: out.kosher.issues } };

    // Two lines of the original can be the same catalogue ingredient (garlic, garlic clove): keep one.
    const used = new Map();
    const known = new Set(refs);
    for (const i of out.ingredients) {
      if (i.use !== 'ref' || !known.has(i.ref)) continue;
      const prev = used.get(i.ref);
      if (!prev) used.set(i.ref, { ref: i.ref, ...(i.qty ? { qty: i.qty } : {}) });
      else if (!prev.qty && i.qty) prev.qty = i.qty;
    }
    const missing = out.ingredients.filter((i) => i.use === 'missing' || (i.use === 'ref' && !known.has(i.ref))).map((i) => i.source);

    return {
      draft: {
        status: missing.length ? 'needs-ingredients' : 'pending',
        source,
        ...(missing.length ? { missing } : {}),
        notes: out.notes,
        recipe: {
          id: `${ID_PREFIX}${meal.idMeal}`,
          title: { fr: out.title.fr, en: out.title.en, he: out.title.he },
          image: meal.strMealThumb || null,
          minutes: out.minutes,
          difficulty: out.difficulty === 'easy' ? 'easy' : 'medium',
          servings: out.servings,
          tags: [...new Set(out.tags)].filter((t) => TAGS.includes(t)),
          ingredients: [...used.values()],
          steps: { fr: out.steps.fr, en: out.steps.en, he: out.steps.he },
        },
        original,
      },
    };
  };
}

function systemPrompt() {
  const catalog = ingredients.map((i) => `${i.id}: ${i.name.en}${i.group ? ` (one kind of ${i.group})` : ''}`).join('\n');
  const example = readJson(files.recipes).find((r) => r.id === 'shakshuka');
  return `You prepare recipes from TheMealDB for RestoFrigo, a kitchen app in French, English and Hebrew that suggests recipes from what is in the user's fridge. Its users keep kosher.

You get one recipe: its original name, category, cuisine, ingredients with measures, and instructions. Fill in each field as follows.

kosher: judge what the recipe is made of. ok is false when it uses a non-kosher animal or product (pork and anything made from it, shellfish and other sea creatures without fins and scales, fish without scales such as eel or catfish, rabbit, suet, blood, gelatin), cooks meat or poultry together with dairy (butter, cheese, cream, milk, yogurt, or a stock or sauce containing them), or cooks meat together with fish (anchovies and Worcestershire sauce count as fish). Put each problem in issues. Leave out certification and slaughter, which a recipe can't show. Don't make a recipe kosher by swapping an ingredient: judge it as written.

title: the name of the dish in each language. English: the original name, tidied, in sentence case ("Pepper shakshuka"). French and Hebrew: what a cook in France or in Israel would call it; keep well-known foreign names as they are used there.

steps: rewrite the instructions as 3 to 8 short steps, the same steps in each language, so step n says the same thing in all three. Metric units and °C. Leave out serving suggestions that aren't cooking. French speaks to the reader with "tu" ("Fais revenir…"), Hebrew uses the impersonal plural present ("מטגנים", "מוסיפים"), English uses the imperative.

minutes: total time including cooking and resting, a realistic estimate. difficulty: easy or medium. servings: from the recipe, or a reasonable estimate.

tags: those that apply, from the list. veggie: no meat or fish. vegan: no animal product at all. fish. meat: meat or poultry. quick: 20 minutes or less. oven. soup. salad. pasta. sweet: a dessert or sweet baking. asian. israeli: an Israeli dish, or a Middle Eastern one common in Israel.

ingredients: one entry per original ingredient, in the same order, with source set to the original name, and use set to:
- ref when it is one of the app's ingredients listed below: set ref to its id. Take the closest one: chopped tomatoes → canned-tomatoes, tomato puree → tomato-paste, garlic clove → garlic, lemon juice → lemon, chicken stock → stock, plain flour → flour, caster sugar → sugar. When any kind would do, use the general id (tomato rather than cherry-tomato).
- staple for what every kitchen has and the app doesn't track: salt, pepper, water, ice, baking powder, bicarbonate of soda, and small amounts of dried herbs, spices and condiments that aren't in the list. ref is null.
- missing for anything else, ref null. Never call a main ingredient a staple just because it is missing from the list.
qty: the amount in a form that reads in any language: a count ("2"), or grams and millilitres ("200 g", "400 ml", "1 kg"). Convert cups and ounces. null when the amount is in spoons, a pinch, to taste, or not given.

notes: what a reviewer should check: an ambiguous ingredient, a guess about time or servings, an instruction you had to interpret. Empty when there is nothing.

The app's ingredients (id: English name):
${catalog}

A recipe already in the app, to show the tone and length of the steps:
${JSON.stringify({ title: example.title, steps: example.steps })}`;
}

// ---------------------------------------------------------------------------------------------------------------
// Publish

function publish() {
  const drafts = readJson(files.drafts, []);
  const approved = drafts.filter((d) => d.status === 'approved');
  const known = new Set(refs);
  const problems = [];
  for (const d of approved) {
    const r = d.recipe;
    const where = `${d.source.id} ${d.source.name}`;
    const verdict = checkKosher({ title: d.source.name, category: d.source.category, ingredients: d.original.ingredients });
    if (!verdict.ok) problems.push(`${where}: not kosher (${verdict.issues.join('; ')})`);
    for (const { ref } of r.ingredients) if (!known.has(ref)) problems.push(`${where}: unknown ingredient "${ref}"`);
    for (const l of LANGS) {
      if (!r.title[l]?.trim()) problems.push(`${where}: no title in ${l}`);
      if (!r.steps[l]?.length) problems.push(`${where}: no steps in ${l}`);
      else if (r.steps[l].length !== r.steps.fr.length) problems.push(`${where}: ${l} doesn't have as many steps as fr`);
    }
    if (!r.ingredients.length) problems.push(`${where}: no ingredients`);
  }
  if (problems.length) {
    console.error(`Nothing published. Fix these approved drafts first:\n${problems.join('\n')}`);
    process.exit(1);
  }

  const before = readJson(files.recipes);
  const kept = before.filter((r) => !r.id.startsWith(ID_PREFIX));
  const removed = before.length - kept.length;
  writeFileSync(files.recipes, JSON.stringify([...kept, ...approved.map((d) => d.recipe)], null, 1));
  console.log(`catalog/recipes.json: ${kept.length} own recipes, ${approved.length} from TheMealDB (${removed} were there before)`);
}
