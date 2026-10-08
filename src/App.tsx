import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { TabBar } from './ds';
import { Ctx, type AppCtx, type Tab } from './ctx';
import { LANGS, LANG_NAMES, detectLang, makeT, type Lang } from './i18n';
import { completeRedirect, signOut as fbSignOut, watchUser, type AppUser, type SignInResult } from './lib/firebase';
import { useCatalog } from './catalog';
import { cloudAvailable, subscribeCatalog } from './lib/cloud';
import { seedDemo, usePref, useUserData } from './lib/store';
import { Home } from './screens/Home';
import { Login } from './screens/Login';
import { Pantry } from './screens/Pantry';
import { Recipes } from './screens/Recipes';
import { Scan } from './screens/Scan';
import { Sheet } from './screens/Sheet';
import { Shopping } from './screens/Shopping';

const DEMO_USER: AppUser = { uid: 'demo', name: 'Illana', email: null, photoURL: null, demo: true };

export function App() {
  const [lang, setLang] = usePref<Lang>('lang', detectLang());
  const t = useMemo(() => makeT(lang), [lang]);
  const [user, setUser] = useState<AppUser | null | undefined>(undefined);
  const [demo, setDemo] = useState(() => {
    try { return localStorage.getItem('restofrigo:demo') === '1'; } catch { return false; }
  });
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const toastTimer = useRef<number>();

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'he' ? 'rtl' : 'ltr';
  }, [lang]);

  const toast = useCallback((msg: string) => {
    setToastMsg(msg);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToastMsg(null), 2800);
  }, []);

  const onSignedIn = useCallback((r: SignInResult) => {
    setUser(r.user);
    if (r.isNewUser) toast(t('welcomeNew'));
  }, [t, toast]);

  useEffect(() => {
    void completeRedirect().then((r) => r && onSignedIn(r));
    return watchUser(setUser);
  }, []);

  const current = demo ? DEMO_USER : user;
  const toastEl = toastMsg && <div className="toast" role="status">{toastMsg}</div>;

  if (current === undefined) return <div className="splash" aria-busy="true">RestoFrigo</div>;
  if (current === null) {
    return (
      <>
        <Login t={t} lang={lang} setLang={setLang} onSignedIn={onSignedIn} onDemo={() => { seedDemo(); try { localStorage.setItem('restofrigo:demo', '1'); } catch { /* ignore */ } setDemo(true); }} />
        {toastEl}
      </>
    );
  }

  const signOut = () => {
    try { localStorage.removeItem('restofrigo:demo'); } catch { /* ignore */ }
    setDemo(false);
    void fbSignOut();
  };

  return (
    <Shell key={current.uid} user={current} lang={lang} setLang={setLang} t={t} toast={toast} signOut={signOut}>
      {toastEl}
    </Shell>
  );
}

function Shell({ user, lang, setLang, t, toast, signOut, children }: Pick<AppCtx, 'user' | 'lang' | 'setLang' | 't' | 'toast' | 'signOut'> & { children: React.ReactNode }) {
  const [data, update, sync] = useUserData(user.uid);
  // Re-render the screens when the catalogue arrives from Firestore.
  useCatalog();
  useEffect(() => (user.demo || !cloudAvailable() ? undefined : subscribeCatalog()), [user.demo]);
  const [tab, setTab] = useState<Tab>('home');
  const [recipe, setRecipe] = useState<string | undefined>();
  const [manual, setManual] = useState(false);
  const [account, setAccount] = useState(false);
  const main = useRef<HTMLElement>(null);

  const go = useCallback<AppCtx['go']>((next, opts) => {
    setTab(next);
    setRecipe(opts?.recipe);
    setManual(Boolean(opts?.manual));
    main.current?.scrollTo({ top: 0 });
  }, []);

  const ctx: AppCtx = { lang, setLang, t, user, data, update, go, toast, signOut };
  const initials = user.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <Ctx.Provider value={ctx}>
      <div className="app">
        <button type="button" className="avatar" onClick={() => setAccount(true)} aria-label={t('account')}>
          {user.photoURL ? <img src={user.photoURL} alt="" referrerPolicy="no-referrer" /> : <span>{initials}</span>}
        </button>
        {sync === 'error' && <div className="syncbar" role="alert">{t('syncError')}</div>}
        <main ref={main} className="main">
          {sync === 'loading' ? <div className="screen"><p className="muted" aria-busy="true">{t('loading')}</p></div> : <>
          {tab === 'home' && <Home />}
          {tab === 'pantry' && <Pantry />}
          {tab === 'scan' && <Scan manual={manual} onManualClose={() => setManual(false)} />}
          {tab === 'recipes' && <Recipes openId={recipe} onOpen={(id) => { setRecipe(id); main.current?.scrollTo({ top: 0 }); }} />}
          {tab === 'list' && <Shopping />}
          </>}
        </main>
        <TabBar
          label={t('nav')}
          active={tab}
          onChange={(id) => go(id as Tab)}
          items={[
            { id: 'home', label: t('tabHome'), icon: 'home' },
            { id: 'pantry', label: t('tabPantry'), icon: 'fridge' },
            { id: 'scan', label: t('tabScan'), icon: 'camera', primary: true },
            { id: 'recipes', label: t('tabRecipes'), icon: 'pot' },
            { id: 'list', label: t('tabList'), icon: 'list' },
          ]}
        />
        {account && (
          <Sheet title={t('account')} onClose={() => setAccount(false)} closeLabel={t('close')}>
            <div className="acct">
              <span className="avatar avatar-lg">{user.photoURL ? <img src={user.photoURL} alt="" referrerPolicy="no-referrer" /> : <span>{initials}</span>}</span>
              <div><b>{user.name}</b>{user.email && <div className="muted">{user.email}</div>}</div>
            </div>
            <div className="flabel">{t('language')}
              <div className="langs">
                {LANGS.map((l) => <button key={l} type="button" lang={l} className={l === lang ? 'on' : ''} aria-pressed={l === lang} onClick={() => setLang(l)}>{LANG_NAMES[l]}</button>)}
              </div>
            </div>
            <button type="button" className="rf-btn rf-btn-secondary rf-btn-md rf-btn-block" onClick={signOut}>{t('signOut')}</button>
          </Sheet>
        )}
        {children}
      </div>
    </Ctx.Provider>
  );
}
