// RecentRecordsCard — the Overview's "what changed" card, rebuilt to the
// patient-detail reference (Paper "Xanthic honey", artboard "Patient Overview —
// merged reference").
//
// WHAT THE REFERENCE DRAWS: full-bleed rows, each a 32px rounded icon well
// beside a two-line stack (bold title over a muted date/source line), the rows
// separated by gap alone — no date block, no pill, no divider rail. The first
// row carries the `critical` tint and the rest the canvas tint, which is the
// reference's own emphasis rhythm rather than a per-kind mapping.
//
// DATA (WSP-02; §Data / §27): the rows are the composed patient-scoped trail
// (activity.ts) — record created, record updated, invite sent/redeemed — newest
// first, capped at RECENT_ACTIVITY_LIMIT. Nothing is invented; the title is the
// event's own label and the sub-line is its stored instant read off the UTC
// calendar date characters (the FolderCard precedent), so a 23:30Z timestamp
// never renders as two different days on the same screen.
//
// No divider rail (INV-11): rows separate by `gap` alone. No dead header
// control: the reference's expand mark is drawn in the shell, not wired here.
// Empty reads the §7 contract verbatim; loading and error states are the
// frame's business (OverviewSkeleton / StateVariant), never this card's.
//
// Server Component: no hook, no client directive.
import { BottomCardShell } from '@/components/workspace/BottomCardShell';
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

/**
 * An ISO-8601 date → { day: "06", month: "Oct" }, read off the UTC CALENDAR
 * DATE characters — not via `new Date()`'s local getters.
 */
function dateParts(iso: string): { day: string; month: string } {
  if (!/^\d{4}-\d{2}-\d{2}/.test(iso)) return { day: '--', month: '' };
  const monthIndex = Number(iso.slice(5, 7)) - 1;
  return {
    day: iso.slice(8, 10),
    month: MONTH_ABBR[monthIndex] ?? '',
  };
}

/** The reference's rounded icon well. */
function IconWell({ children }: { children: React.ReactNode }) {
  return (
    <span className="flex size-8 shrink-0 items-center justify-center rounded-sm bg-surface text-text-primary">
      {children}
    </span>
  );
}

/** The record/document glyph the reference draws in the first row. */
function DocumentGlyph() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" aria-hidden="true">
      <rect x="2.5" y="3" width="11" height="10" rx="1.6" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <path d="M5 6.5h6M5 9.5h4" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

export function RecentRecordsCard({ events }: { events: readonly ActivityEvent[] }) {
  const shown = events.slice(0, RECENT_ACTIVITY_LIMIT);

  return (
    <BottomCardShell
      label="Recent Records"
      heading="Recent Records"
      bodyClassName="justify-center gap-sm"
    >
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
        <ul className="flex flex-col gap-sm">
          {shown.map((event, index) => {
            const { day, month } = dateParts(event.at);
            return (
              <li
                key={event.key}
                className={`flex items-center gap-md rounded-md px-md py-sm ${
                  index === 0 ? 'bg-critical' : 'bg-canvas'
                }`}
              >
                <IconWell>
                  <DocumentGlyph />
                </IconWell>
                <span className="flex min-w-0 flex-col">
                  <span className="truncate text-label leading-label font-semibold text-text-primary">
                    {event.label}
                  </span>
                  <span className="truncate text-caption leading-caption text-text-secondary">
                    {month} {day}
                  </span>
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </BottomCardShell>
  );
}
