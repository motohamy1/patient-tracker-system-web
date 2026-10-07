// /reset-password/update — the new-password surface (D-07; 03-UI-SPEC §8.1).
//
// Reached through the recovery email link: /auth/confirm verifies the
// recovery token (type=recovery) and lands here; the mutation runs against
// the recovery session through the updatePasswordAction server action, and
// success routes to /login. Bare (auth) column grammar, heading "Set a new
// password", a "Confirm password" field, action "Set new password",
// "Back to sign in" ghost link — all §Copywriting strings.
import { Surface } from '@/components/primitives';
import { UpdateForm } from './update-form';

const GHOST_LINK_CLASSES =
  'inline-flex w-fit items-center justify-center gap-xs rounded-pill px-md min-h-11 md:min-h-8 text-body font-semibold leading-body text-text-primary';

export default function ResetPasswordUpdatePage() {
  return (
    <Surface
      variant="canvas"
      className="flex min-h-screen items-center justify-center bg-canvas p-lg"
    >
      <div className="flex w-full max-w-[24rem] flex-col gap-md text-text-primary">
        <h1 className="text-heading font-semibold leading-heading text-text-primary">
          Set a new password
        </h1>
        <UpdateForm />
        <a href="/login" className={GHOST_LINK_CLASSES}>
          Back to sign in
        </a>
      </div>
    </Surface>
  );
}
