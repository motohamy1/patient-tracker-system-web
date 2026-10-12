// LabsCard — the compact (≈22.5%) bottom-row card, rebuilt to the
// patient-detail reference (Paper "Xanthic honey", artboard "Patient Overview —
// merged reference").
//
// WHAT THE REFERENCE DRAWS: one row per analyte — the name left, the value
// right, and beneath them a 6px capsule track with a semantic fill and a 2px
// ink marker standing at the reference range's lower bound. The two rows it
// shows (Glucose green, Cholesterol amber) are the flag grammar, not two
// hard-coded analytes: any result maps onto the same row.
//
// DATA (§Data / §27): this card is WIRED — it reads the real `lab_results`
// rows the Overview already loads, so nothing here is invented. A result's
// `flag` picks the fill; the marker is drawn only when `referenceRange`
// parses as a `low-high` pair, because a marker standing at a position the
// record does not state would be a fabrication. With no results the card
// falls back to the §7 empty state rather than a placeholder row.
//
// Every value is tabular (QA row 7); every colour resolves through a token
// (INV-01); the rows separate by gap alone (INV-11).
//
// Server Component: no hook, no client directive.
import { BottomCardShell } from '@/components/workspace/BottomCardShell';
import type { LabResultRecord } from '@/lib/labs/queries';

/** The flag vocabulary → the one semantic fill that carries it (INV-04: the
 *  hue never carries the meaning alone — the value and unit are always shown). */
const FLAG_FILL: Record<string, string> = {
  normal: 'bg-success',
  low: 'bg-warning',
  high: 'bg-warning',
  critical: 'bg-critical',
};

/** Parse a `low-high` reference range; null for anything else (a single
 *  bound, a `<x` form, prose, or nothing at all). */
function parseRange(range: string | null): [number, number] | null {
  if (range === null) return null;
  const match = /^\s*(-?\d+(?:\.\d+)?)\s*-\s*(-?\d+(?:\.\d+)?)\s*$/.exec(range);
  if (match === null) return null;
  const low = Number(match[1]);
  const high = Number(match[2]);
  if (!Number.isFinite(low) || !Number.isFinite(high) || high <= low) return null;
  return [low, high];
}

/**
 * Where the value and the range's lower bound sit on a track that spans twice
 * the range either side of it. Both come back as percentages of the track, so
 * the marker and the fill can never disagree about the scale.
 */
function positionsFor(value: number, range: [number, number]): { value: number; low: number } {
  const [low, high] = range;
  const span = high - low;
  const domainLow = low - span;
  const domainHigh = high + span;
  const pct = (n: number) => ((n - domainLow) / (domainHigh - domainLow)) * 100;
  return { value: Math.min(100, Math.max(0, pct(value))), low: pct(low) };
}

function LabRow({ result }: { result: LabResultRecord }) {
  const fill = FLAG_FILL[result.flag ?? 'normal'] ?? 'bg-border-subtle';
  const range = result.value === null ? null : parseRange(result.referenceRange);
  const position = result.value === null || range === null ? null : positionsFor(result.value, range);

  return (
    <div className="flex flex-col gap-[5px]">
      <div className="flex items-baseline justify-between gap-sm">
        <span className="truncate text-label leading-label text-text-primary">{result.analyte}</span>
        <span className="shrink-0 text-label leading-label font-semibold text-text-primary tabular-nums">
          {result.value === null ? 'Pending' : `${result.value}${result.unit ? ` ${result.unit}` : ''}`}
        </span>
      </div>
      {/* The 6px capsule track. The fill is the flag's semantic tint; the
          2px marker stands at the reference range's lower bound and only
          when the record actually states one. */}
      <div className="relative h-[6px] w-full shrink-0 overflow-visible rounded-[3px] bg-surface-muted">
        <div
          className={`h-full rounded-[3px] ${fill}`}
          style={{ width: `${position === null ? (result.value === null ? 0 : 100) : position.value}%` }}
        />
        {position !== null ? (
          <span
            aria-hidden="true"
            className="absolute -top-[3px] h-3 w-0.5 bg-text-primary"
            style={{ left: `${position.low}%` }}
          />
        ) : null}
      </div>
    </div>
  );
}

export function LabsCard({ results }: { results: readonly LabResultRecord[] }) {
  const shown = results.slice(0, 4);

  return (
    <BottomCardShell
      label="Labs"
      heading="Labs"
      bodyClassName="justify-center gap-md"
    >
      {shown.length === 0 ? (
        <div className="mt-auto flex flex-col gap-xs">
          <span className="text-body font-semibold leading-body text-text-primary">No labs yet</span>
          <span className="text-body leading-body text-text-secondary">
            Lab results will appear here as they are filed.
          </span>
        </div>
      ) : (
        <div className="flex flex-col gap-md">
          {shown.map((result) => (
            <LabRow key={result.id} result={result} />
          ))}
        </div>
      )}
    </BottomCardShell>
  );
}
