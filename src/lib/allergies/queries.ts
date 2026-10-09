// src/lib/allergies/queries.ts — RLS-scoped allergy reads (ALG-01).
// Allergies are visible to every staff role at the data layer; this module
// adds no visibility rule of its own.
import { createClient } from '@/lib/supabase/server';
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

export async function listAllergies(orgId: string, patientId: string): Promise<AllergyRecord[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('allergies')
    .select('id, patient_id, allergen, reaction, severity, status, noted_at, notes, source, verification')
    .eq('org_id', orgId)
    .eq('patient_id', patientId)
    .order('noted_at', { ascending: false })
    .order('id', { ascending: false });

  if (error) throw new Error(`listAllergies failed: ${error.message}`);
  return (
    (data ?? []) as Array<{
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
    }>
  ).map((row) => ({
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
}
