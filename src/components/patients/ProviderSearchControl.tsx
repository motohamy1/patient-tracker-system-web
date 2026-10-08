'use client';

// src/components/patients/ProviderSearchControl.tsx — the live patient search
// (PROV-02; D-17/D-18/D-19; 04-UI-SPEC §4.4).
//
// Client island: a timer plus `router.replace(..., { scroll: false })`. The
// value is debounced at SEARCH_DEBOUNCE_MS and written to `?q=`; the server
// re-runs `listPatients`, so NO row is ever filtered or fetched on the client
// (D-18 — source-inspectable: this file holds no rows, no predicate and no
// fetch). The active `filter` is preserved so search runs WITHIN it (D-19),
// and `shown` is dropped because a new query resets pagination.
//
// WHY THE FIELD IS COMPOSED HERE RATHER THAN WRAPPED AROUND
// `CompactControl variant="search"`: `CompactControl` runs a `node:fs` gate
// read at module load, and a client chunk may not reference `node:fs` — the
// login-form / invite-creator / audit-browser precedent. The gate-selected
// fill therefore arrives as a PROP from the server page, and the markup below
// is CompactControl's §5.4 search grammar verbatim (sr-only programmatic
// label, `radius.pill` capsule, `min-h-11 md:min-h-8` band rhythm, 16px
// leading glyph, transparent input at the body step).
//
// Two placements, one component: the page renders it in the body control row
// `md:hidden` (the Phase-2 top bar keeps its own `max-md:hidden` control),
// and both sync from the same URL param.
import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { makeIcon } from '@/components/primitives/Icon';
import type { PatientFilter } from './FolderGrid';
import { localToday } from './RetrievalControls';

/** D-18: 300ms of quiet before the query hits the server. */
export const SEARCH_DEBOUNCE_MS = 300;

const SearchGlyph = makeIcon(Search);

export type ProviderSearchControlProps = {
  filter: PatientFilter;
  /** The client's local YYYY-MM-DD already in the URL (D-14), if any. */
  day?: string;
  /** The gate-selected INSET_FILL, read server-side (never from a client chunk). */
  insetFill: string;
  inputId: string;
  className?: string;
};

export function ProviderSearchControl({
  filter,
  day,
  insetFill,
  inputId,
  className,
}: ProviderSearchControlProps) {
  const router = useRouter();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Never leave a pending write behind after unmount or a route change.
  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  function schedule(rawValue: string): void {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const params = new URLSearchParams();
      const value = rawValue.trim();
      if (value !== '') params.set('q', value);
      params.set('filter', filter);
      if (filter === 'today') params.set('d', day || localToday());
      const query = params.toString();
      router.replace(query ? `/provider?${query}` : '/provider', { scroll: false });
    }, SEARCH_DEBOUNCE_MS);
  }

  return (
    <div className={['flex w-full flex-col gap-xs', className].filter(Boolean).join(' ')}>
      <label htmlFor={inputId} className="sr-only">
        Search patients
      </label>
      <div
        className={[
          'inline-flex w-full items-center gap-xs rounded-pill px-lg min-h-11 md:min-h-8 text-text-primary',
          insetFill,
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <SearchGlyph size="sm" />
        <input
          id={inputId}
          type="search"
          placeholder="Search patients"
          onChange={(event) => schedule(event.target.value)}
          className="min-w-0 flex-1 bg-transparent text-body leading-body text-text-primary placeholder:text-text-primary"
        />
      </div>
    </div>
  );
}
