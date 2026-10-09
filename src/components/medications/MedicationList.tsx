// MedicationList — the patient's medications grouped by lifecycle state
// (MED-01; ticket 08-03).
//
// Server Component. Active first, paused next, stopped (historical) last; each
// row shows the REAL structured facts (dose + unit, frequency, route, start
// date) with a semantic status Pill from the closed D-04 tint family, and
// renders the lifecycle controls only for a clinical author (no dead controls
// for a reader). The row's identity links to its detail (structured facts +
// the event trail); the controls sit OUTSIDE the anchor (nested interactive
// elements are invalid).
import Link from 'next/link';
import { Pill } from '@/components/primitives/Pill';
import { Surface } from '@/components/primitives';
import { MedicationLifecycleControls } from '@/components/medications/MedicationLifecycleControls';
import {
  MEDICATION_FREQUENCY_LABELS,
  MEDICATION_ROUTE_LABELS,
  MEDICATION_STATUS_LABELS,
  MEDICATION_STATUS_TOKEN,
  MEDICATION_STATUSES,
  MEDICATION_SOURCE_LABELS,
  type MedicationSource,
  type MedicationStatus,
} from '@/lib/medications/status';
import type { MedicationRecord } from '@/lib/medications/queries';

/** "500 mg · Twice daily · Oral · started 2026-10-06" — real facts only. */
function facts(medication: MedicationRecord): string {
  const parts: string[] = [];
  if (medication.doseAmount !== null) {
    parts.push(
      medication.doseUnit !== null
        ? `${medication.doseAmount} ${medication.doseUnit}`
        : String(medication.doseAmount),
    );
  }
  if (medication.frequency !== null) parts.push(MEDICATION_FREQUENCY_LABELS[medication.frequency]);
  if (medication.route !== null) parts.push(MEDICATION_ROUTE_LABELS[medication.route]);
  parts.push(`started ${medication.startedAt.slice(0, 10)}`);
  if (medication.status === 'stopped' && medication.stoppedAt !== null) {
    parts.push(`stopped ${medication.stoppedAt.slice(0, 10)}`);
  }
  return parts.join(' · ');
}

export function MedicationList({
  patientId,
  medications,
  canAuthor,
  insetFill,
}: {
  patientId: string;
  medications: readonly MedicationRecord[];
  canAuthor: boolean;
  insetFill: string;
}) {
  const groups = MEDICATION_STATUSES.map((status: MedicationStatus) => ({
    status,
    rows: medications.filter((medication) => medication.status === status),
  })).filter((group) => group.rows.length > 0);

  return (
    <div className="flex flex-col gap-lg">
      {groups.map((group) => (
        <section key={group.status} className="flex flex-col gap-md" aria-label={`${MEDICATION_STATUS_LABELS[group.status]} medications`}>
          <h2 className="text-label leading-label text-text-secondary">
            {MEDICATION_STATUS_LABELS[group.status]}
          </h2>
          <ul className="flex flex-col gap-md">
            {group.rows.map((medication) => (
              <li key={medication.id}>
                <Surface variant="surface" className="flex flex-col gap-md">
                  <div className="flex flex-wrap items-center justify-between gap-md">
                    <Link
                      href={`/provider/patients/${patientId}/medications/${medication.id}`}
                      className="flex min-w-0 flex-col gap-xs"
                    >
                      <span className="truncate text-heading font-semibold leading-heading text-text-primary">
                        {medication.name}
                      </span>
                      <span className="text-label leading-label text-text-secondary tabular-nums">
                        {facts(medication)}
                      </span>
                    </Link>
                    <span className="flex items-center gap-md">
                      {medication.source !== 'clinician' ? (
                        <span className="text-label leading-label text-text-secondary">
                          {MEDICATION_SOURCE_LABELS[medication.source as MedicationSource]}
                        </span>
                      ) : null}
                      <Pill
                        tone={MEDICATION_STATUS_TOKEN[medication.status]}
                        label={MEDICATION_STATUS_LABELS[medication.status]}
                      />
                    </span>
                  </div>
                  {canAuthor && medication.status !== 'stopped' ? (
                    <MedicationLifecycleControls medication={medication} insetFill={insetFill} />
                  ) : null}
                </Surface>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
