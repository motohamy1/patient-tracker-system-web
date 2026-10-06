// /provider — the provider home empty shell (D-01, D-04).
//
// A Server Component with no client boundary and no client state. It renders a
// `canvas` field holding the shared `EmptyState` (which is itself a
// `surfaceRaised` card). No action is rendered, because no destination is wired
// in this phase (02-UI-SPEC.md §5.5).
//
// No clinical content appears here: the copy is the fixed string from
// 02-UI-SPEC.md §9.1 and names no patient, medication, measurement or specialty
// (FOUND-01).
import { Surface } from '@/components/primitives';
import { EmptyState } from '@/components/primitives/EmptyState';

export default function ProviderHomePage() {
  return (
    <Surface variant="canvas" className="flex flex-1 items-center justify-center bg-canvas p-lg">
      <EmptyState
        title="No patients yet"
        body="Patient folders appear here once they are added to the practice."
      />
    </Surface>
  );
}
