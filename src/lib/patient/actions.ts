// src/lib/patient/actions.ts — the Quick Log server action (Phase 13,
// PTH-02/03; AUTH-07).
//
// THE patient's only authoring action in the entire product. It requires the
// patient capability (CAN_SUBMIT_OBSERVATION, held by the patient role only),
// resolves the patient from the VERIFIED SESSION, and lets migration 0012's
// guard re-derive the row's `user_id`/`patient_id` from `auth.uid()` — the
// payload cannot name a patient. A staff account has no path here at all: the
// type system and the capability check structurally exclude it (AUTH-07).
'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
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

  const patient = await getPatientForCurrentUser();
  if (patient === null) return { ok: false, kind: 'no-record' };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('patient_observations')
    .insert({
      org_id: patient.orgId,
      patient_id: patient.id,
      // user_id is taken from auth.uid() by the guard trigger, not the client.
      kind: parsed.data.kind,
      value_numeric: parsed.data.kind === 'note' ? null : parsed.data.value,
      value_secondary: parsed.data.kind === 'blood_pressure' ? parsed.data.secondValue : null,
      unit: parsed.data.unit,
      note: parsed.data.note,
      ...(parsed.data.observedAt ? { observed_at: parsed.data.observedAt } : {}),
    })
    .select('id')
    .single();

  if (error || !data) return { ok: false, kind: 'error' };

  revalidatePath('/patient/home');
  return { ok: true, observationId: data.id };
}
