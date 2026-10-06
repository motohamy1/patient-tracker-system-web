// /patient — the patient home empty shell (D-01, D-04).
//
// A Server Component with no client boundary and no client state. It renders a
// `canvas` field holding the shared `EmptyState` (itself a `surfaceRaised`
// card). No action is rendered, because no destination is wired in this phase
// (02-UI-SPEC.md §5.5).
//
// COPY VOICE: the patient-facing body uses the second person ("your visits,
// results and medications"). The provider-facing bodies use the neutral third
// person the reference uses. The two "No record yet" titles are intentionally
// identical — the same record type seen from two roles — and the bodies differ
// so a reader is never in doubt which workspace they are in (02-UI-SPEC.md
// §9.1). Do not make the two read alike in a later phase.
//
// No clinical content appears here: the copy is the fixed string from
// 02-UI-SPEC.md §9.1 and names no patient, medication, measurement or specialty
// (FOUND-01).
import { Surface } from '@/components/primitives';
import { EmptyState } from '@/components/primitives/EmptyState';

export default function PatientRecordPage() {
  return (
    <Surface variant="canvas" className="flex flex-1 items-center justify-center bg-canvas p-lg">
      <EmptyState
        title="No record yet"
        body="Your visits, results and medications appear here as your care is recorded."
      />
    </Surface>
  );
}
