// src/lib/genetics/queries.ts — RLS-scoped genetics reads (ALG-02/ALG-03).
//
// This module performs NO visibility logic of its own: migration 0009's SELECT
// policy restricts rows to provider_doctor/admin_owner. The page mirrors that
// with CAN_VIEW_GENETICS ONLY so it can render a truthful denial instead of an
// empty list; the enforcement stays in the database (§12).
import { createClient } from '@/lib/supabase/server';
import type { ClinicalSource, VerificationState } from '@/lib/allergies/status';
import type { GeneticKind, GeneticSignificance } from '@/lib/genetics/status';

export type GeneticFindingRecord = {
  id: string;
  patientId: string;
  kind: GeneticKind;
  gene: string | null;
  variant: string | null;
  interpretation: string | null;
  significance: GeneticSignificance | null;
  reportedAt: string;
  source: ClinicalSource;
  verification: VerificationState;
  documentName: string | null;
};

export async function listGeneticFindings(
  orgId: string,
  patientId: string,
): Promise<GeneticFindingRecord[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('genetics')
    .select(
      'id, patient_id, kind, gene, variant, interpretation, significance, reported_at, source, verification, documents(filename)',
    )
    .eq('org_id', orgId)
    .eq('patient_id', patientId)
    .order('reported_at', { ascending: false })
    .order('id', { ascending: false });

  if (error) throw new Error(`listGeneticFindings failed: ${error.message}`);
  return (
    (data ?? []) as Array<{
      id: string;
      patient_id: string;
      kind: GeneticKind;
      gene: string | null;
      variant: string | null;
      interpretation: string | null;
      significance: GeneticSignificance | null;
      reported_at: string;
      source: ClinicalSource;
      verification: VerificationState;
      documents: { filename: string } | null;
    }>
  ).map((row) => ({
    id: row.id,
    patientId: row.patient_id,
    kind: row.kind,
    gene: row.gene,
    variant: row.variant,
    interpretation: row.interpretation,
    significance: row.significance,
    reportedAt: row.reported_at,
    source: row.source,
    verification: row.verification,
    documentName: row.documents?.filename ?? null,
  }));
}
