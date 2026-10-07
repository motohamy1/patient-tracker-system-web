// src/lib/auth/actions.membership.ts — the membership server actions (D-01..D-04, AUTH-02/05/06).
//
// Four actions, each parsing its arguments with the Zod tables in
// src/lib/auth/invite.ts FIRST (the same Zod-first discipline as
// src/lib/auth/actions.ts), and only then touching Supabase. Session state is
// resolved through getClaims() plus the caller's own membership row — the
// canonical role never comes from a client payload.
//
// createOrgAction: the D-01 owner bootstrap. The insert's RLS with-check
// (created_by = auth.uid()) is the enforcement layer.
//
// createInviteAction: requires CAN_MANAGE_MEMBERSHIP resolved via
// claims → memberships → role (the resolveWorkspaceRole shape); the raw token
// returns ONLY to the owner's screen; only the digest is persisted. The 0003
// invitations INSERT trigger audits the row automatically.
//
// redeemSignupWithInviteAction: signup + session + redeem_invite RPC in ONE
// action so a half-complete signup can never join; every failure — invalid,
// expired, used, nonexistent, or transient — maps to the SAME neutral kind
// ('invite'), so no token-existence or org identity ever leaks.
//
// removeMemberAction: the caller must be admin_owner in the SAME org as the
// target with CAN_MANAGE_MEMBERSHIP; the last-admin pre-flight is ADVISORY
// only — the migration-0004 definer function re-enforces same-org +
// admin_owner + last-admin in SQL, and is the ONLY legal memberships delete
// path (0002 granted no delete). The 0003 DELETE trigger audits the row.

'use server';

import { headers } from 'next/headers';
import { CAN_MANAGE_MEMBERSHIP, runsCapability } from '@/lib/auth/capabilities';
import { createInviteToken, createInviteSchema, createOrgSchema, lastAdminGuard, redeemSchema, removeMemberSchema } from '@/lib/auth/invite';
import { ROLES, type Role } from '@/lib/auth/roles';
import { createClient } from '@/lib/supabase/server';

const ORIGIN_FALLBACK = 'http://127.0.0.1:3000';

async function appOrigin(): Promise<string> {
  const headerList = await headers();
  const host = headerList.get('host');
  if (!host) return ORIGIN_FALLBACK;
  const forwardedProto = headerList.get('x-forwarded-proto')?.split(',')[0]?.trim();
  const loopback = host.startsWith('localhost') || host.startsWith('127.');
  const proto = forwardedProto ?? (loopback ? 'http' : 'https');
  return `${proto}://${host}`;
}

export type MembershipActionResult =
  | { ok: true; organization: string; role: Role }
  | { ok: true; link: string; shortCode: string | null; expiresAt: string | null }
  | { ok: true }
  | { ok: false; kind: 'forbidden' | 'last-admin' | 'invite' | 'error' };

async function resolveOrgRole(orgId: string): Promise<{ uid: string; role: Role } | null> {
  const supabase = await createClient();
  const { data, error: claimsError } = await supabase.auth.getClaims();
  const uid = claimsError ? null : (data?.claims?.sub ?? null);
  if (!uid) return null;

  const { data: rows } = await supabase
    .from('memberships')
    .select('org_id, role')
    .eq('user_id', uid)
    .eq('org_id', orgId);

  const match = (rows ?? []).find((row) => (ROLES as readonly string[]).includes(row.role));
  return match ? { uid, role: match.role as Role } : null;
}

export async function createOrgAction(name: string): Promise<MembershipActionResult> {
  const parsed = createOrgSchema.safeParse({ name });
  if (!parsed.success) return { ok: false, kind: 'error' };

  const supabase = await createClient();
  const { data, error: claimsError } = await supabase.auth.getClaims();
  const uid = claimsError ? null : (data?.claims?.sub ?? null);
  if (!uid) return { ok: false, kind: 'forbidden' };

  const { error } = await supabase.from('organizations').insert({ name: parsed.data.name, created_by: uid });
  return error ? { ok: false, kind: 'error' } : { ok: true };
}

export async function createInviteAction(
  orgId: string,
  role: string,
  expiresInDays?: number,
): Promise<MembershipActionResult> {
  const parsed = createInviteSchema.safeParse({ orgId, role, expiresInDays });
  if (!parsed.success) return { ok: false, kind: 'error' };

  const actor = await resolveOrgRole(parsed.data.orgId);
  if (!actor || !runsCapability(actor.role, CAN_MANAGE_MEMBERSHIP)) {
    return { ok: false, kind: 'forbidden' };
  }

  const { raw, digest } = createInviteToken();
  const shortCode = randomShortCode();
  const expiresAt = parsed.data.expiresInDays
    ? new Date(Date.now() + parsed.data.expiresInDays * 86_400_000).toISOString()
    : null;

  const supabase = await createClient();
  const { error } = await supabase.from('invitations').insert({
    org_id: parsed.data.orgId,
    role: parsed.data.role,
    token_digest: digest,
    short_code: shortCode,
    created_by: actor.uid,
    expires_at: expiresAt,
  });
  if (error) return { ok: false, kind: 'error' };

  return { ok: true, link: `/invite/${raw}`, shortCode, expiresAt };
}

function randomShortCode(): string {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

export async function redeemSignupWithInviteAction(
  email: string,
  password: string,
  rawToken: string,
): Promise<MembershipActionResult> {
  const parsed = redeemSchema.safeParse({ email, password, rawToken });
  if (!parsed.success) return { ok: false, kind: 'invite' };

  const origin = await appOrigin();
  const supabase = await createClient();

  const { error: signUpError } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: { emailRedirectTo: `${origin}/invite/${parsed.data.rawToken}` },
  });
  if (signUpError) {
    const code = signUpError.code ?? '';
    const known = code === 'user_already_exists' || code === 'email_exists';
    const limited = code.startsWith('over_');
    if (!known && !limited) return { ok: false, kind: 'invite' };
    if (limited) return { ok: false, kind: 'error' };
  }

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });
  if (signInError) return { ok: false, kind: 'invite' };

  const { data, error: rpcError } = await supabase.rpc('redeem_invite', {
    p_raw_token: parsed.data.rawToken,
  });
  if (rpcError) return { ok: false, kind: 'invite' };

  const payload = data as { organization?: string; orgName?: string; role?: Role; orgId?: string } | null;
  const organization = payload?.organization ?? payload?.orgName;
  const role = payload?.role;
  if (!organization || !role) return { ok: false, kind: 'invite' };

  return { ok: true, organization, role };
}

export async function removeMemberAction(membershipId: string): Promise<MembershipActionResult> {
  const parsed = removeMemberSchema.safeParse({ membershipId });
  if (!parsed.success) return { ok: false, kind: 'error' };

  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const uid = claimsError ? null : (claimsData?.claims?.sub ?? null);
  if (!uid) return { ok: false, kind: 'forbidden' };

  const { data: target } = await supabase
    .from('memberships')
    .select('id, org_id, role, user_id')
    .eq('id', parsed.data.membershipId)
    .maybeSingle();
  if (!target) return { ok: false, kind: 'error' };

  const actor = await resolveOrgRole(target.org_id);
  if (!actor || actor.role !== 'admin_owner' || !runsCapability(actor.role, CAN_MANAGE_MEMBERSHIP)) {
    return { ok: false, kind: 'forbidden' };
  }

  if (target.role === 'admin_owner') {
    const { data: admins } = await supabase
      .from('memberships')
      .select('id')
      .eq('org_id', target.org_id)
      .eq('role', 'admin_owner');
    const remaining = (admins ?? []).filter((row) => row.id !== target.id).length;
    if (!lastAdminGuard(remaining, target.role as Role, target.user_id === actor.uid)) {
      return { ok: false, kind: 'last-admin' };
    }
  }

  const { error } = await supabase.rpc('remove_membership', { p_membership_id: parsed.data.membershipId });
  return error ? { ok: false, kind: 'error' } : { ok: true };
}
