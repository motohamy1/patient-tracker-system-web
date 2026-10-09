// Visits — the patient's visit list and the scheduling entry point (ticket
// 07-05; VIS-01/VIS-03).
//
// Server Component, force-dynamic: the org-scoped visit read runs under RLS
// per request and is never cached across principals. Authorization resolves
// server-side first; the "New visit" control and the clinical fields appear
// only for roles that hold the matching capability, and the actions re-check —
// the UI is a courtesy, never the boundary (§3.1/§12).
//
// The `[patientId]` parameter is validated as a UUID before it reaches any
// query and is used only to build hrefs otherwise (ASVS V5, T-02-52).
import { Lock } from 'lucide-react';
import { Surface } from '@/components/primitives';
import { EmptyState } from '@/components/primitives/EmptyState';
import { INSET_FILL } from '@/components/primitives/CompactControl';
import { StateVariant } from '@/components/state/StateVariant';
import { WorkspaceTopBar } from '@/components/shell/WorkspaceTopBar';
import { NewVisitControl } from '@/components/visits/NewVisitControl';
import { VisitList } from '@/components/visits/VisitList';
import { CAN_AUTHOR_CLINICAL, CAN_SCHEDULE, runsCapability } from '@/lib/auth/capabilities';
import { resolveWorkspaceRole } from '@/lib/auth/workspace';
import { patientIdSchema } from '@/lib/patients/schemas';
import { listVisits, type VisitRecord } from '@/lib/visits/queries';
import { tabHref } from '../tabs';

export const dynamic = 'force-dynamic';

export default async function VisitsPage({
  params,
}: {
  params: Promise<{ patientId: string }>;
}) {
  const { patientId } = await params;
  const resolution = await resolveWorkspaceRole('provider');
  if (resolution.kind !== 'signed-in') return null;

  const parsedId = patientIdSchema.safeParse(patientId);

  let visits: VisitRecord[] = [];
  let failed = false;
  if (parsedId.success) {
    try {
      visits = await listVisits(resolution.orgId, parsedId.data);
    } catch {
      failed = true;
    }
  }

  const canSchedule = runsCapability(resolution.role, CAN_SCHEDULE);
  const canAuthorClinical = runsCapability(resolution.role, CAN_AUTHOR_CLINICAL);

  return (
    <>
      <WorkspaceTopBar patientId={patientId} activeSlug="visits" />
      <Surface variant="canvas" className="flex flex-1 bg-canvas p-lg">
        <div className="mx-auto flex w-full max-w-[72rem] flex-col gap-lg">
          <div className="flex flex-wrap items-center justify-between gap-md">
            <h1 className="text-heading font-semibold leading-heading text-text-primary">Visits</h1>
            {canSchedule && parsedId.success && !failed ? (
              <NewVisitControl
                patientId={parsedId.data}
                canAuthorClinical={canAuthorClinical}
                insetFill={INSET_FILL}
              />
            ) : null}
          </div>

          {failed ? (
            <StateVariant surface="visits" retryHref={tabHref(patientId, 'visits')} />
          ) : !parsedId.success ? (
            <EmptyState
              icon={Lock}
              title="You don't have access to this patient's visits"
              body="Ask your organization owner for access to patient records."
            />
          ) : visits.length === 0 ? (
            <EmptyState
              title="No visits yet"
              body="Visits will appear here once one is scheduled or documented."
            />
          ) : (
            <VisitList patientId={parsedId.data} visits={visits} />
          )}
        </div>
      </Surface>
    </>
  );
}
