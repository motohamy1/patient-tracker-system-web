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
//     verified claims + DB membership from the request context — never
//     localStorage, browser state or a URL parameter — and
//     `redirectForRole('provider', resolution)` applies the D-12 redirect
//     exactly once per request. No middleware and no client-side gate exists:
//     a fake gate that looks real is worse than none (D-03, AGENTS.md
//     §Security). RLS (migration 0002) is the enforcement layer; the redirect
//     is UX, and nothing role-based crosses the RSC -> client boundary.
import type { ReactNode } from 'react';
import { Surface } from '@/components/primitives';
import { ProviderRail } from '@/components/shell/ProviderRail';
import { ProviderTopBar } from '@/components/shell/ProviderTopBar';
import { MobileNav } from '@/components/shell/MobileNav';
import { redirectForRole } from '@/lib/auth/redirect';
import { resolveWorkspaceRole } from '@/lib/auth/workspace';

const PROVIDER_MOBILE_ITEMS = [{ value: 'home', label: 'Home', href: '/provider' }];

export default async function ProviderLayout({ children }: { children: ReactNode }) {
  const resolution = await resolveWorkspaceRole('provider');
  redirectForRole('provider', resolution);

  return (
    <Surface variant="canvas" className="flex min-h-screen">
      <ProviderRail activeKey="home" />
      <div className="flex min-w-0 flex-1 flex-col bg-canvas">
        <ProviderTopBar />
        <MobileNav
          items={PROVIDER_MOBILE_ITEMS}
          activeValue="home"
          ariaLabel="Provider navigation"
        />
        {children}
      </div>
    </Surface>
  );
}
