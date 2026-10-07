// /login — the real credential surface (D-05, D-08; 03-UI-SPEC §8.1).
//
// The Phase-2 empty shell's D-03 obligation is FULFILLED here: the credential
// form is rendered by the client sibling (login-form.tsx), credentials are
// verified by Supabase Auth through the server action in src/lib/auth/
// actions.ts, and no role or workspace is ever derived on the client (D-12 —
// server-side layout resolution owns the routing decision).
//
// Shell (kept from the Phase-2 lines 21–35): a full-bleed `canvas` field with
// one centred column. The column's max-w-[24rem] is the LOCKED §8.1 layout
// exception (02-UI-SPEC's `max-w-*` nickname precedent: never max-w-sm, which
// collides with the theme's --spacing-sm token). Monochrome + status tints
// only — no card panel (the column-is-not-a-card ruling), no entrance
// animation, the heading always present. A failed email-verification link
// arrives as ?error=auth-verification and renders the same page-level
// label-plus-dot line, calm and fixed.
import { INSET_FILL } from '@/components/primitives/CompactControl';
import { Surface } from '@/components/primitives';
import { LoginForm } from './login-form';

const GHOST_LINK_CLASSES =
  'inline-flex w-fit items-center justify-center gap-xs rounded-pill px-md min-h-11 md:min-h-8 text-body font-semibold leading-body text-text-primary';

export const CONFIRM_SIGN_IN_ERROR = 'That sign-in link has expired. Try signing in again.';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const errorParam = params.error;
  const initialPageError = typeof errorParam === 'string' ? CONFIRM_SIGN_IN_ERROR : null;

  return (
    <Surface
      variant="canvas"
      className="flex min-h-screen items-center justify-center bg-canvas p-lg"
    >
      <div className="flex w-full max-w-[24rem] flex-col gap-md">
        <h1 className="text-heading font-semibold leading-heading text-text-primary">Sign in</h1>
        <LoginForm initialPageError={initialPageError} insetFill={INSET_FILL} />
        <a href="/reset-password/request" className={GHOST_LINK_CLASSES}>
          Reset password
        </a>
      </div>
    </Surface>
  );
}
