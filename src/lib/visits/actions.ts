// src/lib/visits/actions.ts — Phase-7 visit mutations (VIS-01/03, AUTH-05).
// Follows the established contract (patients/actions.ts, actions.membership.ts):
// Zod parse FIRST, then the capability check, then the write, then
// revalidatePath — expected failures return a typed RESULT and never throw.
//
// TWO capabilities, two responsibilities (D-09):
//   CAN_SCHEDULE        → create a visit and edit its scheduling fields.
//   CAN_AUTHOR_CLINICAL → advance the workflow and write reason/documentation/
//                         follow-up.
// A receptionist holds the first and not the second; the DB's
// `guard_visit_content` trigger enforces the same rule underneath, so a bug
// here cannot widen clinical authoring (§3.1/§12).
//
// TRIGGER-OWNED (migration 0006): created_by/updated_by/created_at/updated_at
// are never written here — they come from `public.app_uid()`, so every write
// runs through withAppUser(user.id, …) to make that identity available.
'use server';

import { revalidatePath } from 'next/cache';
import { getSql } from '@/lib/db/neon';
import { withAppUser } from '@/lib/db/client';
import { getSessionUser } from '@/lib/auth/session';
import { resolveWorkspaceRole } from '@/lib/auth/workspace';
import { CAN_AUTHOR_CLINICAL, CAN_SCHEDULE, runsCapability, type Capability } from '@/lib/auth/capabilities';
import { createVisitSchema, saveVisitDocumentationSchema, visitIdSchema, visitStageSchema } from '@/lib/visits/schemas';
import { nextStage, type VisitStage } from '@/lib/visits/status';

export type VisitActionResult =
  | { ok: true; visitId?: string }
  | { ok: false; kind: 'invalid' | 'forbidden' | 'error' | 'not-found' };

async function requireStaff(capability: Capability) {
  const [resolution, user] = await Promise.all([
    resolveWorkspaceRole('provider'),
    getSessionUser(),
  ]);
  if (resolution.kind !== 'signed-in') return null;
  if (!user) return null;
  if (!runsCapability(resolution.role, capability)) return null;
  return { ...resolution, uid: user.id };
}

/** The workspace paths a visit change can affect. */
function revalidateVisitSurfaces(patientId: string) {
  revalidatePath('/provider');
  revalidatePath(`/provider/patients/${patientId}/visits`);
  revalidatePath(`/provider/patients/${patientId}/overview`);
}

export async function createVisitAction(input: unknown): Promise<VisitActionResult> {
  const parsed = createVisitSchema.safeParse(input);
  if (!parsed.success) return { ok: false, kind: 'invalid' };

  const actor = await requireStaff(CAN_SCHEDULE);
  if (!actor) return { ok: false, kind: 'forbidden' };

  // A scheduler without clinical authoring may never write a reason, whatever
  // the payload says — and the DB guard refuses it too.
  const authorsClinical = runsCapability(actor.role, CAN_AUTHOR_CLINICAL);

  const sql = getSql();
  let patient: { id: string } | undefined;
  try {
    const rows = (await sql`
      select id from public.patients
      where id = ${parsed.data.patientId} and org_id = ${actor.orgId}
      limit 1
    `) as unknown as { id: string }[];
    patient = rows[0];
  } catch {
    return { ok: false, kind: 'error' };
  }
  if (!patient) return { ok: false, kind: 'not-found' };

  let visitId: string | undefined;
  try {
    visitId = await withAppUser(actor.uid, async (tx) => {
      const { rows } = await tx.query<{ id: string }>(
        `insert into public.visits (org_id, patient_id, scheduled_at, visit_type, location, reason)
         values ($1, $2, $3, $4, $5, $6)
         returning id`,
        [
          actor.orgId,
          parsed.data.patientId,
          parsed.data.scheduledAt,
          parsed.data.visitType,
          parsed.data.location,
          authorsClinical ? parsed.data.reason : null,
          // stage omitted → SQL default 'pre_visit' (0006)
        ],
      );
      return rows[0]?.id;
    });
  } catch {
    return { ok: false, kind: 'error' };
  }

  if (!visitId) return { ok: false, kind: 'error' };

  revalidateVisitSurfaces(parsed.data.patientId);
  return { ok: true, visitId };
}

/**
 * Advance one visit exactly one stage forward (Pre → During → After). The
 * server owns the sequence: a skip, a repeat or a backward move is rejected
 * rather than silently applied.
 */
export async function advanceVisitStageAction(
  visitId: string,
  stage: VisitStage,
): Promise<VisitActionResult> {
  const idParsed = visitIdSchema.safeParse(visitId);
  const stageParsed = visitStageSchema.safeParse(stage);
  if (!idParsed.success || !stageParsed.success) return { ok: false, kind: 'invalid' };

  const actor = await requireStaff(CAN_AUTHOR_CLINICAL);
  if (!actor) return { ok: false, kind: 'forbidden' };

  const sql = getSql();
  let current: { id: string; patient_id: string; stage: VisitStage } | undefined;
  try {
    const rows = (await sql`
      select id, patient_id, stage from public.visits
      where id = ${idParsed.data} and org_id = ${actor.orgId}
      limit 1
    `) as unknown as { id: string; patient_id: string; stage: VisitStage }[];
    current = rows[0];
  } catch {
    return { ok: false, kind: 'error' };
  }
  if (!current) return { ok: false, kind: 'not-found' };

  if (nextStage(current.stage) !== stageParsed.data) {
    return { ok: false, kind: 'invalid' };
  }

  let updatedId: string | undefined;
  try {
    updatedId = await withAppUser(actor.uid, async (tx) => {
      const { rows } = await tx.query<{ id: string }>(
        `update public.visits set stage = $1
         where id = $2 and org_id = $3
         returning id`,
        [stageParsed.data, idParsed.data, actor.orgId],
      );
      return rows[0]?.id;
    });
  } catch {
    return { ok: false, kind: 'error' };
  }

  if (!updatedId) return { ok: false, kind: 'not-found' };

  revalidateVisitSurfaces(current.patient_id);
  return { ok: true, visitId: updatedId };
}

/**
 * Replace the visit's clinical block (reason / documentation / follow-up).
 * The form submits the whole block, so an omitted field is a deliberate clear.
 * Clinician-only; the DB trigger refuses a non-author at the same boundary.
 */
export async function saveVisitDocumentationAction(input: unknown): Promise<VisitActionResult> {
  const parsed = saveVisitDocumentationSchema.safeParse(input);
  if (!parsed.success) return { ok: false, kind: 'invalid' };

  const actor = await requireStaff(CAN_AUTHOR_CLINICAL);
  if (!actor) return { ok: false, kind: 'forbidden' };

  let updated: { id: string; patient_id: string } | undefined;
  try {
    updated = await withAppUser(actor.uid, async (tx) => {
      const { rows } = await tx.query<{ id: string; patient_id: string }>(
        `update public.visits
            set reason = $1, documentation = $2, follow_up = $3, follow_up_at = $4
          where id = $5 and org_id = $6
          returning id, patient_id`,
        [
          parsed.data.reason,
          parsed.data.documentation,
          parsed.data.followUp,
          parsed.data.followUpAt,
          parsed.data.visitId,
          actor.orgId,
        ],
      );
      return rows[0];
    });
  } catch {
    return { ok: false, kind: 'error' };
  }

  if (!updated) return { ok: false, kind: 'not-found' };

  revalidateVisitSurfaces(updated.patient_id);
  return { ok: true, visitId: updated.id };
}
