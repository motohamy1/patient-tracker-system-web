// src/lib/ai/actions.ts — AI insight generation and review (Phase 11,
// AI-01/02, AUTH-05).
//
// Generation reads ONLY the rows the workspace already reads (visits,
// medications, labs, imaging, allergies), projects them through the PURE
// generator in generate.ts, and stores the result as unreviewed
// system-derived insight rows. Review is a separate, attributable decision
// (provider_doctor + nurse, mirrored by CAN_REVIEW_AI); the guard trigger in
// 0010 takes reviewer identity from the session, never from this payload.
'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { resolveWorkspaceRole } from '@/lib/auth/workspace';
import { CAN_AUTHOR_CLINICAL, CAN_REVIEW_AI, runsCapability, type Capability } from '@/lib/auth/capabilities';
import { listAllergies } from '@/lib/allergies/queries';
import { listLabOrders, listLabResults } from '@/lib/labs/queries';
import { listMedications, listMedicationEvents } from '@/lib/medications/queries';
import { listImagingOrders, listImagingResults } from '@/lib/imaging/queries';
import { listVisits } from '@/lib/visits/queries';
import { generateInsights } from '@/lib/ai/generate';
import { generateInsightsSchema, reviewInsightSchema } from '@/lib/ai/schemas';

export type AiInsightActionResult =
  | { ok: true; generated?: number; insightId?: string; reviewState?: 'accepted' | 'dismissed' }
  | { ok: false; kind: 'invalid' | 'forbidden' | 'not-found' | 'error' };

async function requireStaff(capability: Capability) {
  const resolution = await resolveWorkspaceRole('provider');
  if (resolution.kind !== 'signed-in') return null;
  if (!runsCapability(resolution.role, capability)) return null;
  return resolution;
}

function revalidateAiSurfaces(patientId: string) {
  revalidatePath(`/provider/patients/${patientId}/ai-analytics`);
  revalidatePath(`/provider/patients/${patientId}/overview`);
}

/**
 * Generate the patient's insights from the real record. Supersedes the
 * patient's still-PENDING rows (housekeeping, audited) and leaves reviewed
 * decisions untouched. Deterministic: the same record yields the same rows.
 */
export async function generateAiInsightsAction(input: unknown): Promise<AiInsightActionResult> {
  const parsed = generateInsightsSchema.safeParse(input);
  if (!parsed.success) return { ok: false, kind: 'invalid' };

  const actor = await requireStaff(CAN_AUTHOR_CLINICAL);
  if (!actor) return { ok: false, kind: 'forbidden' };

  const [visits, medications, medicationEvents, allergies, labOrders, labResults, imagingOrders, imagingResults] =
    await Promise.all([
      listVisits(actor.orgId, parsed.data.patientId),
      listMedications(actor.orgId, parsed.data.patientId),
      listMedicationEvents(actor.orgId, parsed.data.patientId),
      listAllergies(actor.orgId, parsed.data.patientId),
      listLabOrders(actor.orgId, parsed.data.patientId),
      listLabResults(actor.orgId, parsed.data.patientId),
      listImagingOrders(actor.orgId, parsed.data.patientId),
      listImagingResults(actor.orgId, parsed.data.patientId),
    ]);

  const insights = generateInsights(
    {
      visits,
      medications,
      medicationEvents,
      allergies,
      labOrders,
      labResults,
      imagingOrders,
      imagingResults,
    },
    new Date(),
  );

  const supabase = await createClient();

  // The patient must exist in this org (RLS-scoped read; no-leak on miss).
  const { data: patient, error: patientError } = await supabase
    .from('patients')
    .select('id')
    .eq('id', parsed.data.patientId)
    .eq('org_id', actor.orgId)
    .maybeSingle();
  if (patientError) return { ok: false, kind: 'error' };
  if (!patient) return { ok: false, kind: 'not-found' };

  // Housekeeping: the definer RPC drops only this patient's pending rows.
  const { error: supersedeError } = await supabase.rpc('supersede_pending_ai_insights', {
    p_patient_id: parsed.data.patientId,
  });
  if (supersedeError) return { ok: false, kind: 'error' };

  if (insights.length > 0) {
    const { error: insertError } = await supabase.from('ai_insights').insert(
      insights.map((insight) => ({
        org_id: actor.orgId,
        patient_id: parsed.data.patientId,
        kind: insight.kind,
        title: insight.title,
        body: insight.body,
        // jsonb wants mutable shapes; the generator's readonly arrays are
        // copied so the stored value is plain JSON.
        evidence: insight.evidence.map((ref) => ({ ...ref })),
        window: insight.window !== null ? { ...insight.window } : null,
        // provenance/verification/review_state omitted → 0010's INSERT guard
        // normalizes them to system-derived / ai-extracted / pending.
      })),
    );
    if (insertError) return { ok: false, kind: 'error' };
  }

  revalidateAiSurfaces(parsed.data.patientId);
  return { ok: true, generated: insights.length };
}

/**
 * Record a clinician's decision about an unreviewed insight (AI-02). The
 * database takes reviewed_by/reviewed_at from the session and refuses any
 * content change; this action carries only the decision.
 */
export async function reviewAiInsightAction(input: unknown): Promise<AiInsightActionResult> {
  const parsed = reviewInsightSchema.safeParse(input);
  if (!parsed.success) return { ok: false, kind: 'invalid' };

  const actor = await requireStaff(CAN_REVIEW_AI);
  if (!actor) return { ok: false, kind: 'forbidden' };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('ai_insights')
    .update({ review_state: parsed.data.decision })
    .eq('id', parsed.data.insightId)
    .eq('org_id', actor.orgId)
    .select('id, patient_id')
    .maybeSingle();

  if (error) return { ok: false, kind: 'error' };
  if (!data) return { ok: false, kind: 'not-found' };

  revalidateAiSurfaces(data.patient_id);
  return { ok: true, insightId: data.id, reviewState: parsed.data.decision };
}
