// Medications — the patient's medication lifecycle surface (ticket 08-03;
// MED-01).
//
// Server Component, force-dynamic: the org-scoped read runs under RLS per
// request. Authorization resolves server-side first; the "New medication"
// control and the lifecycle controls appear only for a clinical author, and
// the actions re-check — the UI is a courtesy, never the boundary
// (§3.1/§12). The `[patientId]` parameter is UUID-validated before any query
// (ASVS V5, T-02-52).
import { Lock } from 'lucide-react';
import { Surface } from '@/components/primitives';
import { EmptyState } from '@/components/primitives/EmptyState';
import { INSET_FILL } from '@/components/primitives/CompactControl';
import { StateVariant } from '@/components/state/StateVariant';
import { WorkspaceTopBar } from '@/components/shell/WorkspaceTopBar';
import { MedicationList } from '@/components/medications/MedicationList';
import { StartMedicationControl } from '@/components/medications/StartMedicationControl';
import { CAN_AUTHOR_CLINICAL, runsCapability } from '@/lib/auth/capabilities';
import { resolveWorkspaceRole } from '@/lib/auth/workspace';
import { patientIdSchema } from '@/lib/patients/schemas';
import { listMedications, type MedicationRecord } from '@/lib/medications/queries';
import { tabHref } from '../tabs';

export const dynamic = 'force-dynamic';

export default async function MedicationsPage({
  params,
}: {
  params: Promise<{ patientId: string }>;
}) {
  const { patientId } = await params;
  const resolution = await resolveWorkspaceRole('provider');
  if (resolution.kind !== 'signed-in') return null;

  const parsedId = patientIdSchema.safeParse(patientId);

  let medications: MedicationRecord[] = [];
  let failed = false;
  if (parsedId.success) {
    try {
      medications = await listMedications(resolution.orgId, parsedId.data);
    } catch {
      failed = true;
    }
  }

  const canAuthor = runsCapability(resolution.role, CAN_AUTHOR_CLINICAL);

  return (
    <>
      <WorkspaceTopBar patientId={patientId} activeSlug="medications" />
      <Surface variant="canvas" className="flex flex-1 bg-canvas p-lg">
        <div className="mx-auto flex w-full max-w-[72rem] flex-col gap-lg">
          <div className="flex flex-wrap items-center justify-between gap-md">
            <h1 className="text-heading font-semibold leading-heading text-text-primary">
              Medications
            </h1>
            {canAuthor && parsedId.success && !failed ? (
              <StartMedicationControl patientId={parsedId.data} insetFill={INSET_FILL} />
            ) : null}
          </div>

          {failed ? (
            <StateVariant surface="medications" retryHref={tabHref(patientId, 'medications')} />
          ) : !parsedId.success ? (
            <EmptyState
              icon={Lock}
              title="You don't have access to this patient's medications"
              body="Ask your organization owner for access to patient records."
            />
          ) : medications.length === 0 ? (
            <EmptyState
              title="No medications yet"
              body="Medications will appear here once one is started or recorded."
            />
          ) : (
            <MedicationList
              patientId={parsedId.data}
              medications={medications}
              canAuthor={canAuthor}
              insetFill={INSET_FILL}
            />
          )}
        </div>
      </Surface>
    </>
  );
}
