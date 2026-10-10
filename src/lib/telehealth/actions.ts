// src/lib/telehealth/actions.ts — the consultation workflow (Phase 17,
// ticket 17-02; TH-01/03).
//
// Start, complete, cancel — all doctor-only (CAN_AUTHOR_CLINICAL), all
// re-deriving the org from the session and re-reading the visit under RLS.
// The visit stays the encounter of record: completing a telehealth
// consultation writes the SAME documentation block an in-person visit uses
// (TH-03) — there is one model, not two.
'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { resolveWorkspaceRole } from '@/lib/auth/workspace';
import { CAN_AUTHOR_CLINICAL, runsCapability } from '@/lib/auth/capabilities';
import {
  cancelConsultationSchema,
  completeConsultationSchema,
  startConsultationSchema,
} from '@/lib/telehealth/schemas';

export type TelehealthActionResult =
  | { ok: true; sessionId?: string; visitId?: string }
  | { ok: false; kind: 'invalid' | 'forbidden' | 'error' | 'not-found' };

function revalidateConsultationSurfaces(patientId: string, visitId: string) {
  revalidatePath('/provider/consultations');
  revalidatePath(`/provider/consultations/${visitId}`);
  revalidatePath(`/provider/patients/${patientId}/visits/${visitId}`);
  revalidatePath(`/provider/patients/${patientId}/visits`);
  revalidatePath(`/provider/patients/${patientId}/overview`);
  revalidatePath('/patient/home');
  revalidatePath('/patient/consultation');
}

async function requireDoctor() {
  const resolution = await resolveWorkspaceRole('provider');
  if (resolution.kind !== 'signed-in') return null;
  if (!runsCapability(resolution.role, CAN_AUTHOR_CLINICAL)) return null;
  return resolution;
}

/**
 * Start (or resume) the consultation for an appointment. A visit that
 * already has an ACTIVE session resumes it — never a duplicate row — and the
 * visit advances to `during_visit` exactly once.
 */
export async function startConsultationAction(input: unknown): Promise<TelehealthActionResult> {
  const parsed = startConsultationSchema.safeParse(input);
  if (!parsed.success) return { ok: false, kind: 'invalid' };

  const actor = await requireDoctor();
  if (!actor) return { ok: false, kind: 'forbidden' };

  const supabase = await createClient();
  const { data: visit, error: visitError } = await supabase
    .from('visits')
    .select('id, patient_id, stage')
    .eq('id', parsed.data.visitId)
    .eq('org_id', actor.orgId)
    .maybeSingle();

  if (visitError) return { ok: false, kind: 'error' };
  if (!visit) return { ok: false, kind: 'not-found' };

  // Resume an active session rather than creating a second one.
  const { data: existing, error: existingError } = await supabase
    .from('telehealth_sessions')
    .select('id, status')
    .eq('org_id', actor.orgId)
    .eq('visit_id', parsed.data.visitId)
    .in('status', ['scheduled', 'in_progress'])
    .maybeSingle();

  if (existingError) return { ok: false, kind: 'error' };
  if (existing) {
    // A scheduled-but-unstarted session moves to in_progress.
    if (existing.status === 'scheduled') {
      const { error: advanceError } = await supabase
        .from('telehealth_sessions')
        .update({ status: 'in_progress' })
        .eq('id', existing.id)
        .eq('org_id', actor.orgId);
      if (advanceError) return { ok: false, kind: 'error' };
    }
  } else {
    const { data: created, error: createError } = await supabase
      .from('telehealth_sessions')
      .insert({
        org_id: actor.orgId,
        patient_id: visit.patient_id as string,
        visit_id: parsed.data.visitId,
        // status omitted → SQL default 'scheduled', then advanced below.
      })
      .select('id')
      .single();
    if (createError || !created) return { ok: false, kind: 'error' };

    const { error: advanceError } = await supabase
      .from('telehealth_sessions')
      .update({ status: 'in_progress' })
      .eq('id', created.id)
      .eq('org_id', actor.orgId);
    if (advanceError) return { ok: false, kind: 'error' };
  }

  // The appointment is now being held: the visit advances to During Visit.
  if ((visit.stage as string) === 'pre_visit') {
    const { error: stageError } = await supabase
      .from('visits')
      .update({ stage: 'during_visit' })
      .eq('id', parsed.data.visitId)
      .eq('org_id', actor.orgId);
    if (stageError) return { ok: false, kind: 'error' };
  }

  revalidateConsultationSurfaces(visit.patient_id as string, parsed.data.visitId);
  return { ok: true, visitId: parsed.data.visitId };
}

/**
 * Complete the consultation: the session closes and the visit's clinical
 * block is written through the same row an in-person visit uses. The visit
 * then reads After Visit with the documentation in place (TH-03).
 */
export async function completeConsultationAction(input: unknown): Promise<TelehealthActionResult> {
  const parsed = completeConsultationSchema.safeParse(input);
  if (!parsed.success) return { ok: false, kind: 'invalid' };

  const actor = await requireDoctor();
  if (!actor) return { ok: false, kind: 'forbidden' };

  const supabase = await createClient();
  const { data: visit, error: visitError } = await supabase
    .from('visits')
    .select('id, patient_id')
    .eq('id', parsed.data.visitId)
    .eq('org_id', actor.orgId)
    .maybeSingle();

  if (visitError) return { ok: false, kind: 'error' };
  if (!visit) return { ok: false, kind: 'not-found' };

  // The session must be in progress to complete — the guard re-checks.
  const { error: sessionError } = await supabase
    .from('telehealth_sessions')
    .update({ status: 'completed' })
    .eq('org_id', actor.orgId)
    .eq('visit_id', parsed.data.visitId)
    .eq('status', 'in_progress')
    .select('id')
    .maybeSingle();

  if (sessionError) return { ok: false, kind: 'error' };

  // The visit's clinical block — the same write an in-person visit makes.
  const { error: visitUpdateError } = await supabase
    .from('visits')
    .update({
      reason: parsed.data.reason ?? null,
      documentation: parsed.data.documentation ?? null,
      follow_up: parsed.data.followUp ?? null,
      follow_up_at: parsed.data.followUpAt ?? null,
      stage: 'after_visit',
    })
    .eq('id', parsed.data.visitId)
    .eq('org_id', actor.orgId)
    .select('id')
    .maybeSingle();

  if (visitUpdateError) return { ok: false, kind: 'error' };

  revalidateConsultationSurfaces(visit.patient_id as string, parsed.data.visitId);
  return { ok: true, visitId: parsed.data.visitId };
}

/** Cancel a consultation; the appointment stays in the record with its reason. */
export async function cancelConsultationAction(input: unknown): Promise<TelehealthActionResult> {
  const parsed = cancelConsultationSchema.safeParse(input);
  if (!parsed.success) return { ok: false, kind: 'invalid' };

  const actor = await requireDoctor();
  if (!actor) return { ok: false, kind: 'forbidden' };

  const supabase = await createClient();
  const { data: visit, error: visitError } = await supabase
    .from('visits')
    .select('id, patient_id')
    .eq('id', parsed.data.visitId)
    .eq('org_id', actor.orgId)
    .maybeSingle();

  if (visitError) return { ok: false, kind: 'error' };
  if (!visit) return { ok: false, kind: 'not-found' };

  const { error } = await supabase
    .from('telehealth_sessions')
    .update({ status: 'cancelled', cancellation_reason: parsed.data.reason })
    .eq('org_id', actor.orgId)
    .eq('visit_id', parsed.data.visitId)
    .in('status', ['scheduled', 'in_progress'])
    .select('id')
    .maybeSingle();

  if (error) return { ok: false, kind: 'error' };

  revalidateConsultationSurfaces(visit.patient_id as string, parsed.data.visitId);
  return { ok: true, visitId: parsed.data.visitId };
}
