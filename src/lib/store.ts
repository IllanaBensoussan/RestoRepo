import { useCallback, useEffect, useState } from 'react';
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

/** Each signed-in account keeps its own fridge and shopping list on this device. */
export function useUserData(uid: string) {
  const [data, setData] = useState<UserData>(() => load(uid));
  useEffect(() => setData(load(uid)), [uid]);
  const update = useCallback(
    (fn: (d: UserData) => UserData) =>
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
  return [data, update] as const;
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
