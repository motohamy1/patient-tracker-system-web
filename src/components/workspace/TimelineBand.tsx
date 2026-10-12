// TimelineBand — the host of the clinical timeline, restyled to the patient
// detail reference (Paper "Xanthic honey", artboard "Patient Overview — merged
// reference").
//
// WHAT THE BAND IS: not a third elevation. It is the SAME cream field as the
// page, given a rounded silhouette and separated from the ground by two soft
// shadows — a light `surface` glow on its lower-right and a dark rim beneath.
// It carries NO border and no top lip: the band reads as a distinct region
// because of its rounding and its shadows alone (INV-15/INV-16 — a perimeter
// edge never appears on a surface).
//
// `events` arrive from the Server Component projection (real records only) — the
// band adds no data of its own and never fabricates an axis (§27).
//
// Server Component: no hook, no client directive (the timeline itself is the
// client island and arrives through `ClinicalTimeline`).
import { ClinicalTimeline } from '@/components/timeline/ClinicalTimeline';
import type { CareEvent } from '@/lib/timeline/events';

export function TimelineBand({ events }: { events: readonly CareEvent[] }) {
  return (
    <section
      aria-label="Timeline"
      className="flex min-h-44 flex-col rounded-card shadow-band-edge"
    >
      <h2 className="sr-only text-heading font-semibold leading-heading text-text-primary">
        Timeline
      </h2>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-card bg-canvas shadow-band-inner">
        <ClinicalTimeline events={events} />
      </div>
    </section>
  );
}
