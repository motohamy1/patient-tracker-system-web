// src/app/(auth)/reset-password/update/update-form.tsx — the new-password
// form (D-07; 03-UI-SPEC §8.1).
//
// Reached through the recovery email's link: /auth/confirm verifies the
// recovery token (type=recovery), which establishes the session this form
// mutates. Two fields — the new password and a "Confirm password" field
// checked for the match — per §Copywriting, action "Set new password".
// Field grammar identical to login-form/signup-form (INSET_FILL import,
// rounded-md, programmatic labels, inline text-label errors, focus on the
// first errored field, aria-busy pending, label-plus-critical-dot page line).
//
// On success routes to /login ("Back to sign in" family). A credentials-kind
// failure means no verifiable recovery session — the caller is sent back to
// the login flow rather than shown an internal state; any other failure
// renders the page-level line.

'use client';

import { useRef, useState, useTransition, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/primitives/Button';
import { INSET_FILL } from '@/components/primitives/CompactControl';
import { LOGIN_PATH } from '@/lib/auth/redirect';
import { updatePasswordAction } from '@/lib/auth/actions';
import {
  type FieldErrors,
  inlineErrorMessages,
  passwordSchema,
  updatePasswordSchema,
} from '@/lib/auth/schemas';

export const CONFIRM_PASSWORD_MISMATCH_ERROR = 'The passwords do not match.';
export const UPDATE_PAGE_ERROR = 'Your password was not updated. Check your connection and try again.';
export const RETRY_ACTION_LABEL = 'Try again';

const FIELD_IDS = { password: 'update-new-password', passwordConfirm: 'update-confirm-password' } as const;

export type Attempt = { password: string; passwordConfirm: string };

const FIELD_WRAPPER = [
  'flex w-full items-center gap-xs rounded-md px-lg min-h-11 md:min-h-8 text-text-primary',
  INSET_FILL,
].join(' ');

function FieldBlock({
  id,
  label,
  error,
  pending,
  autoComplete,
}: {
  id: string;
  label: string;
  error?: string;
  pending: boolean;
  autoComplete: string;
}) {
  return (
    <div className="flex flex-col gap-xs">
      <label htmlFor={id} className="text-label leading-label text-text-primary">
        {label}
      </label>
      <div className={FIELD_WRAPPER}>
        <input
          id={id}
          name={id}
          type="password"
          autoComplete={autoComplete}
          placeholder="At least 8 characters"
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

export type UpdateFormPresentationProps = {
  errors: FieldErrors;
  pageError: string | null;
  pending: boolean;
  onSubmit: (attempt: Attempt) => void;
  onRetry: () => void;
};

export function UpdateFormPresentation({
  errors,
  pageError,
  pending,
  onSubmit,
  onRetry,
}: UpdateFormPresentationProps) {
  return (
    <form
      noValidate
      aria-busy={pending}
      className="flex w-full flex-col gap-md"
      onSubmit={(event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        onSubmit({
          password: String(data.get(FIELD_IDS.password) ?? ''),
          passwordConfirm: String(data.get(FIELD_IDS.passwordConfirm) ?? ''),
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
        id={FIELD_IDS.password}
        label="New password"
        autoComplete="new-password"
        pending={pending}
        error={errors.password}
      />
      <FieldBlock
        id={FIELD_IDS.passwordConfirm}
        label="Confirm password"
        autoComplete="new-password"
        pending={pending}
        error={errors.passwordConfirm}
      />
      <Button variant="primary" type="submit" disabled={pending}>
        Set new password
      </Button>
      {pageError && !pending ? (
        <Button variant="ghost" type="button" onClick={onRetry}>
          {RETRY_ACTION_LABEL}
        </Button>
      ) : null}
    </form>
  );
}

export function UpdateForm() {
  const router = useRouter();
  const lastAttemptRef = useRef<Attempt | null>(null);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [pageError, setPageError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [, startTransition] = useTransition();

  function focusFirstError(nextErrors: FieldErrors): void {
    for (const field of ['password', 'passwordConfirm'] as const) {
      if (nextErrors[field]) {
        document.getElementById(FIELD_IDS[field])?.focus();
        return;
      }
    }
  }

  function handleSubmit(attempt: Attempt): void {
    lastAttemptRef.current = attempt;
    const nextErrors: FieldErrors = {};
    let validPassword = '';

    const parsed = updatePasswordSchema.safeParse({ password: attempt.password });
    if (parsed.success) {
      validPassword = parsed.data.password;
    } else {
      Object.assign(nextErrors, inlineErrorMessages(parsed.error));
    }
    if (attempt.password !== attempt.passwordConfirm) {
      nextErrors.passwordConfirm = CONFIRM_PASSWORD_MISMATCH_ERROR;
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      setPageError(null);
      focusFirstError(nextErrors);
      return;
    }

    setErrors({});
    setPending(true);
    startTransition(async () => {
      const result = await updatePasswordAction(validPassword);
      setPending(false);
      if (result.ok) {
        router.replace(LOGIN_PATH);
        return;
      }
      // No verifiable recovery session: send the caller to the login flow
      // instead of exposing the session state.
      setErrors({});
      if (result.kind === 'credentials') {
        router.replace(LOGIN_PATH);
        return;
      }
      setPageError(UPDATE_PAGE_ERROR);
    });
  }

  function handleRetry(): void {
    const attempt = lastAttemptRef.current;
    if (attempt) handleSubmit(attempt);
  }

  return (
    <UpdateFormPresentation
      errors={errors}
      pageError={pageError}
      pending={pending}
      onSubmit={handleSubmit}
      onRetry={handleRetry}
    />
  );
}
