// src/app/(auth)/reset-password/request/request-form.tsx — the reset request
// form (D-05, D-07; 03-UI-SPEC §8.1).
//
// Same §8.1 form grammar as login-form/signup-form (INSET_FILL import,
// rounded-md, programmatic label, inline text-label error with
// aria-describedby, focus-first-errored-field, aria-busy pending). The
// request action is deliberately UNCONDITIONAL: requestResetAction returns
// the same success shape whether the account exists or not (RESEARCH
// Pitfall 4 non-enumeration), so on success this form swaps to the SAME
// fixed confirmation in both outcomes — the DOM is identical for a known and
// an unknown email. Network/rate-limit failures render the page-level
// label-plus-critical-dot line with a "Try again" ghost.
//
// Presentation/`RequestForm` split identical to login-form's: the pure
// prop-driven presentation renders every state statically in unit tests.

'use client';

import { useRef, useState, useTransition, type FormEvent } from 'react';
import { Button } from '@/components/primitives/Button';
import { INSET_FILL } from '@/components/primitives/CompactControl';
import { requestResetAction } from '@/lib/auth/actions';
import {
  type FieldErrors,
  inlineErrorMessages,
  firstErroredField,
  requestResetSchema,
} from '@/lib/auth/schemas';

export const RESET_REQUEST_CONFIRMATION =
  'If an account exists for this email, a reset link is on the way.';
export const RESET_REQUEST_PAGE_ERROR =
  'The reset request is not working. Check your connection and try again.';
export const RETRY_ACTION_LABEL = 'Try again';

const EMAIL_FIELD_ID = 'reset-request-email';

function EmailField({ error, pending }: { error?: string; pending: boolean }) {
  return (
    <div className="flex flex-col gap-xs">
      <label htmlFor={EMAIL_FIELD_ID} className="text-label leading-label text-text-primary">
        Email
      </label>
      <div
        className={[
          'flex w-full items-center gap-xs rounded-md px-lg min-h-11 md:min-h-8 text-text-primary',
          INSET_FILL,
        ].join(' ')}
      >
        <input
          id={EMAIL_FIELD_ID}
          name="email"
          type="email"
          autoComplete="email"
          placeholder="name@example.com"
          readOnly={pending}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${EMAIL_FIELD_ID}-error` : undefined}
          className="min-w-0 flex-1 bg-transparent text-body leading-body text-text-primary placeholder:text-text-primary"
        />
      </div>
      {error ? (
        <p id={`${EMAIL_FIELD_ID}-error`} className="text-label leading-label text-text-primary">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export type RequestFormPresentationProps = {
  errors: FieldErrors;
  sent: boolean;
  pageError: string | null;
  pending: boolean;
  onSubmit: (email: string) => void;
  onRetry: () => void;
};

export function RequestFormPresentation({
  errors,
  sent,
  pageError,
  pending,
  onSubmit,
  onRetry,
}: RequestFormPresentationProps) {
  return (
    <form
      noValidate
      aria-busy={pending}
      className="flex w-full flex-col gap-md"
      onSubmit={(event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        onSubmit(String(data.get('email') ?? ''));
      }}
    >
      {pageError ? (
        <p className="flex items-center gap-xs text-label leading-label text-text-primary">
          <span aria-hidden="true" className="inline-block size-4 shrink-0 rounded-pill bg-critical" />
          {pageError}
        </p>
      ) : null}
      {sent ? (
        <p aria-live="polite" className="text-body leading-body text-text-primary">
          {RESET_REQUEST_CONFIRMATION}
        </p>
      ) : (
        <>
          <EmailField pending={pending} error={errors.email} />
          <Button variant="primary" type="submit" disabled={pending}>
            Send reset link
          </Button>
        </>
      )}
      {pageError && !pending && !sent ? (
        <Button variant="ghost" type="button" onClick={onRetry}>
          {RETRY_ACTION_LABEL}
        </Button>
      ) : null}
    </form>
  );
}

export function RequestForm() {
  const lastEmailRef = useRef<string>('');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [sent, setSent] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [, startTransition] = useTransition();

  function handleSubmit(email: string): void {
    lastEmailRef.current = email;
    const parsed = requestResetSchema.safeParse({ email });
    if (!parsed.success) {
      const nextErrors = inlineErrorMessages(parsed.error);
      setErrors(nextErrors);
      setSent(false);
      setPageError(null);
      const field = firstErroredField(nextErrors);
      if (field) document.getElementById(EMAIL_FIELD_ID)?.focus();
      return;
    }
    setErrors({});
    setPending(true);
    startTransition(async () => {
      const result = await requestResetAction(parsed.data.email);
      setPending(false);
      // Identical success shape either way — the confirmation copy never
      // names an account state (Pitfall 4).
      if (result.ok) {
        setPageError(null);
        setErrors({});
        setSent(true);
        return;
      }
      setPageError(RESET_REQUEST_PAGE_ERROR);
    });
  }

  function handleRetry(): void {
    if (lastEmailRef.current) handleSubmit(lastEmailRef.current);
  }

  return (
    <RequestFormPresentation
      errors={errors}
      sent={sent}
      pageError={pageError}
      pending={pending}
      onSubmit={handleSubmit}
      onRetry={handleRetry}
    />
  );
}
