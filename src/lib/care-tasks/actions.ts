// src/lib/care-tasks/actions.ts — assignment, archive and the patient's
// completion (Phase 14, TASK-01/02; AUTH-05/07).
//
// Three actions, three actors: the DOCTOR assigns and archives; the PATIENT
// marks a task done. Adherence is never written as a score — it is derived
// from the append-only completion log, and both surfaces read it the same way.
'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { resolveWorkspaceRole } from '@/lib/auth/workspace';
import { CAN_AUTHOR_CLINICAL, CAN_SUBMIT_OBSERVATION, runsCapability } from '@/lib/auth/capabilities';
import { getPatientForCurrentUser } from '@/lib/patient/queries';
import { postTaskMessageAndNotify } from '@/lib/channels/workflow';
import {
  assignCareTaskSchema,
  careTaskTransitionSchema,
  completeCareTaskSchema,
} from '@/lib/care-tasks/schemas';

export type CareTaskActionResult =
  | { ok: true; taskId?: string; completionId?: string }
  | { ok: false; kind: 'invalid' | 'forbidden' | 'not-found' | 'error' };

async function requireDoctor() {
  const resolution = await resolveWorkspaceRole('provider');
  if (resolution.kind !== 'signed-in') return null;
  if (!runsCapability(resolution.role, CAN_AUTHOR_CLINICAL)) return null;
  return resolution;
}

function revalidateTaskSurfaces(patientId: string) {
  revalidatePath(`/provider/patients/${patientId}/overview`);
  revalidatePath('/patient/home');
}

/** A provider assigns a small, concrete care task. */
export async function assignCareTaskAction(input: unknown): Promise<CareTaskActionResult> {
  const parsed = assignCareTaskSchema.safeParse(input);
  if (!parsed.success) return { ok: false, kind: 'invalid' };

  const actor = await requireDoctor();
  if (!actor) return { ok: false, kind: 'forbidden' };

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
    .from('care_tasks')
    .insert({
      org_id: actor.orgId,
      patient_id: parsed.data.patientId,
      title: parsed.data.title,
      detail: parsed.data.detail,
      kind: parsed.data.kind,
      ...(parsed.data.dueAt ? { due_at: parsed.data.dueAt } : {}),
    })
    .select('id, patient_id')
    .single();
  if (error || !data) return { ok: false, kind: 'error' };

  // Phase 16 (CHAN-01/02): the assignment tells the patient through the
  // unified conversation first, then their channels — one story, two
  // transports. A channel failure never fails the assignment.
  await postTaskMessageAndNotify(actor.orgId, data.patient_id as string, parsed.data.title).catch(
    () => undefined,
  );

  revalidateTaskSurfaces(data.patient_id);
  return { ok: true, taskId: data.id };
}

/** Archive a task: it leaves the active list without erasing its history. */
export async function archiveCareTaskAction(input: unknown): Promise<CareTaskActionResult> {
  const parsed = careTaskTransitionSchema.safeParse(input);
  if (!parsed.success) return { ok: false, kind: 'invalid' };

  const actor = await requireDoctor();
  if (!actor) return { ok: false, kind: 'forbidden' };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('care_tasks')
    .update({ status: 'archived' })
    .eq('id', parsed.data.taskId)
    .eq('org_id', actor.orgId)
    .select('id, patient_id')
    .maybeSingle();
  if (error) return { ok: false, kind: 'error' };
  if (!data) return { ok: false, kind: 'not-found' };

  revalidateTaskSurfaces(data.patient_id);
  return { ok: true, taskId: data.id };
}

/**
 * The patient marks a task done. Requires the patient capability and resolves
 * the patient from the verified session; migration 0013's guard re-derives the
 * row's patient from `auth.uid()` and refuses a task that is not theirs or not
 * active. The stated `completed_at` is kept as the patient said it.
 */
export async function completeCareTaskAction(input: unknown): Promise<CareTaskActionResult> {
  const parsed = completeCareTaskSchema.safeParse(input);
  if (!parsed.success) return { ok: false, kind: 'invalid' };

  const resolution = await resolveWorkspaceRole('patient');
  if (resolution.kind !== 'signed-in') return { ok: false, kind: 'forbidden' };
  if (!runsCapability(resolution.role, CAN_SUBMIT_OBSERVATION)) return { ok: false, kind: 'forbidden' };

  const patient = await getPatientForCurrentUser();
  if (patient === null) return { ok: false, kind: 'not-found' };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('care_task_completions')
    .insert({
      org_id: patient.orgId,
      patient_id: patient.id,
      task_id: parsed.data.taskId,
      note: parsed.data.note,
      ...(parsed.data.completedAt ? { completed_at: parsed.data.completedAt } : {}),
    })
    .select('id, patient_id')
    .single();
  if (error || !data) return { ok: false, kind: 'error' };

  revalidateTaskSurfaces(data.patient_id);
  return { ok: true, completionId: data.id };
}
