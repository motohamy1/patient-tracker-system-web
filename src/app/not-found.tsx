// Root not-found.tsx — the 404 surface for the whole application (D-01,
// 02-RESEARCH.md Open Questions 2).
//
// WHY THIS FILE EXISTS AND WHY THERE IS NO `src/app/page.tsx`: the repository
// uses ONE root layout with three NESTED role layouts (Pattern 3). With a
// single top-level layout, `/` is simply undefined — Next renders this file for
// it. Adding a `src/app/page.tsx` would silently widen the locked D-01 route map
// with an unlisted `/` route (a redirect or a home page), which is exactly what
// Open Questions 2 recommended against. So `/` resolves here, to a typed,
// styled surface, rather than to Next's default error output.
//
// Built from the same primitives as every other shell, with no action, because
// no destination is wired in this phase (02-UI-SPEC.md §5.5). It renders inside
// the single root layout, so it declares no <html> or <body> of its own.
import { Surface } from '@/components/primitives';
import { EmptyState } from '@/components/primitives/EmptyState';

export default function NotFound() {
  return (
    <Surface
      variant="canvas"
      className="flex min-h-screen items-center justify-center bg-canvas p-lg"
    >
      <EmptyState
        title="Page not found"
        body="This address does not match a route in the application."
      />
    </Surface>
  );
}
