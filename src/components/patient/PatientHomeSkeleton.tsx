// PatientHomeSkeleton — the Patient Home loading baseline (§24, UX-01).
//
// Token-derived skeleton blocks at the REAL shape the Home is about to take —
// two full-width regions, a two-up row, the wide snapshot and log regions, a
// second two-up row, and the communication region — never a generic
// "Loading…" screen and never a blank panel. One accessible status node and
// one pulse-CSS emission for the whole region (the shared `LoadingSkeleton`
// primitive). No border, no third shadow: a skeleton states nothing about the
// patient.
import { LoadingSkeleton } from '@/components/state/LoadingSkeleton';

const BLOCK_CLASSES = 'skeleton-pulse rounded-lg bg-surface-muted';

export function PatientHomeSkeleton() {
  return (
    <div className="mx-auto flex w-full max-w-[64rem] flex-col gap-lg" aria-busy="true">
      <LoadingSkeleton bars={[]} />

      <div aria-hidden="true" className={`${BLOCK_CLASSES} h-28`} />
      <div aria-hidden="true" className={`${BLOCK_CLASSES} h-28`} />

      <div className="grid grid-cols-1 gap-lg lg:grid-cols-2">
        <div aria-hidden="true" className={`${BLOCK_CLASSES} h-40`} />
        <div aria-hidden="true" className={`${BLOCK_CLASSES} h-40`} />
      </div>

      <div aria-hidden="true" className={`${BLOCK_CLASSES} h-56`} />
      <div aria-hidden="true" className={`${BLOCK_CLASSES} h-28`} />

      <div className="grid grid-cols-1 gap-lg lg:grid-cols-2">
        <div aria-hidden="true" className={`${BLOCK_CLASSES} h-40`} />
        <div aria-hidden="true" className={`${BLOCK_CLASSES} h-40`} />
      </div>

      <div aria-hidden="true" className={`${BLOCK_CLASSES} h-24`} />
    </div>
  );
}
