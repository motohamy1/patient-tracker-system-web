// TimelineBand — the host of the clinical timeline (§5; reference:
// patient-tracking-dashboard.jpg — the axis sits DIRECTLY on the light field,
// never in a card box: a band surface is a third elevation the reference
// does not draw, and recess would gray the exact zone the reference keeps
// calm). The band owns the heading and the states; the timeline's axis
// grammar, nodes, filter chips and scrubber live in `ClinicalTimeline`.
//
// `events` arrive from the Server Component projection (real records only) —
// the band adds no data of its own and never fabricates an axis (§27).
//
// Server Component: no hook, no client directive (the timeline itself is the
// client island and arrives through `ClinicalTimeline`).
import { ClinicalTimeline } from '@/components/timeline/ClinicalTimeline';
import type { CareEvent } from '@/lib/timeline/events';

export function TimelineBand({ events }: { events: readonly CareEvent[] }) {
  return (
    <section aria-label="Timeline" className="flex min-h-44 flex-col gap-md">
      <h2 className="sr-only text-heading font-semibold leading-heading text-text-primary">
        Timeline
      </h2>
      <ClinicalTimeline events={events} />
    </section>
  );
}
