// One medication's detail: the structured facts + its real event trail
// (ticket 08-03; MED-01).
//
// Server Component: reads the patient's medications and its history under org
// RLS (both reads are the same RLS-scoped queries the tab uses), then filters
// to this medication. Nothing is invented: the trail is exactly the rows the
// DB trigger wrote.
import { Lock } from 'lucide-react';
import { Pill } from '@/components/primitives/Pill';
import { Surface } from '@/components/primitives';
import { EmptyState } from '@/components/primitives/EmptyState';
import { StateVariant } from '@/components/state/StateVariant';
import { WorkspaceTopBar } from '@/components/shell/WorkspaceTopBar';
import { resolveWorkspaceRole } from '@/lib/auth/workspace';
import { patientIdSchema } from '@/lib/patients/schemas';
import { medicationIdSchema } from '@/lib/medications/schemas';
import {
  listMedicationEvents,
  listMedications,
  type MedicationEventRecord,
  type MedicationRecord,
} from '@/lib/medications/queries';
import {
  MEDICATION_EVENT_LABELS,
  MEDICATION_FREQUENCY_LABELS,
  MEDICATION_ROUTE_LABELS,
  MEDICATION_STATUS_LABELS,
  MEDICATION_STATUS_TOKEN,
  MEDICATION_SOURCE_LABELS,
  type MedicationSource,
} from '@/lib/medications/status';

export const dynamic = 'force-dynamic';

function FactRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-md">
      <span className="text-label leading-label text-text-secondary">{label}</span>
      <span className="text-body leading-body text-text-primary tabular-nums">{value}</span>
    </div>
  );
}

export default async function MedicationDetailPage({
  params,
}: {
  params: Promise<{ patientId: string; medicationId: string }>;
}) {
  const { patientId, medicationId } = await params;
  const resolution = await resolveWorkspaceRole('provider');
  if (resolution.kind !== 'signed-in') return null;

  const parsedPatient = patientIdSchema.safeParse(patientId);
  const parsedMedication = medicationIdSchema.safeParse(medicationId);

  let medication: MedicationRecord | null = null;
  let history: MedicationEventRecord[] = [];
  let failed = false;
  if (parsedPatient.success && parsedMedication.success) {
    try {
      const medications = await listMedications(resolution.orgId, parsedPatient.data);
      medication = medications.find((row) => row.id === parsedMedication.data) ?? null;
      if (medication !== null) {
        const events = await listMedicationEvents(resolution.orgId, parsedPatient.data);
        history = events.filter((event) => event.medicationId === parsedMedication.data);
      }
    } catch {
      failed = true;
    }
  }

  return (
    <>
      <WorkspaceTopBar patientId={patientId} activeSlug="medications" />
      <Surface variant="canvas" className="flex flex-1 bg-canvas p-lg">
        <div className="mx-auto flex w-full max-w-[48rem] flex-col gap-lg">
          {failed ? (
            <StateVariant
              surface="this medication"
              retryHref={`/provider/patients/${patientId}/medications`}
            />
          ) : medication === null ? (
            <EmptyState
              icon={Lock}
              title="You don't have access to this medication"
              body="Ask your organization owner for access to patient records."
            />
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-md">
                <h1 className="text-heading font-semibold leading-heading text-text-primary">
                  {medication.name}
                </h1>
                <Pill
                  tone={MEDICATION_STATUS_TOKEN[medication.status]}
                  label={MEDICATION_STATUS_LABELS[medication.status]}
                />
              </div>

              <Surface variant="surface" className="flex flex-col gap-sm">
                <FactRow
                  label="Dose"
                  value={
                    medication.doseAmount === null
                      ? 'Not specified'
                      : `${medication.doseAmount}${medication.doseUnit ? ` ${medication.doseUnit}` : ''}`
                  }
                />
                <FactRow
                  label="Frequency"
                  value={
                    medication.frequency === null
                      ? 'Not specified'
                      : MEDICATION_FREQUENCY_LABELS[medication.frequency]
                  }
                />
                <FactRow
                  label="Route"
                  value={
                    medication.route === null
                      ? 'Not specified'
                      : MEDICATION_ROUTE_LABELS[medication.route]
                  }
                />
                <FactRow label="Started" value={medication.startedAt.slice(0, 10)} />
                {medication.stoppedAt !== null ? (
                  <FactRow label="Stopped" value={medication.stoppedAt.slice(0, 10)} />
                ) : null}
                <FactRow
                  label="Source"
                  value={MEDICATION_SOURCE_LABELS[medication.source as MedicationSource]}
                />
              </Surface>

              <section className="flex flex-col gap-md" aria-label="Medication history">
                <h2 className="text-heading font-semibold leading-heading text-text-primary">
                  History
                </h2>
                {history.length === 0 ? (
                  <p className="text-body leading-body text-text-secondary">
                    No changes recorded yet.
                  </p>
                ) : (
                  <ul className="flex flex-col gap-sm">
                    {history.map((event) => (
                      <li key={event.id} className="flex items-center justify-between gap-md">
                        <span className="text-body leading-body text-text-primary">
                          {MEDICATION_EVENT_LABELS[event.kind]}
                        </span>
                        <span className="text-label leading-label text-text-secondary tabular-nums">
                          {event.at.slice(0, 10)} {event.at.slice(11, 16)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </>
          )}
        </div>
      </Surface>
    </>
  );
}
