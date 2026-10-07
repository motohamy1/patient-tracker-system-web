// tests/unit/auth-actions.test.ts — the credential action layer proof
// (D-05, AUTH-01, 03-UI-SPEC §8.1 no-leak contract).
//
// Supabase is mocked at the module boundary (createClient from
// '@/lib/supabase/server'), never a network call — the same module-boundary
// mocking tests/unit/auth-workspace.test.ts established. `next/headers` is
// mocked for the origin the emailRedirectTo is built from.
//
// Asserted: the Zod-first ordering (source assertion: safeParse precedes the
// first createClient call in every action); the hostile-`next` table rows
// reject; bad credentials vs unknown email vs wrong password return a
// deeply-equal no-leak failure; signup of an existing address resolves to the
// same success shape as a fresh signup; the reset request result is identical
// for a known and an unknown (errored) email; the schema validation table
// (valid/invalid emails, short passwords, safe nexts).
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const harness = vi.hoisted(() => ({
  signInWithPassword: vi.fn(),
  signUp: vi.fn(),
  resetPasswordForEmail: vi.fn(),
  updateUser: vi.fn(),
  getClaims: vi.fn(),
  headers: vi.fn(async () => ({
    get: (name: string) => (name.toLowerCase() === 'host' ? '127.0.0.1:3000' : null),
  })),
  createClient: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: harness.createClient,
}));
vi.mock('next/headers', () => ({ headers: harness.headers }));

let actions: typeof import('@/lib/auth/actions');
let schemas: typeof import('@/lib/auth/schemas');

beforeAll(async () => {
  actions = await import('@/lib/auth/actions');
  schemas = await import('@/lib/auth/schemas');
});

beforeEach(() => {
  vi.clearAllMocks();
  harness.createClient.mockReset();
  harness.createClient.mockResolvedValue({
    auth: {
      signInWithPassword: harness.signInWithPassword,
      signUp: harness.signUp,
      resetPasswordForEmail: harness.resetPasswordForEmail,
      updateUser: harness.updateUser,
      getClaims: harness.getClaims,
    },
  });
  harness.signInWithPassword.mockReset();
  harness.signUp.mockReset();
  harness.resetPasswordForEmail.mockReset();
  harness.updateUser.mockReset();
  harness.getClaims.mockReset();
  harness.getClaims.mockResolvedValue({
    data: { claims: { sub: 'u-1' } },
    error: null,
  });
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
  const content = readFileSync(
    path.resolve(__dirname, '../../src/lib/auth/actions.ts'),
    'utf8',
  );
  const actionSpans = ACTION_NAMES.map((name, i) => {
    const start = content.indexOf(`export async function ${name}`);
    const end = i < ACTION_NAMES.length - 1
      ? content.indexOf(`export async function ${ACTION_NAMES[i + 1]}`)
      : content.length;
    return { name, body: content.slice(start, end) };
  });

  it.each(ACTION_NAMES)('%s parses with safeParse before its first supabase call', (name) => {
    const body = actionSpans.find((span) => span.name === name)?.body;
    expect(body).toBeTruthy();
    const parseAt = body!.indexOf('safeParse');
    const clientAt = body!.indexOf('createClient()');
    expect(parseAt).toBeGreaterThan(0);
    expect(clientAt).toBeGreaterThan(parseAt);
  });

  it('exports exactly the four server actions plus nothing callable', () => {
    const exports = Object.keys(actions);
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
    harness.signInWithPassword.mockResolvedValue({ data: {}, error: null });
    expect(await actions.signInAction(VALID_EMAIL, VALID_PASSWORD)).toEqual({ ok: true });
    expect(harness.signInWithPassword).toHaveBeenCalledWith({
      email: VALID_EMAIL,
      password: VALID_PASSWORD,
    });
  });

  it.each([
    ['unknown email (user_not_found)', { code: 'user_not_found', message: '' }],
    ['wrong password (invalid_credentials)', { code: 'invalid_credentials', message: '' }],
  ])('%s returns the SAME no-leak kind (%#)', async (_name, error) => {
    harness.signInWithPassword.mockResolvedValue({ data: null, error });
    expect(await actions.signInAction(VALID_EMAIL, 'wrong-password-1')).toEqual({
      ok: false,
      kind: 'credentials',
    });
  });

  it('deep-equals the unknown-email and wrong-password failures', async () => {
    harness.signInWithPassword.mockResolvedValueOnce({
      data: null,
      error: { code: 'user_not_found', message: 'a' },
    });
    const unknownEmail = await actions.signInAction('nobody@example.com', VALID_PASSWORD);

    harness.signInWithPassword.mockResolvedValueOnce({
      data: null,
      error: { code: 'invalid_credentials', message: 'b' },
    });
    const wrongPassword = await actions.signInAction(VALID_EMAIL, 'wrong-password-1');

    expect(unknownEmail).toEqual(wrongPassword);
    expect(unknownEmail).toEqual({ ok: false, kind: 'credentials' });
  });

  it('maps an unconfirmed email to its fixed kind', async () => {
    harness.signInWithPassword.mockResolvedValue({
      data: null,
      error: { code: 'email_not_confirmed', message: '' },
    });
    expect(await actions.signInAction(VALID_EMAIL, VALID_PASSWORD)).toEqual({
      ok: false,
      kind: 'unconfirmed',
    });
  });

  it('maps rate-limit exhaustion to the neutral rate-limited kind', async () => {
    harness.signInWithPassword.mockResolvedValue({
      data: null,
      error: { code: 'over_request_rate_limit', message: '' },
    });
    expect(await actions.signInAction(VALID_EMAIL, VALID_PASSWORD)).toEqual({
      ok: false,
      kind: 'rate-limited',
    });
  });

  it('maps every other provider failure to the neutral error kind (no internals)', async () => {
    harness.signInWithPassword.mockResolvedValue({
      data: null,
      error: { code: 'saml_idp_not_found', message: 'internal detail' },
    });
    expect(await actions.signInAction(VALID_EMAIL, VALID_PASSWORD)).toEqual({
      ok: false,
      kind: 'error',
    });
  });
});

describe('signUpAction — signup resolves one path either way', () => {
  it('sends emailRedirectTo as the request origin + the next path', async () => {
    harness.signUp.mockResolvedValue({ data: { user: { id: 'u-2' } }, error: null });
    await actions.signUpAction(VALID_EMAIL, VALID_PASSWORD, '/login');
    expect(harness.signUp).toHaveBeenCalledWith({
      email: VALID_EMAIL,
      password: VALID_PASSWORD,
      options: { emailRedirectTo: 'http://127.0.0.1:3000/login' },
    });
  });

  it('resolves an already-registered email to the SAME success shape (no leak)', async () => {
    harness.signUp.mockResolvedValue({
      data: null,
      error: { code: 'user_already_exists', message: '' },
    });
    expect(await actions.signUpAction(VALID_EMAIL, VALID_PASSWORD, '/login')).toEqual({ ok: true });
    expect(await actions.signUpAction('fresh@example.com', VALID_PASSWORD, '/login')).toEqual({
      ok: true,
    });
  });

  it('rejects a hostile next before any supabase call', async () => {
    for (const hostile of ['//evil', 'https://outside', 'http://outside', '/x//y']) {
      expect(await actions.signUpAction(VALID_EMAIL, VALID_PASSWORD, hostile)).toEqual({
        ok: false,
        kind: 'error',
      });
    }
    expect(harness.signUp).not.toHaveBeenCalled();
  });
});

describe('requestResetAction — identical shape regardless of account existence', () => {
  it('resets a known email and points the recovery link at /reset-password/update', async () => {
    harness.resetPasswordForEmail.mockResolvedValue({ data: {}, error: null });
    expect(await actions.requestResetAction(VALID_EMAIL)).toEqual({ ok: true });
    expect(harness.resetPasswordForEmail).toHaveBeenCalledWith(VALID_EMAIL, {
      redirectTo: 'http://127.0.0.1:3000/reset-password/update',
    });
  });

  it('renders the SAME fixed shape for an unknown email (+ rate limits)', async () => {
    harness.resetPasswordForEmail.mockResolvedValue({
      data: null,
      error: { code: 'user_not_found', message: '' },
    });
    const unknown = await actions.requestResetAction('nobody@example.com');
    expect(unknown).toEqual({ ok: true });

    harness.resetPasswordForEmail.mockResolvedValue({
      data: null,
      error: { code: 'over_email_send_rate_limit', message: '' },
    });
    expect(await actions.requestResetAction(VALID_EMAIL)).toEqual({ ok: true });
  });
});

describe('updatePasswordAction — getClaims-guarded mutation', () => {
  it('updates the password once claims verify', async () => {
    harness.updateUser.mockResolvedValue({ data: {}, error: null });
    expect(await actions.updatePasswordAction('new-password-9')).toEqual({ ok: true });
    expect(harness.updateUser).toHaveBeenCalledWith({ password: 'new-password-9' });
  });

  it('fails closed without verified claims', async () => {
    harness.getClaims.mockResolvedValue({ data: null, error: { message: '' } });
    expect(await actions.updatePasswordAction('new-password-9')).toEqual({
      ok: false,
      kind: 'credentials',
    });
    expect(harness.updateUser).not.toHaveBeenCalled();
  });

  it('rejects a short password before any supabase call', async () => {
    expect(await actions.updatePasswordAction('short')).toEqual({ ok: false, kind: 'error' });
    expect(harness.updateUser).not.toHaveBeenCalled();
  });
});
