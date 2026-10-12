// /provider — the provider home folder workspace (PROV-01/02/03/04, UX-01,
// UX-07; D-11/D-12/D-14/D-16/D-17/D-18/D-19/D-20; 04-UI-SPEC §4.1).
//
// Server Component, async: `searchParams` is awaited (Next 15/16 Promise
// shape — login/page.tsx:27-31 precedent, 04-RESEARCH Pitfall 2) and every
// `string | string[]` value is normalized to its first entry. The URL is the
// ONLY state carrier: tabs, search and "Load more" all write `?params` and
// this page re-derives the query from them — there is no client fetch, no
// local filtering and no component state (D-11/D-18/D-20).
//
// Authorization runs server-side first: `resolveWorkspaceRole('provider')`
// gives the org scope for the RLS-scoped `listPatients` call plus the role the
// capability flags derive from. The layout already redirects a non-member, so
// an unresolvable resolution renders an EMPTY grid region rather than guessing
// (a fake gate that looks real is worse than none). Nothing role-based crosses
// the RSC → client boundary beyond the boolean `canInvite` the card needs.
//
// URL → listPatients mapping (listPatientsQuerySchema, Zod before trust):
//   q     → q        search across name/MRN/phone/DOB (D-17), server-side
//   filter→ filter   all | recent | today | attention | critical (D-11)
//   d     → day      the client's LOCAL calendar day for "today" (D-14)
//   shown → shown    cumulative window start: rows 0..shown+limit (D-20)
//   limit → limit    page size (schema-capped at 30)
// An unparsable value falls back to the schema defaults instead of rendering a
// half-parseable surface.
//
// `dynamic = 'force-dynamic'` is declared explicitly: awaiting `searchParams`
// and the cookie-backed Supabase client already force per-request rendering,
// and the declaration keeps PHI off any future cache path by construction
// (02-10's load-bearing precedent, repeated by every data-backed page).
import { Surface } from '@/components/primitives';
import { INSET_FILL } from '@/components/primitives/CompactControl';
import { FolderGrid } from '@/components/patients/FolderGrid';
import { NewPatientControl } from '@/components/patients/NewPatientControl';
import { ProviderSearchControl } from '@/components/patients/ProviderSearchControl';
import { RetrievalControls } from '@/components/patients/RetrievalControls';
import { TodaySchedulePanel } from '@/components/schedule/TodaySchedulePanel';
import { CriticalAlertsPanel } from '@/components/alerts/CriticalAlertsPanel';
import { DailyStatsPanel } from '@/components/stats/DailyStatsPanel';
import { CAN_MANAGE_MEMBERSHIP, CAN_MESSAGE, runsCapability } from '@/lib/auth/capabilities';
import { resolveWorkspaceRole } from '@/lib/auth/workspace';
import { listPatients } from '@/lib/patients/queries';
import { listDaySchedule } from '@/lib/schedule/queries';
import { listCriticalAlerts } from '@/lib/alerts/queries';
import { getProviderHomeStats, type ProviderHomeStats } from '@/lib/stats/queries';
import { listPatientsQuerySchema, type ListPatientsQueryInput } from '@/lib/patients/schemas';

export const dynamic = 'force-dynamic';

/** The five retrieval filters, typed against the schema so they cannot drift. */
const FILTER_VALUES = [
  'all',
  'recent',
  'today',
  'attention',
  'critical',
] as const satisfies readonly ListPatientsQueryInput['filter'][];

type FilterValue = ListPatientsQueryInput['filter'];

/** Narrow a searchParam to its first value (04-RESEARCH Pitfall 2). */
function first(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

/** An unknown filter never widens the query — it falls back to the default. */
function asFilter(value: string | undefined): FilterValue | undefined {
  return FILTER_VALUES.includes(value as FilterValue) ? (value as FilterValue) : undefined;
}

export default async function ProviderHomePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const parsed = listPatientsQuerySchema.safeParse({
    q: first(params.q),
    filter: asFilter(first(params.filter)),
    day: first(params.d),
    shown: first(params.shown),
    limit: first(params.limit),
  });
  const query = parsed.success ? parsed.data : listPatientsQuerySchema.parse({});

  const resolution = await resolveWorkspaceRole('provider');
  if (resolution.kind !== 'signed-in') return null;

  const { rows, hasMore, total } = await listPatients({
    orgId: resolution.orgId,
    q: query.q,
    filter: query.filter,
    day: query.day,
    shown: query.shown,
    limit: query.limit,
  });

  // Server-known: the UI hides the invite row for roles that cannot send one
  // (04-RESEARCH Open Question 4 — the capability is not widened), and the
  // action re-checks it anyway.
  const canInvite = runsCapability(resolution.role, CAN_MANAGE_MEMBERSHIP);
  // Phase 15 (COMM-03): the folder card's "Message patient" row is the
  // provider-side entry to the unified conversation. The capability mirrors
  // migration 0014's write policy; the action re-checks it anyway.
  const canMessage = runsCapability(resolution.role, CAN_MESSAGE);

  // D-28 dashboard panels (the reference's three-column composition): the
  // day's schedule and the org's critical alerts. Each degrades on its own —
  // a failed read shows that panel's honest empty line, never a blank.
  const day = new Date().toISOString().slice(0, 10);
  let schedule: Awaited<ReturnType<typeof listDaySchedule>> = [];
  try {
    schedule = await listDaySchedule(resolution.orgId, day);
  } catch {
    schedule = [];
  }
  let alerts: Awaited<ReturnType<typeof listCriticalAlerts>> = [];
  try {
    alerts = await listCriticalAlerts(resolution.orgId);
  } catch {
    alerts = [];
  }
  // The Daily Stats read degrades on its own: a failure renders the panel's
  // honest unavailability line, never invented numbers (reference grammar §6).
  let stats: ProviderHomeStats | null = null;
  try {
    stats = await getProviderHomeStats(resolution.orgId, day);
  } catch {
    stats = null;
  }

  return (
    <Surface variant="canvas" className="flex flex-1 flex-col bg-canvas p-lg">
      <div className="mx-auto flex w-full max-w-[104rem] flex-col gap-lg">
        {/* Mobile placements (04-UI-SPEC §4.4/§4.5): the Phase-2 top bar
            keeps its own `max-md:hidden` controls, so the body row repeats
            the search and the CTA below the 768px band edge. */}
        <div className="flex flex-col gap-md md:hidden">
          <ProviderSearchControl
            inputId="provider-search-body"
            filter={query.filter}
            day={query.day}
            insetFill={INSET_FILL}
          />
          <NewPatientControl insetFill={INSET_FILL} className="w-full" />
        </div>

        {/* The reference's three-column dashboard (D-28, grammar §6): schedule
            left, profiles center, and on the right the Critical Alerts panel
            plus Daily Stats as a 2x2 of mini stat cards — one column stack.
            Stacked in one column below the 1280px band edge with the profiles
            first (order-*). */}
        <div className="flex flex-col gap-lg xl:grid xl:grid-cols-[minmax(0,17rem)_minmax(0,1fr)_minmax(0,19rem)] xl:items-start">
          <div className="order-2 xl:order-1">
            <TodaySchedulePanel rows={schedule} />
          </div>

          {/* The Patient Profiles panel: one white rounded surface holds the
              retrieval controls and the folder grid, so the grid reads as
              profiles inside a composed panel instead of loose boxes
              floating on the canvas. */}
          <Surface variant="surface" className="order-1 flex flex-col gap-lg rounded-xl xl:order-2">
            <div className="flex flex-wrap items-center justify-between gap-md">
              <h1 className="text-heading font-semibold leading-heading text-text-primary">Patient Profiles</h1>
            </div>

            {/* The retrieval control row sits ABOVE the grid (D-12). */}
            <RetrievalControls
              filter={query.filter}
              q={query.q}
              day={query.day}
              count={rows.length}
              total={total}
              hasMore={hasMore}
              insetFill={INSET_FILL}
            />

            <FolderGrid
              rows={rows}
              hasMore={hasMore}
              filter={query.filter}
              q={query.q}
              day={query.day}
              shown={query.shown}
              limit={query.limit}
              canInvite={canInvite}
              canMessage={canMessage}
              emptyAction={<NewPatientControl insetFill={INSET_FILL} variant="secondary" />}
            />
          </Surface>

          <div className="order-3 flex flex-col gap-lg">
            <CriticalAlertsPanel rows={alerts} />
            <DailyStatsPanel stats={stats} />
          </div>
        </div>
      </div>
    </Surface>
  );
}
