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
import { PrescriptionIntakeControl } from '@/components/ocr/PrescriptionIntakeControl';
import { StartMedicationControl } from '@/components/medications/StartMedicationControl';
import { CAN_AUTHOR_CLINICAL, runsCapability } from '@/lib/auth/capabilities';
import { resolveWorkspaceRole } from '@/lib/auth/workspace';
import { patientIdSchema } from '@/lib/patients/schemas';
import { listMedications, type MedicationRecord } from '@/lib/medications/queries';
import { listOcrExtractions, type OcrExtractionRecord } from '@/lib/ocr/queries';
import { EXTRACTION_STATUS_LABELS, EXTRACTION_STATUS_TOKEN } from '@/lib/ocr/status';
import { Pill } from '@/components/primitives/Pill';
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

  // In-flight prescription extractions (Phase 12): the ingestion pipeline's
  // work items for this patient, newest first.
  let extractions: OcrExtractionRecord[] = [];
  if (parsedId.success) {
    try {
      extractions = await listOcrExtractions(resolution.orgId, parsedId.data);
    } catch {
      extractions = [];
    }
  }

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
              <span className="flex flex-wrap items-center gap-sm">
                <PrescriptionIntakeControl
                  patientId={parsedId.data}
                  orgId={resolution.orgId}
                  insetFill={INSET_FILL}
                />
                <StartMedicationControl patientId={parsedId.data} insetFill={INSET_FILL} />
              </span>
            ) : null}
          </div>

          {!failed && parsedId.success && extractions.length > 0 ? (
            <section aria-label="Prescription intake" className="flex flex-col gap-sm">
              <h2 className="text-label leading-label font-semibold text-text-primary">
                Prescription intake
              </h2>
              <ul className="flex flex-col gap-sm">
                {extractions.map((extraction) => (
                  <li key={extraction.id}>
                    <Surface variant="surface" className="flex flex-wrap items-center justify-between gap-md">
                      <a
                        href={`/provider/patients/${parsedId.data}/medications/intake/${extraction.id}`}
                        className="flex min-w-0 flex-col gap-xs"
                      >
                        <span className="truncate text-body leading-body text-text-primary">
                          {extraction.documentName ?? 'Prescription'}
                        </span>
                        <span className="text-label leading-label text-text-secondary tabular-nums">
                          Received {extraction.createdAt.slice(0, 10)}
                        </span>
                      </a>
                      <Pill
                        tone={EXTRACTION_STATUS_TOKEN[extraction.status]}
                        label={EXTRACTION_STATUS_LABELS[extraction.status]}
                      />
                    </Surface>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

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
