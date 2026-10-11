// src/components/stats/DailyStatsPanel.tsx — the provider home's right column,
// under Critical Alerts (reference grammar §6: "Daily Stats ... as 2x2 mini
// stat cards with sparklines"; D-28). Server Component: no hook, no client
// directive.
//
// Every value is a real aggregate from `@/lib/stats/queries` — the reference's
// sample numbers are do-not-reuse content, never a quota to hit. A failed read
// renders one honest unavailability line, never a blank or a shimmer (UX §24).
//
// The sparkline is a plain inline SVG polyline in the token ink
// (`text-text-secondary`), never a chart library — the reference's saturated
// blue/red/green sparkline colors are sample content, not the frozen palette,
// and D3 belongs to the timeline alone. It is aria-hidden decoration: every
// number it echoes is stated as text.
import { Surface } from '@/components/primitives';
import type { ProviderHomeStats } from '@/lib/stats/queries';

const SPARK_W = 72;
const SPARK_H = 24;

function Sparkline({ values }: { values: readonly number[] }) {
  const max = Math.max(...values, 1);
  const step = values.length > 1 ? SPARK_W / (values.length - 1) : 0;
  const points = values
    .map((v, i) => {
      const x = (i * step).toFixed(1);
      const y = (SPARK_H - 3 - (v / max) * (SPARK_H - 8)).toFixed(1);
      return `${x},${y}`;
    })
    .join(' ');
  return (
    <svg
      aria-hidden="true"
      viewBox={`0 0 ${SPARK_W} ${SPARK_H}`}
      preserveAspectRatio="none"
      className="h-6 w-full text-text-secondary"
    >
      <polyline
        points={points}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

function StatCard({
  label,
  value,
  values,
}: {
  label: string;
  value: number;
  values: readonly number[];
}) {
  return (
    <div className="flex flex-col gap-xs rounded-lg bg-surface-muted p-md">
      <span className="text-label leading-label text-text-secondary">{label}</span>
      <span className="text-display leading-tight font-semibold text-text-primary tabular-nums">
        {value}
      </span>
      <Sparkline values={values} />
    </div>
  );
}

export function DailyStatsPanel({ stats }: { stats: ProviderHomeStats | null }) {
  return (
    <Surface variant="surface" className="flex flex-col gap-md rounded-xl">
      <div className="flex flex-wrap items-center justify-between gap-sm">
        <h2 className="text-heading font-semibold leading-heading text-text-primary">Daily Stats</h2>
        {stats !== null ? (
          <span className="text-label leading-label text-text-secondary">Last 7 days</span>
        ) : null}
      </div>

      {stats === null ? (
        <p className="text-label leading-label text-text-secondary">
          Daily stats are unavailable right now.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-md">
          <StatCard
            label="Patients"
            value={stats.totalPatients}
            values={stats.series.map((p) => p.newPatients)}
          />
          <StatCard
            label="New today"
            value={stats.newPatientsToday}
            values={stats.series.map((p) => p.newPatients)}
          />
          <StatCard
            label="Today's visits"
            value={stats.todaysVisits}
            values={stats.series.map((p) => p.visits)}
          />
          <StatCard
            label="Completed today"
            value={stats.completedToday}
            values={stats.series.map((p) => p.completed)}
          />
        </div>
      )}
    </Surface>
  );
}
