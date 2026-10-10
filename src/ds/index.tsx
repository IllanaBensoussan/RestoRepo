// RestoFrigo components, ported from the RestoFrigo design system bundle.
// Every visible word is a prop; set dir="rtl" on an ancestor for Hebrew.
import type { ButtonHTMLAttributes, ReactNode } from 'react';

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(' ');
}

const PATHS = {
  camera: 'M3 8.5h3.5l2-3h7l2 3H21V19H3z M15.5 13a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0z',
  upload: 'M12 15V4 M7.5 8.5L12 4l4.5 4.5 M4 15v5h16v-5',
  receipt: 'M6 3h12v18l-2-1.5-2 1.5-2-1.5-2 1.5-2-1.5L6 21z M9 8h6 M9 12h6 M9 16h4',
  fridge: 'M6 3h12v18H6z M6 10h12 M9 6v2 M9 13v3',
  pot: 'M4 11h16v3a6 6 0 0 1-6 6h-4a6 6 0 0 1-6-6z M2 11h20 M9 8c0-1.5 1-2 1-3.5 M14 8c0-1.5 1-2 1-3.5',
  home: 'M4 11l8-7 8 7v9h-5v-6H9v6H4z',
  list: 'M9 6h11 M9 12h11 M9 18h11 M4.5 6h.01 M4.5 12h.01 M4.5 18h.01',
  plus: 'M12 5v14 M5 12h14',
  check: 'M5 12.5l4.5 4.5L19 7',
  x: 'M6 6l12 12 M18 6L6 18',
  clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z M12 7v5l3 2',
  leaf: 'M5 19c0-8 6-14 15-14 0 9-6 15-14 15 M5 19l8-8',
  alert: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z M12 7.5v5.5 M12 16.5v.01',
  // Added for the app: back navigation (mirrors in RTL).
  back: 'M15 5l-7 7 7 7',
  // Sharing a recipe, the shopping list or a household invitation.
  share: 'M12 3v12 M7.5 7.5L12 3l4.5 4.5 M6 11H5v9h14v-9h-1',
  // The weekly menu, and moving forward through its weeks (mirrors in RTL).
  calendar: 'M4 6h16v14H4z M4 10h16 M8 3v5 M16 3v5',
  forward: 'M9 5l7 7-7 7',
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({ name, size = 20, label, className }: { name: IconName; size?: number; label?: string; className?: string }) {
  return (
    <svg
      className={cx('rf-icon', className)}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <path d={PATHS[name]} />
    </svg>
  );
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'scan';
  size?: 'md' | 'sm';
  icon?: IconName;
  block?: boolean;
  children?: ReactNode;
}

export function Button({ variant = 'primary', size = 'md', icon, block, className, children, ...rest }: ButtonProps) {
  return (
    <button type="button" {...rest} className={cx('rf-btn', `rf-btn-${variant}`, `rf-btn-${size}`, block && 'rf-btn-block', className)}>
      {icon && <Icon name={icon} size={size === 'sm' ? 16 : 20} />}
      {children && <span>{children}</span>}
    </button>
  );
}

export type BadgeTone = 'fresh' | 'soon' | 'today' | 'expired' | 'receipt' | 'review';
const BADGE_ICON: Record<BadgeTone, IconName> = { fresh: 'leaf', soon: 'clock', today: 'clock', expired: 'alert', receipt: 'receipt', review: 'alert' };

export function ExpiryBadge({ tone = 'fresh', children, className }: { tone?: BadgeTone; children: ReactNode; className?: string }) {
  return (
    <span className={cx('rf-badge', `rf-badge-${tone}`, className)}>
      <Icon name={BADGE_ICON[tone]} size={14} />
      <span>{children}</span>
    </span>
  );
}

const CHIP_ICON = { have: 'check', missing: 'plus', low: 'clock' } as const;

export function IngredientChip({ state = 'have', quantity, onRemove, removeLabel, onClick, children }: {
  state?: 'have' | 'missing' | 'low';
  quantity?: string;
  onRemove?: () => void;
  removeLabel?: string;
  onClick?: () => void;
  children: ReactNode;
}) {
  const content = (
    <>
      <Icon name={CHIP_ICON[state]} size={14} />
      <span>{children}</span>
      {quantity && <span className="rf-chip-qty">{quantity}</span>}
    </>
  );
  if (onClick) {
    return <button type="button" className={cx('rf-chip', `rf-chip-${state}`, 'rf-chip-btn')} onClick={onClick}>{content}</button>;
  }
  return (
    <span className={cx('rf-chip', `rf-chip-${state}`)}>
      {content}
      {onRemove && (
        <button type="button" className="rf-chip-x" onClick={onRemove} aria-label={removeLabel || 'Remove'}>
          <Icon name="x" size={14} />
        </button>
      )}
    </span>
  );
}

export function PantryItem({ name, quantity, meta, source = 'manual', expiryTone = 'fresh', expiryLabel, onClick, className }: {
  name: string;
  quantity?: string;
  meta?: string;
  source?: 'receipt' | 'manual';
  expiryTone?: BadgeTone;
  expiryLabel?: string;
  onClick?: () => void;
  className?: string;
}) {
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag type={onClick ? 'button' : undefined} className={cx('rf-item', onClick && 'rf-item-btn', className)} onClick={onClick}>
      <span className={`rf-item-tile rf-item-tile-${source}`}>
        <Icon name={source === 'receipt' ? 'receipt' : 'plus'} size={20} />
      </span>
      <div className="rf-item-main">
        <div className="rf-item-name">{name}</div>
        <div className="rf-item-meta">
          {quantity && <span className="rf-num">{quantity}</span>}
          {meta && <span>{meta}</span>}
        </div>
      </div>
      {expiryLabel && <ExpiryBadge tone={expiryTone}>{expiryLabel}</ExpiryBadge>}
    </Tag>
  );
}

export function ReceiptScan({ title, hint, scanLabel, uploadLabel, manualLabel, onScan, onUpload, onManual, className }: {
  title: string;
  hint?: string;
  scanLabel: string;
  uploadLabel: string;
  manualLabel?: string;
  onScan?: () => void;
  onUpload?: () => void;
  onManual?: () => void;
  className?: string;
}) {
  return (
    <section className={cx('rf-scan', className)}>
      <span className="rf-scan-mark"><Icon name="receipt" size={28} /></span>
      <div className="rf-scan-title">{title}</div>
      {hint && <p className="rf-scan-hint">{hint}</p>}
      <div className="rf-scan-actions">
        <Button variant="scan" icon="camera" onClick={onScan}>{scanLabel}</Button>
        <Button variant="secondary" icon="upload" onClick={onUpload}>{uploadLabel}</Button>
        {manualLabel && <Button variant="ghost" icon="plus" onClick={onManual}>{manualLabel}</Button>}
      </div>
    </section>
  );
}

export function ReceiptLine({ name, raw, quantity, price, status = 'matched', statusLabel, toggleLabel, onToggle, children }: {
  name: ReactNode;
  raw: string;
  quantity?: string;
  price?: string;
  status?: 'matched' | 'review' | 'ignored';
  statusLabel?: string;
  toggleLabel?: string;
  onToggle?: () => void;
  children?: ReactNode;
}) {
  const on = status !== 'ignored';
  return (
    <div className={cx('rf-line', `rf-line-${status}`)}>
      <button type="button" className="rf-check" role="checkbox" aria-checked={on} aria-label={toggleLabel} onClick={onToggle}>
        {on && <Icon name="check" size={16} />}
      </button>
      <div className="rf-line-main">
        <div className="rf-line-name">{name}</div>
        <div className="rf-line-raw">{raw}</div>
        {children}
      </div>
      {status === 'review' && statusLabel && <ExpiryBadge tone="review">{statusLabel}</ExpiryBadge>}
      <div className="rf-line-nums">
        {quantity && <span className="rf-num rf-line-qty">{quantity}</span>}
        {price && <span className="rf-num">{price}</span>}
      </div>
    </div>
  );
}

export function MatchMeter({ have, total, label }: { have: number; total: number; label?: string }) {
  const t = Math.max(1, total || 1);
  const hv = Math.min(t, have || 0);
  const pct = Math.round((hv / t) * 100);
  return (
    <div className={cx('rf-meter', pct === 100 && 'rf-meter-full')}>
      <div className="rf-meter-track" role="meter" aria-valuemin={0} aria-valuemax={t} aria-valuenow={hv} aria-label={label}>
        <div className="rf-meter-fill" style={{ inlineSize: `${pct}%` }} />
      </div>
      <span className="rf-meter-text"><span className="rf-num">{hv}/{t}</span>{label && ` ${label}`}</span>
    </div>
  );
}

export interface RecipeBadge { label: string; tone: 'course' | 'meat' | 'dairy' | 'parve' }

export function RecipeBadges({ badges }: { badges: RecipeBadge[] }) {
  return (
    <div className="rf-recipe-badges">
      {badges.map((b) => <span key={b.label} className={cx('rf-badge', `rf-badge-${b.tone}`)}>{b.label}</span>)}
    </div>
  );
}

export function RecipeCard({ title, image, imageAlt, badges, readyLabel, size = 'md', time, have, total, matchLabel, missing, missingLabel, onOpen, onMissing }: {
  title: string;
  /** Course and kashrut, shown above the title. */
  badges?: RecipeBadge[];
  /** Photo of the finished dish; null shows a stand-in until one is added. */
  image: string | null;
  imageAlt?: string;
  readyLabel?: string;
  size?: 'md' | 'sm';
  time?: string;
  have: number;
  total: number;
  matchLabel?: string;
  missing?: string[];
  missingLabel?: string;
  onOpen?: () => void;
  onMissing?: (name: string) => void;
}) {
  const ready = have >= total;
  const shown = (missing || []).slice(0, 3);
  const extra = (missing || []).length - shown.length;
  return (
    <article className={cx('rf-recipe', size === 'sm' && 'rf-recipe-sm', onOpen && 'rf-recipe-link')}>
      <button type="button" className="rf-recipe-open" onClick={onOpen} aria-label={title} disabled={!onOpen} />
      <div className="rf-recipe-media">
        <RecipeImage src={image} alt={imageAlt || title} />
        {readyLabel && ready && (
          <span className="rf-recipe-ready"><Icon name="check" size={14} />{readyLabel}</span>
        )}
      </div>
      <div className="rf-recipe-body">
        {badges && badges.length > 0 && <RecipeBadges badges={badges} />}
        <div className="rf-recipe-title">{title}</div>
        {time && <div className="rf-recipe-meta"><Icon name="clock" size={16} /><span>{time}</span></div>}
        <MatchMeter have={have} total={total} label={matchLabel} />
        {shown.length > 0 && (
          <div className="rf-recipe-missing">
            {missingLabel && <span className="rf-recipe-missing-label">{missingLabel}</span>}
            {shown.map((m) => (
              <IngredientChip key={m} state="missing" onClick={onMissing ? () => onMissing(m) : undefined}>{m}</IngredientChip>
            ))}
            {extra > 0 && <span className="rf-chip rf-chip-missing">+{extra}</span>}
          </div>
        )}
      </div>
    </article>
  );
}

// Holds the 4:3 frame with a pulsing placeholder until the dish photo has loaded.
// A recipe with no photo yet gets a stand-in frame with the pot icon.
export function RecipeImage({ src, alt }: { src: string | null; alt: string }) {
  if (!src) {
    return (
      <div className="rf-recipe-img rf-recipe-noimg" role="img" aria-label={alt}>
        <Icon name="pot" size={40} />
      </div>
    );
  }
  return (
    <img
      className="rf-recipe-img rf-recipe-loading"
      src={src}
      alt={alt}
      loading="lazy"
      onLoad={(e) => e.currentTarget.classList.remove('rf-recipe-loading')}
    />
  );
}

export interface TabBarItem { id: string; label: string; icon: IconName; primary?: boolean }

export function TabBar({ items, active, onChange, label }: { items: TabBarItem[]; active?: string; onChange?: (id: string) => void; label?: string }) {
  return (
    <nav className="rf-tabs" aria-label={label}>
      {items.map((it) => {
        if (it.primary) {
          return (
            <button key={it.id} type="button" className="rf-tab-scan" aria-label={it.label} onClick={() => onChange?.(it.id)}>
              <Icon name={it.icon} size={26} />
            </button>
          );
        }
        const isActive = it.id === active;
        return (
          <button key={it.id} type="button" className={cx('rf-tab', isActive && 'rf-tab-active')} aria-current={isActive ? 'page' : undefined} onClick={() => onChange?.(it.id)}>
            <Icon name={it.icon} size={22} />
            <span>{it.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
