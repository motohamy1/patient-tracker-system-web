// /patient/home — the patient's care surface (Phase 13, ticket 13-02;
// PTH-01, docs/governance/reference-ui-specification.md §14).
//
// Server Component, force-dynamic. The page owns only the streaming boundary:
// `PatientHomeBody` resolves the signed-in patient from the VERIFIED SESSION
// (never the URL, never client state — §3.1) and runs inside its own
// `<Suspense>` so a slow read streams a token-derived skeleton instead of a
// blank panel (§24). The fallback renders no patient data of any kind.
import { Suspense } from 'react';
import { Surface } from '@/components/primitives';
import { PatientHomeBody } from '@/components/patient/PatientHomeBody';
import { PatientHomeSkeleton } from '@/components/patient/PatientHomeSkeleton';

export const dynamic = 'force-dynamic';

export default function PatientHomePage() {
  return (
    <Surface variant="canvas" className="flex flex-1 bg-canvas p-lg">
      <Suspense fallback={<PatientHomeSkeleton />}>
        <PatientHomeBody />
      </Suspense>
    </Surface>
  );
}
