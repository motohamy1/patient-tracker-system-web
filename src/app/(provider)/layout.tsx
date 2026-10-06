// The provider route-group layout (D-02, 02-UI-SPEC.md §6.1).
//
// THREE FACTS a later reader needs:
//  1. This is a NESTED route-group layout beneath the single root layout
//     (`src/app/layout.tsx`), so a /provider to /patient role switch is a client
//     navigation, not a full document reload (02-RESEARCH.md Pattern 3).
//  2. Role chrome lives HERE and never in the root layout: the persistent rail,
//     the top bar and the mobile strip are provider-specific.
//  3. THIS IS THE EXACT SLOT where Phase 003's server-side role resolution
//     lands. That resolution must read the role from the request context
//     (the server session), and NEVER from localStorage, browser state or a URL
//     parameter. No `middleware.ts` and no client-side gate is created in this
//     phase: a fake gate that looks real is worse than none (D-03, AGENTS.md
//     §Security). The routes are openly temporary, not accidentally permissive.
import type { ReactNode } from 'react';
import { Surface } from '@/components/primitives';
import { ProviderRail } from '@/components/shell/ProviderRail';
import { ProviderTopBar } from '@/components/shell/ProviderTopBar';
import { MobileNav } from '@/components/shell/MobileNav';

const PROVIDER_MOBILE_ITEMS = [{ value: 'home', label: 'Home', href: '/provider' }];

export default function ProviderLayout({ children }: { children: ReactNode }) {
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
