// src/lib/imaging/actions.ts — the imaging lifecycle (LAB-02, AUTH-05).
// Ordering and resulting are clinical authoring (CAN_AUTHOR_CLINICAL); a
// result insert flips the order to `resulted` in the same statement (0008
// trigger), and an optional document link is integrity-checked to the same
// patient/org by the same trigger.
//
// Writes run through withAppUser(): `touch_imaging_order_provenance` reads
// public.app_uid() for created_by/updated_by and `guard_order_content` /
// `guard_imaging_result` resolve the caller's role and patient/org integrity
// from that same setting. Reads carry an explicit `org_id` predicate — the
// Neon connection is single-owner, so the ported RLS policies are inert.
'use server';

import { revalidatePath } from 'next/cache';
import { getSql } from '@/lib/db/neon';
import { withAppUser } from '@/lib/db/client';
import { getSessionUser } from '@/lib/auth/session';
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
  const user = await getSessionUser();
  if (!user) return null;
  const resolution = await resolveWorkspaceRole('provider');
  if (resolution.kind !== 'signed-in') return null;
  if (!runsCapability(resolution.role, capability)) return null;
  return { orgId: resolution.orgId, userId: user.id };
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

  try {
    const sql = getSql();
    const patients = (await sql`
      select id from public.patients
      where id = ${parsed.data.patientId} and org_id = ${actor.orgId}
      limit 1
    `) as unknown as { id: string }[];
    if (patients.length === 0) return { ok: false, kind: 'not-found' };

    // status/source omitted → SQL defaults ('ordered', 'clinician');
    // ordered_at defaults to now() when the caller did not state one.
    const created = await withAppUser(actor.userId, async (tx) => {
      const { rows } = await tx.query<{ id: string }>(
        `insert into public.imaging_orders (org_id, patient_id, modality, body_site, notes, ordered_at)
         values ($1, $2, $3, $4, $5, coalesce($6, now()))
         returning id`,
        [
          actor.orgId,
          parsed.data.patientId,
          parsed.data.modality,
          parsed.data.bodySite,
          parsed.data.notes,
          parsed.data.orderedAt ?? null,
        ],
      );
      return rows[0] ?? null;
    });

    if (!created) return { ok: false, kind: 'error' };

    revalidateImagingSurfaces(parsed.data.patientId);
    return { ok: true, orderId: created.id };
  } catch {
    return { ok: false, kind: 'error' };
  }
}

export async function recordImagingResultAction(input: unknown): Promise<ImagingActionResult> {
  const parsed = recordImagingResultSchema.safeParse(input);
  if (!parsed.success) return { ok: false, kind: 'invalid' };

  const actor = await requireStaff(CAN_AUTHOR_CLINICAL);
  if (!actor) return { ok: false, kind: 'forbidden' };

  try {
    const sql = getSql();
    const orders = (await sql`
      select id, org_id, patient_id, status from public.imaging_orders
      where id = ${parsed.data.orderId} and org_id = ${actor.orgId}
      limit 1
    `) as unknown as { id: string; org_id: string; patient_id: string; status: string }[];
    const order = orders[0];
    if (!order) return { ok: false, kind: 'not-found' };
    if (order.status === 'cancelled') return { ok: false, kind: 'invalid' };

    const created = await withAppUser(actor.userId, async (tx) => {
      const { rows } = await tx.query<{ id: string }>(
        `insert into public.imaging_results
           (org_id, patient_id, order_id, impression, document_id, resulted_at)
         values ($1, $2, $3, $4, $5, coalesce($6, now()))
         returning id`,
        [
          order.org_id,
          order.patient_id,
          order.id,
          parsed.data.impression,
          parsed.data.documentId,
          parsed.data.resultedAt ?? null,
        ],
      );
      return rows[0] ?? null;
    });

    if (!created) return { ok: false, kind: 'error' };

    revalidateImagingSurfaces(order.patient_id);
    return { ok: true, orderId: order.id, resultId: created.id };
  } catch {
    return { ok: false, kind: 'error' };
  }
}

export async function cancelImagingOrderAction(orderId: string): Promise<ImagingActionResult> {
  const parsed = imagingOrderIdSchema.safeParse(orderId);
  if (!parsed.success) return { ok: false, kind: 'invalid' };

  const actor = await requireStaff(CAN_AUTHOR_CLINICAL);
  if (!actor) return { ok: false, kind: 'forbidden' };

  try {
    const updated = await withAppUser(actor.userId, async (tx) => {
      const { rows } = await tx.query<{ id: string; patient_id: string }>(
        `update public.imaging_orders set status = 'cancelled'
         where id = $1 and org_id = $2
         returning id, patient_id`,
        [parsed.data, actor.orgId],
      );
      return rows[0] ?? null;
    });

    if (!updated) return { ok: false, kind: 'not-found' };

    revalidateImagingSurfaces(updated.patient_id);
    return { ok: true, orderId: updated.id };
  } catch {
    return { ok: false, kind: 'error' };
  }
}
