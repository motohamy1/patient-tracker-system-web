// src/app/(auth)/invite/[token]/invite-signup-form.tsx — the §8.1 credential
// form cloned for the invite redeem route (D-03/D-04).
//
// D-04 discipline: submitting credentials AND consuming the token is ONE
// action — redeemSignupWithInviteAction, never the plain signUpAction from
// this route. The action is Zod-first and maps every failure (invalid token,
// expired, used, transient) to the SAME neutral kind, so the failure copy is
// the constant invite-denial line. On success the client resolves to the
// instant-join confirmation state ('You joined {organization}' + 'Your
// workspace opens as {role}.'), never 'You're in' (§Copywriting).
//
// The presentation is a pure prop-driven component (LoginFormPresentation
// pattern) so unit tests render every state statically.

'use client';

import { useRef, useState, useTransition, type FormEvent } from 'react';
import { Button } from '@/components/primitives/Button';
import { ownWorkspaceTarget } from '@/lib/auth/redirect';
import { redeemSignupWithInviteAction } from '@/lib/auth/actions.membership';
import {
  redeemSchema,
} from '@/lib/auth/invite';
import {
  type FieldErrors,
  firstErroredField,
  inlineErrorMessages,
} from '@/lib/auth/schemas';

export const INVITE_ERROR = 'This invite is no longer valid. Ask your organization owner to send a new one.';
export const JOINED_BODY = (role: string) => `Your workspace opens as ${role}.`;

const FIELD_IDS = { email: 'invite-email', password: 'invite-password' } as const;

export type Attempt = { email: string; password: string };
export type JoinedState = { organization: string; role: 'patient' | 'provider_doctor' | 'nurse' | 'receptionist' | 'admin_owner' };

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

export type InviteFormPresentationProps = {
  errors: FieldErrors;
  pageError: string | null;
  pending: boolean;
  insetFill: string;
  joined: JoinedState | null;
  onSubmit: (attempt: Attempt) => void;
};

export function InviteFormPresentation({
  errors,
  pageError,
  pending,
  insetFill,
  joined,
  onSubmit,
}: InviteFormPresentationProps) {
  if (joined) {
    return (
      <div className="flex w-full flex-col gap-md">
        <h1 className="text-heading font-semibold leading-heading text-text-primary">
          {`You joined ${joined.organization}`}
        </h1>
        <p className="text-body leading-body text-text-primary">{JOINED_BODY(joined.role)}</p>
        <a
          href={ownWorkspaceTarget(joined.role)}
          className="inline-flex w-fit items-center justify-center gap-xs rounded-pill px-md min-h-11 md:min-h-8 text-body font-semibold leading-body text-text-primary"
        >
          Go to your workspace
        </a>
      </div>
    );
  }

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
        placeholder="Choose a password"
        pending={pending}
        error={errors.password}
        insetFill={insetFill}
      />
      <Button variant="primary" type="submit" disabled={pending}>
        Create account and join
      </Button>
    </form>
  );
}

export function InviteSignupForm({ rawToken, insetFill }: { rawToken: string; insetFill: string }) {
  const lastAttemptRef = useRef<Attempt | null>(null);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [pageError, setPageError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [joined, setJoined] = useState<JoinedState | null>(null);
  const [, startTransition] = useTransition();

  function focusFirstError(nextErrors: FieldErrors): void {
    const field = firstErroredField(nextErrors);
    if (field) document.getElementById(FIELD_IDS[field])?.focus();
  }

  function handleSubmit(attempt: Attempt): void {
    lastAttemptRef.current = attempt;
    const parsed = redeemSchema.safeParse({ email: attempt.email, password: attempt.password, rawToken });
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
      const result = await redeemSignupWithInviteAction(parsed.data.email, parsed.data.password, parsed.data.rawToken);
      setPending(false);
      if (result.ok && 'organization' in result) {
        setJoined({ organization: result.organization, role: result.role });
        return;
      }
      setErrors({});
      setPageError(INVITE_ERROR);
    });
  }

  return (
    <InviteFormPresentation
      errors={errors}
      pageError={pageError}
      pending={pending}
      insetFill={insetFill}
      joined={joined}
      onSubmit={handleSubmit}
    />
  );
}
