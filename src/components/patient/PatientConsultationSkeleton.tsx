// PatientConsultationSkeleton — the consultation loading baseline (§24).
//
// One quiet surface at the shape the consultation takes, never a generic
// "Loading…" screen and never a blank panel. States nothing about the
// patient.
import { LoadingSkeleton } from '@/components/state/LoadingSkeleton';

const BLOCK_CLASSES = 'skeleton-pulse rounded-lg bg-surface-muted';

export function PatientConsultationSkeleton() {
  return (
    <div className="flex flex-col gap-md" aria-busy="true">
      <LoadingSkeleton bars={[]} />
      <div aria-hidden="true" className={`${BLOCK_CLASSES} h-40`} />
    </div>
  );
}
