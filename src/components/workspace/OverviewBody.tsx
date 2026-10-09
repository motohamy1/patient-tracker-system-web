// OverviewBody — the data-backed body of the Overview tab (WSP-02).
//
// Split from page.tsx so the page can stream: the top bar paints immediately
// and this async component suspends inside its own `<Suspense>` boundary, with
// `OverviewSkeleton` as the fallback (§24 — a token-derived skeleton, never a
// generic "Loading…" screen and never a blank panel).
//
// Authorization runs server-side first: `resolveWorkspaceRole('provider')`
// gives the org scope for the RLS-scoped `getPatient` call. The (provider)
// layout has already redirected a cross-role or unauthenticated visitor, so a
// non-signed-in resolution here renders nothing rather than guessing (a fake
// gate that looks real is worse than none — provider/page.tsx precedent).
//
// A member of another organization reads zero rows under migration 0005's
// RLS; a malformed route segment never reaches the query at all
// (`patientIdSchema`). A privilege failure surfaces as
// `SupabasePermissionError`. All three land on the no-leak denial state — the
// copy never says whether the record exists (UX-02, AUTH-03).
//
// Layout, top to bottom (reference §5):
//   1. Upper rows — identity card (19rem) beside the context/vitals stat row;
//   2. Timeline band — the framed host Phase 006 fills, honestly empty;
//   3. Bottom row — Vital Signs History (≈55%), Labs (≈22.5%) and Recent
//      Records (≈22.5%) on the shared bottom-row grid (QA row 5), each in its
//      own failure posture: the recent-activity query degrades to the §7
//      error/denial state in ITS slot only, never blanking the surface.
//
// Server Component: no hook, no client directive.
import { Lock } from 'lucide-react';
import { EmptyState } from '@/components/primitives/EmptyState';
import { OverviewAttentionStrip } from '@/components/ai/OverviewAttentionStrip';
import { StateVariant } from '@/components/state/StateVariant';
import { ContextStatRow } from '@/components/workspace/ContextStatRow';
import { LabsCard } from '@/components/workspace/LabsCard';
import { PatientIdentityCard } from '@/components/workspace/PatientIdentityCard';
import { RecentRecordsCard } from '@/components/workspace/RecentRecordsCard';
import { TimelineBand } from '@/components/workspace/TimelineBand';
import { VitalsHistoryCard } from '@/components/workspace/VitalsHistoryCard';
import { BOTTOM_ROW_GRID, UPPER_GRID } from '@/components/workspace/grids';
import { composeRecentEvents } from '@/lib/patients/activity';
import { listAiInsights, type AiInsightRecord } from '@/lib/ai/queries';
import { projectCareEvents } from '@/lib/timeline/events';
import type { Role } from '@/lib/auth/roles';
import { ownWorkspaceTarget } from '@/lib/auth/redirect';
import { resolveWorkspaceRole } from '@/lib/auth/workspace';
import {
  getPatient,
  listPatientInvitations,
  SupabasePermissionError,
  type PatientRecord,
} from '@/lib/patients/queries';
import { patientIdSchema } from '@/lib/patients/schemas';
import { listVisits, type VisitRecord } from '@/lib/visits/queries';
import { listMedicationEvents, type MedicationEventRecord } from '@/lib/medications/queries';
import { listLabOrders, listLabResults, type LabOrderRecord, type LabResultRecord } from '@/lib/labs/queries';
import {
  listImagingOrders,
  listImagingResults,
  type ImagingOrderRecord,
  type ImagingResultRecord,
} from '@/lib/imaging/queries';
import { tabHref } from '@/app/(provider)/provider/patients/[patientId]/tabs';

/** How the recent-activity slice fared; each state owns its slot's copy. */
type ActivityPosture = 'ok' | 'error' | 'denied';

/**
 * The no-leak denial state (UX-02): the title and body never confirm that a
 * resource exists, and the only action is a wired destination — the
 * visitor's own workspace (D-12/D-24, `provider/denied/page.tsx` copy idiom).
 */
function DeniedState({
  title,
  body,
  role,
}: {
  title: string;
  body: string;
  role: Role;
}) {
  return (
    <EmptyState
      icon={Lock}
      title={title}
      body={body}
      action={{ label: 'Go to your workspace', href: ownWorkspaceTarget(role) }}
    />
  );
}

export async function OverviewBody({ patientId }: { patientId: string }) {
  const resolution = await resolveWorkspaceRole('provider');
  if (resolution.kind !== 'signed-in') return null;

  const parsedId = patientIdSchema.safeParse(patientId);

  let patient: PatientRecord | null = null;
  let recordFailed = false;
  if (parsedId.success) {
    try {
      patient = await getPatient(resolution.orgId, parsedId.data);
    } catch (error) {
      // §7: a data-backed surface never renders blank — a privilege failure
      // becomes the denial state, anything else the retry-bearing error state.
      if (!(error instanceof SupabasePermissionError)) recordFailed = true;
    }
  }

  if (recordFailed) {
    return <StateVariant surface="patient record" retryHref={tabHref(patientId, 'overview')} />;
  }

  if (patient === null) {
    return (
      <DeniedState
        title="You don't have access to this patient record"
        body="Ask your organization owner for access to patient records."
        role={resolution.role}
      />
    );
  }

  // The activity slice degrades per-slot: a failure here keeps identity,
  // context, timeline and the other two cards alive (§24 region states).
  let activityPosture: ActivityPosture = 'ok';
  let invites: Awaited<ReturnType<typeof listPatientInvitations>> = [];
  if (parsedId.success) {
    try {
      invites = await listPatientInvitations(resolution.orgId, parsedId.data);
    } catch (error) {
      activityPosture = error instanceof SupabasePermissionError ? 'denied' : 'error';
    }
  }
  // Visits feed the timeline (VIS-02). A failed visit read only removes the
  // visit events from the axis; the Visits tab owns its own error state and
  // the record's lifecycle events still render (region-level degradation).
  let visits: VisitRecord[] = [];
  if (parsedId.success) {
    try {
      visits = await listVisits(resolution.orgId, parsedId.data);
    } catch {
      visits = [];
    }
  }

  // Medication lifecycle events feed the timeline too (MED-02), read from the
  // HISTORY table. A failed read removes only those events from the axis.
  let medicationEvents: MedicationEventRecord[] = [];
  if (parsedId.success) {
    try {
      medicationEvents = await listMedicationEvents(resolution.orgId, parsedId.data);
    } catch {
      medicationEvents = [];
    }
  }

  // Labs + imaging feed the timeline (LAB-03). Each read degrades to empty on
  // failure — the tabs own their own error states, and the axis keeps whatever
  // other real events exist.
  let labOrders: LabOrderRecord[] = [];
  let labResults: LabResultRecord[] = [];
  let imagingOrders: ImagingOrderRecord[] = [];
  let imagingResults: ImagingResultRecord[] = [];
  if (parsedId.success) {
    try {
      labOrders = await listLabOrders(resolution.orgId, parsedId.data);
      labResults = await listLabResults(resolution.orgId, parsedId.data);
    } catch {
      labOrders = [];
      labResults = [];
    }
    try {
      imagingOrders = await listImagingOrders(resolution.orgId, parsedId.data);
      imagingResults = await listImagingResults(resolution.orgId, parsedId.data);
    } catch {
      imagingOrders = [];
      imagingResults = [];
    }
  }

  // The timeline projects whatever the org may read: lifecycle events always,
  // invite events when the invite read succeeded (a failed read degrades the
  // recent-records CARD only — the axis keeps its real events).
  const timelineEvents = projectCareEvents(patient, invites, {
    visits,
    medicationEvents,
    labOrders,
    labResults,
    imagingOrders,
    imagingResults,
  });
  const events = activityPosture === 'ok' ? composeRecentEvents(patient, invites) : [];

  // Attention insights bridge the Overview to AI Analytics (WSP-02). The read
  // degrades silently to no strip: the Overview never breaks for a derived
  // signal, and an empty strip is honest rather than decorative.
  let attentionInsights: AiInsightRecord[] = [];
  if (parsedId.success) {
    try {
      attentionInsights = (await listAiInsights(resolution.orgId, parsedId.data)).filter(
        (insight) => insight.kind === 'attention',
      );
    } catch {
      attentionInsights = [];
    }
  }

  return (
    <>
      <section aria-label="Patient overview" className={UPPER_GRID}>
        <PatientIdentityCard patient={patient} />
        <ContextStatRow patient={patient} />
      </section>

      <TimelineBand events={timelineEvents} />

      <OverviewAttentionStrip items={attentionInsights} patientId={patientId} />

      <div className={BOTTOM_ROW_GRID}>
        <VitalsHistoryCard />
        <LabsCard />
        {activityPosture === 'error' ? (
          <StateVariant surface="recent records" retryHref={tabHref(patientId, 'overview')} />
        ) : activityPosture === 'denied' ? (
          <DeniedState
            title="You don't have access to recent records"
            body="Ask your organization owner for access to record history."
            role={resolution.role}
          />
        ) : (
          <RecentRecordsCard events={events} />
        )}
      </div>
    </>
  );
}
