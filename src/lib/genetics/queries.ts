// src/lib/genetics/queries.ts — org-scoped genetics reads (ALG-02/ALG-03).
//
// This module performs NO visibility logic of its own: the row-visibility rule
// for genetics (provider_doctor/admin_owner, migration 0009's policy) is a
// ported RLS policy and therefore inert on the single-owner Neon connection.
// The page mirrors the rule with CAN_VIEW_GENETICS ONLY so it can render a
// truthful denial instead of an empty list; the explicit `org_id` predicate
// below is what actually scopes the rows read (§12).
import { getSql } from '@/lib/db/neon';
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

type GeneticFindingRow = {
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
  document_filename: string | null;
};

export async function listGeneticFindings(
  orgId: string,
  patientId: string,
): Promise<GeneticFindingRecord[]> {
  const sql = getSql();
  try {
    const rows = (await sql`
      select g.id, g.patient_id, g.kind, g.gene, g.variant, g.interpretation, g.significance,
             g.reported_at, g.source, g.verification, d.filename as document_filename
      from public.genetics g
      left join public.documents d on d.id = g.document_id and d.org_id = ${orgId}
      where g.org_id = ${orgId} and g.patient_id = ${patientId}
      order by g.reported_at desc, g.id desc
    `) as unknown as GeneticFindingRow[];

    return rows.map((row) => ({
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
      documentName: row.document_filename ?? null,
    }));
  } catch (error) {
    throw new Error(
      `listGeneticFindings failed: ${error instanceof Error ? error.message : 'unknown error'}`,
    );
  }
}
