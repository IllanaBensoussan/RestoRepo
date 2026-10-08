import { useCallback, useEffect, useRef, useState } from 'react';
import { cloudAvailable, saveDiff, subscribeUserData } from './cloud';
import type { PantryEntry, ShoppingEntry } from './pantry';

export interface UserData {
  pantry: PantryEntry[];
  shopping: ShoppingEntry[];
  lastReceiptAt: number | null;
}

const EMPTY: UserData = { pantry: [], shopping: [], lastReceiptAt: null };
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

/**
 * The signed-in user's fridge, shopping list and last receipt date.
 * Google accounts are stored in Firestore (synced across devices, usable offline);
 * the demo account, or an app without Firebase keys, stays in this browser.
 */
export function useUserData(uid: string): readonly [UserData, Update, SyncStatus] {
  const cloud = uid !== 'demo' && cloudAvailable();
  const local = useLocalData(uid, !cloud);
  const remote = useCloudData(uid, cloud);
  return cloud ? remote : local;
}

function useLocalData(uid: string, active: boolean): readonly [UserData, Update, SyncStatus] {
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
  return [data, update, 'ready'] as const;
}

function useCloudData(uid: string, active: boolean): readonly [UserData, Update, SyncStatus] {
  const [data, setData] = useState<UserData>(EMPTY);
  const [status, setStatus] = useState<SyncStatus>('loading');
  const current = useRef<UserData>(EMPTY);

  useEffect(() => {
    if (!active) return;
    setStatus('loading');
    let migrating = false;
    // Offline on a device that never synced: stop waiting for the server and show the cache.
    const giveUp = window.setTimeout(() => setStatus((st) => (st === 'loading' ? 'ready' : st)), 4000);
    const unsub = subscribeUserData(
      uid,
      (d, fromCache) => {
        if (d === null && !fromCache && !migrating) {
          // First sign-in with Firestore: bring over what this browser already had.
          const saved = load(uid);
          if (saved.pantry.length || saved.shopping.length) {
            migrating = true;
            void saveDiff(uid, EMPTY, saved).then(() => {
              try { localStorage.removeItem(keyFor(uid)); } catch { /* ignore */ }
            });
          }
        }
        if (d === null && fromCache) return; // wait for the server before showing an empty fridge
        current.current = d ?? EMPTY;
        setData(current.current);
        setStatus('ready');
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

  const update = useCallback<Update>(
    (fn) => {
      const prev = current.current;
      const next = fn(prev);
      current.current = next;
      setData(next);
      saveDiff(uid, prev, next).catch((err) => {
        console.error(err);
        setStatus('error');
      });
    },
    [uid],
  );
  return [data, update, status] as const;
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
    const data: UserData = { lastReceiptAt: now - D, shopping: [], pantry: [
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
