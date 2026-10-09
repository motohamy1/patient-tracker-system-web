// VisitList — the patient's visits, newest first (ticket 07-05).
//
// Server Component. Each row separates by shadow alone (INV-15/INV-16), the
// stage is a semantic Pill from the closed D-04 tint set (VISIT_STAGE_TOKEN),
// and every date renders `tabular-nums` (QA row 7). The link's href is built
// from the ALREADY-VALIDATED uuid; nothing is interpolated into a query.
import Link from 'next/link';
import { Pill } from '@/components/primitives/Pill';
import { Surface } from '@/components/primitives';
import {
  VISIT_STAGE_LABELS,
  VISIT_STAGE_TOKEN,
  VISIT_SOURCE_LABELS,
  type VisitSource,
} from '@/lib/visits/status';
import type { VisitRecord } from '@/lib/visits/queries';

/** "2026-10-06T09:30:00Z" → "2026-10-06 09:30" (UTC, tabular). */
function stamp(iso: string): string {
  return `${iso.slice(0, 10)} ${iso.slice(11, 16)}`;
}

export function VisitList({
  patientId,
  visits,
}: {
  patientId: string;
  visits: readonly VisitRecord[];
}) {
  return (
    <ul className="flex flex-col gap-md" aria-label="Visits">
      {visits.map((visit) => (
        <li key={visit.id}>
          <Link
            href={`/provider/patients/${patientId}/visits/${visit.id}`}
            className="block rounded-lg"
          >
            <Surface variant="surface" className="flex items-center gap-md">
              <span className="flex min-w-0 flex-1 flex-col gap-xs">
                <span className="truncate text-heading font-semibold leading-heading text-text-primary">
                  {visit.visitType ?? 'Visit'}
                </span>
                <span className="text-label leading-label text-text-secondary tabular-nums">
                  {stamp(visit.scheduledAt)}
                  {visit.location ? ` · ${visit.location}` : ''}
                </span>
              </span>
              {visit.source !== 'clinician' ? (
                <span className="text-label leading-label text-text-secondary">
                  {VISIT_SOURCE_LABELS[visit.source as VisitSource]}
                </span>
              ) : null}
              <Pill
                tone={VISIT_STAGE_TOKEN[visit.stage]}
                label={VISIT_STAGE_LABELS[visit.stage]}
              />
            </Surface>
          </Link>
        </li>
      ))}
    </ul>
  );
}
