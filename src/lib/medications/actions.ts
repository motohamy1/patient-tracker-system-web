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
//
// Writes run through withAppUser(): `touch_medication_provenance` reads
// public.app_uid() for created_by/updated_by and `guard_medication_content`
// resolves the caller's role for the same org from that same setting. Every
// read carries an explicit `org_id` predicate — the Neon connection is
// single-owner, so the ported RLS policies are inert.
'use server';

import { revalidatePath } from 'next/cache';
import { getSql } from '@/lib/db/neon';
import { withAppUser } from '@/lib/db/client';
import { getSessionUser } from '@/lib/auth/session';
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

type TouchedMedicationRow = { id: string; patient_id: string };

async function requireStaff(capability: Capability) {
  const user = await getSessionUser();
  if (!user) return null;
  const resolution = await resolveWorkspaceRole('provider');
  if (resolution.kind !== 'signed-in') return null;
  if (!runsCapability(resolution.role, capability)) return null;
  return { orgId: resolution.orgId, userId: user.id };
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

  try {
    const sql = getSql();
    const patients = (await sql`
      select id from public.patients
      where id = ${parsed.data.patientId} and org_id = ${actor.orgId}
      limit 1
    `) as unknown as { id: string }[];
    if (patients.length === 0) return { ok: false, kind: 'not-found' };

    // status omitted → SQL default 'active'; the trigger writes the
    // `started` history row in the same statement. started_at defaults to
    // now() when the caller did not state one.
    const created = await withAppUser(actor.userId, async (tx) => {
      const { rows } = await tx.query<{ id: string }>(
        `insert into public.medications
           (org_id, patient_id, name, dose_amount, dose_unit, frequency, route, started_at)
         values ($1, $2, $3, $4, $5, $6, $7, coalesce($8, now()))
         returning id`,
        [
          actor.orgId,
          parsed.data.patientId,
          parsed.data.name,
          parsed.data.doseAmount,
          parsed.data.doseUnit,
          parsed.data.frequency,
          parsed.data.route,
          parsed.data.startedAt ?? null,
        ],
      );
      return rows[0] ?? null;
    });

    if (!created) return { ok: false, kind: 'error' };

    revalidateMedicationSurfaces(parsed.data.patientId);
    return { ok: true, medicationId: created.id };
  } catch {
    return { ok: false, kind: 'error' };
  }
}

/** Change the structured details of an existing medication (a `changed` event). */
export async function changeMedicationAction(input: unknown): Promise<MedicationActionResult> {
  const parsed = changeMedicationSchema.safeParse(input);
  if (!parsed.success) return { ok: false, kind: 'invalid' };

  const actor = await requireStaff(CAN_AUTHOR_CLINICAL);
  if (!actor) return { ok: false, kind: 'forbidden' };

  try {
    const updated = await withAppUser(actor.userId, async (tx) => {
      const { rows } = await tx.query<TouchedMedicationRow>(
        `update public.medications
         set name = $1, dose_amount = $2, dose_unit = $3, frequency = $4, route = $5
         where id = $6 and org_id = $7
         returning id, patient_id`,
        [
          parsed.data.name,
          parsed.data.doseAmount,
          parsed.data.doseUnit,
          parsed.data.frequency,
          parsed.data.route,
          parsed.data.medicationId,
          actor.orgId,
        ],
      );
      return rows[0] ?? null;
    });

    if (!updated) return { ok: false, kind: 'not-found' };

    revalidateMedicationSurfaces(updated.patient_id);
    return { ok: true, medicationId: updated.id };
  } catch {
    return { ok: false, kind: 'error' };
  }
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

  try {
    const sql = getSql();
    const current = (await sql`
      select id, patient_id, status from public.medications
      where id = ${parsed.data.medicationId} and org_id = ${actor.orgId}
      limit 1
    `) as unknown as { id: string; patient_id: string; status: MedicationStatus }[];
    if (current.length === 0) return { ok: false, kind: 'not-found' };
    if (!canTransition(current[0].status, to)) return { ok: false, kind: 'invalid' };

    const stamp = new Date().toISOString();
    const updated = await withAppUser(actor.userId, async (tx) => {
      const { rows } =
        to === 'paused'
          ? await tx.query<TouchedMedicationRow>(
              `update public.medications set status = $1, paused_at = $2
               where id = $3 and org_id = $4
               returning id, patient_id`,
              [to, stamp, parsed.data.medicationId, actor.orgId],
            )
          : to === 'stopped'
            ? await tx.query<TouchedMedicationRow>(
                `update public.medications set status = $1, stopped_at = $2
                 where id = $3 and org_id = $4
                 returning id, patient_id`,
                [to, stamp, parsed.data.medicationId, actor.orgId],
              )
            : await tx.query<TouchedMedicationRow>(
                `update public.medications set status = $1, paused_at = null, stopped_at = null
                 where id = $2 and org_id = $3
                 returning id, patient_id`,
                [to, parsed.data.medicationId, actor.orgId],
              );
      return rows[0] ?? null;
    });

    if (!updated) return { ok: false, kind: 'not-found' };

    revalidateMedicationSurfaces(updated.patient_id);
    return { ok: true, medicationId: updated.id };
  } catch {
    return { ok: false, kind: 'error' };
  }
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
