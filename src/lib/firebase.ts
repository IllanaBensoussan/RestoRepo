import { initializeApp, type FirebaseApp } from 'firebase/app';
import {
  GoogleAuthProvider,
  browserLocalPersistence,
  getAdditionalUserInfo,
  getAuth,
  getRedirectResult,
  onAuthStateChanged,
  setPersistence,
  signInWithPopup,
  signInWithRedirect,
  signOut as fbSignOut,
  type Auth,
  type UserCredential,
} from 'firebase/auth';

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const firebaseConfigured = Boolean(config.apiKey && config.authDomain && config.appId);

let app: FirebaseApp | null = null;
let auth: Auth | null = null;

function getAuthInstance() {
  if (!firebaseConfigured) return null;
  if (!auth) {
    app = initializeApp(config);
    auth = getAuth(app);
    void setPersistence(auth, browserLocalPersistence);
  }
  return auth;
}

export interface AppUser {
  uid: string;
  name: string;
  email: string | null;
  photoURL: string | null;
  demo?: boolean;
}

export interface SignInResult { user: AppUser; isNewUser: boolean }

function toAppUser(u: { uid: string; displayName: string | null; email: string | null; photoURL: string | null }): AppUser {
  return { uid: u.uid, name: u.displayName || u.email?.split('@')[0] || '', email: u.email, photoURL: u.photoURL };
}

function toResult(cred: UserCredential): SignInResult {
  return { user: toAppUser(cred.user), isNewUser: Boolean(getAdditionalUserInfo(cred)?.isNewUser) };
}

/**
 * Google sign-in and sign-up are the same call: Firebase creates the account the first time
 * a Google user signs in and reports it through isNewUser.
 */
export async function signInWithGoogle(lang: string): Promise<SignInResult | null> {
  const a = getAuthInstance();
  if (!a) throw Object.assign(new Error('not-configured'), { code: 'app/not-configured' });
  a.languageCode = lang;
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  try {
    return toResult(await signInWithPopup(a, provider));
  } catch (err) {
    const code = (err as { code?: string }).code;
    // Some mobile browsers block pop-ups: fall back to a full-page redirect.
    if (code === 'auth/popup-blocked' || code === 'auth/operation-not-supported-in-this-environment') {
      await signInWithRedirect(a, provider);
      return null;
    }
    throw err;
  }
}

export async function completeRedirect(): Promise<SignInResult | null> {
  const a = getAuthInstance();
  if (!a) return null;
  const cred = await getRedirectResult(a).catch(() => null);
  return cred ? toResult(cred) : null;
}

export function watchUser(cb: (u: AppUser | null) => void) {
  const a = getAuthInstance();
  if (!a) {
    cb(null);
    return () => {};
  }
  return onAuthStateChanged(a, (u) => cb(u ? toAppUser(u) : null));
}

export async function signOut() {
  const a = getAuthInstance();
  if (a) await fbSignOut(a);
}
