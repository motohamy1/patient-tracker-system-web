// src/lib/auth/actions.ts — the credential server actions (D-05, Managed Neon Auth).
//
// Four actions, each parsing its arguments with the Zod schema in
// src/lib/auth/schemas.ts FIRST — the runtime validation of untrusted input
// per STACK.md — and only then calling Managed Auth (src/lib/auth/server.ts;
// the session cookie is set through the /api/auth/[...all] handler).
// Identity for mutations comes from the verified session (session.ts), never
// an unverified read.
//
// No-leak contract (D-05, 03-UI-SPEC §8.1, RESEARCH Pitfall 4): the result
// payload carries only a neutral failure kind — `credentials` for unknown
// email AND wrong password (zero distinction), `unconfirmed` for a
// not-yet-verified email, `rate-limited` for send/request exhaustion (never
// provider internals), `error` for anything else. Signup resolves an
// already-registered address to the SAME success shape as a fresh signup, so
// no UI reveals existence; the reset request always resolves to the same
// success shape regardless of account existence.
//
// The `next` parameter is the post-verification landing path (the 03-05 invite
// flow passes an invite path; the signup surface passes the login path). The
// schema rejects protocol-relative and absolute `next` targets before anything
// is sent (RESEARCH Pitfall 3).

'use server';

import { auth } from '@/lib/auth/server';
import {
  type AuthActionResult,
  requestResetSchema,
  signInSchema,
  signUpSchema,
  updatePasswordSchema,
} from '@/lib/auth/schemas';

/** The callback URL for email verification / reset links. */
const CALLBACK_FALLBACK = '/login';

type AuthErrorLike = { error?: { code?: string; message?: string } | null; message?: string };

function errorCode(result: AuthErrorLike, thrown: unknown): string {
  const code = result.error?.code ?? '';
  const message = result.error?.message ?? (thrown instanceof Error ? thrown.message : '');
  return `${code} ${message}`.toLowerCase();
}

// Exact upstream codes only. A substring like 'invalid' or 'not_found' also
// matches unrelated provider errors (e.g. `saml_idp_not_found`), which would
// misclassify them as credentials — the sets below are the deliberate allowlist.
const CREDENTIAL_CODES = [
  'invalid_credentials',
  'user_not_found',
  'invalid_email_or_password',
  'invalid_password',
  'invalid email or password',
];
const UNCONFIRMED_CODES = ['email_not_verified', 'email_not_confirmed', 'unverified', 'not_verified'];
const RATE_LIMIT_CODES = ['too_many_requests', 'over_request_rate_limit', 'over_email_send_rate_limit', 'rate_limit'];

function failureOf(result: AuthErrorLike, thrown: unknown): AuthActionResult {
  const haystack = errorCode(result, thrown);
  if (CREDENTIAL_CODES.some((code) => haystack.includes(code))) {
    return { ok: false, kind: 'credentials' };
  }
  if (UNCONFIRMED_CODES.some((code) => haystack.includes(code))) {
    return { ok: false, kind: 'unconfirmed' };
  }
  if (RATE_LIMIT_CODES.some((code) => haystack.includes(code))) {
    return { ok: false, kind: 'rate-limited' };
  }
  return { ok: false, kind: 'error' };
}

/** next must stay a safe in-app path; the open-redirect guard lives in the schema. */
function callbackURL(next: string): string {
  return next.startsWith('/') && !next.startsWith('//') ? next : CALLBACK_FALLBACK;
}

export async function signInAction(email: string, password: string): Promise<AuthActionResult> {
  const parsed = signInSchema.safeParse({ email, password });
  if (!parsed.success) {
    return { ok: false, kind: 'error' };
  }

  try {
    const result = await auth.signIn.email({
      email: parsed.data.email,
      password: parsed.data.password,
    });
    if (result.error) return failureOf(result, null);
    return { ok: true };
  } catch (error) {
    return failureOf({}, error);
  }
}

export async function signUpAction(
  email: string,
  password: string,
  next: string = '/',
): Promise<AuthActionResult> {
  const parsed = signUpSchema.safeParse({ email, password, next });
  if (!parsed.success) {
    return { ok: false, kind: 'error' };
  }

  try {
    const result = await auth.signUp.email({
      name: parsed.data.email,
      email: parsed.data.email,
      password: parsed.data.password,
      callbackURL: callbackURL(parsed.data.next),
    });
    // Already-registered address resolves to the same success shape (no-leak).
    if (result.error) {
      const haystack = errorCode(result, null);
      if (haystack.includes('exists') || haystack.includes('already')) return { ok: true };
      return failureOf(result, null);
    }
    return { ok: true };
  } catch (error) {
    return failureOf({}, error);
  }
}

export async function requestResetAction(email: string): Promise<AuthActionResult> {
  const parsed = requestResetSchema.safeParse({ email });
  if (!parsed.success) {
    return { ok: false, kind: 'error' };
  }

  // Non-enumerating by contract: the same success shape regardless of account
  // existence or send outcome — a rate-limited or failed send stays silent.
  try {
    await auth.requestPasswordReset({
      email: parsed.data.email,
      redirectTo: '/reset-password/update',
    });
  } catch {
    // Silent by design — no UI distinction may leak account existence.
  }
  return { ok: true };
}

/**
 * Completes a password reset. `token` comes from the reset email link
 * (Managed Auth redirects to /reset-password/update?token=…); the upstream
 * reset-password endpoint takes the token as the authority, so no session is
 * required.
 */
export async function updatePasswordAction(
  password: string,
  token: string,
): Promise<AuthActionResult> {
  const parsed = updatePasswordSchema.safeParse({ password });
  if (!parsed.success) {
    return { ok: false, kind: 'error' };
  }
  if (!token) return { ok: false, kind: 'credentials' };

  try {
    const result = await auth.resetPassword({
      newPassword: parsed.data.password,
      token,
    });
    if (result.error) return failureOf(result, null);
    return { ok: true };
  } catch (error) {
    return failureOf({}, error);
  }
}
