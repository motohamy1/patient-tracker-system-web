'use client';

// src/components/patients/RetrievalControls.tsx — the retrieval filter tabs
// and the result count (PROV-02; D-11/D-12/D-14/D-18/D-19/D-20;
// 04-UI-SPEC §4.3).
//
// Client island: `onValueChange` writes URL state with `router.replace(...,
// { scroll: false })` — the URL is the ONLY state carrier (04-RESEARCH
// Pattern 3). Selecting a tab REPLACES the grid content server-side (D-12) and
// drops `shown`, because a filter change resets the page; `q` is preserved so
// search composes within the active filter (D-19). "Today" additionally writes
// `d` = the CLIENT's local calendar day computed at click time (D-14) — the
// server must not answer that question in UTC.
//
// WHY THE PILL ROW IS COMPOSED HERE RATHER THAN RENDERED BY
// `SegmentedControl`: `TabBar` imports `INSET_FILL` from `CompactControl`,
// and `CompactControl`'s gate read runs `node:fs` at module load. A client
// chunk may not reference `node:fs`, so the gate-selected fill arrives as a
// PROP from the server page instead (the login-form / invite-creator /
// audit-browser precedent). The markup below is TabBar's grammar verbatim —
// same container, same item base, `role="tablist"` / `role="tab"` /
// `aria-selected`, 44px minimum on every tab — so the locked pill-control
// grammar (04-CONTEXT discretion: "must use the TabBar or Pill primitive")
// holds and a later gate re-open is still picked up through the prop.
//
// Trailing on the same row: the honest result count — "{n} patients", or
// "{n} of {total} patients" while more pages exist (04-UI-SPEC §4.3).
import { useRouter } from 'next/navigation';
import type { PatientFilter } from './FolderGrid';

/** The five tab labels, in order (04-UI-SPEC §Copywriting). */
export const PATIENT_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'recent', label: 'Recent' },
  { value: 'today', label: 'Today' },
  { value: 'attention', label: 'Needs attention' },
  { value: 'critical', label: 'Critical' },
] as const satisfies readonly { value: PatientFilter; label: string }[];

/**
 * The client's local calendar day, YYYY-MM-DD (D-14). Computed at click time
 * so "Today" means the clinic's day, not UTC's.
 */
export function localToday(): string {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

// TabBar's CONTAINER_CLASSES minus the INSET_FILL slot (a prop here).
const CONTAINER_CLASSES = 'flex min-w-0 max-w-full items-center gap-xs overflow-x-auto [scrollbar-width:none] rounded-pill p-xs';
// TabBar's ITEM_BASE, verbatim.
const ITEM_CLASSES =
  'inline-flex min-h-11 items-center justify-center gap-xs rounded-pill px-md py-sm text-label leading-label text-text-primary';

export type RetrievalControlsProps = {
  filter: PatientFilter;
  q?: string;
  day?: string;
  /** Rows currently loaded. */
  count: number;
  /** Total rows matching the filter+search (queries.ts `count: 'exact'`). */
  total: number;
  hasMore: boolean;
  /** The gate-selected INSET_FILL, read server-side (never from a client chunk). */
  insetFill: string;
};

export function RetrievalControls({
  filter,
  q,
  day,
  count,
  total,
  hasMore,
  insetFill,
}: RetrievalControlsProps) {
  const router = useRouter();

  function select(value: PatientFilter): void {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    params.set('filter', value);
    if (value === 'today') params.set('d', day || localToday());
    // `shown` is deliberately dropped: a filter change resets the page.
    router.replace(`/provider?${params.toString()}`, { scroll: false });
  }

  const countLabel = hasMore ? `${count} of ${total} patients` : `${count} patients`;

  return (
    <div className="flex w-full flex-wrap items-center gap-lg">
      <div
        role="tablist"
        aria-label="Filter patients"
        className={[CONTAINER_CLASSES, insetFill].filter(Boolean).join(' ')}
      >
        {PATIENT_FILTERS.map(({ value, label }) => {
          const isActive = value === filter;
          const stateClasses = isActive ? 'bg-surface-raised shadow-raised' : 'bg-transparent';
          return (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => select(value)}
              className={[ITEM_CLASSES, stateClasses].join(' ')}
            >
              <span>{label}</span>
            </button>
          );
        })}
      </div>
      <span className="shrink-0 text-label leading-label text-text-secondary tabular-nums">
        {countLabel}
      </span>
    </div>
  );
}
