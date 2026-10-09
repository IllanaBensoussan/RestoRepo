// Firestore storage: users/{uid} holds lastReceiptAt; its pantry and shopping
// subcollections hold one document per item. Reads and writes go through
// Firestore's on-device cache, so the app keeps working offline and syncs later.
import {
  collection,
  connectFirestoreEmulator,
  doc,
  initializeFirestore,
  onSnapshot,
  persistentLocalCache,
  persistentMultipleTabManager,
  writeBatch,
  type Firestore,
} from 'firebase/firestore';
import { getCatalog, makeCatalog, setCatalog, type Ingredient, type Recipe, type Source } from '../catalog';
import { getApp, useEmulators } from './firebase';
import type { PantryEntry, ShoppingEntry } from './pantry';
import type { UserData } from './store';

let db: Firestore | null = null;

function getDb() {
  const app = getApp();
  if (!app) return null;
  if (!db) {
    db = initializeFirestore(app, {
      ignoreUndefinedProperties: true,
      localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
    });
    if (useEmulators) connectFirestoreEmulator(db, '127.0.0.1', 8080);
  }
  return db;
}

export const cloudAvailable = () => getDb() !== null;

/**
 * Streams the user's data. `onData` gets `null` while the account has nothing stored yet;
 * `fromCache` says the snapshot came from the device cache, not yet confirmed by the server.
 */
export function subscribeUserData(uid: string, onData: (d: UserData | null, fromCache: boolean) => void, onError: (e: Error) => void) {
  const fs = getDb()!;
  let pantry: PantryEntry[] | null = null;
  let shopping: ShoppingEntry[] | null = null;
  let lastReceiptAt: number | null | undefined;
  let exists = false;
  const cached = [true, true, true];
  const emit = () => {
    if (pantry === null || shopping === null || lastReceiptAt === undefined) return;
    const empty = !exists && pantry.length === 0 && shopping.length === 0;
    onData(empty ? null : { pantry, shopping, lastReceiptAt }, cached.some(Boolean));
  };
  const unsubs = [
    onSnapshot(doc(fs, 'users', uid), { includeMetadataChanges: true }, (s) => {
      cached[0] = s.metadata.fromCache;
      exists = s.exists();
      lastReceiptAt = (s.get('lastReceiptAt') as number | undefined) ?? null;
      emit();
    }, onError),
    onSnapshot(collection(fs, 'users', uid, 'pantry'), { includeMetadataChanges: true }, (s) => {
      cached[1] = s.metadata.fromCache;
      pantry = s.docs.map((d) => ({ ...(d.data() as PantryEntry), id: d.id }));
      emit();
    }, onError),
    onSnapshot(collection(fs, 'users', uid, 'shopping'), { includeMetadataChanges: true }, (s) => {
      cached[2] = s.metadata.fromCache;
      shopping = s.docs.map((d) => ({ ...(d.data() as ShoppingEntry), id: d.id }));
      emit();
    }, onError),
  ];
  return () => unsubs.forEach((u) => u());
}

const same = (a: object, b: object) => JSON.stringify(a) === JSON.stringify(b);

/** Writes only what changed between two states, in one atomic batch. */
export async function saveDiff(uid: string, prev: UserData, next: UserData) {
  const fs = getDb()!;
  const batch = writeBatch(fs);
  let writes = 0;
  for (const [name, before, after] of [
    ['pantry', prev.pantry, next.pantry],
    ['shopping', prev.shopping, next.shopping],
  ] as const) {
    const old = new Map<string, object>(before.map((x) => [x.id, x]));
    const now = new Set(after.map((x) => x.id));
    for (const item of after) {
      const o = old.get(item.id);
      if (!o || !same(o, item)) {
        const { id, ...fields } = item;
        batch.set(doc(fs, 'users', uid, name, id), fields);
        writes++;
      }
    }
    for (const id of old.keys()) {
      if (!now.has(id)) {
        batch.delete(doc(fs, 'users', uid, name, id));
        writes++;
      }
    }
  }
  if (prev.lastReceiptAt !== next.lastReceiptAt || writes > 0) {
    batch.set(doc(fs, 'users', uid), { lastReceiptAt: next.lastReceiptAt, updatedAt: Date.now() }, { merge: true });
    writes++;
  }
  if (writes > 0) await batch.commit();
}

/**
 * Keeps the app's catalogue in step with the `ingredients`, `recipes` and `sources` collections.
 * It stays "loading" until each has answered from the server (or from the device cache, when
 * that holds documents), and turns "unavailable" if one can't be read.
 */
export function subscribeCatalog() {
  const fs = getDb();
  if (!fs) {
    setCatalog(makeCatalog('unavailable'));
    return () => {};
  }
  let ingredients: Ingredient[] | null = null;
  let recipes: Recipe[] | null = null;
  let sources: Source[] | null = null;
  const apply = () => {
    if (ingredients && recipes && sources) setCatalog(makeCatalog('ready', ingredients, recipes, sources));
  };
  const fail = (what: string) => (e: Error) => {
    console.warn(`catalog: ${what}`, e);
    setCatalog({ ...getCatalog(), status: 'unavailable' });
  };
  // An empty snapshot from the cache only means nothing is cached yet: wait for the server.
  const settled = (s: { empty: boolean; metadata: { fromCache: boolean } }) => !s.metadata.fromCache || !s.empty;
  const unsubs = [
    onSnapshot(collection(fs, 'ingredients'), { includeMetadataChanges: true }, (s) => {
      if (!settled(s)) return;
      ingredients = s.docs.map((d) => ({ ...(d.data() as Ingredient), id: d.id }));
      apply();
    }, fail('ingredients')),
    onSnapshot(collection(fs, 'recipes'), { includeMetadataChanges: true }, (s) => {
      if (!settled(s)) return;
      recipes = s.docs.map((d) => ({ ...(d.data() as Recipe), id: d.id })).sort((a, b) => a.id.localeCompare(b.id));
      apply();
    }, fail('recipes')),
    onSnapshot(collection(fs, 'sources'), { includeMetadataChanges: true }, (s) => {
      if (!settled(s)) return;
      sources = s.docs.map((d) => ({ ...(d.data() as Source), id: d.id }));
      apply();
    }, (e) => {
      // Recipes still show without their source's name and logo.
      console.warn('catalog: sources', e);
      sources = [];
      apply();
    }),
  ];
  return () => unsubs.forEach((u) => u());
}
