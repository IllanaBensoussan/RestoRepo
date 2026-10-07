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
