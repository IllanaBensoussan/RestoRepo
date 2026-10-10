import { useEffect, useState } from 'react';
import { Button, Icon } from '../ds';
import { useApp } from '../ctx';
import { joinHousehold, lookupInvite, moveToOwnHousehold, newInvite, removeMember, type Invite } from '../lib/cloud';
import { Sheet } from './Sheet';

const initials = (name: string) => name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();

/** The household section of the account sheet: who shares the fridge, inviting, leaving. */
export function HouseholdPanel({ onMove }: { onMove: () => void }) {
  const { t, user, household, shareInvite, toast } = useApp();
  if (!household) return null;
  const owner = household.owner === user.uid;

  const remove = (uid: string, name: string) => {
    if (!window.confirm(t('confirmRemove', { name }))) return;
    removeMember(household.id, uid).catch((e) => {
      console.error(e);
      toast(t('syncError'));
    });
  };
  const leave = () => {
    if (!window.confirm(t('confirmLeave'))) return;
    onMove();
    moveToOwnHousehold(user, undefined, household.id).then(() => toast(t('left')), (e) => {
      console.error(e);
      toast(t('syncError'));
    });
  };

  return (
    <section className="sec">
      <h3 className="grouph">{t('household')}</h3>
      <p className="muted">{t('householdHint')}</p>
      <ul className="members">
        {household.members.map((m) => (
          <li key={m.uid}>
            <span className="mavatar">{m.photoURL ? <img src={m.photoURL} alt="" referrerPolicy="no-referrer" /> : initials(m.name)}</span>
            <span className="member-name">
              {m.name}{m.uid === user.uid && ` (${t('you')})`}
              {m.uid === household.owner && <span className="muted"> · {t('owner')}</span>}
            </span>
            {owner && m.uid !== user.uid && (
              <button type="button" className="iconbtn" aria-label={t('removeMember', { name: m.name })} onClick={() => remove(m.uid, m.name)}><Icon name="x" /></button>
            )}
          </li>
        ))}
      </ul>
      <Button variant="secondary" icon="share" block onClick={shareInvite}>{t('invite')}</Button>
      {owner && household.invite && (
        <Button variant="ghost" onClick={() => { newInvite(household, user); toast(t('newLinkDone')); }}>{t('newLink')}</Button>
      )}
      {household.id !== user.uid && <Button variant="ghost" onClick={leave}>{t('leave')}</Button>}
    </section>
  );
}

/** Opened from an invitation link: joins the household that sent it, after asking. */
export function JoinSheet({ code, onDone, onMove }: { code: string; onDone: () => void; onMove: () => void }) {
  const { t, user, data, household, toast } = useApp();
  const [invite, setInvite] = useState<Invite | null>(null);
  const [bring, setBring] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    lookupInvite(code).then((i) => {
      if (!i) {
        toast(t('inviteInvalid'));
        onDone();
      } else if (i.householdId === household?.id) {
        toast(t('alreadyMember'));
        onDone();
      } else setInvite(i);
    }, (e) => {
      console.error(e);
      toast(t('joinError'));
      onDone();
    });
    // Looked up once per link.
  }, [code]);

  if (!invite || !household) return null;
  const alone = household.members.length <= 1;
  const count = data.pantry.length + data.shopping.length;

  async function join() {
    if (!invite || !household) return;
    setBusy(true);
    onMove();
    try {
      await joinHousehold(user, invite, household.id, alone && bring && count > 0 ? data : undefined);
      toast(t('joined', { name: invite.fromName }));
      onDone();
    } catch (e) {
      console.error(e);
      toast(t('joinError'));
      setBusy(false);
    }
  }

  return (
    <Sheet title={t('joinTitle')} onClose={onDone} closeLabel={t('close')}>
      <p>{t('joinText', { name: invite.fromName || t('someone') })}</p>
      {alone && count > 0 && (
        <label className="checkrow">
          <input type="checkbox" checked={bring} onChange={(e) => setBring(e.target.checked)} />
          <span>{t('joinMerge', { n: count })}</span>
        </label>
      )}
      {!alone && <p className="muted">{t('joinLeaves')}</p>}
      <div className="sheet-actions">
        <Button block onClick={join} disabled={busy}>{busy ? t('loading') : t('join')}</Button>
        <Button block variant="ghost" onClick={onDone} disabled={busy}>{t('cancel')}</Button>
      </div>
    </Sheet>
  );
}
