// The provider SHELL layout (provider-home + the patient collection).
//
// Role chrome lives HERE, scoped to the `(shell)` route group: the persistent
// rail, the provider top bar, the mobile strip and the offline strip wrap only
// the ordinary provider surfaces. The immersive patient workspace
// (`provider/patients/[patientId]/*`) sits OUTSIDE this group, so it never
// receives this chrome — the workspace owns its own full-bleed clinical frame
// (§4.1). This is the clean App Router boundary: the shell is opted INTO by
// route group membership, never hidden with CSS or DOM tricks after render.
//
// Server-side role resolution has already run in the parent `(provider)` layout
// (the shared gate + D-12 redirect). This layout resolves the clinician's
// display name (a session-shape read) for the top-bar identity cluster only.
// Nothing role-based crosses the RSC -> client boundary.
import type { ReactNode } from 'react';
import { ProviderRail } from '@/components/shell/ProviderRail';
import { ProviderTopBar } from '@/components/shell/ProviderTopBar';
import { MobileNav } from '@/components/shell/MobileNav';
import { auth } from '@/lib/auth/server';
import { resolveWorkspaceRole } from '@/lib/auth/workspace';
import { OfflineSyncStrip } from '@/components/shell/OfflineSyncStrip';

const PROVIDER_MOBILE_ITEMS = [{ value: 'home', label: 'Home', href: '/provider' }];

/**
 * The clinician's display name from the session user, or null.
 *
 * A session-shape read (never a data write): the layout only needs the name for
 * the top bar. The session user's `name` is the Managed Auth equivalent of the
 * old claims metadata; an unnamed principal falls back to the email's local
 * part so the identity cluster is never blank.
 */
async function resolveDisplayName(): Promise<string | null> {
  let named: string | undefined;
  let email: string | undefined;
  try {
    const { data } = await auth.getSession();
    named = data?.user?.name;
    email = data?.user?.email;
  } catch {
    return null;
  }
  if (typeof named === 'string' && named.trim() !== '') return named.trim();
  if (typeof email === 'string' && email.includes('@')) {
    const prefix = email.split('@')[0].replace(/[._-]+/g, ' ').trim();
    return prefix === '' ? null : prefix.charAt(0).toUpperCase() + prefix.slice(1);
  }
  return null;
}

export default async function ProviderShellLayout({ children }: { children: ReactNode }) {
  const resolution = await resolveWorkspaceRole('provider');
  const displayName = resolution.kind === 'signed-in' ? await resolveDisplayName() : null;

  return (
    // THE FRAME WRAP (reference: patient-tracking-dashboard.jpg): `frame` is one
    // continuous chrome field — the rail, the top bar and the reserved scrollbar
    // gutter (painted `frame` at the root in globals.css) all sit on the same
    // field, so the top bar reads full-bleed to the window edge. `canvas` is the
    // inset workspace: one rounded (radius.xl) field the page content scrolls
    // inside — the reference's rounded light panel floating in the frame band.
    <div className="flex min-h-screen gap-lg bg-frame p-lg">
      <ProviderRail activeKey="home" />
      <div className="flex min-w-0 flex-1 flex-col gap-lg">
        <ProviderTopBar resolution={resolution} displayName={displayName} />
        <MobileNav
          items={PROVIDER_MOBILE_ITEMS}
          activeValue="home"
          ariaLabel="Provider navigation"
        />
        <OfflineSyncStrip />
        <div className="flex min-w-0 flex-1 flex-col overflow-clip rounded-xl bg-canvas">
          {children}
        </div>
      </div>
    </div>
  );
}
