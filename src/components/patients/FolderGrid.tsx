// src/components/patients/FolderGrid.tsx — the provider-home folder grid
// (PROV-01/PROV-03, UX-07; D-11/D-12/D-19/D-20; 04-UI-SPEC §4.1/§4.7).
//
// Server Component: no client directive, no hook. It renders cards, the
// per-filter empty state and the "Load more" link — nothing else (the result
// count lives in RetrievalControls, 04-UI-SPEC §4.3).
//
// Grid (QA row 5): 1 column below 768px, 2 at 768–1023px, 3 at ≥1024px, gap
// `space.lg` on both axes.
//
// "Load more" (D-20/UX-07, 04-RESEARCH Pattern 3): the URL IS the state, so
// the control is a LINK to the same URL with `shown` grown by `limit` — the
// page fetches rows 0..shown+limit, so a click APPENDS the next window and
// never drops rows already on screen. There is no client fetch and no local
// filtering (D-18).
//
// Empty states (04-UI-SPEC §4.7): one exact string pair per filter, the
// search-no-match pair taking precedence whenever `q` is non-empty (it never
// leaks which field failed to match). The "All" empty state additionally
// renders the `emptyAction` node under it — the wired "Add new patient"
// trigger passed by the page (04-04). An unwired action slot is never
// rendered: a dead enabled button does not ship (EmptyState's contract).
import type { ReactNode } from 'react';
import type { ListPatientsQueryInput } from '@/lib/patients/schemas';
import type { PatientFolderRow } from '@/lib/patients/queries';
import { EmptyState } from '@/components/primitives/EmptyState';
import { FolderCard } from './FolderCard';

/** The five retrieval filters (D-11), typed from the schema so they cannot drift. */
export type PatientFilter = ListPatientsQueryInput['filter'];

type EmptyCopy = { title: string; body: string };

// 04-UI-SPEC §4.7 — exact strings, sentence case, no fabricated urgency.
const EMPTY_COPY: Record<PatientFilter, EmptyCopy> = {
  all: {
    title: 'No patients yet',
    body: 'Patient folders appear here once they are added to the practice.',
  },
  recent: {
    title: 'No recent activity',
    body: 'Patients appear here once their records change.',
  },
  today: {
    title: 'No patients today',
    body: 'Patients created or updated today appear here.',
  },
  attention: {
    title: 'No patients need attention',
    body: 'Patients marked for follow-up or review appear here.',
  },
  critical: {
    title: 'No critical patients',
    body: 'Patients marked critical appear here.',
  },
};

const SEARCH_EMPTY: EmptyCopy = {
  title: 'No matching patients',
  body: 'Try a different name, record number, phone number or date.',
};

/** 3 / 2 / 1 columns at the responsive-rules band edges (1024px / 768px). */
export const FOLDER_GRID_CLASSES = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-lg';

// The anchor form of the `secondary` Button (EmptyState.ACTION_LINK_CLASSES):
// an RSC cannot hand onClick to the client Button primitive, so a link wears
// the same pill grammar — bg-surface-raised, radius.pill, shadow-raised.
const LOAD_MORE_CLASSES =
  'inline-flex min-h-11 items-center justify-center gap-xs rounded-pill bg-surface-raised px-xl text-body font-semibold leading-body text-text-primary shadow-raised';

/** Same URL, `shown` grown by `limit` — cumulative paging, never a window replace. */
export function buildLoadMoreHref(next: {
  q?: string;
  filter: PatientFilter;
  day?: string;
  shown: number;
}): string {
  const params = new URLSearchParams();
  if (next.q) params.set('q', next.q);
  params.set('filter', next.filter);
  if (next.filter === 'today' && next.day) params.set('d', next.day);
  params.set('shown', String(next.shown));
  return `/provider?${params.toString()}`;
}

export type FolderGridProps = {
  rows: PatientFolderRow[];
  hasMore: boolean;
  filter: PatientFilter;
  q?: string;
  /** The client's local YYYY-MM-DD (D-14), preserved by "Load more". */
  day?: string;
  shown: number;
  limit: number;
  /** The resolved role holds CAN_MANAGE_MEMBERSHIP (server-known). */
  canInvite?: boolean;
  /** The resolved role holds CAN_MESSAGE (Phase 15, server-known). */
  canMessage?: boolean;
  /** The wired "Add new patient" trigger for the All-empty branch (04-04). */
  emptyAction?: ReactNode;
};

export function FolderGrid({
  rows,
  hasMore,
  filter,
  q,
  day,
  shown,
  limit,
  canInvite = false,
  canMessage = false,
  emptyAction,
}: FolderGridProps) {
  if (rows.length === 0) {
    const searching = Boolean(q && q.trim() !== '');
    const copy = searching ? SEARCH_EMPTY : EMPTY_COPY[filter];
    return (
      <div className="flex flex-col items-center gap-md">
        <EmptyState title={copy.title} body={copy.body} />
        {!searching && filter === 'all' && emptyAction ? emptyAction : null}
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-lg">
      <div className={FOLDER_GRID_CLASSES}>
        {rows.map((patient) => (
          <FolderCard key={patient.id} patient={patient} canInvite={canInvite} canMessage={canMessage} />
        ))}
      </div>
      {hasMore ? (
        <div className="flex justify-center">
          <a
            className={LOAD_MORE_CLASSES}
            href={buildLoadMoreHref({ q, filter, day, shown: shown + limit })}
          >
            Load more
          </a>
        </div>
      ) : null}
    </div>
  );
}
