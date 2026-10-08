// RecentRecordsCard — the Overview's bottom-row "what changed" card
// (WSP-02; ticket 03; reference §5 bottom row: "Recent Records (salmon
// `critical`-family type pill) at about 22.5%").
//
// The card renders the composed patient-scoped trail (activity.ts) — record
// created, record updated, invite sent/redeemed — newest first, capped at
// RECENT_ACTIVITY_LIMIT so the card keeps the reference's compact density.
// Each row is a date block (day numeral + month, tabular) beside a type pill
// in the frozen `critical` family: that is the §5 grammar for this card, not
// a new tint (INV-04), and the label text carries the meaning so the pill
// never encodes by hue alone (1.4.1).
//
// No divider rail (INV-11): rows separate by `gap` alone. No dead header
// control: the reference's "..." affordance is chrome this phase cannot wire,
// so it is not drawn (no fake interactivity). Empty reads the §7 contract
// verbatim; loading and error states are the frame's business
// (OverviewSkeleton / StateVariant), never this card's.
//
// Server Component: no hook, no client directive.
import { Surface } from '@/components/primitives';
import type { ActivityEvent } from '@/lib/patients/activity';
import { RECENT_ACTIVITY_LIMIT } from '@/lib/patients/activity';

const MONTH_ABBR = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const;

/** "2026-10-06" (or an ISO instant) → { day: "06", month: "Oct" }. */
function dateParts(iso: string): { day: string; month: string } {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return { day: '--', month: '' };
  const month = MONTH_ABBR[date.getMonth()];
  return { day: String(date.getDate()).padStart(2, '0'), month };
}

export function RecentRecordsCard({ events }: { events: readonly ActivityEvent[] }) {
  const shown = events.slice(0, RECENT_ACTIVITY_LIMIT);

  return (
    <section aria-label="Recent Records" className="h-full">
      <Surface variant="surface" className="h-full">
        <div className="flex h-full flex-col gap-md">
          <h2 className="text-heading font-semibold leading-heading text-text-primary">
            Recent Records
          </h2>

          {shown.length === 0 ? (
            <div className="mt-auto flex flex-col gap-xs">
              <span className="text-body font-semibold leading-body text-text-primary">
                No records yet
              </span>
              <span className="text-body leading-body text-text-secondary">
                Records will appear here as care progresses.
              </span>
            </div>
          ) : (
            <ul className="flex flex-col gap-md">
              {shown.map((event) => {
                const { day, month } = dateParts(event.at);
                return (
                  <li key={event.key} className="flex items-center gap-md">
                    <span className="flex w-10 shrink-0 flex-col">
                      <span className="text-heading font-semibold leading-heading text-text-primary tabular-nums">
                        {day}
                      </span>
                      <span className="text-label leading-label text-text-secondary">{month}</span>
                    </span>
                    <span className="inline-flex min-w-0 items-center rounded-pill bg-critical px-md py-sm text-label leading-label text-text-primary">
                      <span className="truncate">{event.label}</span>
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </Surface>
    </section>
  );
}
