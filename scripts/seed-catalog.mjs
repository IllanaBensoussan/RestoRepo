// Uploads catalog/ingredients.json, catalog/recipes.json and catalog/sources.json to Firestore.
// Documents are written by id; documents no longer in the files are deleted.
//
//   GOOGLE_APPLICATION_CREDENTIALS=key.json node scripts/seed-catalog.mjs   # real project
//   FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 node scripts/seed-catalog.mjs    # local emulator
import { readFileSync } from 'node:fs';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const projectId = process.env.FIREBASE_PROJECT_ID || 'resto-frigo';
const read = (f) => JSON.parse(readFileSync(new URL(`../catalog/${f}`, import.meta.url), 'utf8'));

initializeApp({ projectId });
const db = getFirestore();

async function sync(name, items) {
  const col = db.collection(name);
  const existing = await col.listDocuments();
  const keep = new Set(items.map((i) => i.id));
  const writer = db.bulkWriter();
  for (const { id, ...fields } of items) writer.set(col.doc(id), fields);
  const removed = existing.filter((d) => !keep.has(d.id));
  for (const d of removed) writer.delete(d);
  await writer.close();
  console.log(`${name}: ${items.length} written, ${removed.length} removed`);
}

const ingredients = read('ingredients.json');
const recipes = read('recipes.json');
const sources = read('sources.json');
await sync('sources', sources);
await sync('ingredients', ingredients);
await sync('recipes', recipes);
await db.doc('meta/catalog').set({ ingredients: ingredients.length, recipes: recipes.length, sources: sources.length, updatedAt: new Date() });
