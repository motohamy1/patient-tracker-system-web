// tests/unit/auth-invite.test.ts — the invite token engine proof (D-02, AUTH-06).
//
// Token format assertions (base64url, ~43 chars, digest differs from raw,
// same raw → same digest, different raw → different digest), the membership
// Zod tables (invalid org id / unknown role / hostile tokens rejected before
// any DB call), and the advisory lastAdminGuard table. The SQL runtime and
// guard behavior of redeem_invite/remove_membership is proven by plan 03-06
// Task 3's pgTAP acceptance suite — referenced here, not duplicated.
import { describe, expect, it } from 'vitest';
import {
  assertValidInviteToken,
  createInviteSchema,
  createInviteToken,
  createOrgSchema,
  digestOf,
  lastAdminGuard,
  redeemSchema,
  removeMemberSchema,
} from '@/lib/auth/invite';

describe('createInviteToken', () => {
  it('mints a base64url raw token of ~43 characters', () => {
    const { raw } = createInviteToken();
    expect(raw).toMatch(/^[A-Za-z0-9_-]{43}$/);
  });

  it('stores a SHA-256 hex digest that never equals the raw token', () => {
    const { raw, digest } = createInviteToken();
    expect(digest).toMatch(/^[0-9a-f]{64}$/);
    expect(digest).not.toBe(raw);
  });

  it('is deterministic: same raw → same digest, different raw → different digest', () => {
    const a = createInviteToken();
    const b = createInviteToken();
    expect(digestOf(a.raw)).toBe(a.digest);
    expect(digestOf(b.raw)).toBe(b.digest);
    expect(a.digest).not.toBe(b.digest);
  });

  it('assertValidInviteToken accepts exactly the minted shape and rejects hosts', () => {
    const { raw } = createInviteToken();
    expect(assertValidInviteToken(raw)).toBe(true);
    expect(assertValidInviteToken('not-a-token')).toBe(false);
    expect(assertValidInviteToken('a'.repeat(43) + '!')).toBe(false);
    expect(assertValidInviteToken('')).toBe(false);
  });
});

describe('membership Zod tables', () => {
  const VALID_UUID = '11111111-1111-4111-8111-111111111111';

  it('createOrgSchema trims and requires a name', () => {
    expect(createOrgSchema.safeParse({ name: '  Practice  ' }).success).toBe(true);
    expect(createOrgSchema.safeParse({ name: '   ' }).success).toBe(false);
  });

  it('createInviteSchema rejects unknown role strings and invalid org ids', () => {
    expect(createInviteSchema.safeParse({ orgId: VALID_UUID, role: 'superuser' }).success).toBe(false);
    expect(createInviteSchema.safeParse({ orgId: 'not-a-uuid', role: 'nurse' }).success).toBe(false);
    expect(createInviteSchema.safeParse({ orgId: VALID_UUID, role: 'admin_owner', expiresInDays: 7 }).success).toBe(true);
  });

  it('redeemSchema rejects hostile tokens before any DB call', () => {
    const ok = createInviteToken();
    expect(
      redeemSchema.safeParse({ email: 'a@b.co', password: 'password123', rawToken: ok.raw }).success,
    ).toBe(true);
    expect(
      redeemSchema.safeParse({ email: 'a@b.co', password: 'password123', rawToken: '../../etc/passwd' }).success,
    ).toBe(false);
    expect(
      redeemSchema.safeParse({ email: 'a@b.co', password: 'short', rawToken: ok.raw }).success,
    ).toBe(false);
    expect(
      redeemSchema.safeParse({ email: 'not-an-email', password: 'password123', rawToken: ok.raw }).success,
    ).toBe(false);
  });

  it('removeMemberSchema requires a uuid membership id', () => {
    expect(removeMemberSchema.safeParse({ membershipId: VALID_UUID }).success).toBe(true);
    expect(removeMemberSchema.safeParse({ membershipId: 'xyz' }).success).toBe(false);
  });
});

describe('lastAdminGuard (advisory pre-check only)', () => {
  type Row = { remaining: number; targetRole: 'admin_owner' | 'nurse' | 'provider_doctor' | 'receptionist' | 'patient'; actorIsTarget: boolean; allowed: boolean };
  const rows: Row[] = [
    { remaining: 0, targetRole: 'admin_owner', actorIsTarget: true, allowed: false },
    { remaining: 0, targetRole: 'admin_owner', actorIsTarget: false, allowed: false },
    { remaining: 1, targetRole: 'admin_owner', actorIsTarget: true, allowed: true },
    { remaining: 2, targetRole: 'admin_owner', actorIsTarget: false, allowed: true },
    { remaining: 0, targetRole: 'nurse', actorIsTarget: false, allowed: true },
    { remaining: 0, targetRole: 'patient', actorIsTarget: true, allowed: true },
  ];
  for (const row of rows) {
    it(`remaining=${row.remaining} target=${row.targetRole} actorIsTarget=${row.actorIsTarget} → allowed=${row.allowed}`, () => {
      expect(lastAdminGuard(row.remaining, row.targetRole, row.actorIsTarget)).toBe(row.allowed);
    });
  }
});
