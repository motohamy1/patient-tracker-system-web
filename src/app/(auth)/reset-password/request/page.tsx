// /reset-password/request — the reset request surface (D-05, D-07;
// 03-UI-SPEC §8.1).
//
// Bare (auth) column grammar, same as /login and /signup. The body line
// "We will email you a link to set a new password." and the "Send reset
// link" action are the §Copywriting strings. On success the client form
// swaps to the SAME fixed confirmation regardless of account existence
// (Pitfall 4 no-leak — the confirmation copy never names an account state).
// "Back to sign in" ghost link per §8.1 secondary actions.
import { INSET_FILL } from '@/components/primitives/CompactControl';
import { Surface } from '@/components/primitives';
import { RequestForm } from './request-form';

const GHOST_LINK_CLASSES =
  'inline-flex w-fit items-center justify-center gap-xs rounded-pill px-md min-h-11 md:min-h-8 text-body font-semibold leading-body text-text-primary';

export default function ResetPasswordRequestPage() {
  return (
    <Surface
      variant="canvas"
      className="flex min-h-screen items-center justify-center bg-canvas p-lg"
    >
      <div className="flex w-full max-w-[24rem] flex-col gap-md text-text-primary">
        <h1 className="text-heading font-semibold leading-heading text-text-primary">
          Reset your password
        </h1>
        <p className="text-body leading-body text-text-primary">
          We will email you a link to set a new password.
        </p>
        <RequestForm insetFill={INSET_FILL} />
        <a href="/login" className={GHOST_LINK_CLASSES}>
          Back to sign in
        </a>
      </div>
    </Surface>
  );
}
