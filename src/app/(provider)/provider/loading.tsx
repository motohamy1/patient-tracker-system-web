// src/app/(provider)/provider/loading.tsx — the /provider loading baseline
// (UX-01; D-20; 04-UI-SPEC §4.7).
//
// Folder-shaped skeletons at the SAME 3/2/1 grid rhythm as the real grid
// (responsive-rules band edges at 1024px / 768px), never a generic "Loading…"
// screen (§7, UX-01). The pulse CSS and the single accessible status node
// come from the shared `LoadingSkeleton` primitive — rendered once, outside
// the grid, so six cards do not announce six live regions and do not duplicate
// the keyframes — and each cell paints the primitive's own bar grammar
// (`skeleton-pulse`, `bg-surface-muted`, `radius.md`) at the real folder card's
// density. No border, no third shadow, no status tint: a skeleton states
// nothing about a patient.
import { LoadingSkeleton } from '@/components/state/LoadingSkeleton';

/** Two rows of three folders on desktop — the shape the grid is about to take. */
const SKELETON_CARDS = 6;

const CARD_BAR_CLASSES = 'skeleton-pulse rounded-md bg-surface-muted';

export default function ProviderLoading() {
  return (
    <div className="flex flex-1 flex-col gap-xl p-lg">
      {/* One status node + one pulse-CSS emission for the whole region. */}
      <LoadingSkeleton bars={[]} />
      <div className="mx-auto grid w-full max-w-[80rem] grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-lg">
        {Array.from({ length: SKELETON_CARDS }, (_, index) => (
          <div
            key={index}
            aria-hidden="true"
            className="flex flex-col gap-md rounded-lg bg-surface p-lg shadow-raised"
          >
            <span className={`${CARD_BAR_CLASSES} h-4 w-2/3`} />
            <span className={`${CARD_BAR_CLASSES} h-0.5 w-full`} />
            <span className={`${CARD_BAR_CLASSES} h-4 w-1/3`} />
            <span className={`${CARD_BAR_CLASSES} h-3 w-1/2`} />
          </div>
        ))}
      </div>
    </div>
  );
}
