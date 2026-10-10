import { useCallback, useEffect, useRef, useState } from 'react';
import { cloudAvailable, currentHouseholdId, legacyData, moveToOwnHousehold, saveDiff, subscribeHousehold, subscribeHouseholdId, type Household } from './cloud';
import type { AppUser } from './firebase';
import type { MenuEntry } from './menu';
import type { PantryEntry, ShoppingEntry } from './pantry';

export interface UserData {
  pantry: PantryEntry[];
  shopping: ShoppingEntry[];
  /** The weekly menu: recipes planned for each day's meals. */
  menu: MenuEntry[];
  lastReceiptAt: number | null;
}

const EMPTY: UserData = { pantry: [], shopping: [], menu: [], lastReceiptAt: null };
const keyFor = (uid: string) => `restofrigo:data:${uid}`;

function load(uid: string): UserData {
  try {
    const raw = localStorage.getItem(keyFor(uid));
    return raw ? { ...EMPTY, ...JSON.parse(raw) } : EMPTY;
  } catch {
    return EMPTY;
  }
}

export type SyncStatus = 'loading' | 'ready' | 'error';
type Update = (fn: (d: UserData) => UserData) => void;
export interface UserStore {
  data: UserData;
  update: Update;
  status: SyncStatus;
  /** The shared household, for Google accounts once it has loaded. */
  household: Household | null;
}

/**
 * The fridge, shopping list, menu and last receipt date the user sees: their household's.
 * Google accounts are stored in Firestore (shared live with the household, synced across devices,
 * usable offline); the demo account, or an app without Firebase keys, stays in this browser.
 */
export function useUserData(user: AppUser): UserStore {
  const cloud = !user.demo && cloudAvailable();
  const local = useLocalData(user.uid, !cloud);
  const remote = useCloudData(user, cloud);
  return cloud ? remote : local;
}

function useLocalData(uid: string, active: boolean): UserStore {
  const [data, setData] = useState<UserData>(() => (active ? load(uid) : EMPTY));
  useEffect(() => {
    if (active) setData(load(uid));
  }, [uid, active]);
  const update = useCallback<Update>(
    (fn) =>
      setData((d) => {
        const next = fn(d);
        try {
          localStorage.setItem(keyFor(uid), JSON.stringify(next));
        } catch {
          /* storage full or blocked: keep the in-memory copy */
        }
        return next;
      }),
    [uid],
  );
  return { data, update, status: 'ready', household: null };
}

function useCloudData(user: AppUser, active: boolean): UserStore {
  const { uid } = user;
  const [householdId, setHouseholdId] = useState<string | null>(null);
  const [data, setData] = useState<UserData>(EMPTY);
  const [household, setHousehold] = useState<Household | null>(null);
  const [status, setStatus] = useState<SyncStatus>('loading');
  const current = useRef<UserData>(EMPTY);
  const userRef = useRef(user);
  userRef.current = user;

  // Which household the user is in. A first sign-in gets their own, filled with what they had
  // stored before households existed, or failing that with what this browser had.
  useEffect(() => {
    if (!active) return;
    let creating = false;
    // Offline on a device that never synced: show an empty app rather than wait forever.
    const giveUp = window.setTimeout(() => setStatus((st) => (st === 'loading' ? 'ready' : st)), 4000);
    const unsub = subscribeHouseholdId(
      uid,
      (id) => {
        if (id) return setHouseholdId(id);
        if (creating) return;
        creating = true;
        void (async () => {
          const saved = load(uid);
          const seed = (await legacyData(uid)) ?? (saved.pantry.length || saved.shopping.length || saved.menu.length ? saved : undefined);
          await moveToOwnHousehold(userRef.current, seed);
          try { localStorage.removeItem(keyFor(uid)); } catch { /* ignore */ }
        })().catch((err) => {
          console.error(err);
          setStatus('error');
        });
      },
      (err) => {
        console.error(err);
        setStatus('error');
      },
    );
    return () => {
      window.clearTimeout(giveUp);
      unsub();
    };
  }, [uid, active]);

  useEffect(() => {
    if (!householdId) return;
    setStatus('loading');
    // Offline on a device that never synced: stop waiting for the server and show the cache.
    const giveUp = window.setTimeout(() => setStatus((st) => (st === 'loading' ? 'ready' : st)), 4000);
    const unsub = subscribeHousehold(
      householdId,
      (d, h) => {
        current.current = d;
        setData(d);
        setHousehold(h);
        setStatus('ready');
      },
      (err) => {
        if (err.code !== 'permission-denied') {
          console.error(err);
          setStatus('error');
          return;
        }
        // Either the user is moving to another household (its id arrives next), or a member
        // removed them: then they go back to their own household.
        void currentHouseholdId(uid).then((id) => {
          if (id !== householdId) return;
          if (id === uid) throw err;
          return moveToOwnHousehold(userRef.current, undefined, id);
        }).catch((e) => {
          console.error(e);
          setStatus('error');
        });
      },
    );
    return () => {
      window.clearTimeout(giveUp);
      unsub();
    };
  }, [householdId, uid]);

  const update = useCallback<Update>(
    (fn) => {
      if (!householdId) return;
      const prev = current.current;
      const next = fn(prev);
      current.current = next;
      setData(next);
      saveDiff(householdId, prev, next).catch((err) => {
        console.error(err);
        setStatus('error');
      });
    },
    [householdId],
  );
  return { data, update, status, household: household?.id === householdId ? household : null };
}

export function usePref<T extends string>(key: string, initial: T) {
  const [v, setV] = useState<T>(() => {
    try {
      return (localStorage.getItem(`restofrigo:${key}`) as T) || initial;
    } catch {
      return initial;
    }
  });
  const set = useCallback((next: T) => {
    setV(next);
    try {
      localStorage.setItem(`restofrigo:${key}`, next);
    } catch {
      /* ignore */
    }
  }, [key]);
  return [v, set] as const;
}

/** Example fridge for the demo account, so the app opens with something to show. */
export function seedDemo() {
  const key = keyFor('demo');
  try {
    if (localStorage.getItem(key)) return;
    const now = Date.now(), D = 86_400_000;
    const e = (id: string, ingredientId: string, category: PantryEntry['category'], days: number, source: PantryEntry['source'], quantity?: string): PantryEntry =>
      ({ id, ingredientId, category, source, quantity, addedAt: now - D, expiresAt: now + days * D });
    const data: UserData = { lastReceiptAt: now - D, shopping: [], menu: [], pantry: [
      e('d1', 'egg', 'dairy', 10, 'receipt', '12'), e('d2', 'cherry-tomato', 'veg', 2, 'receipt', '250 g'),
      e('d3', 'pepper', 'veg', 3, 'manual', '3'), e('d4', 'onion', 'veg', 20, 'receipt', '1 kg'),
      e('d5', 'garlic', 'veg', 20, 'receipt', '1'), e('d6', 'olive-oil', 'grocery', 200, 'receipt', '1 L'),
      e('d7', 'milk', 'dairy', 0, 'receipt', '1 L'), e('d8', 'lentils', 'grocery', 200, 'manual', '500 g'),
      e('d9', 'carrot', 'veg', 12, 'receipt', '1 kg'), e('d10', 'pasta', 'grocery', 200, 'receipt', '500 g'),
      e('d11', 'cucumber', 'veg', -1, 'receipt', '4'),
    ] };
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    /* storage blocked: the demo starts empty */
  }
}
