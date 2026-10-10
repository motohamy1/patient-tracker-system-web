// /patient/billing — the patient's invoices and receipts (Phase 18, ticket
// 18-03; PAY-02).
//
// Server Component, force-dynamic: the body resolves the patient from the
// VERIFIED SESSION (never the URL — §3.1) and streams its own read. The
// fallback states nothing about the patient.
import { Suspense } from 'react';
import { Surface } from '@/components/primitives';
import { PatientBillingBody } from '@/components/patient/PatientBillingBody';
import { PatientBillingSkeleton } from '@/components/patient/PatientBillingSkeleton';

export const dynamic = 'force-dynamic';

export default function PatientBillingPage() {
  return (
    <Surface variant="canvas" className="flex flex-1 bg-canvas p-lg">
      <div className="mx-auto flex w-full max-w-[64rem] flex-col gap-lg">
        <h1 className="text-heading font-semibold leading-heading text-text-primary">Billing</h1>
        <Suspense fallback={<PatientBillingSkeleton />}>
          <PatientBillingBody />
        </Suspense>
      </div>
    </Surface>
  );
}
