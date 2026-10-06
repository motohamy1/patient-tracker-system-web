// /patient/home — the patient care-activity empty shell (D-01, D-04).
//
// A Server Component with no client boundary and no client state. It renders a
// `canvas` field holding the shared `EmptyState`. No action is rendered,
// because no destination is wired in this phase (02-UI-SPEC.md §5.5).
//
// COPY: the exact string from 02-UI-SPEC.md §9.1, in the second person, with no
// fabricated urgency and no named condition, medication or measurement
// (FOUND-01, docs/governance/reference-ui-specification.md §7).
import { Surface } from '@/components/primitives';
import { EmptyState } from '@/components/primitives/EmptyState';

export default function PatientHomePage() {
  return (
    <Surface variant="canvas" className="flex flex-1 items-center justify-center bg-canvas p-lg">
      <EmptyState
        title="No care activity yet"
        body="Today's care, next actions and your care plan appear here as your care progresses."
      />
    </Surface>
  );
}
