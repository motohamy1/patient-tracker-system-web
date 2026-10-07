// src/lib/auth/invite.ts — the invite-token engine + membership Zod tables (D-02/D-03/D-04, AUTH-02).
//
// Pattern 6 (03-RESEARCH): the raw token goes in the link the owner sends;
// only the SHA-256 hex digest is persisted (invitations.token_digest); the
// digest comparison is performed inside the SQL function, so TS stores/receives
// raw only. No server-only invite state on the client, no raw token anywhere
// but the owner's one-time screen payload.
//
// Zod-first discipline (STACK.md): createInviteAction/removeMemberAction parse
// through the schemas in this file BEFORE any Supabase call; hostile tokens and
// unknown role strings are rejected at parse time, never reaching the DB. The
// schemas live here (not inside the 'use server' actions.membership.ts) for
// the same reason src/lib/auth/schemas.ts exists separately: a 'use server'
// module may only export async functions.
//
// lastAdminGuard is the ADVISORY pre-check that produces the friendly error
// shape without a DB round-trip — it never substitutes for the authoritative
// SQL guard inside remove_membership (migration 0004).

import { createHash, randomBytes } from 'node:crypto';
import { z } from 'zod';
import { ROLES, type Role } from '@/lib/auth/roles';

/** The raw invite token + its stored digest, returned once at mint time. */
export function createInviteToken(): { raw: string; digest: string } {
  const raw = randomBytes(32).toString('base64url');
  const digest = createHash('sha256').update(raw).digest('hex');
  return { raw, digest };
}

/** Format assertion for a raw invite token (base64url, ~43 chars). Never reveals existence. */
export function assertValidInviteToken(raw: string): boolean {
  return /^[A-Za-z0-9_-]{43}$/.test(raw);
}

/** The stored hex digest for a raw token — same raw → same digest, different raw → different digest. */
export function digestOf(raw: string): string {
  return createHash('sha256').update(raw).digest('hex');
}

/**
 * Advisory pre-check mirroring the migration-0004 SQL guard: a removal that
 * would leave the org with zero admin_owner memberships is refused. The SQL
 * function re-verifies this authoritatively; this predicate exists only to
 * shape the friendly error without a DB round-trip.
 */
export function lastAdminGuard(
  remainingAdminCount: number,
  targetRole: Role,
  actorIsTarget: boolean,
): boolean {
  void actorIsTarget;
  return !(targetRole === 'admin_owner' && remainingAdminCount === 0);
}

const UUID_MESSAGE = 'This organization could not be found.';
const ROLE_MESSAGE = 'Choose a valid role.';
const TOKEN_MESSAGE = 'This invite link is not valid.';

export const orgIdSchema = z.string().uuid(UUID_MESSAGE);
export const inviteRoleSchema = z.enum(ROLES);
export const inviteTokenSchema = z
  .string()
  .min(1, TOKEN_MESSAGE)
  .refine(assertValidInviteToken, TOKEN_MESSAGE);

export const createOrgSchema = z.object({
  name: z.string().trim().min(1, 'Give the organization a name.').max(120),
});

export const createInviteSchema = z.object({
  orgId: orgIdSchema,
  role: inviteRoleSchema,
  expiresInDays: z.number().int().min(1).max(365).optional(),
});

export const redeemSchema = z.object({
  email: z.email('Enter a valid email address.'),
  password: z.string().min(8, 'Use at least 8 characters.'),
  rawToken: inviteTokenSchema,
});

export const removeMemberSchema = z.object({
  membershipId: z.string().uuid('This member could not be found.'),
});

export type CreateOrgInput = z.infer<typeof createOrgSchema>;
export type CreateInviteInput = z.infer<typeof createInviteSchema>;
export type RedeemInput = z.infer<typeof redeemSchema>;
export type RemoveMemberInput = z.infer<typeof removeMemberSchema>;
