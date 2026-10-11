// src/lib/allergies/actions.ts — allergy record/resolve (ALG-01, AUTH-05).
// Authoring is clinical (CAN_AUTHOR_CLINICAL; provider_doctor at the DB guard).
//
// Writes run through withAppUser(), so `touch_allergies_provenance` reads
// public.app_uid() for created_by/updated_by and `guard_allergy_content`
// resolves the caller's role for the same org from the same setting. Reads and
// the update's WHERE clause carry an explicit `org_id` predicate: the Neon
// connection is single-owner, so the ported RLS policies are inert and the
// app-layer filter is the org boundary.
'use server';

import { revalidatePath } from 'next/cache';
import { getSql } from '@/lib/db/neon';
import { withAppUser } from '@/lib/db/client';
import { getSessionUser } from '@/lib/auth/session';
import { resolveWorkspaceRole } from '@/lib/auth/workspace';
import { CAN_AUTHOR_CLINICAL, runsCapability, type Capability } from '@/lib/auth/capabilities';
import { recordAllergySchema, resolveAllergySchema } from '@/lib/allergies/schemas';

export type AllergyActionResult =
  | { ok: true; allergyId?: string }
  | { ok: false; kind: 'invalid' | 'forbidden' | 'error' | 'not-found' };

async function requireStaff(capability: Capability) {
  const user = await getSessionUser();
  if (!user) return null;
  const resolution = await resolveWorkspaceRole('provider');
  if (resolution.kind !== 'signed-in') return null;
  if (!runsCapability(resolution.role, capability)) return null;
  return { orgId: resolution.orgId, userId: user.id };
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

  try {
    const sql = getSql();
    const patients = (await sql`
      select id from public.patients
      where id = ${parsed.data.patientId} and org_id = ${actor.orgId}
      limit 1
    `) as unknown as { id: string }[];
    if (patients.length === 0) return { ok: false, kind: 'not-found' };

    // status/verification/source omitted → SQL defaults (active,
    // clinician-verified, clinician); noted_at defaults to now() when the
    // caller did not state one.
    const created = await withAppUser(actor.userId, async (tx) => {
      const { rows } = await tx.query<{ id: string }>(
        `insert into public.allergies (org_id, patient_id, allergen, reaction, severity, notes, noted_at)
         values ($1, $2, $3, $4, $5, $6, coalesce($7, now()))
         returning id`,
        [
          actor.orgId,
          parsed.data.patientId,
          parsed.data.allergen,
          parsed.data.reaction,
          parsed.data.severity,
          parsed.data.notes,
          parsed.data.notedAt ?? null,
        ],
      );
      return rows[0] ?? null;
    });

    if (!created) return { ok: false, kind: 'error' };

    revalidateAllergySurfaces(parsed.data.patientId);
    return { ok: true, allergyId: created.id };
  } catch {
    return { ok: false, kind: 'error' };
  }
}

/** Resolve an allergy (an explicit clinical action; the verb is the label). */
export async function resolveAllergyAction(input: unknown): Promise<AllergyActionResult> {
  const parsed = resolveAllergySchema.safeParse(input);
  if (!parsed.success) return { ok: false, kind: 'invalid' };

  const actor = await requireStaff(CAN_AUTHOR_CLINICAL);
  if (!actor) return { ok: false, kind: 'forbidden' };

  try {
    const updated = await withAppUser(actor.userId, async (tx) => {
      const { rows } = await tx.query<{ id: string; patient_id: string }>(
        `update public.allergies set status = $1
         where id = $2 and org_id = $3
         returning id, patient_id`,
        [parsed.data.status, parsed.data.allergyId, actor.orgId],
      );
      return rows[0] ?? null;
    });

    if (!updated) return { ok: false, kind: 'not-found' };

    revalidateAllergySurfaces(updated.patient_id);
    return { ok: true, allergyId: updated.id };
  } catch {
    return { ok: false, kind: 'error' };
  }
}
