// src/lib/patients/actions.ts — Phase-4 patient mutations (PROV-04, D-01,
// D-04, D-06, D-13, D-22; AUTH-05 capability gate). Follows the established
// actions.membership.ts contract: Zod parse FIRST, then capability check, then
// the write, then revalidatePath — expected failures return a typed RESULT
// kind and never throw (03-PATTERNS rules 3/4).
//
// TRIGGER-OWNED COLUMNS (D-07/D-22): this file NEVER writes mrn, mrn_seq,
// created_at, updated_at, last_activity_at or search_text — migration 0005's
// assign_patient_mrn / touch_patient_timestamps triggers own them, so a missed
// call path can never mean a stale timestamp (04-RESEARCH Pitfall 7).
//
// Every write runs through withAppUser(uid, …): the provenance triggers read
// `public.app_uid()` for created_by/updated_by, and the invitations
// patient-link trigger bumps the patient's activity — the identity must be
// present on the session.
//
// `session_replication_role` is never set here: that bypass is reserved for
// the deterministic seed fixtures (04-05), not app code.
'use server';

import { revalidatePath } from 'next/cache';
import { getSql } from '@/lib/db/neon';
import { withAppUser } from '@/lib/db/client';
import { getSessionUser } from '@/lib/auth/session';
import { resolveWorkspaceRole } from '@/lib/auth/workspace';
import {
  CAN_MANAGE_MEMBERSHIP,
  CAN_MANAGE_PATIENTS,
  runsCapability,
  type Capability,
} from '@/lib/auth/capabilities';
import { createInviteToken } from '@/lib/auth/invite';
import {
  changePatientStatusSchema,
  createPatientSchema,
  patientIdSchema,
} from '@/lib/patients/schemas';
import type { PatientStatus } from '@/lib/patients/status';

export type PatientActionResult =
  | {
      ok: true;
      patient?: { id: string; firstName: string; lastName: string; mrn: string; status: PatientStatus };
      link?: string;
      shortCode?: string;
    }
  | { ok: false; kind: 'invalid' | 'forbidden' | 'error' };

// Server-side identity + membership resolution (never client-supplied role —
// §3.1). Returns null when the principal is outside the provider workspace or
// lacks the capability; every downstream query still pins the row scope with
// an explicit org predicate.
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

export async function createPatientAction(input: unknown): Promise<PatientActionResult> {
  const parsed = createPatientSchema.safeParse(input);
  if (!parsed.success) return { ok: false, kind: 'invalid' };

  const actor = await requireStaff(CAN_MANAGE_PATIENTS);
  if (!actor) return { ok: false, kind: 'forbidden' };

  let patient: { id: string; first_name: string; last_name: string; mrn: string; status: string } | undefined;
  try {
    patient = await withAppUser(actor.uid, async (tx) => {
      const { rows } = await tx.query<{
        id: string;
        first_name: string;
        last_name: string;
        mrn: string;
        status: string;
      }>(
        `insert into public.patients (org_id, first_name, last_name, dob, sex, phone)
         values ($1, $2, $3, $4, $5, $6)
         returning id, first_name, last_name, mrn, status`,
        [
          actor.orgId,
          parsed.data.firstName,
          parsed.data.lastName,
          parsed.data.dob,
          parsed.data.sex,
          parsed.data.phone,
          // status omitted → SQL default 'new' (D-13); mrn/mrn_seq/timestamps
          // are trigger-owned and must never appear in this payload (D-07/D-22).
        ],
      );
      return rows[0];
    });
  } catch {
    return { ok: false, kind: 'error' };
  }

  if (!patient) return { ok: false, kind: 'error' };

  revalidatePath('/provider'); // D-06: the new card appears; no navigation
  return {
    ok: true,
    patient: {
      id: patient.id,
      firstName: patient.first_name,
      lastName: patient.last_name,
      mrn: patient.mrn,
      status: patient.status as PatientStatus,
    },
  };
}

export async function changePatientStatusAction(
  patientId: string,
  status: PatientStatus,
): Promise<PatientActionResult> {
  const parsed = changePatientStatusSchema.safeParse({ patientId, status });
  if (!parsed.success) return { ok: false, kind: 'invalid' };

  const actor = await requireStaff(CAN_MANAGE_PATIENTS);
  if (!actor) return { ok: false, kind: 'forbidden' };

  let updatedId: string | undefined;
  try {
    updatedId = await withAppUser(actor.uid, async (tx) => {
      // Only `status` — updated_at/last_activity_at are bumped by trigger (D-22).
      const { rows } = await tx.query<{ id: string }>(
        `update public.patients set status = $1
         where id = $2 and org_id = $3
         returning id`,
        [parsed.data.status, parsed.data.patientId, actor.orgId],
      );
      return rows[0]?.id;
    });
  } catch {
    return { ok: false, kind: 'error' };
  }

  if (!updatedId) return { ok: false, kind: 'error' }; // zero rows = not ours

  revalidatePath('/provider');
  return { ok: true };
}

export async function sendPatientInviteAction(patientId: string): Promise<PatientActionResult> {
  const idParsed = patientIdSchema.safeParse(patientId);
  if (!idParsed.success) return { ok: false, kind: 'invalid' };

  // D-04 reuses Phase-3 invite infrastructure: the invite stays gated on
  // CAN_MANAGE_MEMBERSHIP (provider_doctor/admin_owner) — 04-RESEARCH Open
  // Question 4: the capability is NOT widened; the UI hides the row for other
  // roles and this check re-enforces it server-side.
  const actor = await requireStaff(CAN_MANAGE_MEMBERSHIP);
  if (!actor) return { ok: false, kind: 'forbidden' };

  const sql = getSql();
  // The inviter's uid comes from the verified session (requireStaff), never
  // from the payload, for invitations.created_by.
  let patient: { id: string; org_id: string; user_id: string | null; first_name: string } | undefined;
  try {
    const rows = (await sql`
      select id, org_id, user_id, first_name from public.patients
      where id = ${patientId} and org_id = ${actor.orgId}
      limit 1
    `) as unknown as { id: string; org_id: string; user_id: string | null; first_name: string }[];
    patient = rows[0];
  } catch {
    return { ok: false, kind: 'error' };
  }

  if (!patient) return { ok: false, kind: 'error' };
  if (patient.user_id !== null) return { ok: false, kind: 'error' }; // linked already (D-15)
  const target = patient;

  const { raw, digest } = createInviteToken();
  const shortCode = Math.random().toString(36).slice(2, 8).toUpperCase();

  try {
    await withAppUser(actor.uid, async (tx) => {
      await tx.query(
        `insert into public.invitations
           (org_id, role, token_digest, short_code, created_by, patient_id)
         values ($1, $2, $3, $4, $5, $6)`,
        [target.org_id, 'patient', digest, shortCode, actor.uid, target.id],
      );
    });
  } catch {
    return { ok: false, kind: 'error' };
  }

  revalidatePath('/provider'); // invite-sent bumps last_activity_at via trigger (D-22)
  return { ok: true, link: `/invite/${raw}`, shortCode };
}
