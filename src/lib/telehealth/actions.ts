// src/lib/telehealth/actions.ts — the consultation workflow (Phase 17,
// ticket 17-02; TH-01/03).
//
// Start, complete, cancel — all doctor-only (CAN_AUTHOR_CLINICAL), all
// re-deriving the org from the session and re-reading the visit with an
// explicit org scope (RLS is inert on the single-owner Lakebase connection).
// The visit stays the encounter of record: completing a telehealth
// consultation writes the SAME documentation block an in-person visit uses
// (TH-03) — there is one model, not two.
//
// Every write runs under `withAppUser`: the session/visit guards derive the
// caller's role and the provenance/audit triggers read `public.app_uid()`.
'use server';

import { revalidatePath } from 'next/cache';
import { getSql } from '@/lib/db/neon';
import { withAppUser } from '@/lib/db/client';
import { getSessionUser } from '@/lib/auth/session';
import { resolveWorkspaceRole } from '@/lib/auth/workspace';
import { CAN_AUTHOR_CLINICAL, runsCapability } from '@/lib/auth/capabilities';
import {
  cancelConsultationSchema,
  completeConsultationSchema,
  startConsultationSchema,
} from '@/lib/telehealth/schemas';

export type TelehealthActionResult =
  | { ok: true; sessionId?: string; visitId?: string }
  | { ok: false; kind: 'invalid' | 'forbidden' | 'error' | 'not-found' };

function revalidateConsultationSurfaces(patientId: string, visitId: string) {
  revalidatePath('/provider/consultations');
  revalidatePath(`/provider/consultations/${visitId}`);
  revalidatePath(`/provider/patients/${patientId}/visits/${visitId}`);
  revalidatePath(`/provider/patients/${patientId}/visits`);
  revalidatePath(`/provider/patients/${patientId}/overview`);
  revalidatePath('/patient/home');
  revalidatePath('/patient/consultation');
}

async function requireDoctor() {
  const resolution = await resolveWorkspaceRole('provider');
  if (resolution.kind !== 'signed-in') return null;
  if (!runsCapability(resolution.role, CAN_AUTHOR_CLINICAL)) return null;
  const user = await getSessionUser();
  if (!user) return null;
  return { ...resolution, uid: user.id };
}

/**
 * Start (or resume) the consultation for an appointment. A visit that
 * already has an ACTIVE session resumes it — never a duplicate row — and the
 * visit advances to `during_visit` exactly once.
 */
export async function startConsultationAction(input: unknown): Promise<TelehealthActionResult> {
  const parsed = startConsultationSchema.safeParse(input);
  if (!parsed.success) return { ok: false, kind: 'invalid' };

  const actor = await requireDoctor();
  if (!actor) return { ok: false, kind: 'forbidden' };

  try {
    const sql = getSql();
    const visitRows = (await sql`
      select id, patient_id, stage from public.visits
      where id = ${parsed.data.visitId} and org_id = ${actor.orgId}
      limit 1
    `) as unknown as { id: string; patient_id: string; stage: string }[];
    const visit = visitRows[0] ?? null;
    if (!visit) return { ok: false, kind: 'not-found' };

    // Resume an active session rather than creating a second one.
    const existingRows = (await sql`
      select id, status from public.telehealth_sessions
      where org_id = ${actor.orgId} and visit_id = ${parsed.data.visitId}
        and status in ('scheduled', 'in_progress')
      limit 1
    `) as unknown as { id: string; status: string }[];
    const existing = existingRows[0] ?? null;

    if (existing) {
      // A scheduled-but-unstarted session moves to in_progress.
      if (existing.status === 'scheduled') {
        await withAppUser(actor.uid, async (tx) => {
          await tx.query(
            `update public.telehealth_sessions set status = 'in_progress' where id = $1 and org_id = $2`,
            [existing.id, actor.orgId],
          );
        });
      }
    } else {
      const createdId = await withAppUser(actor.uid, async (tx) => {
        const { rows } = await tx.query<{ id: string }>(
          `insert into public.telehealth_sessions (org_id, patient_id, visit_id)
           values ($1, $2, $3)
           returning id`,
          [actor.orgId, visit.patient_id, parsed.data.visitId],
        );
        return rows[0]?.id;
      });
      if (createdId === undefined) return { ok: false, kind: 'error' };

      await withAppUser(actor.uid, async (tx) => {
        await tx.query(
          `update public.telehealth_sessions set status = 'in_progress' where id = $1 and org_id = $2`,
          [createdId, actor.orgId],
        );
      });
    }

    // The appointment is now being held: the visit advances to During Visit.
    if (visit.stage === 'pre_visit') {
      await withAppUser(actor.uid, async (tx) => {
        await tx.query(
          `update public.visits set stage = 'during_visit' where id = $1 and org_id = $2`,
          [parsed.data.visitId, actor.orgId],
        );
      });
    }

    revalidateConsultationSurfaces(visit.patient_id, parsed.data.visitId);
    return { ok: true, visitId: parsed.data.visitId };
  } catch {
    return { ok: false, kind: 'error' };
  }
}

/**
 * Complete the consultation: the session closes and the visit's clinical
 * block is written through the same row an in-person visit uses. The visit
 * then reads After Visit with the documentation in place (TH-03).
 */
export async function completeConsultationAction(input: unknown): Promise<TelehealthActionResult> {
  const parsed = completeConsultationSchema.safeParse(input);
  if (!parsed.success) return { ok: false, kind: 'invalid' };

  const actor = await requireDoctor();
  if (!actor) return { ok: false, kind: 'forbidden' };

  try {
    const sql = getSql();
    const visitRows = (await sql`
      select id, patient_id from public.visits
      where id = ${parsed.data.visitId} and org_id = ${actor.orgId}
      limit 1
    `) as unknown as { id: string; patient_id: string }[];
    const visit = visitRows[0] ?? null;
    if (!visit) return { ok: false, kind: 'not-found' };

    // The session must be in progress to complete — the guard re-checks.
    await withAppUser(actor.uid, async (tx) => {
      await tx.query(
        `update public.telehealth_sessions set status = 'completed'
         where org_id = $1 and visit_id = $2 and status = 'in_progress'`,
        [actor.orgId, parsed.data.visitId],
      );
    });

    // The visit's clinical block — the same write an in-person visit makes.
    await withAppUser(actor.uid, async (tx) => {
      await tx.query(
        `update public.visits
         set reason = $1, documentation = $2, follow_up = $3, follow_up_at = $4, stage = 'after_visit'
         where id = $5 and org_id = $6`,
        [
          parsed.data.reason ?? null,
          parsed.data.documentation ?? null,
          parsed.data.followUp ?? null,
          parsed.data.followUpAt ?? null,
          parsed.data.visitId,
          actor.orgId,
        ],
      );
    });

    revalidateConsultationSurfaces(visit.patient_id, parsed.data.visitId);
    return { ok: true, visitId: parsed.data.visitId };
  } catch {
    return { ok: false, kind: 'error' };
  }
}

/** Cancel a consultation; the appointment stays in the record with its reason. */
export async function cancelConsultationAction(input: unknown): Promise<TelehealthActionResult> {
  const parsed = cancelConsultationSchema.safeParse(input);
  if (!parsed.success) return { ok: false, kind: 'invalid' };

  const actor = await requireDoctor();
  if (!actor) return { ok: false, kind: 'forbidden' };

  try {
    const sql = getSql();
    const visitRows = (await sql`
      select id, patient_id from public.visits
      where id = ${parsed.data.visitId} and org_id = ${actor.orgId}
      limit 1
    `) as unknown as { id: string; patient_id: string }[];
    const visit = visitRows[0] ?? null;
    if (!visit) return { ok: false, kind: 'not-found' };

    await withAppUser(actor.uid, async (tx) => {
      await tx.query(
        `update public.telehealth_sessions
         set status = 'cancelled', cancellation_reason = $1
         where org_id = $2 and visit_id = $3 and status in ('scheduled', 'in_progress')`,
        [parsed.data.reason, actor.orgId, parsed.data.visitId],
      );
    });

    revalidateConsultationSurfaces(visit.patient_id, parsed.data.visitId);
    return { ok: true, visitId: parsed.data.visitId };
  } catch {
    return { ok: false, kind: 'error' };
  }
}
