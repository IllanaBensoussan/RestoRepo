import { useState } from 'react';
import { LANGS, LANG_NAMES, type Lang, type T } from '../i18n';
import { firebaseConfigured, signInWithGoogle, type SignInResult } from '../lib/firebase';

function GoogleG() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}

export function Login({ t, lang, setLang, onSignedIn, onDemo }: {
  t: T;
  lang: Lang;
  setLang: (l: Lang) => void;
  onSignedIn: (r: SignInResult) => void;
  onDemo: () => void;
}) {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function google() {
    setError(null);
    setBusy(true);
    try {
      const r = await signInWithGoogle(lang);
      if (r) onSignedIn(r);
    } catch (err) {
      const code = (err as { code?: string }).code;
      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') return;
      setError(code === 'app/not-configured' ? t('notConfigured') : code === 'auth/popup-blocked' ? t('popupBlocked') : t('authError'));
    } finally {
      setBusy(false);
    }
  }

  const signup = mode === 'signup';
  return (
    <div className="login">
      <div className="login-art" aria-hidden="true">
        <span className="la la-brand"><i /><i /><i /><i /><i /><i /><i /><i /><i /></span>
        <span className="la la-accent" />
        <span className="la la-ink"><i /><i /><i /><i /></span>
      </div>

      <div className="login-body">
        <h1 className="login-name">RestoFrigo</h1>
        <p className="login-tag">{t('tagline')}</p>

        <div className="seg" role="tablist" aria-label={`${t('signIn')} / ${t('signUp')}`}>
          <button type="button" role="tab" aria-selected={!signup} className={!signup ? 'on' : ''} onClick={() => setMode('signin')}>{t('signIn')}</button>
          <button type="button" role="tab" aria-selected={signup} className={signup ? 'on' : ''} onClick={() => setMode('signup')}>{t('signUp')}</button>
        </div>

        <div className="login-card">
          <h2 className="login-title">{signup ? t('signUpTitle') : t('signInTitle')}</h2>
          <p className="login-hint">{signup ? t('signUpHint') : t('signInHint')}</p>
          <button type="button" className="gbtn" onClick={google} disabled={busy}>
            <GoogleG />
            <span>{busy ? t('loading') : signup ? t('signUpGoogle') : t('continueGoogle')}</span>
          </button>
          {error && <p className="login-error" role="alert">{error}</p>}
          {!firebaseConfigured && (
            <>
              {!error && <p className="login-note">{t('notConfigured')}</p>}
              <button type="button" className="linkbtn" onClick={onDemo}>{t('demo')}</button>
            </>
          )}
          <p className="login-switch">
            {signup ? t('haveAccount') : t('noAccount')}{' '}
            <button type="button" className="linkbtn" onClick={() => setMode(signup ? 'signin' : 'signup')}>{signup ? t('signIn') : t('signUp')}</button>
          </p>
        </div>

        <p className="login-legal">{t('legal')}</p>

        <div className="langs" role="group" aria-label={t('language')}>
          {LANGS.map((l) => (
            <button key={l} type="button" lang={l} className={l === lang ? 'on' : ''} aria-pressed={l === lang} onClick={() => setLang(l)}>{LANG_NAMES[l]}</button>
          ))}
        </div>
      </div>
    </div>
  );
}
