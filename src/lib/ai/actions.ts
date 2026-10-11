// src/lib/ai/actions.ts — AI insight generation and review (Phase 11,
// AI-01/02, AUTH-05).
//
// Generation reads ONLY the rows the workspace already reads (visits,
// medications, labs, imaging, allergies), projects them through the PURE
// generator in generate.ts, and stores the result as unreviewed
// system-derived insight rows. Review is a separate, attributable decision
// (provider_doctor + nurse, mirrored by CAN_REVIEW_AI); the guard triggers
// take reviewer identity from the session (`app.user_id`, set by
// withAppUser), never from this payload. Writes therefore run inside
// withAppUser so the DB triggers can attribute the actor.
'use server';

import { revalidatePath } from 'next/cache';
import { getSql } from '@/lib/db/neon';
import { withAppUser } from '@/lib/db/client';
import { getSessionUser } from '@/lib/auth/session';
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
  const user = await getSessionUser();
  if (!user) return null;
  return { orgId: resolution.orgId, userId: user.id };
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

  const sql = getSql();

  // The patient must exist in this org (explicit org scope; no-leak on miss).
  let patient: { id: string } | null = null;
  try {
    const rows = (await sql`
      select id from public.patients
      where id = ${parsed.data.patientId} and org_id = ${actor.orgId}
    `) as unknown as { id: string }[];
    patient = rows[0] ?? null;
  } catch {
    return { ok: false, kind: 'error' };
  }
  if (patient === null) return { ok: false, kind: 'not-found' };

  // Housekeeping + storage run under the actor's session: the definer RPC and
  // the INSERT trigger both read identity from `app.user_id`.
  try {
    await withAppUser(actor.userId, async (tx) => {
      await tx.query('select public.supersede_pending_ai_insights($1)', [parsed.data.patientId]);

      if (insights.length > 0) {
        // Content columns only: provenance/verification/review_state are
        // omitted → the INSERT guard normalizes them to
        // system-derived / ai-extracted / pending.
        const columns = ['org_id', 'patient_id', 'kind', 'title', 'body', 'evidence', '"window"'];
        const values: unknown[] = [];
        const tuples = insights.map((insight, index) => {
          const base = index * columns.length;
          values.push(
            actor.orgId,
            parsed.data.patientId,
            insight.kind,
            insight.title,
            insight.body,
            // jsonb wants a serialized shape; the generator's readonly arrays
            // are stringified so the stored value is plain JSON.
            JSON.stringify(insight.evidence),
            insight.window !== null ? JSON.stringify(insight.window) : null,
          );
          return `(${Array.from({ length: columns.length }, (_, offset) => `$${base + offset + 1}`).join(', ')})`;
        });
        await tx.query(
          `insert into public.ai_insights (${columns.join(', ')}) values ${tuples.join(', ')}`,
          values,
        );
      }
    });
  } catch {
    return { ok: false, kind: 'error' };
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

  let updated: { id: string; patient_id: string } | null = null;
  try {
    updated = await withAppUser(actor.userId, async (tx) => {
      const { rows } = await tx.query<{ id: string; patient_id: string }>(
        `update public.ai_insights set review_state = $1
         where id = $2 and org_id = $3
         returning id, patient_id`,
        [parsed.data.decision, parsed.data.insightId, actor.orgId],
      );
      return rows[0] ?? null;
    });
  } catch {
    return { ok: false, kind: 'error' };
  }
  if (updated === null) return { ok: false, kind: 'not-found' };

  revalidateAiSurfaces(updated.patient_id);
  return { ok: true, insightId: updated.id, reviewState: parsed.data.decision };
}
