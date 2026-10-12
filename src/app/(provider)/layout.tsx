// The provider route-group layout (D-02, 02-UI-SPEC.md §6.1).
//
// THIS LAYOUT IS NOW THE SHARED AUTH GATE ONLY. Role chrome (the rail, the
// provider top bar, the mobile strip) no longer lives here: it moved into the
// `(shell)` route group (`provider/(shell)/layout.tsx`) so it wraps ONLY the
// ordinary provider surfaces — provider-home and the patient collection. The
// immersive patient workspace (`provider/patients/[patientId]/*`) is a sibling
// of `(shell)` and carries its own full-bleed clinical frame, so the provider
// chrome no longer crowds the patient workspace (§4.1).
//
// THREE FACTS a later reader needs:
//  1. This is a NESTED route-group layout beneath the single root layout
//     (`src/app/layout.tsx`), so a /provider to /patient role switch is a client
//     navigation, not a full document reload (02-RESEARCH.md Pattern 3).
//  2. Role CHROME is scoped by route group, not by CSS: `(shell)` opts in to the
//     provider rail/top bar, `[patientId]` opts in to the immersive workspace
//     frame. Clean App Router structure — no post-render DOM manipulation.
//  3. THE PHASE-003 SLOT, FILLED (plan 03-03). Server-side role resolution runs
//     BEFORE the render tree below: `resolveWorkspaceRole('provider')` reads
//     the verified Managed Neon Auth session + DB membership from the request
//     context — never localStorage, browser state or a URL parameter — and
//     `redirectForRole('provider', resolution)` applies the D-12 redirect
//     exactly once per request. This gate guards EVERY provider route — both
//     the `(shell)` surfaces and the immersive patient workspace — so removing
//     the chrome from the patient view never weakened the auth boundary
//     (§3.1, §12). The redirect is UX, not enforcement: RLS is inert on the
//     single-owner Neon connection, so every query below/behind this layout
//     carries an explicit `org_id` predicate. Nothing role-based crosses the
//     RSC -> client boundary.
import type { ReactNode } from 'react';
import { redirectForRole } from '@/lib/auth/redirect';
import { resolveWorkspaceRole } from '@/lib/auth/workspace';

export default async function ProviderLayout({ children }: { children: ReactNode }) {
  const resolution = await resolveWorkspaceRole('provider');
  redirectForRole('provider', resolution);

  // A bare, full-height host: each subtree (the `(shell)` chrome or the
  // immersive patient frame) owns its own silhouette and fills this. Keeping
  // the host neutral is what lets the patient workspace paint its own olive
  // frame edge-to-edge without a provider-colored ring around it.
  return <div className="flex min-h-screen flex-col bg-frame">{children}</div>;
}
