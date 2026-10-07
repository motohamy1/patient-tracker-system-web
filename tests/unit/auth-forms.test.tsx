// tests/unit/auth-forms.test.tsx — the (auth) credential surfaces' unit proof
// (D-05, D-08, D-13; 03-UI-SPEC §8.1 + §Copywriting).
//
// Static-render idiom established by tests/unit/primitives/EmptyState.test.tsx:
// react-dom/server + a parsed DOM. Client components are rendered statically in
// their prop-driven presentation states (`LoginFormPresentation` etc.), so the
// error, pending and success states are real DOM assertions, and next/navigation
// plus motion/react are mocked at the module boundary (no app router is mounted
// in a static render and no animation engine is needed).
//
// Asserted: exact §Copywriting headings and action labels, the inline-error
// wire-up (aria-describedby linking the error id), the first-errored-field
// focus target, aria-busy/disabled pending, the fixed no-leak sweep (no status
// tint as text ink; the one sanctioned critical dot is aria-hidden), identical
// reset-request confirmation in both outcomes, 44px height classes below md,
// and the Server-Component assertion on every auth page file.
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { createElement, type ReactElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { firstErroredField, type FieldErrors } from '@/lib/auth/schemas';

vi.mock('motion/react', () => ({
  useReducedMotion: () => true,
  motion: {
    button(props: Record<string, any>) {
      const { children, whileHover, whileTap, transition, ...rest } = props;
      return createElement('button', rest, children);
    },
  },
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
}));

function parse(element: ReactElement): Document {
  return new DOMParser().parseFromString(renderToStaticMarkup(element), 'text/html');
}

function classesOf(node: Element | null): string[] {
  if (!node) throw new Error('expected an element');
  return (node.getAttribute('class') ?? '').split(/\s+/).filter(Boolean);
}

const pageSource = (parts: string[]) =>
  readFileSync(path.resolve(__dirname, '..', '..', parts.join('/')), 'utf8');

let forms: typeof import('@/app/(auth)/login/login-form');
let signupForms: typeof import('@/app/(auth)/signup/signup-form');
let requestForms: typeof import('@/app/(auth)/reset-password/request/request-form');
let updateForms: typeof import('@/app/(auth)/reset-password/update/update-form');
let loginPage: typeof import('@/app/(auth)/login/page');
let signupPage: typeof import('@/app/(auth)/signup/page');
let checkEmailPage: typeof import('@/app/(auth)/signup/check-email/page');
let requestPage: typeof import('@/app/(auth)/reset-password/request/page');
let updatePage: typeof import('@/app/(auth)/reset-password/update/page');

beforeAll(async () => {
  forms = await import('@/app/(auth)/login/login-form');
  signupForms = await import('@/app/(auth)/signup/signup-form');
  requestForms = await import('@/app/(auth)/reset-password/request/request-form');
  updateForms = await import('@/app/(auth)/reset-password/update/update-form');
  loginPage = await import('@/app/(auth)/login/page');
  signupPage = await import('@/app/(auth)/signup/page');
  checkEmailPage = await import('@/app/(auth)/signup/check-email/page');
  requestPage = await import('@/app/(auth)/reset-password/request/page');
  updatePage = await import('@/app/(auth)/reset-password/update/page');
});

const NO_ERRORS: FieldErrors = { email: undefined, password: undefined, next: undefined, passwordConfirm: undefined };
const noopSubmit = () => undefined;
const noopRetry = () => undefined;

describe('/login — the rewritten credential surface', () => {
  it('keeps the heading exact and the reset ghost link wired', async () => {
    const element = await loginPage.default({ searchParams: Promise.resolve({}) });
    const doc = parse(element as ReactElement);
    const heading = doc.querySelector('h1');
    expect(heading?.textContent).toBe('Sign in');
    const ghost = doc.querySelector('a');
    expect(ghost?.getAttribute('href')).toBe('/reset-password/request');
    expect(ghost?.textContent).toBe('Reset password');
  });

  it('renders the page-level error line for a failed email link (?error=auth-verification)', async () => {
    const element = await loginPage.default({
      searchParams: Promise.resolve({ error: 'auth-verification' }),
    });
    const doc = parse(element as ReactElement);
    expect(doc.querySelector('h1')?.textContent).toBe('Sign in');
    expect(doc.querySelector('.bg-critical')?.getAttribute('aria-hidden')).toBe('true');
    expect(doc.querySelector('h1 ~ div')?.textContent ?? doc.body.textContent).toContain(
      loginPage.CONFIRM_SIGN_IN_ERROR,
    );
  });

  it('is a Server Component (no use client directive in the page file)', () => {
    expect(pageSource(['src/app/(auth)/login/page.tsx']).split('\n')[0]).not.toBe("'use client';");
    expect(pageSource(['src/app/(auth)/login/page.tsx']).includes("'use client'")).toBe(false);
  });

  it('fulfilled the Phase-2 D-03 obligation (the empty-state copy is gone)', () => {
    const source = pageSource(['src/app/(auth)/login/page.tsx']);
    expect(source.includes('Sign in is not active yet')).toBe(false);
    expect(source.includes('Access controls arrive in a later phase')).toBe(false);
  });
});

describe('LoginFormPresentation — §8.1 form grammar and no-leak states', () => {
  const base = { pending: false, onSubmit: noopSubmit, onRetry: noopRetry };

  it('renders programmatic labels tied to their fields, inset fills and the height rhythm', () => {
    const doc = parse(
      createElement(forms.LoginFormPresentation, { errors: NO_ERRORS, pageError: null, ...base }),
    );
    const emailLabel = doc.querySelector('label');
    expect(emailLabel?.getAttribute('for')).toBe('signin-email');
    const field = doc.querySelector('#signin-email')?.closest('div') ?? null;
    const classes = classesOf(field);
    expect(classes).toContain('rounded-md');
    expect(classes).toContain('bg-surface-muted');
    expect(classes).toContain('min-h-11');
    expect(classes).toContain('md:min-h-8');
    expect(classes).toContain('px-lg');
  });

  it('renders the exact primary action label', () => {
    const doc = parse(
      createElement(forms.LoginFormPresentation, { errors: NO_ERRORS, pageError: null, ...base }),
    );
    const button = doc.querySelector('button');
    expect(button?.textContent).toBe('Sign in');
  });

  it('wires the inline error with aria-describedby and never a tint (§4.3)', () => {
    const doc = parse(
      createElement(forms.LoginFormPresentation, {
        errors: { ...NO_ERRORS, email: 'Enter a valid email address.' },
        pageError: null,
        ...base,
      }),
    );
    const input = doc.querySelector('#signin-email');
    expect(input?.getAttribute('aria-describedby')).toBe('signin-email-error');
    const inline = doc.querySelector('#signin-email-error');
    expect(inline?.textContent).toBe('Enter a valid email address.');
    expect(classesOf(inline)).toContain('text-text-primary');
    expect(tintAsInk(doc)).toEqual([]);
    expect(doc.querySelector('.bg-critical')).toBeNull();
  });

  it('firstErroredField targets the first errored field for the §Focus move', () => {
    expect(firstErroredField({ ...NO_ERRORS })).toBeNull();
    expect(firstErroredField({ ...NO_ERRORS, email: 'x', password: 'y' })).toBe('email');
    expect(firstErroredField({ ...NO_ERRORS, password: 'y' })).toBe('password');
  });

  it('renders pending as aria-busy + disabled with the fill unchanged, no spinner', () => {
    const doc = parse(
      createElement(forms.LoginFormPresentation, { errors: NO_ERRORS, pageError: null, ...base, pending: true }),
    );
    const form = doc.querySelector('form');
    expect(form?.getAttribute('aria-busy')).toBe('true');
    const button = doc.querySelector('button');
    expect(button?.hasAttribute('disabled')).toBe(true);
    const markupForSweeps = renderToStaticMarkup(
      createElement(forms.LoginFormPresentation, {
        errors: NO_ERRORS,
        pageError: null,
        ...base,
        pending: true,
      }),
    );
    expect(markupForSweeps).not.toMatch(/animate-spin|spinner|skeleton|loading|progress/);
    // the fill class stays on the button (opacity-only disabled treatment)
    expect(classesOf(button)).toContain('bg-accent-soft');
  });

  it('renders the fixed no-leak credentials failure as the page-level dot line', () => {
    const doc = parse(
      createElement(forms.LoginFormPresentation, {
        errors: NO_ERRORS,
        pageError: forms.SIGN_IN_CREDENTIALS_ERROR,
        ...base,
      }),
    );
    const errorLine = doc.querySelector('form > p');
    expect(errorLine?.textContent).toBe(forms.SIGN_IN_CREDENTIALS_ERROR);
    const dots = doc.querySelectorAll('.bg-critical');
    expect(dots.length).toBe(1);
    expect(dots[0].getAttribute('aria-hidden')).toBe('true');
    expect(tintAsInk(doc)).toEqual([]);
    expect(doc.body.textContent).toContain('The email or password is not correct.');
  });

  it('renders the ghost Try again action for a network failure only when not pending', () => {
    const failing = parse(
      createElement(forms.LoginFormPresentation, {
        errors: NO_ERRORS,
        pageError: forms.SIGN_IN_NETWORK_ERROR,
        ...base,
      }),
    );
    const buttons = Array.from(failing.querySelectorAll('button'));
    expect(buttons.map((b) => b.textContent)).toEqual(['Sign in', forms.RETRY_ACTION_LABEL]);
  });
});

describe('/signup + check-email — signup chain surfaces', () => {
  it('renders the heading, the Sign up action and the Back to sign in ghost', () => {
    const doc = parse(createElement(signupPage.default));
    expect(doc.querySelector('h1')?.textContent).toBe('Create your account');
    expect(doc.querySelector('button')?.textContent).toBe('Sign up');
    const ghost = doc.querySelector('a');
    expect(ghost?.getAttribute('href')).toBe('/login');
    expect(ghost?.textContent).toBe('Back to sign in');
  });

  it('is a Server Component (no use client directive in the page file)', () => {
    const source = pageSource(['src/app/(auth)/signup/page.tsx']);
    expect(source.includes("'use client'")).toBe(false);
  });

  it('check-email names the typed address in the frozen sentence, as plain text', async () => {
    const element = await checkEmailPage.default({
      searchParams: Promise.resolve({ email: 'owner@example.com' }),
    });
    const doc = parse(element as ReactElement);
    expect(doc.querySelector('h1')?.textContent).toBe('Check your email');
    expect(doc.querySelectorAll('p')[0]?.textContent).toContain('We sent a confirmation link to owner@example.com.');
    expect(doc.querySelectorAll('a[href="/login"]')[0]?.textContent).toBe('Back to sign in');
  });

  it('check-email sanitizes the echoed address to plain text never markup', async () => {
    const element = await checkEmailPage.default({
      searchParams: Promise.resolve({ email: '<script>alert(1)</script>x@y.z' }),
    });
    const doc = parse(element as ReactElement);
    expect(doc.querySelector('script')).toBeNull();
    expect(doc.querySelectorAll('p')[0]?.textContent).toContain('<script>alert(1)</script>x@y.z');
  });

  it('check-email renders without an echoed address too (no empty gap)', async () => {
    const element = await checkEmailPage.default({ searchParams: Promise.resolve({}) });
    const doc = parse(element as ReactElement);
    expect(doc.querySelector('h1')?.textContent).toBe('Check your email');
    expect(doc.querySelectorAll('p')[0]?.textContent).toBeTruthy();
  });
});

describe('/reset-password/request + /reset-password/update — reset surfaces', () => {
  it('renders the exact heading, body and action strings', () => {
    const doc = parse(createElement(requestPage.default));
    expect(doc.querySelector('h1')?.textContent).toBe('Reset your password');
    expect(doc.querySelectorAll('p')[0]?.textContent).toBe(
      'We will email you a link to set a new password.',
    );
    expect(Array.from(doc.querySelectorAll('button')).map((b) => b.textContent)).toContain(
      'Send reset link',
    );
  });

  it('renders the identical DOM for both request outcomes (fixed confirmation)', () => {
    const outcome = parse(
      createElement(requestForms.RequestFormPresentation, {
        errors: NO_ERRORS,
        sent: true,
        pageError: null,
        pending: false,
        onSubmit: noopSubmit,
        onRetry: noopRetry,
      }),
    );
    expect(outcome.querySelector('p')?.getAttribute('aria-live')).toBe('polite');
    expect(outcome.querySelector('p')?.textContent).toBe(requestForms.RESET_REQUEST_CONFIRMATION);
    expect(outcome.querySelector('button')).toBeNull();
    expect(tintAsInk(outcome)).toEqual([]);
    // the fixed confirmation never echoes the attempted address and carries
    // no email-like leak (outcomes identical for a known and an unknown email)
    expect(outcome.body.textContent?.includes('@')).toBe(false);
    expect(outcome.body.textContent).toContain('a reset link is on the way.');
  });

  it('renders the update surface with both fields and the Set new password action', () => {
    const doc = parse(createElement(updatePage.default));
    expect(doc.querySelector('h1')?.textContent).toBe('Set a new password');
    const labels = Array.from(doc.querySelectorAll('label')).map((l) => l.textContent);
    expect(labels).toEqual(['New password', 'Confirm password']);
    expect(doc.querySelector('button')?.textContent).toBe('Set new password');
    expect(doc.querySelector('a[href="/login"]')?.textContent).toBe('Back to sign in');
  });

  it('wires the confirm-password mismatch as an inline text error (aria-describedby + focus target)', () => {
    const doc = parse(
      createElement(updateForms.UpdateFormPresentation, {
        errors: { ...NO_ERRORS, passwordConfirm: updateForms.CONFIRM_PASSWORD_MISMATCH_ERROR },
        pageError: null,
        pending: false,
        onSubmit: noopSubmit,
        onRetry: noopRetry,
      }),
    );
    const input = doc.querySelector('#update-confirm-password');
    expect(input?.getAttribute('aria-describedby')).toBe('update-confirm-password-error');
    expect(doc.querySelector('#update-confirm-password-error')?.textContent).toBe(
      updateForms.CONFIRM_PASSWORD_MISMATCH_ERROR,
    );
    expect(tintAsInk(doc)).toEqual([]);
  });
});

describe('all four (auth) routes — voice + chrome discipline sweep', () => {
  it('every page and form file cites decisions and token utilities, never hex', () => {
    for (const file of [
      'src/app/(auth)/login/page.tsx',
      'src/app/(auth)/login/login-form.tsx',
      'src/app/(auth)/signup/page.tsx',
      'src/app/(auth)/signup/signup-form.tsx',
      'src/app/(auth)/signup/check-email/page.tsx',
      'src/app/(auth)/reset-password/request/page.tsx',
      'src/app/(auth)/reset-password/request/request-form.tsx',
      'src/app/(auth)/reset-password/update/page.tsx',
      'src/app/(auth)/reset-password/update/update-form.tsx',
    ]) {
      const source = pageSource([file]);
      expect(source, `${file} cell`).not.toMatch(/#[0-9a-fA-F]{6}\b/);
      expect(source, `${file} inline error sizes`).not.toMatch(/text-(gray|blue|violet|red)-\d+/);
    }
  });
});

function tintAsInk(doc: Document): string[] {
  const errors: string[] = [];
  for (const node of Array.from(doc.querySelectorAll('*'))) {
    const classes = classesOf(node);
    if (classes.some((name) => /^(text|ring|border)-(success|info|warning|critical)$/.test(name))) {
      errors.push(`${node.tagName} carries a tint as ink/boundary`);
    }
  }
  return errors;
}
