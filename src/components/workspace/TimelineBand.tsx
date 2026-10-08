// TimelineBand — the framed host Phase 006 fills (ticket 04; WSP-02
// "interactive timeline"; §3.5, §27).
//
// The band exists at the reference's full-width position so the Overview
// reads as the complete layout, and it is honestly EMPTY: it draws no axis,
// no month dividers, no event nodes, no branch arcs and no count badges —
// those are Phase-006 deliverables and faking them here would be exactly the
// "static decorative drawing" §3.5 forbids. The bottom scrubber and its dark
// viewport window (TL-06) are likewise not drawn — QA rows 8–10 are recorded
// N/A → Phase 006.
//
// The frame is the inset `surfaceMuted` fill: a recessed region on the
// canvas, no shadow (INV-13 — recess is expressed by fill, never by a third
// elevation) and no perimeter border (INV-16). Rows of copy follow the §7
// contract: a "No {record-type} yet" heading, one line of what will appear,
// one next step. No phase names appear in any user-facing string.
//
// Server Component: no hook, no client directive.
import { Surface } from '@/components/primitives';

export function TimelineBand() {
  return (
    <section aria-label="Timeline" className="min-h-44">
      <Surface variant="surfaceMuted" className="flex h-full min-h-44 flex-col gap-md">
        <h2 className="text-heading font-semibold leading-heading text-text-primary">Timeline</h2>
        <div className="flex flex-1 flex-col items-center justify-center gap-xs text-center">
          <span className="text-body font-semibold leading-body text-text-primary">
            No timeline events yet
          </span>
          <span className="text-body leading-body text-text-secondary">
            Visits, medications and results will appear here as care progresses.
          </span>
          <span className="text-label leading-label text-text-secondary">
            Document a visit to place the first event.
          </span>
        </div>
      </Surface>
    </section>
  );
}
