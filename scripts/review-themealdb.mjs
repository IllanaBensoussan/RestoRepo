// Review page for the TheMealDB drafts (imports/themealdb/drafts.json): each draft next to the original,
// editable, to approve or reject. Runs on this computer only and writes straight into drafts.json.
//
//   npm run review:themealdb        # then open http://localhost:5174
//
// Don't run the import at the same time: it would write over what is approved here.
import { readFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { draftProblems, files, LANGS, readJson, STATUSES, TAGS, writeJson } from './themealdb/drafts.mjs';

const PORT = Number(process.env.PORT) || 5174;
const page = new URL('themealdb/review.html', import.meta.url);

const catalog = () => readJson(files.ingredients).map((i) => ({ id: i.id, name: i.name, category: i.category, group: i.group }));

function send(res, status, body, type = 'application/json; charset=utf-8') {
  res.writeHead(status, { 'content-type': type, 'cache-control': 'no-store' });
  res.end(type.startsWith('application/json') ? JSON.stringify(body) : body);
}

async function readBody(req) {
  let raw = '';
  for await (const chunk of req) {
    raw += chunk;
    if (raw.length > 1e6) throw new Error('too large');
  }
  return JSON.parse(raw);
}

// The page can only change a draft's status and its recipe text, never its id, source or original.
function update(draft, { status, recipe }) {
  if (!STATUSES.includes(status)) throw new Error(`unknown status "${status}"`);
  const str = (v) => (typeof v === 'string' ? v.trim() : '');
  const steps = Object.fromEntries(LANGS.map((l) => [l, (recipe.steps?.[l] ?? []).map(str)]));
  return {
    ...draft,
    status,
    recipe: {
      ...draft.recipe,
      title: Object.fromEntries(LANGS.map((l) => [l, str(recipe.title?.[l])])),
      minutes: Math.round(Number(recipe.minutes)) || 0,
      difficulty: recipe.difficulty === 'medium' ? 'medium' : 'easy',
      servings: Math.round(Number(recipe.servings)) || 0,
      tags: TAGS.filter((t) => recipe.tags?.includes(t)),
      ingredients: (recipe.ingredients ?? []).map((i) => ({ ref: str(i.ref), ...(str(i.qty) ? { qty: str(i.qty) } : {}) })),
      steps: { fr: steps.fr, en: steps.en, he: steps.he },
    },
  };
}

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    if (req.method === 'GET' && url.pathname === '/') return send(res, 200, readFileSync(page), 'text/html; charset=utf-8');
    if (req.method === 'GET' && url.pathname === '/tokens.css') return send(res, 200, readFileSync(files.tokens), 'text/css; charset=utf-8');
    if (req.method === 'GET' && url.pathname === '/api/data') {
      return send(res, 200, { drafts: readJson(files.drafts, []), ingredients: catalog(), tags: TAGS });
    }
    const match = url.pathname.match(/^\/api\/drafts\/([\w-]+)$/);
    if (req.method === 'PUT' && match) {
      const drafts = readJson(files.drafts, []);
      const index = drafts.findIndex((d) => d.source.id === match[1]);
      if (index < 0) return send(res, 404, { error: 'draft not found' });
      const next = update(drafts[index], await readBody(req));
      if (next.status === 'approved') {
        const problems = draftProblems(next, new Set(catalog().map((i) => i.id)));
        if (problems.length) return send(res, 422, { error: problems.join('\n') });
      }
      drafts[index] = next;
      writeJson(files.drafts, drafts);
      return send(res, 200, next);
    }
    send(res, 404, { error: 'not found' });
  } catch (e) {
    send(res, 400, { error: e.message });
  }
});

// Only this computer can reach it.
server.listen(PORT, '127.0.0.1', () => {
  const drafts = readJson(files.drafts, null);
  if (!drafts) console.log('No drafts yet: run `npm run import:themealdb` first.');
  console.log(`Review page: http://localhost:${PORT}`);
});
