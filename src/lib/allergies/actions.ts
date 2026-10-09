// src/lib/allergies/actions.ts — allergy record/resolve (ALG-01, AUTH-05).
// Authoring is clinical (CAN_AUTHOR_CLINICAL; provider_doctor at the DB guard).
'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { resolveWorkspaceRole } from '@/lib/auth/workspace';
import { CAN_AUTHOR_CLINICAL, runsCapability, type Capability } from '@/lib/auth/capabilities';
import { recordAllergySchema, resolveAllergySchema } from '@/lib/allergies/schemas';

export type AllergyActionResult =
  | { ok: true; allergyId?: string }
  | { ok: false; kind: 'invalid' | 'forbidden' | 'error' | 'not-found' };

async function requireStaff(capability: Capability) {
  const resolution = await resolveWorkspaceRole('provider');
  if (resolution.kind !== 'signed-in') return null;
  if (!runsCapability(resolution.role, capability)) return null;
  return resolution;
}

function revalidateAllergySurfaces(patientId: string) {
  revalidatePath('/provider');
  revalidatePath(`/provider/patients/${patientId}/allergies`);
  revalidatePath(`/provider/patients/${patientId}/overview`);
}

export async function recordAllergyAction(input: unknown): Promise<AllergyActionResult> {
  const parsed = recordAllergySchema.safeParse(input);
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
    .from('allergies')
    .insert({
      org_id: actor.orgId,
      patient_id: parsed.data.patientId,
      allergen: parsed.data.allergen,
      reaction: parsed.data.reaction,
      severity: parsed.data.severity,
      notes: parsed.data.notes,
      ...(parsed.data.notedAt ? { noted_at: parsed.data.notedAt } : {}),
      // status/verification/source omitted → SQL defaults (active, clinician-verified, clinician)
    })
    .select('id')
    .single();

  if (error || !data) return { ok: false, kind: 'error' };

  revalidateAllergySurfaces(parsed.data.patientId);
  return { ok: true, allergyId: data.id };
}

/** Resolve an allergy (an explicit clinical action; the verb is the label). */
export async function resolveAllergyAction(input: unknown): Promise<AllergyActionResult> {
  const parsed = resolveAllergySchema.safeParse(input);
  if (!parsed.success) return { ok: false, kind: 'invalid' };

  const actor = await requireStaff(CAN_AUTHOR_CLINICAL);
  if (!actor) return { ok: false, kind: 'forbidden' };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('allergies')
    .update({ status: parsed.data.status })
    .eq('id', parsed.data.allergyId)
    .eq('org_id', actor.orgId)
    .select('id, patient_id')
    .maybeSingle();

  if (error) return { ok: false, kind: 'error' };
  if (!data) return { ok: false, kind: 'not-found' };

  revalidateAllergySurfaces(data.patient_id);
  return { ok: true, allergyId: data.id };
}
