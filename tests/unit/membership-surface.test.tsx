// tests/unit/membership-surface.test.tsx — the membership surfaces' unit proof
// (D-01..D-04; 03-UI-SPEC §8.2/§8.3/§Copywriting).
//
// Static render idiom of tests/unit/auth-forms.test.tsx: react-dom/server +
// parsed DOM, Supabase mocked at the module boundary, server-only and
// next/navigation mocked, motion/react mocked to the no-op button. Asserted:
// denial and valid branches' exact strings, the no-leak sweep (no org name or
// status tint on the deny branch), force-dynamic presence, the one-action
// discipline on the redeem form, and (Task 3 extends this file) the create-org
// and members-surface contract.
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { createElement, type ReactElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const harness = vi.hoisted(() => ({
  rpc: undefined as ((fn: string, args: unknown) => Promise<{ data: unknown; error: unknown }>) | undefined,
}));

vi.mock('server-only', () => ({}));
vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    rpc: async (fn: string, args: unknown) =>
      harness.rpc ? harness.rpc(fn, args) : { data: null, error: null },
  }),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }),
  redirect: vi.fn(),
}));

vi.mock('motion/react', () => ({
  useReducedMotion: () => true,
  motion: {
    button(props: Record<string, unknown>) {
      const { children, whileHover, whileTap, transition, ...rest } = props as Record<string, unknown> & { children?: React.ReactNode };
      return createElement('button', rest, children);
    },
  },
}));

function parse(element: ReactElement): Document {
  return new DOMParser().parseFromString(renderToStaticMarkup(element), 'text/html');
}

const pageSource = (parts: string[]) =>
  readFileSync(path.resolve(__dirname, '..', '..', parts.join('/')), 'utf8');

let invitePage: typeof import('@/app/(auth)/invite/[token]/page');
let inviteForm: typeof import('@/app/(auth)/invite/[token]/invite-signup-form');

beforeAll(async () => {
  invitePage = await import('@/app/(auth)/invite/[token]/page');
  inviteForm = await import('@/app/(auth)/invite/[token]/invite-signup-form');
});

beforeEach(() => {
  harness.rpc = undefined;
});

describe('/invite/[token] — the denial branch', () => {
  it('renders the exact constant copy for an unknown token, with no org name span', async () => {
    harness.rpc = async () => ({ data: null, error: { message: 'invite_invalid' } });
    const element = await invitePage.default({
      params: Promise.resolve({ token: 'a'.repeat(43) }),
    });
    const doc = parse(element as ReactElement);
    expect(doc.body.textContent).toContain('This invite is no longer valid.');
    expect(doc.body.textContent).toContain('Ask your organization owner to send a new one.');
    expect(doc.body.textContent).not.toContain('join');
  });

  it('renders the same constant copy when the DB call fails (transient outage leaks nothing)', async () => {
    harness.rpc = async () => {
      throw new Error('connection refused');
    };
    const element = await invitePage.default({
      params: Promise.resolve({ token: 'b'.repeat(43) }),
    });
    const doc = parse(element as ReactElement);
    expect(doc.body.textContent).toContain('This invite is no longer valid.');
    expect(doc.body.textContent).not.toContain('join');
  });

  it('denies a hostile token string without any DB call', async () => {
    let called = false;
    harness.rpc = async () => {
      called = true;
      return { data: null, error: null };
    };
    const element = await invitePage.default({
      params: Promise.resolve({ token: '../../etc/passwd' }),
    });
    const doc = parse(element as ReactElement);
    expect(called).toBe(false);
    expect(doc.body.textContent).toContain('This invite is no longer valid.');
  });

  it('is a Server Component (no use client directive) and force-dynamic', () => {
    const source = pageSource(['src/app/(auth)/invite/[token]/page.tsx']);
    expect(source.includes("'use client'")).toBe(false);
    expect(source).toContain("dynamic = 'force-dynamic'");
  });
});

describe('/invite/[token] — the valid branch', () => {
  it('renders the exact join sentence with org name and role', async () => {
    harness.rpc = async () => ({
      data: { organization: 'Acme Practice', role: 'patient' },
      error: null,
    });
    const element = await invitePage.default({
      params: Promise.resolve({ token: 'c'.repeat(43) }),
    });
    const doc = parse(element as ReactElement);
    expect(doc.body.textContent).toContain('You have been invited to join Acme Practice as patient.');
  });
});

describe('InviteFormPresentation — instant-join discipline', () => {
  const base = { errors: {}, pageError: null, pending: false, insetFill: 'bg-surface-muted', onSubmit: () => undefined };

  it('renders the credentials form with the one-action discipline source assertion', () => {
    const doc = parse(createElement(inviteForm.InviteFormPresentation, { ...base, joined: null }));
    expect(doc.querySelector('input#invite-email')).not.toBeNull();
    expect(doc.querySelector('button[type="submit"]')?.textContent).toBe('Create account and join');
    const source = pageSource(['src/app/(auth)/invite/[token]/invite-signup-form.tsx']);
    expect(source).toContain('redeemSignupWithInviteAction');
    expect(source).not.toContain("from '@/lib/auth/actions'");
  });

  it('renders the resolved instant-join confirmation state on success', () => {
    const doc = parse(
      createElement(inviteForm.InviteFormPresentation, {
        ...base,
        joined: { organization: 'Acme Practice', role: 'patient' },
      }),
    );
    expect(doc.body.textContent).toContain('You joined Acme Practice');
    expect(doc.body.textContent).toContain('Your workspace opens as patient.');
    expect(doc.body.textContent).not.toContain('You\'re in');
  });

  it('renders the constant invite failure line plus a critical dot', () => {
    const doc = parse(
      createElement(inviteForm.InviteFormPresentation, {
        ...base,
        pageError: inviteForm.INVITE_ERROR,
        joined: null,
      }),
    );
    expect(doc.body.textContent).toContain(inviteForm.INVITE_ERROR);
    expect(doc.querySelector('.bg-critical')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('no-leak sweep: no status tint as text ink, no spinner/skeleton classes', () => {
    const contexts = [
      { ...base, joined: null },
      { ...base, joined: { organization: 'Acme', role: 'nurse' as const } },
    ];
    for (const ctx of contexts) {
      const doc = parse(createElement(inviteForm.InviteFormPresentation, ctx));
      const classes = Array.from(doc.querySelectorAll('*'))
        .flatMap((n) => (n.getAttribute('class') ?? '').split(/\s+/));
      expect(classes.some((c) => /^(text|bg)-(success|info|warning|critical)$/.test(c))).toBe(false);
      expect(classes.some((c) => /animate-spin|skeleton|spinner|loading|progress/.test(c))).toBe(false);
    }
  });
});
