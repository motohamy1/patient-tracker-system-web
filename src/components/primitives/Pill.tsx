// Pill — the status chip (02-UI-SPEC.md §4.3 and §5.3; INV-04; WCAG 1.4.1).
//
// The label is always painted `text-text-primary`; a tone paints only a leading
// decorative dot. Removing every tint still leaves the meaning readable, because
// the status is carried by the label text and never by hue alone. A tone class
// is never used as the label ink, an icon ink or a boundary.
//
// The four tones are exhaustive: `success`, `info`, `warning` and `neutral`
// (the no-tint form). No other tone may be added without a decision recorded in
// `docs/governance/tokens.json` (Phase 001 D-04).
//
// Server Component: no hook, no client directive.
import type { ReactNode } from 'react';

export type PillTone = 'success' | 'info' | 'warning' | 'neutral';

// The dot is the only place a tone appears. It is 16px (the `sm` icon step in
// Icon.tsx) and decorative — the label carries the meaning.
const TONE_DOT: Record<Exclude<PillTone, 'neutral'>, string> = {
  success: 'bg-success',
  info: 'bg-info',
  warning: 'bg-warning',
};

export type PillProps = {
  tone?: PillTone;
  label: string;
  /** Optional leading element rendered before the label (e.g. an Icon). */
  leading?: ReactNode;
  className?: string;
};

export function Pill({ tone = 'neutral', label, leading, className }: PillProps) {
  const dotClass = tone === 'neutral' ? null : TONE_DOT[tone];
  const classes = [
    'inline-flex items-center gap-xs bg-surface-muted rounded-pill px-md py-sm text-label leading-label text-text-primary',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <span className={classes}>
      {dotClass ? (
        <span
          aria-hidden="true"
          className={`inline-block size-4 shrink-0 rounded-pill ${dotClass}`}
        />
      ) : null}
      {leading}
      {label}
    </span>
  );
}
