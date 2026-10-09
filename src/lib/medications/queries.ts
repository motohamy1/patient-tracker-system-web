// src/lib/medications/queries.ts — the Phase-8 server-side medication layer.
//
// RLS (migration 0007) enforces org scoping; the explicit `.eq('org_id', …)`
// is defense in depth, not the authorization boundary (0005 discipline).
//
// TWO reads, two stories (MED-02): `listMedications` returns the CURRENT state
// the tab renders; `listMedicationEvents` returns the HISTORY the timeline
// projects. The timeline never reads the current row, so a state edit cannot
// rewrite history.
import { createClient } from '@/lib/supabase/server';
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

const MEDICATION_COLUMNS =
  'id, patient_id, name, dose_amount, dose_unit, frequency, route, status, started_at, paused_at, stopped_at, rxnorm_code, source, verification, created_at, updated_at';

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
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('medications')
    .select(MEDICATION_COLUMNS)
    .eq('org_id', orgId)
    .eq('patient_id', patientId)
    .order('started_at', { ascending: false })
    .order('id', { ascending: false });

  if (error) throw new Error(`listMedications failed: ${error.message}`);
  return ((data ?? []) as MedicationRow[]).map(mapMedication);
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
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('medication_events')
    .select('id, medication_id, kind, at, detail, medications(name, source, verification)')
    .eq('org_id', orgId)
    .eq('patient_id', patientId)
    .order('at', { ascending: false })
    .order('id', { ascending: false });

  if (error) throw new Error(`listMedicationEvents failed: ${error.message}`);

  return (
    (data ?? []) as Array<{
      id: string;
      medication_id: string;
      kind: MedicationEventKind;
      at: string;
      detail: unknown;
      medications: { name: string; source: MedicationSource; verification: MedicationVerification } | null;
    }>
  ).map((row) => ({
    id: row.id,
    medicationId: row.medication_id,
    medicationName: row.medications?.name ?? null,
    medicationSource: row.medications?.source ?? null,
    medicationVerification: row.medications?.verification ?? null,
    kind: row.kind,
    at: row.at,
    detail: row.detail,
  }));
}
