// CompactControl — the compact search field, icon toggle and range toggle
// (02-UI-SPEC.md §5.4; INV-08, INV-13, INV-15, INV-16).
//
// No compact control renders a border: `borderSubtle` is reserved for true
// dividers, table row lines, the timeline axis and the scrubber track (INV-15,
// Phase 001 D-05). The reference's search field is a filled capsule with no
// edge and is reproduced exactly that way. A third shadow is likewise forbidden
// (INV-13), which is why the inset fill — not a shadow — carries the boundary.
//
// Sizing rule and band edges (responsive-rules.md §4): every text-bearing
// control is at least 44px tall below the 768px band edge and may drop to 32px
// at and above it; an icon-only control stays 44px in both axes at every band,
// because it is a pointer-and-thumb target. The band edges are fixed at 768px
// and 1024px and are never moved.
//
// The gate-selected inset fill (`INSET_FILL`). A control needing a visible edge
// cannot take a border (INV-15/INV-16) and cannot add a third shadow (INV-13),
// so it needs an inset fill distinguishable from the surface behind it. Which
// fill that is depends on plan 02-01's owner gate, read at module load from
// docs/governance/tokens.json → the `review` object's `gateStatus`:
//   - `reopened-rejected` — the owner rejected the D-27 re-sample, so
//     `surfaceMuted` is not frozen and may still equal `surface` — selects the
//     `surfaceRaised` fill plus `shadow-raised`, the only sanctioned workaround
//     `02-UI-SPEC.md` Reviewer item C records.
//   - every other status — including the current `approved-with-changes` and a
//     future `approved-reopen`, where `surfaceMuted` IS frozen and distinct —
//     selects the plain `bg-surface-muted` inset fill of §5.3/§5.4.
// The fallback is a pre-freeze workaround, never the steady state. The constant
// is never deleted later: the gate-selected indirection is what lets a re-open
// be picked up without a per-call-site edit.
//
// Server Component: no hook, no client directive; the `search` and `iconToggle`
// variants render native form elements and need no client boundary.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import type { LucideIcon } from 'lucide-react';
import { Search } from 'lucide-react';
import { makeIcon } from './Icon';

const TOKENS_FILE = path.join(process.cwd(), 'docs', 'governance', 'tokens.json');

function readGateStatus(): string {
  try {
    const parsed = JSON.parse(readFileSync(TOKENS_FILE, 'utf8'));
    const gateStatus = parsed.review.gateStatus;
    return typeof gateStatus === 'string' ? gateStatus : '';
  } catch {
    return '';
  }
}

const GATE_STATUS = readGateStatus();

/** The single gate-selected inset fill, shared by this file and TabBar.tsx. */
export const INSET_FILL =
  GATE_STATUS === 'reopened-rejected'
    ? 'bg-surface-raised shadow-raised'
    : 'bg-surface-muted';

const SearchGlyph = makeIcon(Search);

const SEARCH_WRAPPER = [
  'inline-flex items-center gap-xs rounded-pill px-lg min-h-11 md:min-h-8 text-text-primary',
  INSET_FILL,
].join(' ');

const ICON_TOGGLE_BASE =
  'inline-flex items-center justify-center rounded-pill min-h-11 min-w-11 p-sm text-text-primary';

const RANGE_TOGGLE_BASE =
  'inline-flex items-center justify-center rounded-pill px-md min-h-11 md:min-h-8 text-text-primary';

type SearchProps = {
  variant: 'search';
  label: string;
  inputId: string;
  placeholder?: string;
  className?: string;
};

type IconToggleProps = {
  variant: 'iconToggle';
  ariaLabel: string;
  pressed: boolean;
  icon: LucideIcon;
  className?: string;
};

type RangeToggleProps = {
  variant: 'rangeToggle';
  ariaLabel: string;
  label: string;
  active: boolean;
  className?: string;
};

export type CompactControlProps = SearchProps | IconToggleProps | RangeToggleProps;

function SearchControl({ label, inputId, placeholder, className }: SearchProps) {
  const wrapperClasses = [SEARCH_WRAPPER, className].filter(Boolean).join(' ');
  return (
    <>
      <label htmlFor={inputId} className="sr-only">
        {label}
      </label>
      <div className={wrapperClasses}>
        <SearchGlyph size="sm" />
        <input
          id={inputId}
          type="search"
          placeholder={placeholder}
          className="min-w-0 flex-1 bg-transparent text-body leading-body text-text-primary placeholder:text-text-primary"
        />
      </div>
    </>
  );
}

function IconToggle({ ariaLabel, pressed, icon, className }: IconToggleProps) {
  const Glyph = makeIcon(icon);
  const stateFill = pressed ? 'bg-surface-raised' : INSET_FILL;
  const stateShadow = pressed ? 'shadow-raised' : '';
  const classes = [ICON_TOGGLE_BASE, stateFill, stateShadow, className].filter(Boolean).join(' ');
  return (
    <button type="button" aria-label={ariaLabel} aria-pressed={pressed} className={classes}>
      <Glyph size="lg" />
    </button>
  );
}

function RangeToggle({ ariaLabel, label, active, className }: RangeToggleProps) {
  const stateFill = active ? 'bg-surface-raised' : 'bg-transparent';
  const stateShadow = active ? 'shadow-raised' : '';
  const classes = [RANGE_TOGGLE_BASE, stateFill, stateShadow, className].filter(Boolean).join(' ');
  return (
    <button type="button" aria-label={ariaLabel} aria-pressed={active} className={classes}>
      <span>{label}</span>
    </button>
  );
}

export function CompactControl(props: CompactControlProps) {
  switch (props.variant) {
    case 'search':
      return <SearchControl {...props} />;
    case 'iconToggle':
      return <IconToggle {...props} />;
    case 'rangeToggle':
      return <RangeToggle {...props} />;
  }
}
