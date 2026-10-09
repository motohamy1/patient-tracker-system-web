// src/lib/imaging/actions.ts — the imaging lifecycle (LAB-02, AUTH-05).
// Ordering and resulting are clinical authoring (CAN_AUTHOR_CLINICAL); a
// result insert flips the order to `resulted` in the same statement (0008
// trigger), and an optional document link is integrity-checked to the same
// patient/org by the same trigger.
'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { resolveWorkspaceRole } from '@/lib/auth/workspace';
import { CAN_AUTHOR_CLINICAL, runsCapability, type Capability } from '@/lib/auth/capabilities';
import {
  imagingOrderIdSchema,
  orderImagingSchema,
  recordImagingResultSchema,
} from '@/lib/imaging/schemas';

export type ImagingActionResult =
  | { ok: true; orderId?: string; resultId?: string }
  | { ok: false; kind: 'invalid' | 'forbidden' | 'error' | 'not-found' };

async function requireStaff(capability: Capability) {
  const resolution = await resolveWorkspaceRole('provider');
  if (resolution.kind !== 'signed-in') return null;
  if (!runsCapability(resolution.role, capability)) return null;
  return resolution;
}

function revalidateImagingSurfaces(patientId: string) {
  revalidatePath('/provider');
  revalidatePath(`/provider/patients/${patientId}/imaging`);
  revalidatePath(`/provider/patients/${patientId}/overview`);
}

export async function orderImagingAction(input: unknown): Promise<ImagingActionResult> {
  const parsed = orderImagingSchema.safeParse(input);
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
    .from('imaging_orders')
    .insert({
      org_id: actor.orgId,
      patient_id: parsed.data.patientId,
      modality: parsed.data.modality,
      body_site: parsed.data.bodySite,
      notes: parsed.data.notes,
      ...(parsed.data.orderedAt ? { ordered_at: parsed.data.orderedAt } : {}),
    })
    .select('id')
    .single();

  if (error || !data) return { ok: false, kind: 'error' };

  revalidateImagingSurfaces(parsed.data.patientId);
  return { ok: true, orderId: data.id };
}

export async function recordImagingResultAction(input: unknown): Promise<ImagingActionResult> {
  const parsed = recordImagingResultSchema.safeParse(input);
  if (!parsed.success) return { ok: false, kind: 'invalid' };

  const actor = await requireStaff(CAN_AUTHOR_CLINICAL);
  if (!actor) return { ok: false, kind: 'forbidden' };

  const supabase = await createClient();
  const { data: order, error: orderError } = await supabase
    .from('imaging_orders')
    .select('id, org_id, patient_id, status')
    .eq('id', parsed.data.orderId)
    .eq('org_id', actor.orgId)
    .maybeSingle();

  if (orderError) return { ok: false, kind: 'error' };
  if (!order) return { ok: false, kind: 'not-found' };
  if (order.status === 'cancelled') return { ok: false, kind: 'invalid' };

  const { data, error } = await supabase
    .from('imaging_results')
    .insert({
      org_id: order.org_id,
      patient_id: order.patient_id,
      order_id: order.id,
      impression: parsed.data.impression,
      document_id: parsed.data.documentId,
      ...(parsed.data.resultedAt ? { resulted_at: parsed.data.resultedAt } : {}),
    })
    .select('id')
    .single();

  if (error || !data) return { ok: false, kind: 'error' };

  revalidateImagingSurfaces(order.patient_id);
  return { ok: true, orderId: order.id, resultId: data.id };
}

export async function cancelImagingOrderAction(orderId: string): Promise<ImagingActionResult> {
  const parsed = imagingOrderIdSchema.safeParse(orderId);
  if (!parsed.success) return { ok: false, kind: 'invalid' };

  const actor = await requireStaff(CAN_AUTHOR_CLINICAL);
  if (!actor) return { ok: false, kind: 'forbidden' };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('imaging_orders')
    .update({ status: 'cancelled' })
    .eq('id', parsed.data)
    .eq('org_id', actor.orgId)
    .select('id, patient_id')
    .maybeSingle();

  if (error) return { ok: false, kind: 'error' };
  if (!data) return { ok: false, kind: 'not-found' };

  revalidateImagingSurfaces(data.patient_id);
  return { ok: true, orderId: data.id };
}
