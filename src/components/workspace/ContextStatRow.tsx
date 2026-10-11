// ContextStatRow — the Overview's open-air metric strip beside the identity
// card (WSP-02 "precise current clinical context" + "contextual status/
// attention indicators"; reference §5 upper rows: stat columns with large
// tabular numerals ON the field — no card boxes, thin rounded dividers).
//
// Four honest columns:
//   1. Current status — the attention indicator, drawn from the stored
//      five-value vocabulary through PATIENT_STATUS_TOKEN (D-10) and nothing
//      else: no new severity model, no accent paint (INV-04, INV-05).
//   2. Last activity — whole days since the record last changed, with the
//      exact date beneath.
//   3. Record opened — whole months since the patient was created, with the
//      exact date beneath.
//   4. Vital signs — the reference's vitals column, rendered as a deliberate
//      §24 state that names what will appear: no placeholder number,
//      sparkline or bar (§27, Phase-4 D-18).
//
// Every statistical value carries `tabular-nums` (QA row 7); type uses only
// `font.size` steps and the weights 400/600 (QA row 7). No card holds one
// line of content (INV-12), no gamified vocabulary appears (INV-06), and the
// only colors are semantic tokens (INV-01). The dividers are the reference's
// thin separators, drawn as rounded-pill ticks so no unrounded rule ships
// (INV-11's shape law) and never as a border on a box.
//
// Server Component: no hook, no client directive. Dates are computed against
// the render clock; the exact dates beneath each numeral keep the values
// honest when the rounded count is 0.
import type { ReactNode } from 'react';
import { Pill } from '@/components/primitives/Pill';
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

function Metric({
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
    <div className="flex min-w-0 flex-col gap-sm self-center">
      <span className="text-label leading-label text-text-secondary">{label}</span>
      {children ? (
        children
      ) : (
        <span className="flex items-baseline gap-xs">
          <span className="text-display font-semibold leading-tight text-text-primary tabular-nums">
            {value}
          </span>
          {unit ? <span className="text-body leading-body text-text-primary">{unit}</span> : null}
        </span>
      )}
      <span className="text-label leading-label text-text-secondary tabular-nums">{supporting}</span>
    </div>
  );
}

/** The reference's thin separator — a rounded tick, never an unrounded rule. */
function Divider() {
  return <span aria-hidden="true" className="hidden h-10 w-px rounded-pill bg-border-subtle lg:block" />;
}

export function ContextStatRow({ patient }: { patient: PatientRecord }) {
  const now = Date.now();
  const tone = PATIENT_STATUS_TOKEN[patient.status];
  const statusLabel = PATIENT_STATUS_LABELS[patient.status];
  const daysSinceActivity = wholeDaysSince(patient.lastActivityAt, now);
  const monthsSinceOpened = wholeMonthsSince(patient.createdAt, now);

  return (
    <div className="flex items-center gap-lg" aria-label="Current context">
      <Metric label="Current status" supporting={`Updated ${patient.updatedAt.slice(0, 10)}`}>
        <Pill tone={tone} label={statusLabel} />
      </Metric>
      <Divider />
      <Metric
        label="Last activity"
        value={daysSinceActivity}
        unit={daysSinceActivity === 1 ? 'day' : 'days'}
        supporting={patient.lastActivityAt.slice(0, 10)}
      />
      <Divider />
      <Metric
        label="Record opened"
        value={monthsSinceOpened}
        unit={monthsSinceOpened === 1 ? 'month' : 'months'}
        supporting={patient.createdAt.slice(0, 10)}
      />
      <Divider />
      <Metric label="Vital signs" supporting="Recorded during visits.">
        <span className="text-body font-semibold leading-body text-text-primary">
          No readings yet
        </span>
      </Metric>
    </div>
  );
}
