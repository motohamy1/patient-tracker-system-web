// The provider route-group layout (D-02, 02-UI-SPEC.md §6.1).
//
// THREE FACTS a later reader needs:
//  1. This is a NESTED route-group layout beneath the single root layout
//     (`src/app/layout.tsx`), so a /provider to /patient role switch is a client
//     navigation, not a full document reload (02-RESEARCH.md Pattern 3).
//  2. Role chrome lives HERE and never in the root layout: the persistent rail,
//     the top bar and the mobile strip are provider-specific.
//  3. THE PHASE-003 SLOT, FILLED (plan 03-03). Server-side role resolution runs
//     BEFORE the render tree below: `resolveWorkspaceRole('provider')` reads
//     the verified Managed Neon Auth session + DB membership from the request
//     context — never localStorage, browser state or a URL parameter — and
//     `redirectForRole('provider', resolution)` applies the D-12 redirect
//     exactly once per request. No middleware and no client-side gate exists:
//     a fake gate that looks real is worse than none (D-03, AGENTS.md
//     §Security). The redirect is UX, not enforcement: RLS is inert on the
//     single-owner Neon connection, so every query below/behind this layout
//     carries an explicit `org_id` predicate. Nothing role-based crosses the
//     RSC -> client boundary.
import type { ReactNode } from 'react';
import { ProviderRail } from '@/components/shell/ProviderRail';
import { ProviderTopBar } from '@/components/shell/ProviderTopBar';
import { MobileNav } from '@/components/shell/MobileNav';
import { redirectForRole } from '@/lib/auth/redirect';
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

export default async function ProviderLayout({ children }: { children: ReactNode }) {
  const resolution = await resolveWorkspaceRole('provider');
  redirectForRole('provider', resolution);

  const displayName = resolution.kind === 'signed-in' ? await resolveDisplayName() : null;

  return (
    // THE FRAME WRAP (2026-10-11, reference: patient-tracking-dashboard.jpg):
    // `frame` is one continuous chrome field — the rail, the top bar and the
    // reserved scrollbar gutter (painted `frame` at the root in globals.css)
    // all sit on the same field, so the top bar reads full-bleed to the
    // window edge and is never cut short. `canvas` is the inset workspace:
    // one rounded (radius.xl) field the page content scrolls inside, exactly
    // the reference's rounded light panel floating in the frame band. Light
    // frame only — D-01.
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
        <div className="flex min-w-0 flex-1 flex-col rounded-xl bg-canvas">
          {children}
        </div>
      </div>
    </div>
  );
}
