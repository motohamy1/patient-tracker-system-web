// /provider/onboarding/create-org — the D-01 owner bootstrap step (03-UI-SPEC §8.3).
//
// WHY THIS ROUTE IS NOT IN THE (provider) GROUP (bug fix, self-redirect loop):
// the (provider) layout applies `redirectForRole('provider', resolution)` before
// its children render, and for an UNAFFILIATED principal (signed in, zero
// memberships) that redirects to `CREATE_ORG_PATH` — this very URL. With the
// page inside (provider), every request for the onboarding URL re-ran the
// layout guard and redirected to itself, so an unaffiliated user looped on
// /provider/onboarding/create-org forever and never saw the form. The URL is
// unchanged (route groups do not affect the path); the page simply lives in a
// chrome-free group so no workspace layout guards it. Its own server guard
// below remains the single authority for who may see the form.
//
// Server guard: a SIGNED-IN principal with any membership is sent to their own
// workspace (never re-run org creation through the onboarding URL), and an
// unauthenticated visitor goes to login; only an UNAFFILIATED principal sees
// the form. force-dynamic: this is an authenticated workspace route and never
// statically cached (Pitfall 11).
import { redirect } from 'next/navigation';
import { Surface } from '@/components/primitives';
import { INSET_FILL } from '@/components/primitives/CompactControl';
import { LOGIN_PATH, ownWorkspaceTarget } from '@/lib/auth/redirect';
import { createOrgAction } from '@/lib/auth/actions.membership';
import { resolveWorkspaceRole } from '@/lib/auth/workspace';

export const dynamic = 'force-dynamic';

async function createOrgFromForm(formData: FormData): Promise<void> {
  'use server';
  const name = String(formData.get('name') ?? '');
  const result = await createOrgAction(name);
  if (result.ok) redirect('/provider/members');
  redirect('/provider/onboarding/create-org?error=1');
}

export default async function CreateOrgPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolution = await resolveWorkspaceRole('provider');

  if (resolution.kind === 'unauthenticated') {
    redirect(LOGIN_PATH);
    return null;
  }
  if (resolution.kind === 'signed-in') {
    redirect(ownWorkspaceTarget(resolution.role));
    return null;
  }

  const params = await searchParams;
  const failed = params.error === '1';

  return (
    <Surface variant="canvas" className="flex min-h-screen items-center justify-center bg-canvas p-lg">
      <div className="flex w-full max-w-[24rem] flex-col gap-md">
        <h1 className="text-heading font-semibold leading-heading text-text-primary">Create your organization</h1>
        {failed ? (
          <p className="flex items-center gap-xs text-label leading-label text-text-primary">
            <span aria-hidden="true" className="inline-block size-4 shrink-0 rounded-pill bg-critical" />
            Couldn't create your organization. Check your connection and try again.
          </p>
        ) : null}
        <form action={createOrgFromForm} className="flex w-full flex-col gap-md">
          <label htmlFor="org-name" className="text-label leading-label text-text-primary">
            Organization name
          </label>
          <div className={`flex w-full items-center gap-xs rounded-md px-lg min-h-11 md:min-h-8 ${INSET_FILL}`}>
            <input
              id="org-name"
              name="name"
              type="text"
              autoComplete="organization"
              placeholder="Your practice name"
              className="min-w-0 flex-1 bg-transparent text-body leading-body text-text-primary placeholder:text-text-primary"
            />
          </div>
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-xs bg-accent-soft text-text-primary rounded-pill px-xl min-h-11 md:min-h-8 text-body font-semibold leading-body"
          >
            Create organization
          </button>
        </form>
      </div>
    </Surface>
  );
}
