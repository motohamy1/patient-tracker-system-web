// The patient route-group layout (D-02, 02-UI-SPEC.md §6.1, §6.5).
//
// THREE FACTS a later reader needs:
//  1. This is a NESTED route-group layout beneath the single root layout
//     (`src/app/layout.tsx`), so a /provider to /patient role switch is a client
//     navigation, not a full document reload (02-RESEARCH.md Pattern 3).
//  2. Patient surfaces have NO persistent sidebar (docs/governance/
//     reference-ui-specification.md §6): the chrome is the `PatientTopBar` and,
//     below 768px, the `MobileNav` strip. No rail is rendered.
//  3. THE PHASE-003 SLOT, FILLED (plan 03-03). Server-side role resolution runs
//     BEFORE the render tree below: `resolveWorkspaceRole('patient')` reads
//     verified claims + DB membership from the request context — never
//     localStorage, browser state or a URL parameter — and
//     `redirectForRole('patient', resolution)` applies the D-12 redirect
//     exactly once per request. No middleware and no client-side gate exists:
//     a fake gate that looks real is worse than none (D-03, AGENTS.md
//     §Security). RLS (migration 0002) is the enforcement layer; the redirect
//     is UX, and nothing role-based crosses the RSC -> client boundary.
import type { ReactNode } from 'react';
import { Surface } from '@/components/primitives';
import { PatientTopBar } from '@/components/shell/PatientTopBar';
import { MobileNav } from '@/components/shell/MobileNav';
import { redirectForRole } from '@/lib/auth/redirect';
import { resolveWorkspaceRole } from '@/lib/auth/workspace';

const PATIENT_MOBILE_ITEMS = [{ value: 'home', label: 'Home', href: '/patient' }];

export default async function PatientLayout({ children }: { children: ReactNode }) {
  const resolution = await resolveWorkspaceRole('patient');
  redirectForRole('patient', resolution);

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
