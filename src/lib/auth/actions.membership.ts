// src/lib/auth/actions.membership.ts — the membership server actions (D-01..D-04, AUTH-02/05/06).
//
// Four actions, each parsing its arguments with the Zod tables in
// src/lib/auth/invite.ts FIRST (the same Zod-first discipline as
// src/lib/auth/actions.ts), and only then touching Lakebase Postgres via
// getSql(). Session identity comes from the Managed Auth session — the
// canonical role never comes from a client payload.
//
// createOrgAction: the D-01 owner bootstrap. The organizations INSERT trigger
// (bootstrap_org_membership, ported from migration 0004) creates the
// admin_owner row atomically; the action ALSO writes that row defensively with
// ON CONFLICT DO NOTHING and asserts it exists, so a trigger that was never
// applied cannot leave an owner-less org (the creator would then resolve
// `unaffiliated` forever and be bounced back to onboarding).
//
// createInviteAction: requires CAN_MANAGE_MEMBERSHIP resolved via
// session → memberships → role; the raw token returns ONLY to the owner's
// screen; only the digest is persisted. The invitations INSERT trigger audits
// the row automatically.
//
// redeemSignupWithInviteAction: signup + session + invite redemption in ONE
// action so a half-complete signup can never join; every failure — invalid,
// expired, used, nonexistent, or transient — maps to the SAME neutral kind
// ('invite'), so no token-existence or org identity ever leaks.
//
// removeMemberAction: the caller must be admin_owner in the SAME org as the
// target with CAN_MANAGE_MEMBERSHIP; the last-admin pre-flight is ADVISORY
// only — the ported remove_membership function re-enforces same-org +
// admin_owner + last-admin in SQL. Writes run under SET LOCAL app.user_id so
// the audit triggers attribute the actor.

'use server';

import { CAN_MANAGE_MEMBERSHIP, runsCapability } from '@/lib/auth/capabilities';
import { createInviteToken, createInviteSchema, createOrgSchema, lastAdminGuard, redeemSchema, removeMemberSchema } from '@/lib/auth/invite';
import { ROLES, type Role } from '@/lib/auth/roles';
import { auth } from '@/lib/auth/server';
import { getSessionUser } from '@/lib/auth/session';
import { getSql } from '@/lib/db/neon';
import { withAppUser } from '@/lib/db/client';

export type MembershipActionResult =
  | { ok: true; organization: string; role: Role }
  | { ok: true; link: string; shortCode: string | null; expiresAt: string | null }
  | { ok: true }
  | { ok: false; kind: 'forbidden' | 'last-admin' | 'invite' | 'error' };

async function resolveOrgRole(orgId: string): Promise<{ uid: string; role: Role } | null> {
  const user = await getSessionUser();
  if (!user) return null;

  const sql = getSql();
  const rows = (await sql`
    select role from public.memberships
    where user_id = ${user.id} and org_id = ${orgId}
  `) as unknown as { role: string }[];

  const match = rows.find((row) => (ROLES as readonly string[]).includes(row.role));
  return match ? { uid: user.id, role: match.role as Role } : null;
}

export async function createOrgAction(name: string): Promise<MembershipActionResult> {
  const parsed = createOrgSchema.safeParse({ name });
  if (!parsed.success) return { ok: false, kind: 'error' };

  const user = await getSessionUser();
  if (!user) return { ok: false, kind: 'forbidden' };

  try {
    await withAppUser(user.id, async (tx) => {
      const inserted = await tx.query<{ id: string }>(
        `insert into public.organizations (name, created_by) values ($1, $2) returning id`,
        [parsed.data.name, user.id],
      );
      const orgId = inserted.rows[0]?.id;
      if (!orgId) throw new Error('org_insert_returned_no_id');

      // The owner's `admin_owner` membership is normally written by the
      // bootstrap_org_membership trigger on public.organizations (baseline,
      // ported from migration 0004). Insert it here as well with ON CONFLICT DO
      // NOTHING: a trigger that was never applied (or dropped) otherwise leaves
      // an ORPHAN org with no members, so the creator keeps resolving
      // `unaffiliated` and is bounced from /provider/members straight back to
      // this onboarding screen — the observed "created the org but I'm still
      // asked to create one" bug. The conflict target makes this a no-op when
      // the trigger did fire.
      await tx.query(
        `insert into public.memberships (org_id, user_id, role)
         values ($1, $2, 'admin_owner')
         on conflict (org_id, user_id) do nothing`,
        [orgId, user.id],
      );

      const owned = await tx.query<{ present: number }>(
        `select 1 as present from public.memberships
         where org_id = $1 and user_id = $2 and role = 'admin_owner'`,
        [orgId, user.id],
      );
      if (owned.rows.length === 0) throw new Error('owner_membership_missing');
    });
    return { ok: true };
  } catch {
    return { ok: false, kind: 'error' };
  }
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

  try {
    await withAppUser(actor.uid, async (tx) => {
      await tx.query(
        `insert into public.invitations (org_id, role, token_digest, short_code, created_by, expires_at)
         values ($1, $2, $3, $4, $5, $6)`,
        [parsed.data.orgId, parsed.data.role, digest, shortCode, actor.uid, expiresAt],
      );
    });
  } catch {
    return { ok: false, kind: 'error' };
  }

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

  // Sign up through Managed Auth first; unverified accounts cannot redeem
  // (the redeem function requires SET LOCAL identity from a session).
  try {
    const signedUp = await auth.signUp.email({
      name: parsed.data.email,
      email: parsed.data.email,
      password: parsed.data.password,
    });
    if (signedUp.error) return { ok: false, kind: 'invite' };
  } catch {
    return { ok: false, kind: 'invite' };
  }

  try {
    const signedIn = await auth.signIn.email({
      email: parsed.data.email,
      password: parsed.data.password,
    });
    if (signedIn.error) return { ok: false, kind: 'invite' };
  } catch {
    return { ok: false, kind: 'invite' };
  }

  const user = await getSessionUser();
  if (!user) return { ok: false, kind: 'invite' };

  try {
    const result = await withAppUser(user.id, async (tx) => {
      const { rows } = await tx.query<{ payload: { organization?: string; orgName?: string; role?: Role } }>(
        `select public.redeem_invite($1) as payload`,
        [parsed.data.rawToken],
      );
      return rows[0]?.payload ?? null;
    });
    const organization = result?.organization ?? result?.orgName;
    const role = result?.role;
    if (!organization || !role) return { ok: false, kind: 'invite' } as const;
    return { ok: true, organization, role } as const;
  } catch {
    return { ok: false, kind: 'invite' };
  }
}

export async function removeMemberAction(membershipId: string): Promise<MembershipActionResult> {
  const parsed = removeMemberSchema.safeParse({ membershipId });
  if (!parsed.success) return { ok: false, kind: 'error' };

  const user = await getSessionUser();
  if (!user) return { ok: false, kind: 'forbidden' };

  const sql = getSql();
  const targets = (await sql`
    select id, org_id, role, user_id from public.memberships
    where id = ${parsed.data.membershipId}
    limit 1
  `) as unknown as { id: string; org_id: string; role: string; user_id: string }[];
  const target = targets[0];
  if (!target) return { ok: false, kind: 'error' };

  const actor = await resolveOrgRole(target.org_id);
  if (!actor || actor.role !== 'admin_owner' || !runsCapability(actor.role, CAN_MANAGE_MEMBERSHIP)) {
    return { ok: false, kind: 'forbidden' };
  }

  if (target.role === 'admin_owner') {
    const admins = (await sql`
      select id from public.memberships
      where org_id = ${target.org_id} and role = 'admin_owner'
    `) as unknown as { id: string }[];
    const remaining = admins.filter((row) => row.id !== target.id).length;
    if (!lastAdminGuard(remaining, target.role as Role, target.user_id === actor.uid)) {
      return { ok: false, kind: 'last-admin' };
    }
  }

  try {
    await withAppUser(actor.uid, async (tx) => {
      await tx.query(`select public.remove_membership($1)`, [parsed.data.membershipId]);
    });
    return { ok: true };
  } catch {
    return { ok: false, kind: 'error' };
  }
}
