// TimelineBand — the band frame that hosts the clinical timeline
// (reference §5; replaced the Phase-5 placeholder in 06-01).
//
// The frame is the inset `surfaceMuted` fill: a recessed region on the
// canvas, no shadow (INV-13 — recess is fill, not a third elevation) and no
// border (INV-16). The band owns the frame, the heading and the states; the
// timeline's axis grammar, its nodes and its (later) zoom/scrubber live in
// `ClinicalTimeline`, so the band file stays stable across phases 006→010.
//
// `events` arrive from the Server Component projection (real records only) —
// the band adds no data of its own and never fabricates an axis (§27).
//
// Server Component: no hook, no client directive (the timeline itself is the
// client island and arrives through `ClinicalTimeline`).
import { ClinicalTimeline } from '@/components/timeline/ClinicalTimeline';
import { Surface } from '@/components/primitives';
import type { CareEvent } from '@/lib/timeline/events';

export function TimelineBand({ events }: { events: readonly CareEvent[] }) {
  return (
    <section aria-label="Timeline" className="min-h-44">
      <Surface variant="surfaceMuted" className="flex h-full min-h-44 flex-col gap-md">
        <h2 className="text-heading font-semibold leading-heading text-text-primary">Timeline</h2>
        <ClinicalTimeline events={events} />
      </Surface>
    </section>
  );
}
