// tests/unit/auth-actions.test.ts — the credential action layer proof
// (D-05, AUTH-01, 03-UI-SPEC §8.1 no-leak contract).
//
// Managed Neon Auth is mocked at the module boundary ('@/lib/auth/server'),
// never a network call. Asserted: the Zod-first ordering (source assertion:
// safeParse precedes the first auth call in every action); the hostile-`next`
// table rows reject; bad credentials vs unknown email vs wrong password return
// a deeply-equal no-leak failure; signup of an existing address resolves to the
// same success shape as a fresh signup; the reset request result is identical
// for a known and an unknown (errored) email; the schema validation table.
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import type * as ActionsModule from '@/lib/auth/actions';
import type * as SchemasModule from '@/lib/auth/schemas';

const harness = vi.hoisted(() => ({
  signInEmail: vi.fn(),
  signUpEmail: vi.fn(),
  requestPasswordReset: vi.fn(),
  resetPassword: vi.fn(),
}));

vi.mock('@/lib/auth/server', () => ({
  auth: {
    signIn: { email: harness.signInEmail },
    signUp: { email: harness.signUpEmail },
    requestPasswordReset: harness.requestPasswordReset,
    resetPassword: harness.resetPassword,
  },
}));

let actions: typeof ActionsModule;
let schemas: typeof SchemasModule;

beforeAll(async () => {
  actions = await import('@/lib/auth/actions');
  schemas = await import('@/lib/auth/schemas');
});

beforeEach(() => {
  vi.clearAllMocks();
  harness.signInEmail.mockReset().mockResolvedValue({ data: {}, error: null });
  harness.signUpEmail.mockReset().mockResolvedValue({ data: {}, error: null });
  harness.requestPasswordReset.mockReset().mockResolvedValue({ data: {}, error: null });
  harness.resetPassword.mockReset().mockResolvedValue({ data: {}, error: null });
});

const VALID_EMAIL = 'owner@example.com';
const VALID_PASSWORD = 'long-enough-8';

describe('schemas — the validation table (D-05)', () => {
  it.each([
    ['owner@example.com', true],
    ['owner@example', false],
    ['not-an-email', false],
    ['', false],
  ])('email %j → %j', (email, valid) => {
    expect(schemas.emailSchema.safeParse(email).success).toBe(valid);
  });

  it.each([
    ['long-enough-8', true],
    ['short', false],
    ['', false],
  ])('password %j → %j', (password, valid) => {
    expect(schemas.passwordSchema.safeParse(password).success).toBe(valid);
  });

  it.each([
    ['/', true],
    ['/login', true],
    ['/signup/check-email', true],
    ['//evil', false],
    ['https://outside', false],
    ['http://outside', false],
    ['relative-path', false],
    ['/login//extra', false],
  ])('next %j → %j', (next, valid) => {
    expect(schemas.safeNextSchema.safeParse(next).success).toBe(valid);
  });
});

describe('the Zod-first source ordering (source assertion)', () => {
  const ACTION_NAMES = [
    'signInAction',
    'signUpAction',
    'requestResetAction',
    'updatePasswordAction',
  ];
  const content = readFileSync(path.resolve(__dirname, '../../src/lib/auth/actions.ts'), 'utf8');
  const actionSpans = ACTION_NAMES.map((name, i) => {
    const start = content.indexOf(`export async function ${name}`);
    const end =
      i < ACTION_NAMES.length - 1
        ? content.indexOf(`export async function ${ACTION_NAMES[i + 1]}`)
        : content.length;
    return { name, body: content.slice(start, end) };
  });

  it.each(ACTION_NAMES)('%s parses with safeParse before its first auth call', (name) => {
    const body = actionSpans.find((span) => span.name === name)?.body;
    expect(body).toBeTruthy();
    const parseAt = body!.indexOf('safeParse');
    const authAt = body!.indexOf('auth.');
    expect(parseAt).toBeGreaterThan(0);
    expect(authAt).toBeGreaterThan(parseAt);
  });

  it('exports exactly the four server actions plus nothing callable', () => {
    const exports = Object.keys(actions).filter((key) => typeof actions[key as never] === 'function');
    expect(exports.sort()).toEqual([
      'requestResetAction',
      'signInAction',
      'signUpAction',
      'updatePasswordAction',
    ]);
  });
});

describe('signInAction — the no-leak mapping', () => {
  it('resolves a confirmed account to ok', async () => {
    expect(await actions.signInAction(VALID_EMAIL, VALID_PASSWORD)).toEqual({ ok: true });
    expect(harness.signInEmail).toHaveBeenCalledWith({
      email: VALID_EMAIL,
      password: VALID_PASSWORD,
    });
  });

  it.each([
    ['unknown email', { code: 'user_not_found', message: '' }],
    ['wrong password', { code: 'invalid_credentials', message: '' }],
    ['invalid credentials copy', { code: '', message: 'Invalid email or password' }],
  ])('%s returns the SAME no-leak kind (%#)', async (_name, error) => {
    harness.signInEmail.mockResolvedValue({ data: null, error });
    expect(await actions.signInAction(VALID_EMAIL, 'wrong-password-1')).toEqual({
      ok: false,
      kind: 'credentials',
    });
  });

  it('deep-equals the unknown-email and wrong-password failures', async () => {
    harness.signInEmail.mockResolvedValueOnce({
      data: null,
      error: { code: 'user_not_found', message: 'a' },
    });
    const unknownEmail = await actions.signInAction('nobody@example.com', VALID_PASSWORD);

    harness.signInEmail.mockResolvedValueOnce({
      data: null,
      error: { code: 'invalid_credentials', message: 'b' },
    });
    const wrongPassword = await actions.signInAction(VALID_EMAIL, 'wrong-password-1');

    expect(unknownEmail).toEqual(wrongPassword);
    expect(unknownEmail).toEqual({ ok: false, kind: 'credentials' });
  });

  it('maps an unconfirmed email to its fixed kind', async () => {
    harness.signInEmail.mockResolvedValue({
      data: null,
      error: { code: 'email_not_verified', message: '' },
    });
    expect(await actions.signInAction(VALID_EMAIL, VALID_PASSWORD)).toEqual({
      ok: false,
      kind: 'unconfirmed',
    });
  });

  it('maps rate-limit exhaustion to the neutral rate-limited kind', async () => {
    harness.signInEmail.mockResolvedValue({
      data: null,
      error: { code: 'too_many_requests', message: '' },
    });
    expect(await actions.signInAction(VALID_EMAIL, VALID_PASSWORD)).toEqual({
      ok: false,
      kind: 'rate-limited',
    });
  });

  it('maps every other provider failure to the neutral error kind (no internals)', async () => {
    harness.signInEmail.mockResolvedValue({
      data: null,
      error: { code: 'saml_idp_not_found', message: 'internal detail' },
    });
    expect(await actions.signInAction(VALID_EMAIL, VALID_PASSWORD)).toEqual({
      ok: false,
      kind: 'error',
    });
  });

  it('treats a thrown transport failure as the neutral error kind', async () => {
    harness.signInEmail.mockRejectedValue(new Error('connect ECONNREFUSED'));
    expect(await actions.signInAction(VALID_EMAIL, VALID_PASSWORD)).toEqual({
      ok: false,
      kind: 'error',
    });
  });
});

describe('signUpAction — signup resolves one path either way', () => {
  it('passes the callback path through to the provider', async () => {
    await actions.signUpAction(VALID_EMAIL, VALID_PASSWORD, '/login');
    expect(harness.signUpEmail).toHaveBeenCalledWith({
      name: VALID_EMAIL,
      email: VALID_EMAIL,
      password: VALID_PASSWORD,
      callbackURL: '/login',
    });
  });

  it('resolves an already-registered email to the SAME success shape (no leak)', async () => {
    harness.signUpEmail.mockResolvedValue({
      data: null,
      error: { code: 'user_already_exists', message: '' },
    });
    expect(await actions.signUpAction(VALID_EMAIL, VALID_PASSWORD, '/login')).toEqual({ ok: true });
    expect(await actions.signUpAction('fresh@example.com', VALID_PASSWORD, '/login')).toEqual({
      ok: true,
    });
  });

  it('rejects a hostile next before any auth call', async () => {
    for (const hostile of ['//evil', 'https://outside', 'http://outside', '/x//y']) {
      expect(await actions.signUpAction(VALID_EMAIL, VALID_PASSWORD, hostile)).toEqual({
        ok: false,
        kind: 'error',
      });
    }
    expect(harness.signUpEmail).not.toHaveBeenCalled();
  });
});

describe('requestResetAction — identical shape regardless of account existence', () => {
  it('resets a known email and points the recovery link at /reset-password/update', async () => {
    expect(await actions.requestResetAction(VALID_EMAIL)).toEqual({ ok: true });
    expect(harness.requestPasswordReset).toHaveBeenCalledWith({
      email: VALID_EMAIL,
      redirectTo: '/reset-password/update',
    });
  });

  it('renders the SAME fixed shape for an unknown email (+ rate limits)', async () => {
    harness.requestPasswordReset.mockResolvedValue({
      data: null,
      error: { code: 'user_not_found', message: '' },
    });
    expect(await actions.requestResetAction('nobody@example.com')).toEqual({ ok: true });

    harness.requestPasswordReset.mockRejectedValue(new Error('rate limited'));
    expect(await actions.requestResetAction(VALID_EMAIL)).toEqual({ ok: true });
  });
});

describe('updatePasswordAction — token-authorised reset', () => {
  it('completes the reset with the emailed token', async () => {
    expect(await actions.updatePasswordAction('new-password-9', 'tok-1')).toEqual({ ok: true });
    expect(harness.resetPassword).toHaveBeenCalledWith({
      newPassword: 'new-password-9',
      token: 'tok-1',
    });
  });

  it('fails closed without a token', async () => {
    expect(await actions.updatePasswordAction('new-password-9', '')).toEqual({
      ok: false,
      kind: 'credentials',
    });
    expect(harness.resetPassword).not.toHaveBeenCalled();
  });

  it('rejects a short password before any auth call', async () => {
    expect(await actions.updatePasswordAction('short', 'tok-1')).toEqual({
      ok: false,
      kind: 'error',
    });
    expect(harness.resetPassword).not.toHaveBeenCalled();
  });
});
