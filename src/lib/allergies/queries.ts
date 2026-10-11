// src/lib/allergies/queries.ts — org-scoped allergy reads (ALG-01).
// Allergies are visible to every staff role at the data layer; this module
// adds no visibility rule of its own. The Neon connection is single-owner
// (the ported RLS policies are inert posture notes), so the explicit
// `org_id` predicate below IS the org boundary rather than defense in depth.
import { getSql } from '@/lib/db/neon';
import type { AllergySeverity, AllergyStatus, ClinicalSource, VerificationState } from '@/lib/allergies/status';

export type AllergyRecord = {
  id: string;
  patientId: string;
  allergen: string;
  reaction: string | null;
  severity: AllergySeverity | null;
  status: AllergyStatus;
  notedAt: string;
  notes: string | null;
  source: ClinicalSource;
  verification: VerificationState;
};

type AllergyRow = {
  id: string;
  patient_id: string;
  allergen: string;
  reaction: string | null;
  severity: AllergySeverity | null;
  status: AllergyStatus;
  noted_at: string;
  notes: string | null;
  source: ClinicalSource;
  verification: VerificationState;
};

export async function listAllergies(orgId: string, patientId: string): Promise<AllergyRecord[]> {
  const sql = getSql();
  try {
    const rows = (await sql`
      select id, patient_id, allergen, reaction, severity, status, noted_at, notes, source, verification
      from public.allergies
      where org_id = ${orgId} and patient_id = ${patientId}
      order by noted_at desc, id desc
    `) as unknown as AllergyRow[];

    return rows.map((row) => ({
      id: row.id,
      patientId: row.patient_id,
      allergen: row.allergen,
      reaction: row.reaction,
      severity: row.severity,
      status: row.status,
      notedAt: row.noted_at,
      notes: row.notes,
      source: row.source,
      verification: row.verification,
    }));
  } catch (error) {
    throw new Error(
      `listAllergies failed: ${error instanceof Error ? error.message : 'unknown error'}`,
    );
  }
}
