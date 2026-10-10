import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { TabBar } from './ds';
import { Ctx, type AppCtx, type Tab } from './ctx';
import { LANGS, LANG_NAMES, detectLang, makeT, type Lang } from './i18n';
import { completeRedirect, signOut as fbSignOut, watchUser, type AppUser, type SignInResult } from './lib/firebase';
import { makeCatalog, setCatalog, useCatalog } from './catalog';
import { newInvite, subscribeCatalog } from './lib/cloud';
import { clearLink, inviteUrl, parseLink, share, type Link } from './lib/links';
import { entryName } from './lib/pantry';
import { seedDemo, usePref, useUserData } from './lib/store';
import { Home } from './screens/Home';
import { HouseholdPanel, JoinSheet } from './screens/Household';
import { Login } from './screens/Login';
import { Menu } from './screens/Menu';
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
  // A shared link the app was opened with (a recipe, a household invitation), kept through sign-in.
  const [link, setLink] = useState<Link | null>(() => parseLink(location.pathname));
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
        <Login t={t} invited={link?.kind === 'invite'} lang={lang} setLang={setLang} onSignedIn={onSignedIn} onDemo={() => { seedDemo(); try { localStorage.setItem('restofrigo:demo', '1'); } catch { /* ignore */ } setDemo(true); }} />
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
    <Shell key={current.uid} user={current} lang={lang} setLang={setLang} t={t} toast={toast} signOut={signOut} link={link} onLinkHandled={() => setLink(null)}>
      {toastEl}
    </Shell>
  );
}

function Shell({ user, lang, setLang, t, toast, signOut, link, onLinkHandled, children }: Pick<AppCtx, 'user' | 'lang' | 'setLang' | 't' | 'toast' | 'signOut'> & { link: Link | null; onLinkHandled: () => void; children: React.ReactNode }) {
  const { data, update, status: sync, household } = useUserData(user);
  // The catalogue only comes from Firestore, which the demo account can't read.
  const catalog = useCatalog();
  useEffect(() => {
    if (!user.demo) return subscribeCatalog();
    setCatalog(makeCatalog('unavailable'));
    return undefined;
  }, [user.demo]);
  const [tab, setTab] = useState<Tab>('home');
  const [recipe, setRecipe] = useState<string | undefined>();
  const [manual, setManual] = useState(false);
  const [account, setAccount] = useState(false);
  const [invite, setInvite] = useState<string | null>(null);
  const main = useRef<HTMLElement>(null);

  const go = useCallback<AppCtx['go']>((next, opts) => {
    setTab(next);
    setRecipe(opts?.recipe);
    setManual(Boolean(opts?.manual));
    main.current?.scrollTo({ top: 0 });
  }, []);

  useEffect(() => {
    clearLink();
    if (!link) return;
    onLinkHandled();
    if (link.kind === 'recipe') go('recipes', { recipe: link.id });
    else if (user.demo) toast(t('inviteDemo'));
    else setInvite(link.code);
    // Only the link the app was opened with.
  }, []);

  const shareInvite = useCallback(() => {
    if (!household) return;
    const code = household.invite ?? newInvite(household, user);
    void share({ title: 'RestoFrigo', text: t('inviteText', { name: user.name }), url: inviteUrl(code) }, () => toast(t('linkCopied')));
  }, [household, user, t, toast]);

  // Moving to another household is announced by whoever started it; any other move means a
  // member removed this person, who is back in their own household.
  const moving = useRef(false);
  const homeId = useRef<string | null>(null);
  useEffect(() => {
    const id = household?.id;
    if (!id || id === homeId.current) return;
    if (homeId.current && !moving.current) toast(t('removedFromHome'));
    homeId.current = id;
    moving.current = false;
  }, [household?.id]);

  // Say when someone else in the household adds to the shopping list.
  const seen = useRef<{ home: string; ids: Set<string> } | null>(null);
  useEffect(() => {
    if (!household || sync !== 'ready') return;
    const before = seen.current;
    seen.current = { home: household.id, ids: new Set(data.shopping.map((s) => s.id)) };
    if (!before || before.home !== household.id) return;
    const added = data.shopping.filter((s) => !before.ids.has(s.id) && s.addedBy && s.addedBy !== user.uid);
    if (!added.length) return;
    const by = household.members.find((m) => m.uid === added[0].addedBy)?.name || t('someone');
    toast(t('addedByOther', { name: by, item: added.map((s) => entryName(s, lang)).join(', ') }));
  }, [data.shopping, household, sync]);

  const ctx: AppCtx = { lang, setLang, t, user, data, update, household, shareInvite, go, toast, signOut };
  const initials = user.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <Ctx.Provider value={ctx}>
      <div className="app">
        <button type="button" className="avatar" onClick={() => setAccount(true)} aria-label={t('account')}>
          {user.photoURL ? <img src={user.photoURL} alt="" referrerPolicy="no-referrer" /> : <span>{initials}</span>}
        </button>
        {sync === 'error' && <div className="syncbar" role="alert">{t('syncError')}</div>}
        {catalog.status === 'unavailable' && <div className="syncbar" role="alert">{t('catalogUnavailable')}</div>}
        <main ref={main} className="main">
          {sync === 'loading' || catalog.status === 'loading' ? <div className="screen"><p className="muted" aria-busy="true">{t('loading')}</p></div> : <>
          {tab === 'home' && <Home />}
          {tab === 'pantry' && <Pantry />}
          {tab === 'scan' && <Scan manual={manual} onManualClose={() => setManual(false)} />}
          {tab === 'recipes' && <Recipes openId={recipe} onOpen={(id) => { setRecipe(id); main.current?.scrollTo({ top: 0 }); }} />}
          {tab === 'menu' && <Menu />}
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
            { id: 'menu', label: t('tabMenu'), icon: 'calendar' },
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
            <HouseholdPanel onMove={() => { moving.current = true; setAccount(false); }} />
            <button type="button" className="rf-btn rf-btn-secondary rf-btn-md rf-btn-block" onClick={signOut}>{t('signOut')}</button>
          </Sheet>
        )}
        {invite && household && sync === 'ready' && (
          <JoinSheet code={invite} onDone={() => setInvite(null)} onMove={() => { moving.current = true; }} />
        )}
        {children}
      </div>
    </Ctx.Provider>
  );
}
