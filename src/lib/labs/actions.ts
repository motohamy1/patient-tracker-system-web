// src/lib/labs/actions.ts — the lab lifecycle (LAB-01, AUTH-05).
//
// Every action requires CAN_AUTHOR_CLINICAL server-side (D-09: provider_doctor
// — authoring orders/results is clinical). Results are INSERT-only clinical
// facts; migration 0008's trigger flips the parent order to `resulted` in the
// SAME statement, so status and facts cannot drift.
//
// Writes run through withAppUser(): `touch_lab_order_provenance` reads
// public.app_uid() for created_by/updated_by and `guard_order_content` /
// `guard_lab_result` resolve the caller's role and patient/org integrity from
// that same setting. Reads carry an explicit `org_id` predicate — the Neon
// connection is single-owner, so the ported RLS policies are inert.
'use server';

import { revalidatePath } from 'next/cache';
import { getSql } from '@/lib/db/neon';
import { withAppUser } from '@/lib/db/client';
import { getSessionUser } from '@/lib/auth/session';
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
  const user = await getSessionUser();
  if (!user) return null;
  const resolution = await resolveWorkspaceRole('provider');
  if (resolution.kind !== 'signed-in') return null;
  if (!runsCapability(resolution.role, capability)) return null;
  return { orgId: resolution.orgId, userId: user.id };
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

  try {
    const sql = getSql();
    const patients = (await sql`
      select id from public.patients
      where id = ${parsed.data.patientId} and org_id = ${actor.orgId}
      limit 1
    `) as unknown as { id: string }[];
    if (patients.length === 0) return { ok: false, kind: 'not-found' };

    // status omitted → SQL default 'ordered'; ordered_at defaults to now()
    // when the caller did not state one.
    const created = await withAppUser(actor.userId, async (tx) => {
      const { rows } = await tx.query<{ id: string }>(
        `insert into public.lab_orders (org_id, patient_id, name, notes, ordered_at)
         values ($1, $2, $3, $4, coalesce($5, now()))
         returning id`,
        [
          actor.orgId,
          parsed.data.patientId,
          parsed.data.name,
          parsed.data.notes,
          parsed.data.orderedAt ?? null,
        ],
      );
      return rows[0] ?? null;
    });

    if (!created) return { ok: false, kind: 'error' };

    revalidateLabSurfaces(parsed.data.patientId);
    return { ok: true, orderId: created.id };
  } catch {
    return { ok: false, kind: 'error' };
  }
}

export async function recordLabResultAction(input: unknown): Promise<LabActionResult> {
  const parsed = recordLabResultSchema.safeParse(input);
  if (!parsed.success) return { ok: false, kind: 'invalid' };

  const actor = await requireStaff(CAN_AUTHOR_CLINICAL);
  if (!actor) return { ok: false, kind: 'forbidden' };

  try {
    // The order identifies the patient; the explicit org filter scopes the
    // read to this org (the ported RLS policy cannot).
    const sql = getSql();
    const orders = (await sql`
      select id, org_id, patient_id, status from public.lab_orders
      where id = ${parsed.data.orderId} and org_id = ${actor.orgId}
      limit 1
    `) as unknown as { id: string; org_id: string; patient_id: string; status: string }[];
    const order = orders[0];
    if (!order) return { ok: false, kind: 'not-found' };
    if (order.status === 'cancelled') return { ok: false, kind: 'invalid' };

    const created = await withAppUser(actor.userId, async (tx) => {
      const { rows } = await tx.query<{ id: string }>(
        `insert into public.lab_results
           (org_id, patient_id, order_id, analyte, value, unit, reference_range, flag, resulted_at)
         values ($1, $2, $3, $4, $5, $6, $7, $8, coalesce($9, now()))
         returning id`,
        [
          order.org_id,
          order.patient_id,
          order.id,
          parsed.data.analyte,
          parsed.data.value,
          parsed.data.unit,
          parsed.data.referenceRange,
          parsed.data.flag,
          parsed.data.resultedAt ?? null,
        ],
      );
      return rows[0] ?? null;
    });

    if (!created) return { ok: false, kind: 'error' };

    revalidateLabSurfaces(order.patient_id);
    return { ok: true, orderId: order.id, resultId: created.id };
  } catch {
    return { ok: false, kind: 'error' };
  }
}

/** An explicit cancellation of an order (the clinical verb is the label). */
export async function cancelLabOrderAction(orderId: string): Promise<LabActionResult> {
  const parsed = labOrderIdSchema.safeParse(orderId);
  if (!parsed.success) return { ok: false, kind: 'invalid' };

  const actor = await requireStaff(CAN_AUTHOR_CLINICAL);
  if (!actor) return { ok: false, kind: 'forbidden' };

  try {
    const updated = await withAppUser(actor.userId, async (tx) => {
      const { rows } = await tx.query<{ id: string; patient_id: string }>(
        `update public.lab_orders set status = 'cancelled'
         where id = $1 and org_id = $2
         returning id, patient_id`,
        [parsed.data, actor.orgId],
      );
      return rows[0] ?? null;
    });

    if (!updated) return { ok: false, kind: 'not-found' };

    revalidateLabSurfaces(updated.patient_id);
    return { ok: true, orderId: updated.id };
  } catch {
    return { ok: false, kind: 'error' };
  }
}
