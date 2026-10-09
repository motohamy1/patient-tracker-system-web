// src/lib/visits/actions.ts — Phase-7 visit mutations (VIS-01/03, AUTH-05).
// Follows the established contract (patients/actions.ts, actions.membership.ts):
// Zod parse FIRST, then the capability check, then the write, then
// revalidatePath — expected failures return a typed RESULT and never throw.
//
// TWO capabilities, two responsibilities (D-09):
//   CAN_SCHEDULE        → create a visit and edit its scheduling fields.
//   CAN_AUTHOR_CLINICAL → advance the workflow and write reason/documentation/
//                         follow-up.
// A receptionist holds the first and not the second; the DB's
// `guard_visit_content` trigger enforces the same rule underneath, so a bug
// here cannot widen clinical authoring (§3.1/§12).
//
// TRIGGER-OWNED (migration 0006): created_by/updated_by/created_at/updated_at
// are never written here.
'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { resolveWorkspaceRole } from '@/lib/auth/workspace';
import { CAN_AUTHOR_CLINICAL, CAN_SCHEDULE, runsCapability, type Capability } from '@/lib/auth/capabilities';
import { createVisitSchema, saveVisitDocumentationSchema, visitIdSchema, visitStageSchema } from '@/lib/visits/schemas';
import { nextStage, type VisitStage } from '@/lib/visits/status';

export type VisitActionResult =
  | { ok: true; visitId?: string }
  | { ok: false; kind: 'invalid' | 'forbidden' | 'error' | 'not-found' };

async function requireStaff(capability: Capability) {
  const resolution = await resolveWorkspaceRole('provider');
  if (resolution.kind !== 'signed-in') return null;
  if (!runsCapability(resolution.role, capability)) return null;
  return resolution;
}

/** The workspace paths a visit change can affect. */
function revalidateVisitSurfaces(patientId: string) {
  revalidatePath('/provider');
  revalidatePath(`/provider/patients/${patientId}/visits`);
  revalidatePath(`/provider/patients/${patientId}/overview`);
}

export async function createVisitAction(input: unknown): Promise<VisitActionResult> {
  const parsed = createVisitSchema.safeParse(input);
  if (!parsed.success) return { ok: false, kind: 'invalid' };

  const actor = await requireStaff(CAN_SCHEDULE);
  if (!actor) return { ok: false, kind: 'forbidden' };

  // A scheduler without clinical authoring may never write a reason, whatever
  // the payload says — and the DB guard refuses it too.
  const authorsClinical = runsCapability(actor.role, CAN_AUTHOR_CLINICAL);

  const supabase = await createClient();
  const { data: patient, error: patientError } = await supabase
    .from('patients')
    .select('id')
    .eq('id', parsed.data.patientId)
    .eq('org_id', actor.orgId)
    .maybeSingle();

  if (patientError) return { ok: false, kind: 'error' };
  if (!patient) return { ok: false, kind: 'not-found' };

  const { data, error } = await supabase
    .from('visits')
    .insert({
      org_id: actor.orgId,
      patient_id: parsed.data.patientId,
      scheduled_at: parsed.data.scheduledAt,
      visit_type: parsed.data.visitType,
      location: parsed.data.location,
      reason: authorsClinical ? parsed.data.reason : null,
      // stage omitted → SQL default 'pre_visit' (0006)
    })
    .select('id')
    .single();

  if (error || !data) return { ok: false, kind: 'error' };

  revalidateVisitSurfaces(parsed.data.patientId);
  return { ok: true, visitId: data.id };
}

/**
 * Advance one visit exactly one stage forward (Pre → During → After). The
 * server owns the sequence: a skip, a repeat or a backward move is rejected
 * rather than silently applied.
 */
export async function advanceVisitStageAction(
  visitId: string,
  stage: VisitStage,
): Promise<VisitActionResult> {
  const idParsed = visitIdSchema.safeParse(visitId);
  const stageParsed = visitStageSchema.safeParse(stage);
  if (!idParsed.success || !stageParsed.success) return { ok: false, kind: 'invalid' };

  const actor = await requireStaff(CAN_AUTHOR_CLINICAL);
  if (!actor) return { ok: false, kind: 'forbidden' };

  const supabase = await createClient();
  const { data: current, error: readError } = await supabase
    .from('visits')
    .select('id, patient_id, stage')
    .eq('id', idParsed.data)
    .eq('org_id', actor.orgId)
    .maybeSingle();

  if (readError) return { ok: false, kind: 'error' };
  if (!current) return { ok: false, kind: 'not-found' };

  if (nextStage(current.stage as VisitStage) !== stageParsed.data) {
    return { ok: false, kind: 'invalid' };
  }

  const { data, error } = await supabase
    .from('visits')
    .update({ stage: stageParsed.data })
    .eq('id', idParsed.data)
    .select('id')
    .maybeSingle();

  if (error) return { ok: false, kind: 'error' };
  if (!data) return { ok: false, kind: 'not-found' };

  revalidateVisitSurfaces(current.patient_id);
  return { ok: true, visitId: data.id };
}

/**
 * Replace the visit's clinical block (reason / documentation / follow-up).
 * The form submits the whole block, so an omitted field is a deliberate clear.
 * Clinician-only; the DB trigger refuses a non-author at the same boundary.
 */
export async function saveVisitDocumentationAction(input: unknown): Promise<VisitActionResult> {
  const parsed = saveVisitDocumentationSchema.safeParse(input);
  if (!parsed.success) return { ok: false, kind: 'invalid' };

  const actor = await requireStaff(CAN_AUTHOR_CLINICAL);
  if (!actor) return { ok: false, kind: 'forbidden' };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('visits')
    .update({
      reason: parsed.data.reason,
      documentation: parsed.data.documentation,
      follow_up: parsed.data.followUp,
      follow_up_at: parsed.data.followUpAt,
    })
    .eq('id', parsed.data.visitId)
    .eq('org_id', actor.orgId)
    .select('id, patient_id')
    .maybeSingle();

  if (error) return { ok: false, kind: 'error' };
  if (!data) return { ok: false, kind: 'not-found' };

  revalidateVisitSurfaces(data.patient_id);
  return { ok: true, visitId: data.id };
}
