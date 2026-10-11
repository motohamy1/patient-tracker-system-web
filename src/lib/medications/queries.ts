// src/lib/medications/queries.ts — the Phase-8 server-side medication layer.
//
// Org scoping is app-layer: the Neon connection is single-owner, so migration
// 0007's RLS policies are inert documentation and the explicit `org_id`
// predicate on every read below is the boundary (0005 discipline).
//
// TWO reads, two stories (MED-02): `listMedications` returns the CURRENT state
// the tab renders; `listMedicationEvents` returns the HISTORY the timeline
// projects. The timeline never reads the current row, so a state edit cannot
// rewrite history.
import { getSql } from '@/lib/db/neon';
import type {
  MedicationEventKind,
  MedicationFrequency,
  MedicationRoute,
  MedicationSource,
  MedicationStatus,
  MedicationVerification,
} from '@/lib/medications/status';

export type MedicationRecord = {
  id: string;
  patientId: string;
  name: string;
  doseAmount: number | null;
  doseUnit: string | null;
  frequency: MedicationFrequency | null;
  route: MedicationRoute | null;
  status: MedicationStatus;
  startedAt: string;
  pausedAt: string | null;
  stoppedAt: string | null;
  rxnormCode: string | null;
  source: MedicationSource;
  verification: MedicationVerification;
  createdAt: string;
  updatedAt: string;
};

export type MedicationEventRecord = {
  id: string;
  medicationId: string;
  medicationName: string | null;
  /** The parent medication's provenance source (so an AI-extracted medication
   *  never renders as clinician-verified on the timeline — §23). */
  medicationSource: MedicationSource | null;
  /** The parent medication's verification state (§23 pair, Phase 12). */
  medicationVerification: MedicationVerification | null;
  kind: MedicationEventKind;
  at: string;
  detail: unknown;
};

type MedicationRow = {
  id: string;
  patient_id: string;
  name: string;
  dose_amount: number | null;
  dose_unit: string | null;
  frequency: MedicationFrequency | null;
  route: MedicationRoute | null;
  status: MedicationStatus;
  started_at: string;
  paused_at: string | null;
  stopped_at: string | null;
  rxnorm_code: string | null;
  source: MedicationSource;
  verification: MedicationVerification;
  created_at: string;
  updated_at: string;
};

type MedicationEventRow = {
  id: string;
  medication_id: string;
  kind: MedicationEventKind;
  at: string;
  detail: unknown;
  medication_name: string | null;
  medication_source: MedicationSource | null;
  medication_verification: MedicationVerification | null;
};

function mapMedication(row: MedicationRow): MedicationRecord {
  return {
    id: row.id,
    patientId: row.patient_id,
    name: row.name,
    doseAmount: row.dose_amount,
    doseUnit: row.dose_unit,
    frequency: row.frequency,
    route: row.route,
    status: row.status,
    startedAt: row.started_at,
    pausedAt: row.paused_at,
    stoppedAt: row.stopped_at,
    rxnormCode: row.rxnorm_code,
    source: row.source,
    verification: row.verification,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** The patient's medications, newest first (bound predicates only, ASVS V5). */
export async function listMedications(
  orgId: string,
  patientId: string,
): Promise<MedicationRecord[]> {
  const sql = getSql();
  try {
    const rows = (await sql`
      select id, patient_id, name, dose_amount, dose_unit, frequency, route, status,
             started_at, paused_at, stopped_at, rxnorm_code, source, verification, created_at, updated_at
      from public.medications
      where org_id = ${orgId} and patient_id = ${patientId}
      order by started_at desc, id desc
    `) as unknown as MedicationRow[];

    return rows.map(mapMedication);
  } catch (error) {
    throw new Error(
      `listMedications failed: ${error instanceof Error ? error.message : 'unknown error'}`,
    );
  }
}

/**
 * The lifecycle history the timeline projects (MED-02), newest first. The
 * medication name rides the FK so an event reads as "Medication started:
 * Lisinopril" without a second query.
 */
export async function listMedicationEvents(
  orgId: string,
  patientId: string,
): Promise<MedicationEventRecord[]> {
  const sql = getSql();
  try {
    const rows = (await sql`
      select e.id, e.medication_id, e.kind, e.at, e.detail,
             m.name as medication_name, m.source as medication_source, m.verification as medication_verification
      from public.medication_events e
      left join public.medications m on m.id = e.medication_id and m.org_id = ${orgId}
      where e.org_id = ${orgId} and e.patient_id = ${patientId}
      order by e.at desc, e.id desc
    `) as unknown as MedicationEventRow[];

    return rows.map((row) => ({
      id: row.id,
      medicationId: row.medication_id,
      medicationName: row.medication_name ?? null,
      medicationSource: row.medication_source ?? null,
      medicationVerification: row.medication_verification ?? null,
      kind: row.kind,
      at: row.at,
      detail: row.detail,
    }));
  } catch (error) {
    throw new Error(
      `listMedicationEvents failed: ${error instanceof Error ? error.message : 'unknown error'}`,
    );
  }
}
