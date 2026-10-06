// The (auth) route-group layout (D-02, 02-UI-SPEC.md §6.1).
//
// THIS GROUP IS DELIBERATELY BARE. It renders a `canvas` field holding a single
// centred column and nothing else: no Rail, no top bar and no nav of any kind.
//
// Its existence is the proof that the route-group pattern supports a
// chrome-free layout (three groups, each owning its own chrome), and therefore
// that no role chrome was pushed up into the shared root layout. If the bare
// group could not exist, chrome would have to live in `src/app/layout.tsx` and
// would leak into every role (D-02).
//
// There is no access control here yet. Phase 003's server-side role resolution
// lands in the provider and patient layouts; this group stays open in Phase 002
// and says so on its `/login` page (D-03).
import type { ReactNode } from 'react';
import { Surface } from '@/components/primitives';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <Surface
      variant="canvas"
      className="flex min-h-screen items-center justify-center bg-canvas p-lg"
    >
      <div className="flex w-full max-w-[32rem] flex-col items-center">{children}</div>
    </Surface>
  );
}
