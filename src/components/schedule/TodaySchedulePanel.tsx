// TodaySchedulePanel — the provider home's left panel (Phase 22's dashboard,
// D-28 reference comparison).
//
// One white rounded surface, the same grammar as the Patient Profiles
// panel: today's appointments, soonest first, each row a real link into the
// patient's workspace (a dead row is a dead control — D-24). No visit is
// invented; the honest empty line says so.
import Link from 'next/link';
import { Surface } from '@/components/primitives';
import { Pill } from '@/components/primitives/Pill';
import type { ScheduleRow } from '@/lib/schedule/queries';
import { VISIT_STAGE_TOKEN } from '@/lib/visits/status';

function formatTime(iso: string): string {
  return iso.slice(11, 16);
}

export function TodaySchedulePanel({ rows }: { rows: readonly ScheduleRow[] }) {
  return (
    <Surface variant="surface" className="flex flex-col gap-md rounded-xl">
      <div className="flex flex-wrap items-center justify-between gap-sm">
        <h2 className="text-heading font-semibold leading-heading text-text-primary">Today&apos;s Schedule</h2>
        <span className="text-label leading-label text-text-secondary tabular-nums">
          {rows.length} {rows.length === 1 ? 'visit' : 'visits'}
        </span>
      </div>

      {rows.length === 0 ? (
        <p className="text-label leading-label text-text-secondary">No visits scheduled for today.</p>
      ) : (
        <ul className="flex flex-col gap-sm">
          {rows.map((row) => (
            <li key={row.visitId}>
              <Link
                href={`/provider/patients/${row.patientId}/visits`}
                className="flex items-center gap-md rounded-lg px-sm py-sm hover:bg-surface-muted"
              >
                <span className="flex w-12 shrink-0 flex-col items-center rounded-md bg-surface-muted px-sm py-xs">
                  <span className="text-label leading-label font-semibold text-text-primary tabular-nums">
                    {formatTime(row.scheduledAt)}
                  </span>
                </span>
                <span className="flex min-w-0 flex-1 flex-col gap-xs">
                  <span className="truncate text-body leading-body text-text-primary">{row.patientName}</span>
                  <span className="text-label leading-label text-text-secondary">
                    {row.visitType ?? 'Appointment'}
                  </span>
                </span>
                <Pill tone={VISIT_STAGE_TOKEN[row.stage]} label={row.stage.replace('_', ' ')} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Surface>
  );
}
