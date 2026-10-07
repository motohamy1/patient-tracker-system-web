// /signup — the signup credential surface (D-05; 03-UI-SPEC §8.1).
//
// Same bare (auth) column grammar as /login: full-bleed canvas field, one
// centred column at the locked max-w-[24rem] exception, heading always
// present, no card panel, no entrance animation, token utilities only. The
// form is the client sibling (signup-form.tsx); success routes to
// /signup/check-email and NEVER past the confirmation email from the client.
//
// Copy note: §Copywriting table freezes the confirm-email, reset and login
// strings but names no signup heading/CTA — this surface uses the calm
// "Create your account" heading and "Sign up" action in the same voice
// (sentence case, no welcome, no celebration), recorded in 03-04-SUMMARY.
import { Surface } from '@/components/primitives';
import { SignUpForm } from './signup-form';

const GHOST_LINK_CLASSES =
  'inline-flex w-fit items-center justify-center gap-xs rounded-pill px-md min-h-11 md:min-h-8 text-body font-semibold leading-body text-text-primary';

export default function SignUpPage() {
  return (
    <Surface
      variant="canvas"
      className="flex min-h-screen items-center justify-center bg-canvas p-lg"
    >
      <div className="flex w-full max-w-[24rem] flex-col gap-md">
        <h1 className="text-heading font-semibold leading-heading text-text-primary">
          Create your account
        </h1>
        <SignUpForm />
        <a href="/login" className={GHOST_LINK_CLASSES}>
          Back to sign in
        </a>
      </div>
    </Surface>
  );
}
