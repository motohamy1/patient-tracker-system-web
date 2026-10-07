// src/lib/auth/actions.ts — the credential server actions (D-05, AUTH-01).
//
// Four actions, each parsing its arguments with the Zod schema in
// src/lib/auth/schemas.ts FIRST — the runtime validation of untrusted input
// per STACK.md — and only then calling Supabase Auth through the per-request
// server client (src/lib/supabase/server.ts; cookies cross from the proxy
// refresh). Identity is read through `getClaims()` where a mutation needs its
// owner; the unverified session-cookie read is never used for authorization
// anywhere (RESEARCH anti-pattern list).
//
// No-leak contract (D-05, 03-UI-SPEC §8.1, RESEARCH Pitfall 4): the result
// payload carries only a neutral failure kind — `credentials` for unknown
// email AND wrong password (zero distinction), `unconfirmed` for a
// not-yet-verified email, `rate-limited` for Supabase send/request exhaustion
// (never provider internals), `error` for anything else. Signup resolves an
// already-registered address to the SAME success shape as a fresh signup, so
// no UI reveals existence; the reset request always resolves to the same
// success shape regardless of account existence.
//
// The `next` parameter is the email link's landing path (the 03-05 invite flow
// passes an invite path; the signup surface passes the login path).
// `emailRedirectTo` is the FINAL destination, allowlisted in
// supabase/config.toml and built from the request's own origin — the
// confirmation/recovery templates in supabase/templates/ compose
// `{{ .SiteURL }}/auth/confirm?token_hash=…&next={{ .RedirectTo }}` themselves,
// so nesting another `/auth/confirm` hop inside `next` would double-verify and
// fail. The schema rejects protocol-relative and absolute `next` targets
// before anything is sent (RESEARCH Pitfall 3).

'use server';

import { headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import {
  type AuthActionResult,
  requestResetSchema,
  signInSchema,
  signUpSchema,
  updatePasswordSchema,
} from '@/lib/auth/schemas';

/** The provisioning target's site URL (supabase/config.toml site_url). */
const ORIGIN_FALLBACK = 'http://127.0.0.1:3000';

const CREDENTIALS_CODES = new Set(['invalid_credentials', 'user_not_found']);
const RATE_LIMITED_CODES = new Set([
  'over_request_rate_limit',
  'over_email_send_rate_limit',
  'over_sms_send_rate_limit',
]);

async function appOrigin(): Promise<string> {
  const headerList = await headers();
  const host = headerList.get('host');
  if (!host) return ORIGIN_FALLBACK;

  const forwardedProto = headerList.get('x-forwarded-proto')?.split(',')[0]?.trim();
  const loopback = host.startsWith('localhost') || host.startsWith('127.');
  const proto = forwardedProto ?? (loopback ? 'http' : 'https');
  return `${proto}://${host}`;
}

export async function signInAction(email: string, password: string): Promise<AuthActionResult> {
  const parsed = signInSchema.safeParse({ email, password });
  if (!parsed.success) {
    return { ok: false, kind: 'error' };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (!error) return { ok: true };

  if (error.code && CREDENTIALS_CODES.has(error.code)) return { ok: false, kind: 'credentials' };
  if (error.code === 'email_not_confirmed') return { ok: false, kind: 'unconfirmed' };
  if (error.code && RATE_LIMITED_CODES.has(error.code)) return { ok: false, kind: 'rate-limited' };
  return { ok: false, kind: 'error' };
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

  const origin = await appOrigin();
  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo: `${origin}${parsed.data.next}`,
    },
  });

  if (!error) return { ok: true };
  if (error.code === 'user_already_exists' || error.code === 'email_exists') {
    return { ok: true };
  }
  if (error.code && RATE_LIMITED_CODES.has(error.code)) return { ok: false, kind: 'rate-limited' };
  return { ok: false, kind: 'error' };
}

export async function requestResetAction(email: string): Promise<AuthActionResult> {
  const parsed = requestResetSchema.safeParse({ email });
  if (!parsed.success) {
    return { ok: false, kind: 'error' };
  }

  const origin = await appOrigin();
  const supabase = await createClient();

  // resetPasswordForEmail is non-enumerating by contract (RESEARCH Pitfall 4):
  // no UI distinction between a known and an unknown account may reach the
  // caller, so the result is the fixed success shape regardless of the
  // response (a rate-limited or failed send stays silent — same shape).
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${origin}/reset-password/update`,
  });

  void error;
  return { ok: true };
}

export async function updatePasswordAction(password: string): Promise<AuthActionResult> {
  const parsed = updatePasswordSchema.safeParse({ password });
  if (!parsed.success) {
    return { ok: false, kind: 'error' };
  }

  const supabase = await createClient();

  // getClaims verifies the recovery session before the mutation; an
  // unauthenticated caller fails closed with the neutral credentials kind.
  const { error: claimsError } = await supabase.auth.getClaims();
  if (claimsError) return { ok: false, kind: 'credentials' };

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (!error) return { ok: true };

  if (error.code && CREDENTIALS_CODES.has(error.code)) return { ok: false, kind: 'credentials' };
  if (error.code && RATE_LIMITED_CODES.has(error.code)) return { ok: false, kind: 'rate-limited' };
  return { ok: false, kind: 'error' };
}
