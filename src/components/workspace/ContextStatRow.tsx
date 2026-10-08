// ContextStatRow — the Overview's compact context row beside the identity
// area (WSP-02 "what matters now / what needs follow-up"; PRODUCT-MASTER-SPEC
// §7 "concise current clinical context" + "contextual status/attention
// indicators"; reference §5 upper rows: stat cards with large tabular
// numerals at near-parity tone, separated by `shadow.raised`).
//
// Three context cards + the vitals snapshot region, each anchored
// top-and-bottom so the row fills the identity card's height without air
// sinking to the bottom:
//   1. Current status — the attention indicator, drawn from the stored
//      five-value vocabulary through PATIENT_STATUS_TOKEN (D-10) and nothing
//      else: no new severity model, no accent paint (INV-04, INV-05).
//   2. Last activity — whole days since the record last changed, with the
//      exact date beneath.
//   3. Record opened — whole months since the patient was created, with the
//      exact date beneath.
//   4. Vital signs — the reference's vitals snapshot region, rendered as a
//      deliberate §24 state that names what will appear: no placeholder
//      number, sparkline or bar (§27, Phase-4 D-18; ticket 04).
//
// Every statistical value carries `tabular-nums`; type uses only `font.size`
// steps and the weights 400/600 (QA row 7). No card holds one line of content
// (INV-12), no gamified vocabulary appears (INV-06), and the only colors are
// semantic tokens (INV-01).
//
// Server Component: no hook, no client directive. Dates are computed against
// the render clock; the exact dates beneath each numeral keep the values
// honest when the rounded count is 0.
import type { ReactNode } from 'react';
import { Pill } from '@/components/primitives/Pill';
import { Surface } from '@/components/primitives';
import { STAT_ROW_GRID } from '@/components/workspace/grids';
import type { PatientRecord } from '@/lib/patients/queries';
import { PATIENT_STATUS_LABELS, PATIENT_STATUS_TOKEN } from '@/lib/patients/status';

function wholeDaysSince(iso: string, now: number): number {
  const delta = now - new Date(iso).getTime();
  return Math.max(0, Math.floor(delta / 86_400_000));
}

function wholeMonthsSince(iso: string, now: number): number {
  const then = new Date(iso);
  const reference = new Date(now);
  let months =
    (reference.getFullYear() - then.getFullYear()) * 12 + (reference.getMonth() - then.getMonth());
  if (reference.getDate() < then.getDate()) months -= 1;
  return Math.max(0, months);
}

function StatCard({
  label,
  value,
  unit,
  supporting,
  children,
}: {
  label: string;
  /** The numeral, rendered tabular; ignored when `children` supplies the value. */
  value?: number;
  unit?: string;
  supporting: string;
  children?: ReactNode;
}) {
  return (
    <section aria-label={label} className="h-full">
      <Surface variant="surface" className="h-full">
        <div className="flex h-full flex-col justify-between gap-md">
          <span className="text-label leading-label text-text-secondary">{label}</span>
          {children ? (
            <span className="flex items-center">{children}</span>
          ) : (
            <span className="flex items-baseline gap-xs">
              <span className="text-display font-semibold leading-tight text-text-primary tabular-nums">
                {value}
              </span>
              {unit ? (
                <span className="text-body leading-body text-text-primary">{unit}</span>
              ) : null}
            </span>
          )}
          <span className="text-label leading-label text-text-secondary tabular-nums">
            {supporting}
          </span>
        </div>
      </Surface>
    </section>
  );
}

export function ContextStatRow({ patient }: { patient: PatientRecord }) {
  const now = Date.now();
  const tone = PATIENT_STATUS_TOKEN[patient.status];
  const statusLabel = PATIENT_STATUS_LABELS[patient.status];
  const daysSinceActivity = wholeDaysSince(patient.lastActivityAt, now);
  const monthsSinceOpened = wholeMonthsSince(patient.createdAt, now);

  return (
    <div className={STAT_ROW_GRID} aria-label="Current context">
      <StatCard
        label="Current status"
        supporting={`Updated ${patient.updatedAt.slice(0, 10)}`}
      >
        <Pill tone={tone} label={statusLabel} />
      </StatCard>
      <StatCard
        label="Last activity"
        value={daysSinceActivity}
        unit={daysSinceActivity === 1 ? 'day' : 'days'}
        supporting={patient.lastActivityAt.slice(0, 10)}
      />
      <StatCard
        label="Record opened"
        value={monthsSinceOpened}
        unit={monthsSinceOpened === 1 ? 'month' : 'months'}
        supporting={patient.createdAt.slice(0, 10)}
      />
      <StatCard label="Vital signs" supporting="Recorded during visits.">
        <span className="text-body font-semibold leading-body text-text-primary">
          No readings yet
        </span>
      </StatCard>
    </div>
  );
}
