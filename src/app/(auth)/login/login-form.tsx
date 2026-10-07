// src/app/(auth)/login/login-form.tsx — the login credential form
// (D-05, D-08; 03-UI-SPEC §8.1).
//
// The one client surface this route needs. Anatomy per CompactControl's
// SearchControl: the gate-selected INSET_FILL import (never re-derived),
// rounded-md (§8.1 — NOT the capsule), programmatic label per field
// (FOUND-04), min-h-11 md:min-h-8 height rhythm shared with the primary
// action button. Fields paint errors as text at text-label, textPrimary ink
// — never a red tint (§4.3) — wired aria-describedby; a failed submit moves
// focus to the first errored field (§Focus). Pending is aria-busy + disabled
// with the fill unchanged — never a spinner swap. A credentials failure
// renders the fixed no-leak line (the same string for an unknown email and a
// wrong password, Pitfall 4); network/rate-limit failures render the same
// label-plus-critical-dot line with the network copy and a "Try again"
// ghost.
//
// The presentation is a pure component driven by props so unit tests render
// every state statically (tests/unit/auth-forms.test.tsx); `LoginForm`
// subscribes the state and the server action around it.

'use client';

import { useRef, useState, useTransition, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/primitives/Button';
import { PROVIDER_WORKSPACE_PATH } from '@/lib/auth/redirect';
import { signInAction } from '@/lib/auth/actions';
import {
  type AuthFailureKind,
  type FieldErrors,
  firstErroredField,
  inlineErrorMessages,
  signInSchema,
} from '@/lib/auth/schemas';
export const SIGN_IN_CREDENTIALS_ERROR = 'The email or password is not correct.';
const SIGN_IN_UNCONFIRMED_ERROR = 'Check your email to finish setting up your account.';
export const SIGN_IN_NETWORK_ERROR = 'Sign in is not working. Check your connection and try again.';
export const RETRY_ACTION_LABEL = 'Try again';

const FIELD_IDS = { email: 'signin-email', password: 'signin-password' } as const;

export type Attempt = { email: string; password: string };

export function pageErrorOf(kind: AuthFailureKind): string {
  if (kind === 'credentials') return SIGN_IN_CREDENTIALS_ERROR;
  if (kind === 'unconfirmed') return SIGN_IN_UNCONFIRMED_ERROR;
  return SIGN_IN_NETWORK_ERROR;
}

// The inset fill arrives as a PROP, not an import — a client chunk may not
// reference node:fs, and CompactControl's gate read lives there (the gallery
// slot precedent, plan 02-10): the server page owns the gate read and passes
// the value down.
function fieldWrapperOf(insetFill: string): string {
  return [
    'flex w-full items-center gap-xs rounded-md px-lg min-h-11 md:min-h-8 text-text-primary',
    insetFill,
  ].join(' ');
}

type FieldBlockProps = {
  id: string;
  label: string;
  error?: string;
  pending: boolean;
  name: string;
  type: string;
  autoComplete: string;
  placeholder: string;
  insetFill: string;
};

function FieldBlock({ id, label, error, pending, name, type, autoComplete, placeholder, insetFill }: FieldBlockProps) {
  return (
    <div className="flex flex-col gap-xs">
      <label htmlFor={id} className="text-label leading-label text-text-primary">
        {label}
      </label>
      <div className={fieldWrapperOf(insetFill)}>
        <input
          id={id}
          name={name}
          type={type}
          autoComplete={autoComplete}
          placeholder={placeholder}
          readOnly={pending}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          className="min-w-0 flex-1 bg-transparent text-body leading-body text-text-primary placeholder:text-text-primary"
        />
      </div>
      {error ? (
        <p id={`${id}-error`} className="flex flex-col gap-xs text-label leading-label text-text-primary">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export type LoginFormPresentation = {
  errors: FieldErrors;
  pageError: string | null;
  pending: boolean;
  insetFill: string;
  onSubmit: (attempt: Attempt) => void;
  onRetry: () => void;
};

/** The pure §8.1 form anatomy — error states and pending all prop-driven. */
export function LoginFormPresentation({
  errors,
  pageError,
  pending,
  insetFill,
  onSubmit,
  onRetry,
}: LoginFormPresentation) {
  return (
    <form
      noValidate
      aria-busy={pending}
      className="flex w-full flex-col gap-md"
      onSubmit={(event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        onSubmit({
          email: String(data.get('email') ?? ''),
          password: String(data.get('password') ?? ''),
        });
      }}
    >
      {pageError ? (
        <p className="flex items-center gap-xs text-label leading-label text-text-primary">
          <span aria-hidden="true" className="inline-block size-4 shrink-0 rounded-pill bg-critical" />
          {pageError}
        </p>
      ) : null}
      <FieldBlock
        id={FIELD_IDS.email}
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        placeholder="name@example.com"
        pending={pending}
        error={errors.email}
        insetFill={insetFill}
      />
      <FieldBlock
        id={FIELD_IDS.password}
        label="Password"
        name="password"
        type="password"
        autoComplete="current-password"
        placeholder="Your password"
        pending={pending}
        error={errors.password}
        insetFill={insetFill}
      />
      <Button variant="primary" type="submit" disabled={pending}>
        Sign in
      </Button>
      {pageError && !pending ? (
        <Button variant="ghost" type="button" onClick={onRetry}>
          {RETRY_ACTION_LABEL}
        </Button>
      ) : null}
    </form>
  );
}

export function LoginForm({
  initialPageError = null,
  insetFill,
}: {
  initialPageError?: string | null;
  insetFill: string;
}) {
  const router = useRouter();
  const lastAttemptRef = useRef<Attempt | null>(null);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [pageError, setPageError] = useState<string | null>(initialPageError);
  const [pending, setPending] = useState(false);
  const [, startTransition] = useTransition();

  function focusFirstError(nextErrors: FieldErrors): void {
    const field = firstErroredField(nextErrors);
    if (field) document.getElementById(FIELD_IDS[field])?.focus();
  }

  function handleSubmit(attempt: Attempt): void {
    lastAttemptRef.current = attempt;
    const parsed = signInSchema.safeParse(attempt);
    if (!parsed.success) {
      const nextErrors = inlineErrorMessages(parsed.error);
      setErrors(nextErrors);
      setPageError(null);
      focusFirstError(nextErrors);
      return;
    }
    setErrors({});
    setPending(true);
    startTransition(async () => {
      const result = await signInAction(parsed.data.email, parsed.data.password);
      setPending(false);
      if (result.ok) {
        // The layout slots resolve the role server-side and route from here
        // (patient goes to its workspace, unaffiliated to org creation, D-12).
        router.push(PROVIDER_WORKSPACE_PATH);
        return;
      }
      setErrors({});
      setPageError(pageErrorOf(result.kind));
    });
  }

  function handleRetry(): void {
    const attempt = lastAttemptRef.current;
    if (attempt) handleSubmit(attempt);
  }

  return (
    <LoginFormPresentation
      errors={errors}
      pageError={pageError}
      pending={pending}
      insetFill={insetFill}
      onSubmit={handleSubmit}
      onRetry={handleRetry}
    />
  );
}
