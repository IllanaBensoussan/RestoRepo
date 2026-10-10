import { createContext, useContext } from 'react';
import type { Household } from './lib/cloud';
import type { AppUser } from './lib/firebase';
import type { UserData } from './lib/store';
import type { Lang, T } from './i18n';

export type Tab = 'home' | 'pantry' | 'scan' | 'recipes' | 'list';

export interface AppCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: T;
  user: AppUser;
  data: UserData;
  update: (fn: (d: UserData) => UserData) => void;
  /** The household sharing this fridge and list; null in the demo. */
  household: Household | null;
  /** Shares the household's invitation link. */
  shareInvite: () => void;
  go: (tab: Tab, opts?: { recipe?: string; manual?: boolean }) => void;
  toast: (msg: string) => void;
  signOut: () => void;
}

export const Ctx = createContext<AppCtx | null>(null);

export function useApp() {
  const c = useContext(Ctx);
  if (!c) throw new Error('useApp outside provider');
  return c;
}
