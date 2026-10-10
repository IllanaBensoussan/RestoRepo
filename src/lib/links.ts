// Links people share: /recette/{id} opens a recipe, /foyer/{code} invites someone into a household.

export type Link = { kind: 'recipe'; id: string } | { kind: 'invite'; code: string };

export function parseLink(path: string): Link | null {
  const m = /^\/(recette|foyer)\/([^/]+)\/?$/.exec(path);
  if (!m) return null;
  const value = decodeURIComponent(m[2]);
  return m[1] === 'recette' ? { kind: 'recipe', id: value } : { kind: 'invite', code: value };
}

export const recipeUrl = (id: string) => `${location.origin}/recette/${encodeURIComponent(id)}`;
export const inviteUrl = (code: string) => `${location.origin}/foyer/${encodeURIComponent(code)}`;

/** The link has been handled: show the app's plain address again. */
export function clearLink() {
  if (location.pathname !== '/') history.replaceState(null, '', '/');
}

/**
 * Opens the phone's share menu (WhatsApp, SMS…). Where there is none, copies the link and
 * calls `onCopied`; where copying is blocked too, shows the link so it can be copied by hand.
 */
export async function share(data: { title: string; text?: string; url: string }, onCopied: () => void) {
  if (navigator.share) {
    try {
      await navigator.share(data);
      return;
    } catch (e) {
      if ((e as Error).name === 'AbortError') return;
    }
  }
  try {
    await navigator.clipboard.writeText(data.url);
    onCopied();
  } catch {
    window.prompt(data.title, data.url);
  }
}
