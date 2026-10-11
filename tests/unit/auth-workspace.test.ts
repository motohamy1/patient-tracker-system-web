// tests/unit/auth-workspace.test.ts — the resolution chain proof (AUTH-01/03, D-12).
//
// The new data layer is mocked at the module boundary (never a network call):
// the mocked session seam (`@/lib/auth/session`) serves the verified user and
// the mocked `getSql()` serves scripted membership rows — the same
// module-boundary mocking the component tests apply to motion/react.
// `server-only` and `next/navigation` are mocked too — the vitest `node`
// project has no react-server condition, and redirect() must be recorded
// rather than thrown here.
//
// Asserted: every WorkspaceResolution branch; the D-10/D-12 pick between
// multi-organization memberships; the fail-closed unknown-role row; every
// redirectForRole table row including the D-12 cross-role own-workspace
// redirect and the D-15 admin-surface non-owner redirect.
import { beforeEach, describe, expect, it, vi } from 'vitest';

const harness = vi.hoisted(() => ({
  user: undefined as { id: string; email: string } | null | undefined,
  memberships: undefined as Array<{ org_id: string; role: string; created_at: string }> | undefined,
  sql: vi.fn(),
  redirect: vi.fn(),
}));

vi.mock('server-only', () => ({}));
vi.mock('next/navigation', () => ({ redirect: harness.redirect }));
// The session seam: session.ts maps "no session" and "verification failed" to
// the same null (it never throws), so the mock only ever yields a user or null.
vi.mock('@/lib/auth/session', () => ({ getSessionUser: async () => harness.user }));
vi.mock('@/lib/db/neon', () => ({ getSql: () => harness.sql }));

// Dynamic import is required: vi.mock() is hoisted above static imports, but
// the mocked factories must be registered before these modules evaluate.
const { resolveWorkspaceRole } = await import('@/lib/auth/workspace');
const {
  CREATE_ORG_PATH,
  LOGIN_PATH,
  PATIENT_WORKSPACE_PATH,
  PROVIDER_WORKSPACE_PATH,
  redirectForRole,
} = await import('@/lib/auth/redirect');

const signedInUser = { id: '11111111-1111-1111-1111-111111111111', email: 'doc@example.com' };

beforeEach(() => {
  harness.user = signedInUser;
  harness.memberships = [];
  harness.sql.mockReset().mockImplementation(async () => harness.memberships);
  harness.redirect.mockClear();
});

function memberships(rows: Array<{ org_id: string; role: string }>): void {
  harness.memberships = rows.map((row) => ({ ...row, created_at: '2026-10-07T00:00:00Z' }));
}

describe('resolveWorkspaceRole — the discriminated result space', () => {
  it('returns unauthenticated when no verifiable session exists', async () => {
    harness.user = null;
    expect(await resolveWorkspaceRole('provider')).toEqual({ kind: 'unauthenticated' });
  });

  it('returns unaffiliated with zero membership rows', async () => {
    memberships([]);
    expect(await resolveWorkspaceRole('provider')).toEqual({ kind: 'unaffiliated' });
  });

  it('fails CLOSED on a role string outside the D-09 vocabulary', async () => {
    memberships([{ org_id: 'org-a', role: 'super_root' }]);
    expect(await resolveWorkspaceRole('provider')).toEqual({ kind: 'unaffiliated' });
  });

  it('fails CLOSED when the membership read itself errors', async () => {
    harness.sql.mockRejectedValueOnce(new Error('connection refused'));
    expect(await resolveWorkspaceRole('provider')).toEqual({ kind: 'unaffiliated' });
  });

  it('resolves the role + orgId of the group-matching membership', async () => {
    memberships([{ org_id: 'org-a', role: 'provider_doctor' }]);
    expect(await resolveWorkspaceRole('provider')).toEqual({
      kind: 'signed-in',
      role: 'provider_doctor',
      orgId: 'org-a',
    });
  });

  it('scopes the membership read to the session user, ordered earliest-first', async () => {
    memberships([{ org_id: 'org-a', role: 'provider_doctor' }]);
    await resolveWorkspaceRole('provider');
    const [strings, ...values] = harness.sql.mock.calls[0];
    const text = strings.join('?');
    expect(text).toContain('from public.memberships');
    expect(text).toContain('user_id');
    expect(text).toContain('order by created_at asc');
    expect(values).toContain(signedInUser.id);
  });

  it('picks the group-matching membership deterministically across organizations', async () => {
    // Earliest-first rows as ordered by the query (created_at ascending).
    memberships([
      { org_id: 'org-a', role: 'provider_doctor' },
      { org_id: 'org-b', role: 'nurse' },
    ]);
    expect(await resolveWorkspaceRole('provider')).toMatchObject({ orgId: 'org-a' });
  });

  it('falls back to the other kind of membership so D-12 can redirect outward', async () => {
    memberships([{ org_id: 'org-a', role: 'patient' }]);
    const result = await resolveWorkspaceRole('provider');
    expect(result).toEqual({ kind: 'signed-in', role: 'patient', orgId: 'org-a' });
  });
});

describe('redirectForRole — the D-12 table', () => {
  it('sends the unauthenticated visitor to /login', () => {
    redirectForRole('provider', { kind: 'unauthenticated' });
    expect(harness.redirect).toHaveBeenCalledWith(LOGIN_PATH);
  });

  it('sends an unaffiliated provider visitor to the D-01 org-creation route', () => {
    redirectForRole('provider', { kind: 'unaffiliated' });
    expect(harness.redirect).toHaveBeenCalledWith(CREATE_ORG_PATH);
  });

  it('sends an unaffiliated patient visitor to /login (patients join via invite, D-03)', () => {
    redirectForRole('patient', { kind: 'unaffiliated' });
    expect(harness.redirect).toHaveBeenCalledWith(LOGIN_PATH);
  });

  it('keeps a staff role inside the provider group (no redirect)', () => {
    redirectForRole('provider', { kind: 'signed-in', role: 'provider_doctor', orgId: 'org-a' });
    expect(harness.redirect).not.toHaveBeenCalled();
  });

  it('redirects a patient-role principal from a provider route to the patient workspace path', () => {
    redirectForRole('provider', { kind: 'signed-in', role: 'patient', orgId: 'org-a' });
    expect(harness.redirect).toHaveBeenCalledWith(PATIENT_WORKSPACE_PATH);
  });

  it('redirects a staff principal from a patient route to the provider workspace path', () => {
    redirectForRole('patient', { kind: 'signed-in', role: 'nurse', orgId: 'org-a' });
    expect(harness.redirect).toHaveBeenCalledWith(PROVIDER_WORKSPACE_PATH);
  });

  it('keeps a patient-role principal inside the patient group (no redirect)', () => {
    redirectForRole('patient', { kind: 'signed-in', role: 'patient', orgId: 'org-a' });
    expect(harness.redirect).not.toHaveBeenCalled();
  });

  it('treats admin_owner as a provider-group role (no redirect)', () => {
    redirectForRole('provider', { kind: 'signed-in', role: 'admin_owner', orgId: 'org-a' });
    expect(harness.redirect).not.toHaveBeenCalled();
  });

  it('keeps admin_owner inside the admin surface (no redirect)', () => {
    redirectForRole('admin', { kind: 'signed-in', role: 'admin_owner', orgId: 'org-a' });
    expect(harness.redirect).not.toHaveBeenCalled();
  });

  it('redirects every non-owner role OFF the admin surface to their own workspace (D-15)', () => {
    redirectForRole('admin', { kind: 'signed-in', role: 'provider_doctor', orgId: 'org-a' });
    expect(harness.redirect).toHaveBeenCalledWith(PROVIDER_WORKSPACE_PATH);

    redirectForRole('admin', { kind: 'signed-in', role: 'patient', orgId: 'org-a' });
    expect(harness.redirect).toHaveBeenCalledWith(PATIENT_WORKSPACE_PATH);
  });
});

describe('the workspace path constants have exactly one owner spelling', () => {
  it('exports the three product destinations as constants, not re-derived strings', () => {
    expect(LOGIN_PATH).toBe('/login');
    expect(CREATE_ORG_PATH).toBe('/provider/onboarding/create-org');
    expect(PROVIDER_WORKSPACE_PATH).toBe('/provider');
    expect(PATIENT_WORKSPACE_PATH).toBe('/patient');
  });
});
