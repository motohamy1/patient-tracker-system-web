// src/app/(auth)/signup/signup-form.tsx — the signup credential form
// (D-05, D-08; 03-UI-SPEC §8.1).
//
// Same §8.1 form grammar as login-form.tsx (INSET_FILL import, rounded-md,
// programmatic labels, inline text-label errors, focus-first-errored-field,
// aria-busy pending, label-plus-critical-dot page-level line). On success the
// flow NEVER moves past the confirmation email from here: the client routes
// to /signup/check-email and the EMAIL link lands through /auth/confirm.
// The signup's `next` is the login path — after the confirmation the member
// returns to sign in (the invite flow, 03-05, passes an invite path instead —
// that is why the parameter exists).
//
// Presentation split identical to login-form's: a pure prop-driven
// `SignUpFormPresentation` for static per-state unit rendering.

'use client';

import { useRef, useState, useTransition, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/primitives/Button';
import { signUpAction } from '@/lib/auth/actions';
import {
  type FieldErrors,
  inlineErrorMessages,
  firstErroredField,
  signUpSchema,
} from '@/lib/auth/schemas';

export const SIGNUP_CONFIRM_NEXT = '/login';
export const SIGNUP_PAGE_ERROR = 'Sign up is not working. Check your connection and try again.';
export const RETRY_ACTION_LABEL = 'Try again';

const FIELD_IDS = { email: 'signup-email', password: 'signup-password' } as const;

export type Attempt = { email: string; password: string };

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
        <p id={`${id}-error`} className="text-label leading-label text-text-primary">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export type SignUpFormPresentation = {
  errors: FieldErrors;
  pageError: string | null;
  pending: boolean;
  insetFill: string;
  onSubmit: (attempt: Attempt) => void;
  onRetry: () => void;
};

export function SignUpFormPresentation({
  errors,
  pageError,
  pending,
  insetFill,
  onSubmit,
  onRetry,
}: SignUpFormPresentation) {
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
        autoComplete="new-password"
        placeholder="At least 8 characters"
        pending={pending}
        error={errors.password}
        insetFill={insetFill}
      />
      <Button variant="primary" type="submit" disabled={pending}>
        Sign up
      </Button>
      {pageError && !pending ? (
        <Button variant="ghost" type="button" onClick={onRetry}>
          {RETRY_ACTION_LABEL}
        </Button>
      ) : null}
    </form>
  );
}

export function SignUpForm({ insetFill }: { insetFill: string }) {
  const router = useRouter();
  const lastAttemptRef = useRef<Attempt | null>(null);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [pageError, setPageError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [, startTransition] = useTransition();

  function handleSubmit(attempt: Attempt): void {
    lastAttemptRef.current = attempt;
    const parsed = signUpSchema.safeParse({ ...attempt, next: SIGNUP_CONFIRM_NEXT });
    if (!parsed.success) {
      const nextErrors = inlineErrorMessages(parsed.error);
      setErrors(nextErrors);
      setPageError(null);
      const field = firstErroredField(nextErrors);
      if (field) document.getElementById(FIELD_IDS[field])?.focus();
      return;
    }
    setErrors({});
    setPending(true);
    startTransition(async () => {
      const result = await signUpAction(parsed.data.email, parsed.data.password, SIGNUP_CONFIRM_NEXT);
      setPending(false);
      if (result.ok) {
        router.replace(`/signup/check-email?email=${encodeURIComponent(parsed.data.email)}`);
        return;
      }
      setErrors({});
      setPageError(SIGNUP_PAGE_ERROR);
    });
  }

  function handleRetry(): void {
    const attempt = lastAttemptRef.current;
    if (attempt) handleSubmit(attempt);
  }

  return (
    <SignUpFormPresentation
      errors={errors}
      pageError={pageError}
      pending={pending}
      insetFill={insetFill}
      onSubmit={handleSubmit}
      onRetry={handleRetry}
    />
  );
}
