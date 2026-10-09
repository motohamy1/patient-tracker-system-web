// src/lib/medications/actions.ts — the medication lifecycle (MED-01, AUTH-05).
//
// Every action requires CAN_AUTHOR_CLINICAL server-side (D-09: provider_doctor
// — a prescription is clinical authoring) and relies on migration 0007's
// trigger to write the matching `medication_events` row in the SAME statement,
// so the current state and the history are atomic by construction: an action
// here cannot update the row without the trail recording it, and cannot write
// a trail row without the state change.
//
// Illegal transitions are rejected BEFORE the write (MEDICATION_STATUS_
// TRANSITIONS is the one table both the server and the UI consult), so an
// invalid move is a typed `invalid` result, never a silent no-op.
'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { resolveWorkspaceRole } from '@/lib/auth/workspace';
import { CAN_AUTHOR_CLINICAL, runsCapability, type Capability } from '@/lib/auth/capabilities';
import {
  changeMedicationSchema,
  medicationTransitionSchema,
  startMedicationSchema,
} from '@/lib/medications/schemas';
import { canTransition, type MedicationStatus } from '@/lib/medications/status';

export type MedicationActionResult =
  | { ok: true; medicationId?: string }
  | { ok: false; kind: 'invalid' | 'forbidden' | 'error' | 'not-found' };

async function requireStaff(capability: Capability) {
  const resolution = await resolveWorkspaceRole('provider');
  if (resolution.kind !== 'signed-in') return null;
  if (!runsCapability(resolution.role, capability)) return null;
  return resolution;
}

function revalidateMedicationSurfaces(patientId: string) {
  revalidatePath('/provider');
  revalidatePath(`/provider/patients/${patientId}/medications`);
  revalidatePath(`/provider/patients/${patientId}/overview`);
}

export async function startMedicationAction(input: unknown): Promise<MedicationActionResult> {
  const parsed = startMedicationSchema.safeParse(input);
  if (!parsed.success) return { ok: false, kind: 'invalid' };

  const actor = await requireStaff(CAN_AUTHOR_CLINICAL);
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
    .from('medications')
    .insert({
      org_id: actor.orgId,
      patient_id: parsed.data.patientId,
      name: parsed.data.name,
      dose_amount: parsed.data.doseAmount,
      dose_unit: parsed.data.doseUnit,
      frequency: parsed.data.frequency,
      route: parsed.data.route,
      ...(parsed.data.startedAt ? { started_at: parsed.data.startedAt } : {}),
      // status omitted → SQL default 'active'; the trigger writes the
      // `started` history row in the same statement.
    })
    .select('id')
    .single();

  if (error || !data) return { ok: false, kind: 'error' };

  revalidateMedicationSurfaces(parsed.data.patientId);
  return { ok: true, medicationId: data.id };
}

/** Change the structured details of an existing medication (a `changed` event). */
export async function changeMedicationAction(input: unknown): Promise<MedicationActionResult> {
  const parsed = changeMedicationSchema.safeParse(input);
  if (!parsed.success) return { ok: false, kind: 'invalid' };

  const actor = await requireStaff(CAN_AUTHOR_CLINICAL);
  if (!actor) return { ok: false, kind: 'forbidden' };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('medications')
    .update({
      name: parsed.data.name,
      dose_amount: parsed.data.doseAmount,
      dose_unit: parsed.data.doseUnit,
      frequency: parsed.data.frequency,
      route: parsed.data.route,
    })
    .eq('id', parsed.data.medicationId)
    .eq('org_id', actor.orgId)
    .select('id, patient_id')
    .maybeSingle();

  if (error) return { ok: false, kind: 'error' };
  if (!data) return { ok: false, kind: 'not-found' };

  revalidateMedicationSurfaces(data.patient_id);
  return { ok: true, medicationId: data.id };
}

/**
 * A status transition (pause / resume / stop). Read the current status first,
 * consult the ONE transition table, then write — an illegal move is rejected
 * rather than silently applied or silently ignored.
 */
async function transition(
  input: unknown,
  to: MedicationStatus,
): Promise<MedicationActionResult> {
  const parsed = medicationTransitionSchema.safeParse(input);
  if (!parsed.success) return { ok: false, kind: 'invalid' };

  const actor = await requireStaff(CAN_AUTHOR_CLINICAL);
  if (!actor) return { ok: false, kind: 'forbidden' };

  const supabase = await createClient();
  const { data: current, error: readError } = await supabase
    .from('medications')
    .select('id, patient_id, status')
    .eq('id', parsed.data.medicationId)
    .eq('org_id', actor.orgId)
    .maybeSingle();

  if (readError) return { ok: false, kind: 'error' };
  if (!current) return { ok: false, kind: 'not-found' };
  if (!canTransition(current.status as MedicationStatus, to)) return { ok: false, kind: 'invalid' };

  const timestamps =
    to === 'paused'
      ? { paused_at: new Date().toISOString() }
      : to === 'stopped'
        ? { stopped_at: new Date().toISOString() }
        : { paused_at: null, stopped_at: null };

  const { data, error } = await supabase
    .from('medications')
    .update({ status: to, ...timestamps })
    .eq('id', parsed.data.medicationId)
    .select('id, patient_id')
    .maybeSingle();

  if (error) return { ok: false, kind: 'error' };
  if (!data) return { ok: false, kind: 'not-found' };

  revalidateMedicationSurfaces(data.patient_id);
  return { ok: true, medicationId: data.id };
}

export async function pauseMedicationAction(input: unknown): Promise<MedicationActionResult> {
  return transition(input, 'paused');
}

export async function resumeMedicationAction(input: unknown): Promise<MedicationActionResult> {
  return transition(input, 'active');
}

export async function stopMedicationAction(input: unknown): Promise<MedicationActionResult> {
  return transition(input, 'stopped');
}
