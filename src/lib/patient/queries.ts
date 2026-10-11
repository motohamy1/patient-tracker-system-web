// src/lib/patient/queries.ts — the patient-side read layer (Phase 13,
// PTH-01).
//
// The patient's own record is resolved from the VERIFIED SESSION — the
// `patients.user_id` link, matched against the session user — never from
// client state, a URL parameter or localStorage (§3.1). Every read below rides
// that record.
//
// RLS policies are inert on the single-owner Neon connection, so identity
// scoping is an explicit predicate: `getPatientForCurrentUser` matches
// `user_id = <session user>` (the unique partial index makes this at most one
// row), and the downstream reads pin `org_id` + `patient_id` explicitly.
import { getSql } from '@/lib/db/neon';
import { getSessionUser } from '@/lib/auth/session';
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
 * The read is restricted to the row whose `user_id` is the authenticated user
 * (the DB boundary is the identity link, not an org argument — the record
 * itself defines the org). No session → null, never another patient's row.
 */
export async function getPatientForCurrentUser(): Promise<PatientSelfRecord | null> {
  const user = await getSessionUser();
  if (!user) return null;

  const sql = getSql();
  const rows = (await sql`
    select id, org_id, first_name, last_name, dob, sex, mrn, status, user_id,
           last_activity_at, created_at, updated_at
    from public.patients
    where user_id = ${user.id}
    limit 1
  `) as unknown as PatientSelfRow[];

  const row = rows[0];
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
  const sql = getSql();
  const rows = (await sql`
    select id, kind, value_numeric, value_secondary, unit, note, observed_at, source
    from public.patient_observations
    where org_id = ${orgId} and patient_id = ${patientId}
    order by observed_at desc, id desc
  `) as unknown as Array<{
    id: string;
    kind: string;
    value_numeric: number | null;
    value_secondary: number | null;
    unit: string | null;
    note: string | null;
    observed_at: string;
    source: string;
  }>;

  return rows.map((row) => ({
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
  const sql = getSql();
  const rows = (await sql`
    select id, kind, filename, created_at
    from public.documents
    where org_id = ${orgId} and patient_id = ${patientId}
    order by created_at desc, id desc
  `) as unknown as Array<{ id: string; kind: string; filename: string; created_at: string }>;

  return rows.map((row) => ({
    id: row.id,
    kind: row.kind,
    filename: row.filename,
    createdAt: row.created_at,
  }));
}
