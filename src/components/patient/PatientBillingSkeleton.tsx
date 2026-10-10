// PatientBillingSkeleton — the billing loading baseline (§24).
//
// Two quiet surfaces at the shape the billing list takes, never a generic
// "Loading…" screen and never a blank panel. States nothing about the
// patient.
import { LoadingSkeleton } from '@/components/state/LoadingSkeleton';

const BLOCK_CLASSES = 'skeleton-pulse rounded-lg bg-surface-muted';

export function PatientBillingSkeleton() {
  return (
    <div className="flex flex-col gap-md" aria-busy="true">
      <LoadingSkeleton bars={[]} />
      <div aria-hidden="true" className={`${BLOCK_CLASSES} h-28`} />
      <div aria-hidden="true" className={`${BLOCK_CLASSES} h-28`} />
    </div>
  );
}
