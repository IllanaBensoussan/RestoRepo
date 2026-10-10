// Firestore storage. A household shares one fridge, one shopping list and one weekly menu between
// its members: households/{id} holds lastReceiptAt and the current invitation code, and its
// members, pantry, shopping and menu subcollections hold one document per person or item. users/{uid} says which household
// the person is in. Reads and writes go through Firestore's on-device cache, so the app keeps
// working offline and syncs later.
import {
  collection,
  connectFirestoreEmulator,
  doc,
  getDoc,
  getDocFromServer,
  getDocs,
  initializeFirestore,
  onSnapshot,
  persistentLocalCache,
  persistentMultipleTabManager,
  writeBatch,
  type Firestore,
  type WriteBatch,
} from 'firebase/firestore';
import { getCatalog, makeCatalog, setCatalog, type Ingredient, type Recipe, type Source } from '../catalog';
import { getApp, useEmulators, type AppUser } from './firebase';
import type { MenuEntry } from './menu';
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

export interface Member {
  uid: string;
  name: string;
  photoURL: string | null;
  joinedAt: number;
}

export interface Household {
  id: string;
  owner: string;
  /** Code of the current invitation link, once someone has shared one. */
  invite: string | null;
  members: Member[];
}

/**
 * Streams the id of the user's household: `null` once the server confirms there is none yet.
 * Ids waiting on a local write are skipped, so a household is only reported once joining it
 * has gone through.
 */
export function subscribeHouseholdId(uid: string, onId: (id: string | null) => void, onError: (e: Error) => void) {
  const fs = getDb()!;
  return onSnapshot(doc(fs, 'users', uid), { includeMetadataChanges: true }, (s) => {
    if (s.metadata.hasPendingWrites) return;
    const id = s.get('householdId') as string | undefined;
    if (id) onId(id);
    else if (!s.metadata.fromCache) onId(null);
  }, onError);
}

/**
 * Streams a household's fridge, shopping list, menu and members. `fromCache` says the snapshot came
 * from the device cache, not yet confirmed by the server.
 */
export function subscribeHousehold(id: string, onData: (d: UserData, h: Household, fromCache: boolean) => void, onError: (e: Error & { code?: string }) => void) {
  const fs = getDb()!;
  let pantry: PantryEntry[] | null = null;
  let shopping: ShoppingEntry[] | null = null;
  let menu: MenuEntry[] | null = null;
  let members: Member[] | null = null;
  let info: { owner: string; invite: string | null; lastReceiptAt: number | null } | null = null;
  const cached = [true, true, true, true, true];
  const emit = () => {
    if (!pantry || !shopping || !menu || !members || !info) return;
    onData({ pantry, shopping, menu, lastReceiptAt: info.lastReceiptAt }, { id, owner: info.owner, invite: info.invite, members }, cached.some(Boolean));
  };
  const unsubs = [
    onSnapshot(doc(fs, 'households', id), { includeMetadataChanges: true }, (s) => {
      cached[0] = s.metadata.fromCache;
      info = { owner: (s.get('owner') as string | undefined) ?? id, invite: (s.get('invite') as string | undefined) ?? null, lastReceiptAt: (s.get('lastReceiptAt') as number | undefined) ?? null };
      emit();
    }, onError),
    onSnapshot(collection(fs, 'households', id, 'members'), { includeMetadataChanges: true }, (s) => {
      cached[1] = s.metadata.fromCache;
      members = s.docs.map((d) => ({ uid: d.id, name: (d.get('name') as string) || '', photoURL: (d.get('photoURL') as string | null) ?? null, joinedAt: (d.get('joinedAt') as number) || 0 }))
        .sort((a, b) => a.joinedAt - b.joinedAt);
      emit();
    }, onError),
    onSnapshot(collection(fs, 'households', id, 'pantry'), { includeMetadataChanges: true }, (s) => {
      cached[2] = s.metadata.fromCache;
      pantry = s.docs.map((d) => ({ ...(d.data() as PantryEntry), id: d.id }));
      emit();
    }, onError),
    onSnapshot(collection(fs, 'households', id, 'shopping'), { includeMetadataChanges: true }, (s) => {
      cached[3] = s.metadata.fromCache;
      shopping = s.docs.map((d) => ({ ...(d.data() as ShoppingEntry), id: d.id }));
      emit();
    }, onError),
    onSnapshot(collection(fs, 'households', id, 'menu'), { includeMetadataChanges: true }, (s) => {
      cached[4] = s.metadata.fromCache;
      menu = s.docs.map((d) => ({ ...(d.data() as MenuEntry), id: d.id }));
      emit();
    }, (e) => {
      // Rules published before the menu existed refuse it: the fridge and the list still sync.
      // Someone removed from the household is refused the other collections too.
      console.warn('menu', e);
      cached[4] = false;
      menu = [];
      emit();
    }),
  ];
  return () => unsubs.forEach((u) => u());
}

const same = (a: object, b: object) => JSON.stringify(a) === JSON.stringify(b);

/** Writes only what changed between two states of a household, in one atomic batch. */
export async function saveDiff(householdId: string, prev: UserData, next: UserData) {
  const fs = getDb()!;
  const batch = writeBatch(fs);
  let writes = 0;
  for (const [name, before, after] of [
    ['pantry', prev.pantry, next.pantry],
    ['shopping', prev.shopping, next.shopping],
    ['menu', prev.menu, next.menu],
  ] as const) {
    const old = new Map<string, object>(before.map((x) => [x.id, x]));
    const now = new Set(after.map((x) => x.id));
    for (const item of after) {
      const o = old.get(item.id);
      if (!o || !same(o, item)) {
        const { id, ...fields } = item;
        batch.set(doc(fs, 'households', householdId, name, id), fields);
        writes++;
      }
    }
    for (const id of old.keys()) {
      if (!now.has(id)) {
        batch.delete(doc(fs, 'households', householdId, name, id));
        writes++;
      }
    }
  }
  if (prev.lastReceiptAt !== next.lastReceiptAt) {
    batch.set(doc(fs, 'households', householdId), { lastReceiptAt: next.lastReceiptAt }, { merge: true });
    writes++;
  }
  if (writes > 0) await batch.commit();
}

/** Copies items into a household, in batches small enough for Firestore. */
async function copyItems(householdId: string, data: Pick<UserData, 'pantry' | 'shopping' | 'menu'>) {
  const fs = getDb()!;
  const items = [
    ...data.pantry.map((x) => ['pantry', x] as const),
    ...data.shopping.map((x) => ['shopping', x] as const),
    ...data.menu.map((x) => ['menu', x] as const),
  ];
  for (let i = 0; i < items.length; i += 400) {
    const batch = writeBatch(fs);
    for (const [name, { id, ...fields }] of items.slice(i, i + 400)) batch.set(doc(fs, 'households', householdId, name, id), fields);
    await batch.commit();
  }
}

function addMember(batch: WriteBatch, householdId: string, user: AppUser, invite?: string) {
  const fs = getDb()!;
  batch.set(doc(fs, 'households', householdId, 'members', user.uid), { name: user.name, photoURL: user.photoURL, joinedAt: Date.now(), invite });
  batch.set(doc(fs, 'users', user.uid), { householdId }, { merge: true });
}

/**
 * Puts the user (back) in their own household, whose id is their uid, and fills it with `seed`.
 * When they are leaving another household, `leaving` drops them from it in the same batch.
 */
export async function moveToOwnHousehold(user: AppUser, seed?: UserData, leaving?: string) {
  const fs = getDb()!;
  const batch = writeBatch(fs);
  const lastReceiptAt = seed?.lastReceiptAt;
  batch.set(doc(fs, 'households', user.uid), { owner: user.uid, ...(lastReceiptAt ? { lastReceiptAt } : {}) }, { merge: true });
  addMember(batch, user.uid, user);
  if (leaving && leaving !== user.uid) batch.delete(doc(fs, 'households', leaving, 'members', user.uid));
  await batch.commit();
  if (seed) await copyItems(user.uid, seed);
}

/** What the user stored before households existed (users/{uid} and its subcollections), if anything. */
export async function legacyData(uid: string): Promise<UserData | null> {
  const fs = getDb()!;
  const [user, pantry, shopping] = await Promise.all([
    getDoc(doc(fs, 'users', uid)),
    getDocs(collection(fs, 'users', uid, 'pantry')),
    getDocs(collection(fs, 'users', uid, 'shopping')),
  ]);
  if (pantry.empty && shopping.empty) return null;
  return {
    pantry: pantry.docs.map((d) => ({ ...(d.data() as PantryEntry), id: d.id })),
    shopping: shopping.docs.map((d) => ({ ...(d.data() as ShoppingEntry), id: d.id })),
    menu: [],
    lastReceiptAt: (user.get('lastReceiptAt') as number | undefined) ?? null,
  };
}

const newCode = () => Array.from(crypto.getRandomValues(new Uint8Array(12)), (b) => b.toString(16).padStart(2, '0')).join('');

/**
 * Creates a new invitation code for the household and withdraws the previous one, so an old
 * link stops working. Returns the code right away: the write syncs when the device is online.
 */
export function newInvite(h: Household, by: AppUser) {
  const fs = getDb()!;
  const code = newCode();
  const batch = writeBatch(fs);
  batch.set(doc(fs, 'invites', code), { householdId: h.id, by: by.uid, fromName: by.name, createdAt: Date.now() });
  batch.set(doc(fs, 'households', h.id), { invite: code }, { merge: true });
  if (h.invite) batch.delete(doc(fs, 'invites', h.invite));
  batch.commit().catch((e) => console.error('invite', e));
  return code;
}

export interface Invite { code: string; householdId: string; fromName: string }

/** The household an invitation code leads to, or null when the code is unknown or withdrawn. */
export async function lookupInvite(code: string): Promise<Invite | null> {
  const fs = getDb()!;
  const s = await getDoc(doc(fs, 'invites', code));
  if (!s.exists()) return null;
  return { code, householdId: s.get('householdId') as string, fromName: (s.get('fromName') as string) || '' };
}

/**
 * Joins the invite's household, then leaves the current one. With `bring`, the user's items are
 * moved over first (they were the current household's only member, so nobody else loses them).
 */
export async function joinHousehold(user: AppUser, invite: Invite, current: string | null, bring?: UserData) {
  const fs = getDb()!;
  const join = writeBatch(fs);
  addMember(join, invite.householdId, user, invite.code);
  await join.commit();
  if (!current || current === invite.householdId) return;
  const moved = bring ? [...bring.pantry.map((x) => ['pantry', x.id]), ...bring.shopping.map((x) => ['shopping', x.id]), ...bring.menu.map((x) => ['menu', x.id])] : [];
  if (bring) await copyItems(invite.householdId, bring);
  for (let i = 0; i < moved.length; i += 400) {
    const batch = writeBatch(fs);
    for (const [name, id] of moved.slice(i, i + 400)) batch.delete(doc(fs, 'households', current, name, id));
    await batch.commit();
  }
  const leave = writeBatch(fs);
  leave.delete(doc(fs, 'households', current, 'members', user.uid));
  await leave.commit();
}

/** The household id stored on the server for the user, bypassing the device cache. */
export async function currentHouseholdId(uid: string) {
  const s = await getDocFromServer(doc(getDb()!, 'users', uid));
  return (s.get('householdId') as string | undefined) ?? null;
}

/** Removes someone from the household (owner only). */
export async function removeMember(householdId: string, uid: string) {
  const fs = getDb()!;
  const batch = writeBatch(fs);
  batch.delete(doc(fs, 'households', householdId, 'members', uid));
  await batch.commit();
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
