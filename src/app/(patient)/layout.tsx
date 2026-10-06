// The patient route-group layout (D-02, 02-UI-SPEC.md §6.1, §6.5).
//
// THREE FACTS a later reader needs:
//  1. This is a NESTED route-group layout beneath the single root layout
//     (`src/app/layout.tsx`), so a /provider to /patient role switch is a client
//     navigation, not a full document reload (02-RESEARCH.md Pattern 3).
//  2. Patient surfaces have NO persistent sidebar (docs/governance/
//     reference-ui-specification.md §6): the chrome is the `PatientTopBar` and,
//     below 768px, the `MobileNav` strip. No rail is rendered.
//  3. THIS IS THE EXACT SLOT where Phase 003's server-side role resolution
//     lands. That resolution must read the role from the request context
//     (the server session), and NEVER from localStorage, browser state or a URL
//     parameter. No `middleware.ts` and no client-side gate is created in this
//     phase: a fake gate that looks real is worse than none (D-03, AGENTS.md
//     §Security). The routes are openly temporary, not accidentally permissive.
import type { ReactNode } from 'react';
import { Surface } from '@/components/primitives';
import { PatientTopBar } from '@/components/shell/PatientTopBar';
import { MobileNav } from '@/components/shell/MobileNav';

const PATIENT_MOBILE_ITEMS = [{ value: 'home', label: 'Home', href: '/patient' }];

export default function PatientLayout({ children }: { children: ReactNode }) {
  return (
    <Surface variant="canvas" className="flex min-h-screen flex-col bg-canvas">
      <PatientTopBar />
      <MobileNav
        items={PATIENT_MOBILE_ITEMS}
        activeValue="home"
        ariaLabel="Patient navigation"
      />
      {children}
    </Surface>
  );
}
