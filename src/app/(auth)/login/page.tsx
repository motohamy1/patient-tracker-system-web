// /login — the bare (auth) group's only route in Phase 002 (D-01, D-04).
//
// ---------------------------------------------------------------------------
// D-03 OBLIGATION (in full): NO authentication is implemented in this phase.
// No form is rendered, no credential field exists and no submit control
// exists — a form that looks real would be a fake gate, which is worse than
// none. No `middleware.ts` exists anywhere in the repository. Phase 003's
// server-side role resolution lands in the provider and patient layouts, and it
// MUST read the role from the request context (the server session) and NEVER
// from localStorage, browser state or a URL parameter (AGENTS.md §Security,
// 02-RESEARCH.md §Security Domain).
// ---------------------------------------------------------------------------
//
// COPY NOTE: the empty-state copy states a FACT about the build ("access
// controls arrive in a later phase … renders for every visitor") and does not
// promise a date, per the copywriting contract in
// docs/governance/reference-ui-specification.md §7 and 02-UI-SPEC.md §9.1.
//
// No action is rendered, because no destination is wired in this phase
// (02-UI-SPEC.md §5.5).
import { Surface } from '@/components/primitives';
import { EmptyState } from '@/components/primitives/EmptyState';

export default function LoginPage() {
  return (
    <Surface
      variant="canvas"
      className="flex min-h-screen items-center justify-center bg-canvas p-lg"
    >
      <EmptyState
        title="Sign in is not active yet"
        body="Access controls arrive in a later phase. This route currently renders for every visitor."
      />
    </Surface>
  );
}
