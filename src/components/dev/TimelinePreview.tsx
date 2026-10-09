// TimelinePreview — DEV-ONLY preview surface for the clinical timeline.
//
// Renders the real `ClinicalTimeline` with the fenced synthetic fixture
// (`src/lib/dev/timeline-fixture.ts`) so the timeline's clustering, branches,
// selection and scrubber can be reviewed without real clinical tables. It is
// reachable ONLY through the gated dev gallery (`?preview=timeline`), and the
// fixture module is imported by the gallery alone (the reachability test's
// single allowed importer) — no product route ever sees this data (§27).
//
// Server Component: the fixture rides the request-time render payload and is
// passed to the client timeline as props; it is never bundled as a module.
import { Surface } from '@/components/primitives';
import { ClinicalTimeline } from '@/components/timeline/ClinicalTimeline';
import type { CareEvent } from '@/lib/timeline/events';

export function TimelinePreview({ events }: { events: readonly CareEvent[] }) {
  return (
    <Surface variant="canvas" className="flex min-h-96 flex-1 flex-col gap-lg bg-canvas p-lg">
      <div className="mx-auto flex w-full max-w-[72rem] flex-col gap-md">
        <h1 className="text-display font-semibold leading-tight text-text-primary">
          Timeline preview
        </h1>
        <p className="text-body leading-body text-text-secondary">
          Synthetic data for design review only — not a patient record.
        </p>
        <section aria-label="Timeline" className="min-h-44">
          <Surface variant="surfaceMuted" className="flex h-full min-h-44 flex-col gap-md">
            <h2 className="text-heading font-semibold leading-heading text-text-primary">Timeline</h2>
            <ClinicalTimeline events={events} />
          </Surface>
        </section>
      </div>
    </Surface>
  );
}
