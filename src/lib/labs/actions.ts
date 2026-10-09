// src/lib/medications/actions.ts — the medication lifecycle (MED-01, AUTH-05).
//
// Every action requires CAN_AUTHOR_CLINICAL server-side (D-09: provider_doctor
// — authoring orders/results is clinical). Results are INSERT-only clinical
// facts; migration 0008's trigger flips the parent order to `resulted` in the
// SAME statement, so status and facts cannot drift.
'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { resolveWorkspaceRole } from '@/lib/auth/workspace';
import { CAN_AUTHOR_CLINICAL, runsCapability, type Capability } from '@/lib/auth/capabilities';
import {
  labOrderIdSchema,
  orderLabSchema,
  recordLabResultSchema,
} from '@/lib/labs/schemas';

export type LabActionResult =
  | { ok: true; orderId?: string; resultId?: string }
  | { ok: false; kind: 'invalid' | 'forbidden' | 'error' | 'not-found' };

async function requireStaff(capability: Capability) {
  const resolution = await resolveWorkspaceRole('provider');
  if (resolution.kind !== 'signed-in') return null;
  if (!runsCapability(resolution.role, capability)) return null;
  return resolution;
}

function revalidateLabSurfaces(patientId: string) {
  revalidatePath('/provider');
  revalidatePath(`/provider/patients/${patientId}/labs`);
  revalidatePath(`/provider/patients/${patientId}/overview`);
}

export async function orderLabAction(input: unknown): Promise<LabActionResult> {
  const parsed = orderLabSchema.safeParse(input);
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
    .from('lab_orders')
    .insert({
      org_id: actor.orgId,
      patient_id: parsed.data.patientId,
      name: parsed.data.name,
      notes: parsed.data.notes,
      ...(parsed.data.orderedAt ? { ordered_at: parsed.data.orderedAt } : {}),
      // status omitted → SQL default 'ordered'
    })
    .select('id')
    .single();

  if (error || !data) return { ok: false, kind: 'error' };

  revalidateLabSurfaces(parsed.data.patientId);
  return { ok: true, orderId: data.id };
}

export async function recordLabResultAction(input: unknown): Promise<LabActionResult> {
  const parsed = recordLabResultSchema.safeParse(input);
  if (!parsed.success) return { ok: false, kind: 'invalid' };

  const actor = await requireStaff(CAN_AUTHOR_CLINICAL);
  if (!actor) return { ok: false, kind: 'forbidden' };

  const supabase = await createClient();
  // The order identifies the patient; RLS scopes the read to this org.
  const { data: order, error: orderError } = await supabase
    .from('lab_orders')
    .select('id, org_id, patient_id, status')
    .eq('id', parsed.data.orderId)
    .eq('org_id', actor.orgId)
    .maybeSingle();

  if (orderError) return { ok: false, kind: 'error' };
  if (!order) return { ok: false, kind: 'not-found' };
  if (order.status === 'cancelled') return { ok: false, kind: 'invalid' };

  const { data, error } = await supabase
    .from('lab_results')
    .insert({
      org_id: order.org_id,
      patient_id: order.patient_id,
      order_id: order.id,
      analyte: parsed.data.analyte,
      value: parsed.data.value,
      unit: parsed.data.unit,
      reference_range: parsed.data.referenceRange,
      flag: parsed.data.flag,
      ...(parsed.data.resultedAt ? { resulted_at: parsed.data.resultedAt } : {}),
    })
    .select('id')
    .single();

  if (error || !data) return { ok: false, kind: 'error' };

  revalidateLabSurfaces(order.patient_id);
  return { ok: true, orderId: order.id, resultId: data.id };
}

/** An explicit cancellation of an order (the clinical verb is the label). */
export async function cancelLabOrderAction(orderId: string): Promise<LabActionResult> {
  const parsed = labOrderIdSchema.safeParse(orderId);
  if (!parsed.success) return { ok: false, kind: 'invalid' };

  const actor = await requireStaff(CAN_AUTHOR_CLINICAL);
  if (!actor) return { ok: false, kind: 'forbidden' };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('lab_orders')
    .update({ status: 'cancelled' })
    .eq('id', parsed.data)
    .eq('org_id', actor.orgId)
    .select('id, patient_id')
    .maybeSingle();

  if (error) return { ok: false, kind: 'error' };
  if (!data) return { ok: false, kind: 'not-found' };

  revalidateLabSurfaces(data.patient_id);
  return { ok: true, orderId: data.id };
}
