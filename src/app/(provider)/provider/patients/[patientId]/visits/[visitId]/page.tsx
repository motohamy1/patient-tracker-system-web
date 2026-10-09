// One visit's workflow surface (ticket 07-05; VIS-01).
//
// Server Component: reads the visit under org RLS, then hands it to the
// workflow client island. A visit RLS hides renders the no-leak denial state;
// a failed read renders the §7 error copy with a wired retry.
import { Lock } from 'lucide-react';
import { Surface } from '@/components/primitives';
import { EmptyState } from '@/components/primitives/EmptyState';
import { INSET_FILL } from '@/components/primitives/CompactControl';
import { StateVariant } from '@/components/state/StateVariant';
import { WorkspaceTopBar } from '@/components/shell/WorkspaceTopBar';
import { VisitWorkflow } from '@/components/visits/VisitWorkflow';
import { CAN_AUTHOR_CLINICAL, runsCapability } from '@/lib/auth/capabilities';
import { resolveWorkspaceRole } from '@/lib/auth/workspace';
import { patientIdSchema } from '@/lib/patients/schemas';
import { getVisit, type VisitRecord } from '@/lib/visits/queries';
import { visitIdSchema } from '@/lib/visits/schemas';

export const dynamic = 'force-dynamic';

export default async function VisitDetailPage({
  params,
}: {
  params: Promise<{ patientId: string; visitId: string }>;
}) {
  const { patientId, visitId } = await params;
  const resolution = await resolveWorkspaceRole('provider');
  if (resolution.kind !== 'signed-in') return null;

  const parsedPatient = patientIdSchema.safeParse(patientId);
  const parsedVisit = visitIdSchema.safeParse(visitId);

  let visit: VisitRecord | null = null;
  let failed = false;
  if (parsedPatient.success && parsedVisit.success) {
    try {
      visit = await getVisit(resolution.orgId, parsedVisit.data);
    } catch {
      failed = true;
    }
  }

  const canAuthorClinical = runsCapability(resolution.role, CAN_AUTHOR_CLINICAL);

  return (
    <>
      <WorkspaceTopBar patientId={patientId} activeSlug="visits" />
      <Surface variant="canvas" className="flex flex-1 bg-canvas p-lg">
        <div className="mx-auto flex w-full max-w-[72rem] flex-col gap-lg">
          {failed ? (
            <StateVariant surface="this visit" retryHref={`/provider/patients/${patientId}/visits`} />
          ) : visit === null ? (
            <EmptyState
              icon={Lock}
              title="You don't have access to this visit"
              body="Ask your organization owner for access to patient records."
            />
          ) : (
            <VisitWorkflow
              visit={visit}
              canAuthorClinical={canAuthorClinical}
              insetFill={INSET_FILL}
            />
          )}
        </div>
      </Surface>
    </>
  );
}
