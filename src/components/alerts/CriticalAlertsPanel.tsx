// CriticalAlertsPanel — the provider home's right panel (Phase 22's
// dashboard, D-28 reference comparison).
//
// The reference's alerts panel is the one surface allowed to carry a tinted
// fill: the frozen `critical` salmon with text-primary ink (≈7:1, INV-04's
// meaning-never-by-hue-alone holds — every row also states its reason in
// words). Two honest sources: critical folder statuses and UNREVIEWED
// attention insights (AI-02 — an unreviewed insight never reads as
// clinician-verified, and this panel is exactly where that distinction
// matters).
import Link from 'next/link';
import { Surface } from '@/components/primitives';
import type { CriticalAlertRow } from '@/lib/alerts/queries';

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '··';
  const first = parts[0].charAt(0);
  const last = parts.length > 1 ? parts[parts.length - 1].charAt(0) : '';
  return `${first}${last}`.toUpperCase();
}

export function CriticalAlertsPanel({ rows }: { rows: readonly CriticalAlertRow[] }) {
  return (
    <Surface variant="surface" className="flex flex-col gap-md rounded-xl bg-critical">
      <h2 className="text-heading font-semibold leading-heading text-text-primary">Critical Alerts</h2>

      {rows.length === 0 ? (
        <p className="text-label leading-label text-text-primary">No critical alerts right now.</p>
      ) : (
        <ul className="flex flex-col gap-md">
          {rows.map((row) => (
            <li key={row.id}>
              <Link
                href={`/provider/patients/${row.patientId}/overview`}
                className="flex items-center gap-sm rounded-lg px-sm py-sm hover:bg-surface"
              >
                <span
                  aria-hidden="true"
                  className="flex size-9 shrink-0 items-center justify-center rounded-pill bg-surface text-label leading-label font-semibold text-text-primary"
                >
                  {initialsOf(row.patientName)}
                </span>
                <span className="flex min-w-0 flex-col gap-xs">
                  <span className="truncate text-body leading-body text-text-primary">{row.patientName}</span>
                  <span className="text-label leading-label text-text-secondary">{row.headline}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Surface>
  );
}
