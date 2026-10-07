// /signup/check-email — the state after signup submits (D-05; 03-UI-SPEC §8.1).
//
// "After signup, the same column renders a heading 'Check your email' and one
// body line naming the address the user typed — a stated information purpose
// for a sparse surface (INV-12 satisfied), no filler card."
//
// The address arrives as a URL search param and is rendered as a plain text
// node — React never emits it as markup, so no echo/injection path exists.
// No entrance animation; the heading is the destination focus target
// (tabindex="-1" per §Focus, it is the first content in tab order anyway).
import { Surface } from '@/components/primitives';

const GHOST_LINK_CLASSES =
  'inline-flex w-fit items-center justify-center gap-xs rounded-pill px-md min-h-11 md:min-h-8 text-body font-semibold leading-body text-text-primary';

const MAX_ECHO_LENGTH = 254;

export default async function CheckEmailPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const rawEmail = params.email;
  const email =
    typeof rawEmail === 'string' && rawEmail.length <= MAX_ECHO_LENGTH ? rawEmail : '';

  return (
    <Surface
      variant="canvas"
      className="flex min-h-screen items-center justify-center bg-canvas p-lg"
    >
      <div className="flex w-full max-w-[24rem] flex-col gap-md text-text-primary">
        <h1
          tabIndex={-1}
          className="text-heading font-semibold leading-heading text-text-primary"
        >
          Check your email
        </h1>
        <p className="text-body leading-body text-text-primary">
          {email
            ? `We sent a confirmation link to ${email}. Follow it to finish setting up your account.`
            : 'We sent you a link to finish setting up your account.'}
        </p>
        <a href="/login" className={GHOST_LINK_CLASSES}>
          Back to sign in
        </a>
      </div>
    </Surface>
  );
}
