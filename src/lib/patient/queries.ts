// src/lib/patient/queries.ts — the patient-side read layer (Phase 13,
// PTH-01; migration 0012's self-or-staff SELECT policies).
//
// The patient's own record is resolved from the VERIFIED SESSION — the
// `patients.user_id` link under RLS — never from client state, a URL
// parameter or localStorage (§3.1). Every read below rides that record.
import { createClient } from '@/lib/supabase/server';
import type { PatientRecord } from '@/lib/patients/queries';

export type PatientSelfRecord = PatientRecord & { orgId: string };

function ageFrom(dob: string): number {
  const born = new Date(dob);
  const now = new Date();
  let age = now.getFullYear() - born.getFullYear();
  const monthDelta = now.getMonth() - born.getMonth();
  if (monthDelta < 0 || (monthDelta === 0 && now.getDate() < born.getDate())) age -= 1;
  return age;
}

const SELF_RECORD_COLUMNS =
  'id, org_id, first_name, last_name, dob, sex, mrn, status, user_id, last_activity_at, created_at, updated_at';

type PatientSelfRow = {
  id: string;
  org_id: string;
  first_name: string;
  last_name: string;
  dob: string;
  sex: PatientRecord['sex'];
  mrn: string;
  status: PatientRecord['status'];
  user_id: string;
  last_activity_at: string | null;
  created_at: string;
  updated_at: string;
};

/**
 * The signed-in patient's own record; null when the account has none.
 *
 * RLS (0005's select-patients-as-self-or-staff policy, extended by 0012)
 * restricts the read to rows whose `user_id` is the authenticated user, so an
 * unbounded select returns exactly this patient's own row — the database is
 * the boundary, this function only shapes the result.
 */
export async function getPatientForCurrentUser(): Promise<PatientSelfRecord | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('patients')
    .select(SELF_RECORD_COLUMNS)
    .not('user_id', 'is', null)
    .limit(2);
  if (error) throw new Error(`getPatientForCurrentUser failed: ${error.message}`);
  const row = (data ?? [])[0] as PatientSelfRow | undefined;
  if (row === undefined) return null;
  return {
    orgId: row.org_id,
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    dob: row.dob,
    sex: row.sex,
    mrn: row.mrn,
    status: row.status,
    userId: row.user_id,
    lastActivityAt: row.last_activity_at ?? row.updated_at,
    age: ageFrom(row.dob),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export type PatientObservationRecord = {
  id: string;
  kind: string;
  valueNumeric: number | null;
  valueSecondary: number | null;
  unit: string | null;
  note: string | null;
  observedAt: string;
  source: string;
};

/** The patient's logged observations, newest first. */
export async function listPatientObservations(
  orgId: string,
  patientId: string,
): Promise<PatientObservationRecord[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('patient_observations')
    .select('id, kind, value_numeric, value_secondary, unit, note, observed_at, source')
    .eq('org_id', orgId)
    .eq('patient_id', patientId)
    .order('observed_at', { ascending: false })
    .order('id', { ascending: false });

  if (error) throw new Error(`listPatientObservations failed: ${error.message}`);
  return (
    (data ?? []) as Array<{
      id: string;
      kind: string;
      value_numeric: number | null;
      value_secondary: number | null;
      unit: string | null;
      note: string | null;
      observed_at: string;
      source: string;
    }>
  ).map((row) => ({
    id: row.id,
    kind: row.kind,
    valueNumeric: row.value_numeric,
    valueSecondary: row.value_secondary,
    unit: row.unit,
    note: row.note,
    observedAt: row.observed_at,
    source: row.source,
  }));
}

export type PatientDocumentRecord = {
  id: string;
  kind: string;
  filename: string;
  createdAt: string;
};

/** The patient's documents (filename + kind; media stays on the storage path). */
export async function listPatientDocuments(
  orgId: string,
  patientId: string,
): Promise<PatientDocumentRecord[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('documents')
    .select('id, kind, filename, created_at')
    .eq('org_id', orgId)
    .eq('patient_id', patientId)
    .order('created_at', { ascending: false })
    .order('id', { ascending: false });

  if (error) throw new Error(`listPatientDocuments failed: ${error.message}`);
  return (
    (data ?? []) as Array<{ id: string; kind: string; filename: string; created_at: string }>
  ).map((row) => ({
    id: row.id,
    kind: row.kind,
    filename: row.filename,
    createdAt: row.created_at,
  }));
}
