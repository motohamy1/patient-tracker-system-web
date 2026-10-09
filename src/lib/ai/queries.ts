// src/lib/ai/queries.ts — RLS-scoped AI insight reads (Phase 11, AI-02).
//
// Migration 0010's SELECT policy restricts rows to the org's four staff roles;
// this module adds no visibility logic of its own (the 0009 discipline).
import { createClient } from '@/lib/supabase/server';
import type {
  AiInsightRecord,
  InsightEvidenceRef,
  InsightKind,
  InsightProvenance,
  InsightVerification,
  InsightWindow,
  ReviewState,
} from '@/lib/ai/status';

export type { AiInsightRecord };

function parseEvidence(value: unknown): readonly InsightEvidenceRef[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry) => {
    if (typeof entry !== 'object' || entry === null) return [];
    const ref = entry as { table?: unknown; id?: unknown; label?: unknown };
    if (typeof ref.table !== 'string' || typeof ref.id !== 'string') return [];
    return [
      {
        table: ref.table as InsightEvidenceRef['table'],
        id: ref.id,
        label: typeof ref.label === 'string' ? ref.label : ref.id,
      },
    ];
  });
}

function parseWindow(value: unknown): InsightWindow | null {
  if (typeof value !== 'object' || value === null) return null;
  const win = value as { from?: unknown; to?: unknown };
  if (typeof win.from !== 'string' || typeof win.to !== 'string') return null;
  return { from: win.from, to: win.to };
}

/**
 * The patient's insights, grouped for display (attention first), newest
 * generation first inside a group. Pending and reviewed rows both come back —
 * a dismissed insight is a recorded decision and stays visible (AI-02).
 */
export async function listAiInsights(
  orgId: string,
  patientId: string,
): Promise<AiInsightRecord[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('ai_insights')
    .select(
      'id, org_id, patient_id, kind, title, body, evidence, window, provenance, verification, review_state, reviewed_by, reviewed_at, created_at, updated_at',
    )
    .eq('org_id', orgId)
    .eq('patient_id', patientId);

  if (error) throw new Error(`listAiInsights failed: ${error.message}`);
  const rows =
    (data ?? []) as Array<{
      id: string;
      org_id: string;
      patient_id: string;
      kind: InsightKind;
      title: string;
      body: string;
      evidence: unknown;
      window: unknown;
      provenance: InsightProvenance;
      verification: InsightVerification;
      review_state: ReviewState;
      reviewed_by: string | null;
      reviewed_at: string | null;
      created_at: string;
      updated_at: string;
    }>;

  const KIND_ORDER: Record<InsightKind, number> = {
    attention: 0,
    change: 1,
    trend: 2,
    'documentation-gap': 3,
    summary: 4,
  };

  return rows
    .map((row) => ({
      id: row.id,
      orgId: row.org_id,
      patientId: row.patient_id,
      kind: row.kind,
      title: row.title,
      body: row.body,
      evidence: parseEvidence(row.evidence),
      window: parseWindow(row.window),
      provenance: row.provenance,
      verification: row.verification,
      reviewState: row.review_state,
      reviewedBy: row.reviewed_by,
      reviewedAt: row.reviewed_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }))
    .sort(
      (a, b) =>
        KIND_ORDER[a.kind] - KIND_ORDER[b.kind] ||
        b.createdAt.localeCompare(a.createdAt) ||
        b.id.localeCompare(a.id),
    );
}
