// src/lib/channels/actions.ts — the staff-managed channel endpoints
// (Phase 16, ticket 16-03; CHAN-03).
//
// Endpoints are contact data about the patient, managed by staff (doctor +
// nurse, mirroring the guard in the ported schema); no patient write path
// exists here. The capability check runs before any write; the DB guard
// re-derives org/patient integrity from `app.user_id`, so every write runs
// inside withAppUser.
'use server';

import { revalidatePath } from 'next/cache';
import { getSql } from '@/lib/db/neon';
import { withAppUser } from '@/lib/db/client';
import { getSessionUser } from '@/lib/auth/session';
import { resolveWorkspaceRole } from '@/lib/auth/workspace';
import { CAN_MESSAGE, runsCapability } from '@/lib/auth/capabilities';
import { CHANNEL_NAMES } from '@/lib/channels/status';
import { saveChannelEndpointSchema, setChannelEndpointStatusSchema } from '@/lib/channels/schemas';

export type ChannelActionResult =
  | { ok: true; endpointId?: string }
  | { ok: false; kind: 'invalid' | 'forbidden' | 'not-found' | 'error' };

async function requireCareTeam() {
  const resolution = await resolveWorkspaceRole('provider');
  if (resolution.kind !== 'signed-in') return null;
  if (!runsCapability(resolution.role, CAN_MESSAGE)) return null;
  const user = await getSessionUser();
  if (!user) return null;
  return { orgId: resolution.orgId, userId: user.id };
}

function revalidateChannelSurfaces(patientId: string) {
  revalidatePath('/provider/messages');
  revalidatePath(`/provider/patients/${patientId}/overview`);
}

/** Add or update the patient's endpoint for a channel (one endpoint per channel). */
export async function saveChannelEndpointAction(input: unknown): Promise<ChannelActionResult> {
  const parsed = saveChannelEndpointSchema.safeParse(input);
  if (!parsed.success) return { ok: false, kind: 'invalid' };
  if (!CHANNEL_NAMES.includes(parsed.data.channel)) return { ok: false, kind: 'invalid' };

  const actor = await requireCareTeam();
  if (!actor) return { ok: false, kind: 'forbidden' };

  const sql = getSql();

  let patient: { id: string } | null = null;
  try {
    const rows = (await sql`
      select id from public.patients
      where id = ${parsed.data.patientId} and org_id = ${actor.orgId}
    `) as unknown as { id: string }[];
    patient = rows[0] ?? null;
  } catch {
    return { ok: false, kind: 'error' };
  }
  if (patient === null) return { ok: false, kind: 'not-found' };

  // One endpoint per channel per patient: a handle change replaces the row.
  let existing: { id: string } | null = null;
  try {
    const rows = (await sql`
      select id from public.channel_endpoints
      where org_id = ${actor.orgId}
        and patient_id = ${parsed.data.patientId}
        and channel = ${parsed.data.channel}
    `) as unknown as { id: string }[];
    existing = rows[0] ?? null;
  } catch {
    existing = null;
  }

  if (existing !== null) {
    const endpointId = existing.id;
    try {
      await withAppUser(actor.userId, async (tx) => {
        await tx.query(
          `update public.channel_endpoints set handle = $1, status = $2 where id = $3 and org_id = $4`,
          [parsed.data.handle, parsed.data.status ?? 'active', endpointId, actor.orgId],
        );
      });
    } catch {
      return { ok: false, kind: 'error' };
    }
    revalidateChannelSurfaces(parsed.data.patientId);
    return { ok: true, endpointId };
  }

  let endpointId: string | null = null;
  try {
    endpointId = await withAppUser(actor.userId, async (tx) => {
      const { rows } = await tx.query<{ id: string }>(
        `insert into public.channel_endpoints (org_id, patient_id, channel, handle, status)
         values ($1, $2, $3, $4, $5)
         returning id`,
        [
          actor.orgId,
          parsed.data.patientId,
          parsed.data.channel,
          parsed.data.handle,
          parsed.data.status ?? 'active',
        ],
      );
      return rows[0]?.id ?? null;
    });
  } catch {
    return { ok: false, kind: 'error' };
  }
  if (endpointId === null) return { ok: false, kind: 'error' };

  revalidateChannelSurfaces(parsed.data.patientId);
  return { ok: true, endpointId };
}

/** Activate or deactivate an endpoint (the delivery workflow reads ACTIVE only). */
export async function setChannelEndpointStatusAction(input: unknown): Promise<ChannelActionResult> {
  const parsed = setChannelEndpointStatusSchema.safeParse(input);
  if (!parsed.success) return { ok: false, kind: 'invalid' };

  const actor = await requireCareTeam();
  if (!actor) return { ok: false, kind: 'forbidden' };

  let updated: { id: string; patient_id: string } | null = null;
  try {
    updated = await withAppUser(actor.userId, async (tx) => {
      const { rows } = await tx.query<{ id: string; patient_id: string }>(
        `update public.channel_endpoints set status = $1
         where id = $2 and org_id = $3
         returning id, patient_id`,
        [parsed.data.status, parsed.data.endpointId, actor.orgId],
      );
      return rows[0] ?? null;
    });
  } catch {
    return { ok: false, kind: 'error' };
  }
  if (updated === null) return { ok: false, kind: 'not-found' };

  revalidateChannelSurfaces(updated.patient_id);
  return { ok: true, endpointId: updated.id };
}
