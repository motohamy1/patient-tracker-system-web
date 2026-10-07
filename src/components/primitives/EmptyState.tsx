// EmptyState — the one shared empty-state primitive (D-24, 02-UI-SPEC.md §5.5).
//
// Every shell route renders this primitive rather than inventing per-screen
// markup, so empty states stay consistent by construction. It is composed only
// from the `surfaceRaised` fill, the heading and body type steps and the
// `textPrimary` ink — no raw value and no status tint.
//
// The empty variant only. The loading, error, retry, permission-denied and
// offline-sync variants belong to Phase 003 (AGENTS.md §Error/empty/loading,
// 02-UI-SPEC.md §5.5). A spinner or a generic skeleton here is forbidden: this
// primitive states a fact about what is not yet here, it never fakes work.
//
// The action slot is a promise of a wired destination, so it renders only when
// an action object is supplied — a dead enabled button never ships. In this
// phase no shell route passes an action, which is why no shell route renders
// one; the dev gallery renders it so the slot is baseline-capturable.
//
// The provider-home primary CTA and an empty-state action are different
// decisions: the CTA is `primary` on `accentSoft`, and an empty-state action is
// `secondary` by default. When the empty state's next step genuinely IS the
// surface's primary action, `primary` is correct and its `accentSoft` fill
// still satisfies INV-05.
//
// Server Component: no hook, no client directive. The action is a `Button`
// (a client component) or a bare anchor when an href is supplied.
import type { LucideIcon } from 'lucide-react';
import { Button, makeIcon, Surface } from '@/components/primitives';

/** The optional action slot. `href` renders a link; otherwise a `Button`. */
export type EmptyStateAction = {
  label: string;
  onClick?: () => void;
  href?: string;
  /** Forwarded to the Button action so a retry reports aria-busy (UX-01 §8.5). */
  ariaBusy?: boolean;
};

export type EmptyStateProps = {
  /** Optional 24px icon above the title. Ink is `textPrimary`, never a tint. */
  icon?: LucideIcon;
  title: string;
  /** Optional body line; omitted entirely when no string is supplied. */
  body?: string;
  /** Optional action; rendered only when a destination is supplied. */
  action?: EmptyStateAction;
  className?: string;
};

// The anchor form of the action mirrors the `Button` `secondary` variant so a
// link and a button render identically. The width utilities are arbitrary rem
// values on purpose: `max-w-lg`/`max-w-sm` resolve through the `--spacing-*`
// namespace in this theme (16px / 8px), so the container sizes the design
// contract intends are written explicitly (02-RESEARCH.md Pattern 2).
const ACTION_LINK_CLASSES =
  'inline-flex min-h-11 items-center justify-center gap-xs rounded-pill bg-surface-raised px-xl text-body font-semibold leading-body text-text-primary shadow-raised';

export function EmptyState({ icon, title, body, action, className }: EmptyStateProps) {
  const IconGlyph = icon ? makeIcon(icon) : null;

  return (
    <Surface
      variant="surfaceRaised"
      className={['mx-auto flex max-w-[32rem] flex-col items-center gap-sm text-center', className]
        .filter(Boolean)
        .join(' ')}
    >
      {IconGlyph ? <IconGlyph size="lg" /> : null}
      <h2 className="text-heading font-semibold leading-heading text-text-primary">{title}</h2>
      {body ? (
        <p className="mx-auto max-w-[24rem] text-body font-regular leading-body text-text-primary">
          {body}
        </p>
      ) : null}
      {action ? (
        action.href ? (
          <a className={ACTION_LINK_CLASSES} href={action.href} onClick={action.onClick}>
            {action.label}
          </a>
        ) : (
          <Button variant="secondary" onClick={action.onClick} ariaBusy={action.ariaBusy}>
            {action.label}
          </Button>
        )
      ) : null}
    </Surface>
  );
}
