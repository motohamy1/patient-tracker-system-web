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
// `session_replication_role` is never set here: that bypass is reserved for
// supabase/seed.sql's deterministic fixtures (04-05), not app code.
'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
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
// lacks the capability; RLS still enforces the row scope underneath.
async function requireStaff(capability: Capability) {
  const resolution = await resolveWorkspaceRole('provider');
  if (resolution.kind !== 'signed-in') return null;
  if (!runsCapability(resolution.role, capability)) return null;
  return resolution;
}

export async function createPatientAction(input: unknown): Promise<PatientActionResult> {
  const parsed = createPatientSchema.safeParse(input);
  if (!parsed.success) return { ok: false, kind: 'invalid' };

  const actor = await requireStaff(CAN_MANAGE_PATIENTS);
  if (!actor) return { ok: false, kind: 'forbidden' };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('patients')
    .insert({
      org_id: actor.orgId,
      first_name: parsed.data.firstName,
      last_name: parsed.data.lastName,
      dob: parsed.data.dob,
      sex: parsed.data.sex,
      phone: parsed.data.phone,
      // status omitted → SQL default 'new' (D-13); mrn/mrn_seq/timestamps
      // are trigger-owned and must never appear in this payload (D-07/D-22).
    })
    .select('id, first_name, last_name, mrn, status')
    .single();

  if (error || !data) return { ok: false, kind: 'error' };

  revalidatePath('/provider'); // D-06: the new card appears; no navigation
  return {
    ok: true,
    patient: {
      id: data.id,
      firstName: data.first_name,
      lastName: data.last_name,
      mrn: data.mrn,
      status: data.status as PatientStatus,
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

  const supabase = await createClient();
  // Only `status` — updated_at/last_activity_at are bumped by trigger (D-22).
  const { data, error } = await supabase
    .from('patients')
    .update({ status: parsed.data.status })
    .eq('id', parsed.data.patientId)
    .select('id')
    .maybeSingle();

  if (error) return { ok: false, kind: 'error' };
  if (!data) return { ok: false, kind: 'error' }; // RLS zero-row = not ours

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

  const supabase = await createClient();
  // WorkspaceResolution carries role/orgId only — the inviter's uid comes from
  // the verified claims (getClaims, never getSession) for invitations.created_by.
  const { data: claimData } = await supabase.auth.getClaims();
  const uid = claimData?.claims?.sub;
  if (!uid) return { ok: false, kind: 'error' };

  const { data: patient, error: patientError } = await supabase
    .from('patients')
    .select('id, org_id, user_id, first_name')
    .eq('id', patientId)
    .maybeSingle();

  if (patientError || !patient) return { ok: false, kind: 'error' };
  if (patient.user_id !== null) return { ok: false, kind: 'error' }; // linked already (D-15)

  const { raw, digest } = createInviteToken();
  const shortCode = Math.random().toString(36).slice(2, 8).toUpperCase();

  const { error: inviteError } = await supabase.from('invitations').insert({
    org_id: patient.org_id,
    role: 'patient',
    token_digest: digest,
    short_code: shortCode,
    created_by: uid,
    patient_id: patient.id, // D-04: signup auto-connects this patient record
  });

  if (inviteError) return { ok: false, kind: 'error' };

  revalidatePath('/provider'); // invite-sent bumps last_activity_at via trigger (D-22)
  return { ok: true, link: `/invite/${raw}`, shortCode };
}
