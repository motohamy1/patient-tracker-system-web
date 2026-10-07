// src/lib/auth/schemas.ts — the credential Zod vocabularies (D-05, AUTH-01).
//
// Zod-first contract (STACK.md): every credential server action parses untrusted
// input through the schema in this file BEFORE any Supabase call. The schemas
// live here — not inside src/lib/auth/actions.ts — because a `use server`
// module may only export async functions, while the CLIENT surfaces
// (login-form/signup-form) parse the same schemas for inline field errors, so
// one vocabulary serves both sides. No message, code or result string here
// reveals whether an email has an account (Pitfall 4 no-leak).
//
// Posture: the schema is pre-validation, never a policy — Supabase enforces its
// own stronger rules server-side. Password minimum is 8 characters (D-05
// credential surface); the `next` email-redirect parameter is a path beginning
// with a single slash and no double slash — protocol-relative (`//evil`) and
// absolute (`https://outside`) targets are rejected, which is the open-redirect
// guard (03-RESEARCH.md Pitfall 3).

import { z } from 'zod';

export const EMAIL_VALIDATION_MESSAGE = 'Enter a valid email address.';
export const PASSWORD_VALIDATION_MESSAGE = 'Use at least 8 characters.';
export const NEXT_VALIDATION_MESSAGE = 'This link is not valid.';

export const emailSchema = z.email(EMAIL_VALIDATION_MESSAGE);
export const passwordSchema = z.string().min(8, PASSWORD_VALIDATION_MESSAGE);

/**
 * The `next` path the confirmation/recovery email may land on. Begins with
 * exactly one slash; never a protocol-relative or absolute URL; never contains
 * a double slash anywhere in the path.
 */
export function isSafeNextPath(value: string): boolean {
  if (!value.startsWith('/') || value.startsWith('//')) return false;
  if (value.includes('//')) return false;
  return !/^[a-z][a-z0-9+.-]*:/i.test(value);
}

export const safeNextSchema = z
  .string()
  .refine(isSafeNextPath, NEXT_VALIDATION_MESSAGE);

export const signInSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export const signUpSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  next: safeNextSchema,
});

export const requestResetSchema = z.object({
  email: emailSchema,
});

export const updatePasswordSchema = z.object({
  password: passwordSchema,
});

/** The only failure kinds an action result may carry — neutral, no internals. */
export type AuthFailureKind = 'credentials' | 'unconfirmed' | 'rate-limited' | 'error';

export type AuthOk = { ok: true };

export type AuthFailure = { ok: false; kind: AuthFailureKind };

export type AuthActionResult = AuthOk | AuthFailure;

/** The tree shape `z.treeifyError` returns for these object schemas' fields. */
export type FieldErrors = Partial<Record<'email' | 'password' | 'next' | 'passwordConfirm', string>>;

/**
 * First field name carrying an inline error — the §Focus rule's target: on a
 * failed submit, focus moves to the first field with an inline error.
 */
export function firstErroredField(errors: FieldErrors): 'email' | 'password' | null {
  if (errors.email) return 'email';
  if (errors.password) return 'password';
  if (errors.next) return 'email';
  return null;
}
