// ContextStrip — the reference's diagnosis capsule + vital-signs row, rendered
// in the header's right column directly beneath the tab strip (Paper "Xanthic
// honey", artboard "Patient Overview — merged reference").
//
// WHAT THE REFERENCE DRAWS, and why this is ONE row: a 303×71 `highlight`
// capsule carrying the word "Diagnosis" and a 30px Familjen Grotesk headline
// sits BESIDE four open-air metrics split by 1px `borderSubtle` rules — Heart
// rate, Pressure, SpO₂ and Temperature — each a muted caption over a 24px bold
// figure and its unit. The capsule and the metrics share one 92px band, both
// centred on it; they are not stacked.
//
// GEOMETRY, from the reference's own coordinates: the capsule is inset 10px
// from the column's left edge and ends 37px before the first metric; the
// metrics are 28px apart with the hairline rules sitting in the same gaps.
// Below the 1024px band edge the row wraps so the metrics stay legible rather
// than compressing (responsive-rules §4).
//
// DATA (AGENTS.md §Data / §27): there is no diagnosis column and no oxygen
// saturation kind in the schema, and `seed.sql` writes no observations, so the
// figures below are the reference's sample content held as placeholder values
// — never derived, never rounded from a reading, never presented as a
// computation. Each slot takes its real value in place when the column lands;
// the markup does not change.
//
// Every figure is tabular (QA row 7); every colour resolves through a token
// (INV-01); the metrics are open-air on the canvas with no card box, exactly as
// the reference draws them.
//
// Server Component: no hook, no client directive.
import type { ReactNode } from 'react';

/** One caption/figure/unit column. */
function Metric({
  label,
  value,
  unit,
  gap,
  unitClassName,
}: {
  label: string;
  value: string;
  unit: string;
  /** The reference's per-column baseline gap: 4 / 2 / 3 / 3px. */
  gap: string;
  /** The reference sets Pressure's `/80` one step up (14px) from the other
   *  units (12px); every other column takes the default label step. */
  unitClassName?: string;
}) {
  return (
    <div className="flex shrink-0 flex-col gap-[6px]">
      <span className="text-label leading-label text-text-secondary">{label}</span>
      <span className="flex items-baseline" style={{ gap }}>
        <span className="font-grotesk text-metric font-bold leading-heading text-text-primary tabular-nums">
          {value}
        </span>
        <span className={unitClassName ?? 'text-label leading-label text-text-secondary'}>
          {unit}
        </span>
      </span>
    </div>
  );
}

/** The reference's 1px vertical rule between metrics — a divider, never a
 *  border on a box (INV-15). It stretches to the row's height. */
function Divider() {
  return <span aria-hidden="true" className="w-px shrink-0 self-stretch bg-border-subtle" />;
}

export function ContextStrip(): ReactNode {
  return (
    <div className="flex flex-wrap items-center gap-x-[25px] gap-y-md">
      {/* The diagnosis capsule. The reference now stacks the 12px caption
          ABOVE the 30px headline, both centred, in a 113px-tall pill — it grew
          from the earlier 71px side-by-side form. */}
      <div className="flex h-[113px] w-full max-w-[303px] shrink-0 flex-col items-center rounded-pill bg-highlight pt-[25px]">
        <span className="text-label leading-label text-text-secondary">Diagnosis</span>
        <span className="font-grotesk text-title font-bold leading-[32px] tracking-[-0.01em] text-text-primary">
          Hypertension
        </span>
      </div>

      {/* Open-air vitals: four metrics split by hairline rules, 28px apart. */}
      <div className="flex items-stretch gap-7" role="group" aria-label="Current vitals">
        <Metric label="Heart rate" value="89" unit="bpm" gap="4px" />
        <Divider />
        <Metric label="Pressure" value="120" unit="/80" gap="2px" unitClassName="text-body leading-body text-text-secondary" />
        <Divider />
        <Metric label="SpO₂" value="98" unit="%" gap="3px" />
        <Divider />
        <Metric label="Temperature" value="36.8" unit="°C" gap="3px" />
      </div>
    </div>
  );
}
