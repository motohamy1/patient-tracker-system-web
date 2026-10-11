// src/lib/patient/actions.ts — the Quick Log server action (Phase 13,
// PTH-02/03; AUTH-07).
//
// THE patient's only authoring action in the entire product. It requires the
// patient capability (CAN_SUBMIT_OBSERVATION, held by the patient role only),
// resolves the patient from the VERIFIED SESSION, and lets migration 0012's
// guard re-derive the row's `user_id`/`patient_id` from `app_uid()` — the
// payload cannot name a patient. A staff account has no path here at all: the
// type system and the capability check structurally exclude it (AUTH-07).
//
// The write runs through withAppUser(user.id, …) so `public.app_uid()` is the
// verified session user — that is what the guard compares against the
// patient's own `user_id`.
'use server';

import { revalidatePath } from 'next/cache';
import { withAppUser } from '@/lib/db/client';
import { getSessionUser } from '@/lib/auth/session';
import { resolveWorkspaceRole } from '@/lib/auth/workspace';
import { CAN_SUBMIT_OBSERVATION, runsCapability } from '@/lib/auth/capabilities';
import { getPatientForCurrentUser } from '@/lib/patient/queries';
import { logObservationSchema } from '@/lib/patient/schemas';

export type ObservationActionResult =
  | { ok: true; observationId?: string }
  | { ok: false; kind: 'invalid' | 'forbidden' | 'no-record' | 'error' };

export async function logObservationAction(input: unknown): Promise<ObservationActionResult> {
  const parsed = logObservationSchema.safeParse(input);
  if (!parsed.success) return { ok: false, kind: 'invalid' };

  // The patient group + the patient-only capability: two independent refusals.
  const resolution = await resolveWorkspaceRole('patient');
  if (resolution.kind !== 'signed-in') return { ok: false, kind: 'forbidden' };
  if (!runsCapability(resolution.role, CAN_SUBMIT_OBSERVATION)) return { ok: false, kind: 'forbidden' };

  const user = await getSessionUser();
  if (!user) return { ok: false, kind: 'forbidden' };

  const patient = await getPatientForCurrentUser();
  if (patient === null) return { ok: false, kind: 'no-record' };

  let observationId: string | undefined;
  try {
    observationId = await withAppUser(user.id, async (tx) => {
      const { rows } = await tx.query<{ id: string }>(
        `insert into public.patient_observations
           (org_id, patient_id, kind, value_numeric, value_secondary, unit, note, observed_at)
         values ($1, $2, $3, $4, $5, $6, $7, coalesce($8::timestamptz, now()))
         returning id`,
        [
          patient.orgId,
          patient.id,
          parsed.data.kind,
          parsed.data.kind === 'note' ? null : parsed.data.value,
          parsed.data.kind === 'blood_pressure' ? parsed.data.secondValue : null,
          parsed.data.unit,
          parsed.data.note,
          parsed.data.observedAt ?? null,
          // user_id is taken from app_uid() by the guard trigger, not the client.
        ],
      );
      return rows[0]?.id;
    });
  } catch {
    return { ok: false, kind: 'error' };
  }

  if (!observationId) return { ok: false, kind: 'error' };

  revalidatePath('/patient/home');
  return { ok: true, observationId };
}
