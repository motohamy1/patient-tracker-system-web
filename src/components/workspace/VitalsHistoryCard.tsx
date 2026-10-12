// VitalsHistoryCard — the wide (≈55%) bottom-row card, rebuilt to the
// patient-detail reference (Paper "Xanthic honey", artboard "Patient Overview —
// merged reference").
//
// WHAT THE REFERENCE DRAWS: two stacked readings on the left (Heart Rate,
// Systolic) as caption + bold figure + unit, a two-curve trend sparkline with a
// single chartreuse node marking the current point, and a canvas-toned "bpm
// avg" capsule on the right. The Month/Week range chips the earlier reference
// showed are GONE here — the sparkline and the average capsule replaced them,
// so the inert-chip chrome has nothing left to reproduce.
//
// DATA (AGENTS.md §Data / §27): `patient_observations` holds pulse and blood
// pressure kinds, but `seed.sql` writes no rows, so the figures below are the
// reference's sample content held as placeholder values — never derived,
// never rounded from a reading. When the vitals read is wired here each slot
// takes its real value in place; the markup does not change.
//
// Server Component: no hook, no client directive.
import { BottomCardShell } from '@/components/workspace/BottomCardShell';

/** One caption/figure/unit stack, exactly as the reference stacks it. */
function Reading({
  label,
  value,
  unit,
}: {
  label: string;
  value: string;
  unit: string;
}) {
  return (
    <div className="flex flex-col gap-xs">
      <span className="text-caption leading-caption text-text-secondary">{label}</span>
      <span className="flex items-baseline gap-xs">
        <span className="font-grotesk text-stat font-bold leading-heading text-text-primary tabular-nums">
          {value}
        </span>
        <span className="text-caption leading-caption text-text-secondary">{unit}</span>
      </span>
    </div>
  );
}

export function VitalsHistoryCard() {
  return (
    <BottomCardShell label="Vital Signs History" heading="Vital Signs History">
      <div className="flex min-h-0 flex-1 flex-wrap items-center gap-lg">
        <div className="flex flex-col gap-md">
          <Reading label="Heart Rate" value="89" unit="bpm" />
          <Reading label="Systolic" value="130" unit="mmHg" />
        </div>

        {/* The reference's two-curve trend: an inked systolic trace over a
            muted diastolic one, with one chartreuse node marking the current
            point. Decorative — the readings above carry the numbers. */}
        <svg
          viewBox="0 0 320 80"
          preserveAspectRatio="none"
          aria-hidden="true"
          className="h-20 min-w-[180px] flex-1"
        >
          <path
            d="M0 58 C30 58 40 30 70 30 C100 30 108 62 140 62 C172 62 180 24 214 24 C248 24 256 52 290 52 C304 52 312 46 320 44"
            fill="none"
            stroke="currentColor"
            className="text-text-primary"
            strokeWidth="2"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
          <path
            d="M0 66 C36 66 48 50 84 50 C120 50 128 70 164 70 C200 70 208 44 244 44 C280 44 292 60 320 58"
            fill="none"
            stroke="currentColor"
            className="text-border-subtle"
            strokeWidth="2"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
          <circle
            cx="214"
            cy="24"
            r="4.5"
            className="fill-accent stroke-text-primary"
            strokeWidth="2"
            vectorEffect="non-scaling-stroke"
          />
        </svg>

        <div className="inline-flex shrink-0 items-center rounded-pill bg-canvas px-lg py-sm">
          <span className="font-grotesk text-subhead font-bold leading-subhead text-text-primary tabular-nums">
            120
          </span>
          <span className="ml-[3px] text-caption leading-caption text-text-secondary">bpm avg</span>
        </div>
      </div>
    </BottomCardShell>
  );
}
