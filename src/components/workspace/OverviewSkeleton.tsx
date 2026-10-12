// OverviewSkeleton — the Overview loading baseline (§24, UX-01).
//
// Token-derived skeleton blocks at the REAL shape the Overview body is about
// to take — the timeline band and the 55/22.5/22.5 three-card bottom row —
// never a generic "Loading…" screen and never a blank panel. The header (close
// control, identity, search, tabs) paints from `WorkspaceTopBar` immediately
// and is NOT part of this boundary, so no header block is faked here.
//
// The pulse CSS and the single accessible status node come from the shared
// `LoadingSkeleton` primitive, emitted once for the whole region so the
// skeleton does not announce one live region per block or duplicate the
// keyframes. Reduced motion disables the pulse through the primitive's own
// CSS. No border, no third shadow, no status tint: a skeleton states nothing
// about a patient.
import { LoadingSkeleton } from '@/components/state/LoadingSkeleton';
import { BOTTOM_ROW_GRID } from '@/components/workspace/grids';

const BLOCK_CLASSES = 'skeleton-pulse rounded-lg bg-surface-muted';

/** The bottom row: wide card + two side cards (QA row 5: 55 / 22.5 / 22.5). */
const BOTTOM_ROW = `${BLOCK_CLASSES} h-40`;

export function OverviewSkeleton() {
  return (
    <div className="flex flex-col gap-xl" aria-busy="true">
      {/* One status node + one pulse-CSS emission for the whole region. */}
      <LoadingSkeleton bars={[]} />

      <div aria-hidden="true" className={`${BLOCK_CLASSES} h-44`} />

      <div className={BOTTOM_ROW_GRID}>
        <div aria-hidden="true" className={BOTTOM_ROW} />
        <div aria-hidden="true" className={BOTTOM_ROW} />
        <div aria-hidden="true" className={BOTTOM_ROW} />
      </div>
    </div>
  );
}
