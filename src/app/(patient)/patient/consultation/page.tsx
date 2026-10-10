// /patient/consultation — the patient's own telehealth consultation (Phase
// 17, ticket 17-03; TH-02).
//
// Server Component, force-dynamic. The session is resolved from the VERIFIED
// SESSION (never the URL, never client state — §3.1): the patient sees only
// their own consultation and only their own join reference. Staff surfaces,
// ids and notes never appear here.
import { Suspense } from 'react';
import { Surface } from '@/components/primitives';
import { PatientConsultationBody } from '@/components/patient/PatientConsultationBody';
import { PatientConsultationSkeleton } from '@/components/patient/PatientConsultationSkeleton';

export const dynamic = 'force-dynamic';

export default function PatientConsultationPage() {
  return (
    <Surface variant="canvas" className="flex flex-1 bg-canvas p-lg">
      <div className="mx-auto flex w-full max-w-[64rem] flex-col gap-lg">
        <h1 className="text-heading font-semibold leading-heading text-text-primary">Your consultation</h1>
        <Suspense fallback={<PatientConsultationSkeleton />}>
          <PatientConsultationBody />
        </Suspense>
      </div>
    </Surface>
  );
}
