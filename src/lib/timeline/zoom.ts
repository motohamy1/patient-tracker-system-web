// src/lib/timeline/zoom.ts — the timeline's interaction math (TL-03/TL-04;
// ticket 06-02; §8.3, §8.4, §25).
//
// Pure functions only: the visible time window for a zoom transform, the
// clamp that keeps panning inside the event domain, the semantic-zoom level,
// and the clustering that bounds how many marks exist at any zoom. The D3
// behavior object lives in the component (it needs a DOM); everything it
// computes lives here, where a fixed fixture can prove it.
//
// The coordinate contract, stated once so both sides agree:
//   baseX   = `buildTimeScale(...).scale(date)` → [pad, width - pad]
//   screenX = k * baseX + tx
// `frameX(k, tx, baseX)` is exactly that. No CTM scaling is ever applied to
// the scene — marks are TRANSLATED only, so node circles stay circular,
// label text never stretches, and hairlines stay 1px (INV-11 holds without
// a non-scaling-stroke escape hatch).
import type { TimelineScale } from '@/lib/timeline/scale';

export type TimelineTransform = {
  /** The d3 zoom scale factor. */
  k: number;
  /** The d3 zoom horizontal translation (px). */
  tx: number;
};

export const IDENTITY_TRANSFORM: TimelineTransform = { k: 1, tx: 0 };

/** 24x reaches day-level detail on a multi-year record. */
export const MAX_ZOOM_K = 24;

/** Marks never exceed this count at any zoom (TL-09/UX-04: bounded renders). */
export const MAX_VISIBLE_NODES = 48;

/** The semantic-zoom level a visible span lands in (§8.4). */
export type SemanticLevel = 'year' | 'quarter' | 'month' | 'week' | 'day' | 'event';

/** Bucket size per level, in ms; `event` means individual events (no bucketing). */
const BUCKET_MS: Record<Exclude<SemanticLevel, 'event'>, number> = {
  year: 365.25 * 86_400_000,
  quarter: 91.3 * 86_400_000,
  month: 30.44 * 86_400_000,
  week: 7 * 86_400_000,
  day: 86_400_000,
};

const LEVEL_ORDER: Exclude<SemanticLevel, 'event'>[] = [
  'year',
  'quarter',
  'month',
  'week',
  'day',
];

/** screenX = k * baseX + tx — the one positional law of the timeline. */
export function frameX(k: number, tx: number, baseX: number): number {
  return k * baseX + tx;
}

/**
 * The [from, to] instants currently on screen for a transform. Used to build
 * the month lattice and to bound clustering, so both always describe exactly
 * what the clinician can see.
 */
export function visibleWindow(
  scale: TimelineScale,
  transform: TimelineTransform,
  width: number,
): { from: string; to: string; fromMs: number; toMs: number } {
  const { k, tx } = transform;
  const [domainFrom, domainTo] = scale.domain().map((d) => d.getTime()) as [number, number];
  const fromMs = Math.max(domainFrom, scale.invert((0 - tx) / k).getTime());
  const toMs = Math.min(domainTo, scale.invert((width - tx) / k).getTime());
  return {
    from: new Date(fromMs).toISOString(),
    to: new Date(toMs).toISOString(),
    fromMs,
    toMs,
  };
}

/**
 * Pan clamp: the VISIBLE WINDOW always stays inside the event domain — the
 * clinician never drags the record away into empty space (ticket 06-02: the
 * extent is bounded), and when the zoomed record is narrower than the band it
 * centers instead. Mirrors what `d3.zoom`'s `translateExtent` does during a
 * gesture, so a transform arriving from the scrubber (06-04) obeys the same
 * law.
 *
 * Constraint, in base pixels: the window `[−tx/k, (width−tx)/k]` ⊆ `[pad, width−pad]`
 *   → tx ≤ −k·pad  and  tx ≥ width − k·(width−pad)
 */
export function clampTransform(
  scale: TimelineScale,
  transform: TimelineTransform,
  width: number,
  pad: number,
): TimelineTransform {
  const k = Math.min(Math.max(transform.k, 1), MAX_ZOOM_K);
  const contentPx = k * (scale.range()[1] - scale.range()[0]);
  if (contentPx < width) {
    // Narrower than the band: center the content (d3's own behaviour for a
    // sub-viewport extent).
    return { k, tx: (width / 2) * (1 - k) };
  }
  const txMin = width - k * (width - pad);
  const txMax = -k * pad;
  return { k, tx: Math.min(Math.max(transform.tx, txMin), txMax) };
}

/** Which semantic level a visible span of days falls into. */
export function levelForSpanDays(spanDays: number): SemanticLevel {
  if (spanDays > 730) return 'year';
  if (spanDays > 180) return 'quarter';
  if (spanDays > 60) return 'month';
  if (spanDays > 14) return 'week';
  if (spanDays > 2) return 'day';
  return 'event';
}

export type ClusterableEvent = {
  id: string;
  at: string;
};

export type ClusterRow = {
  /** Stable identity: the bucket start, or `event:<id>` for a singleton. */
  key: string;
  kind: 'cluster' | 'event';
  /** 1 for an individual event, ≥2 for a cluster. */
  count: number;
  /** Members in chronological order (the cluster's underlying events). */
  events: ClusterableEvent[];
  /** First / last member instant — the renderer positions at their midpoint. */
  from: string;
  to: string;
};

/**
 * Cluster the events inside the visible window for the current level, with a
 * hard cap on how many rows exist (§8.4: the user is never forced to inspect
 * hundreds of events individually).
 *
 * Deterministic by construction: bucketing by level, then — only if the
 * bucket count still exceeds `maxNodes` — nearest-neighbour merging of the
 * two adjacent buckets with the closest starts (ties resolved by the earlier
 * bucket). Same input → same output, always, which is what the unit proof
 * pins.
 */
export function clusterVisibleEvents(
  events: readonly ClusterableEvent[],
  options: {
    fromMs: number;
    toMs: number;
    level: SemanticLevel;
    maxNodes?: number;
  },
): ClusterRow[] {
  const maxNodes = options.maxNodes ?? MAX_VISIBLE_NODES;
  const visible = events
    .filter((event) => {
      const ms = new Date(event.at).getTime();
      return ms >= options.fromMs && ms <= options.toMs;
    })
    .sort((a, b) => a.at.localeCompare(b.at) || a.id.localeCompare(b.id));

  if (visible.length === 0) return [];

  let rows: Array<{ startMs: number; events: ClusterableEvent[] }>;
  if (options.level === 'event') {
    // Individual events — the deepest semantic level. The cap below still
    // applies: a pile of same-instant events is never 200 discrete marks.
    rows = visible.map((event) => ({
      startMs: new Date(event.at).getTime(),
      events: [event],
    }));
  } else {
    const bucketMs = BUCKET_MS[options.level];
    const buckets = new Map<number, ClusterableEvent[]>();
    for (const event of visible) {
      const ms = new Date(event.at).getTime();
      const bucketStart = Math.floor((ms - options.fromMs) / bucketMs);
      const bucket = buckets.get(bucketStart);
      if (bucket) bucket.push(event);
      else buckets.set(bucketStart, [event]);
    }
    // Order buckets by their earliest member (input order is already stable).
    rows = [];
    for (const members of buckets.values()) {
      rows.push({ startMs: new Date(members[0].at).getTime(), events: members });
    }
    rows.sort((a, b) => a.startMs - b.startMs);
  }

  // Nearest-neighbour merge until the row count is bounded (rare, deep zoom).
  while (rows.length > maxNodes) {
    let closest = 0;
    let closestGap = Number.POSITIVE_INFINITY;
    for (let i = 0; i < rows.length - 1; i += 1) {
      const gap = rows[i + 1].startMs - rows[i].startMs;
      if (gap < closestGap) {
        closestGap = gap;
        closest = i;
      }
    }
    const merged = {
      startMs: rows[closest].startMs,
      events: [...rows[closest].events, ...rows[closest + 1].events],
    };
    rows = [...rows.slice(0, closest), merged, ...rows.slice(closest + 2)];
  }

  return rows.map((row) => ({
    // A singleton keyed by its own event id (two events can share an instant
    // at the deepest level); a cluster keyed by its first member's instant.
    key: row.events.length === 1 ? `event:${row.events[0].id}` : `bucket:${row.startMs}`,
    kind: row.events.length > 1 ? ('cluster' as const) : ('event' as const),
    count: row.events.length,
    events: row.events,
    from: row.events[0].at,
    to: row.events[row.events.length - 1].at,
  }));
}

/**
 * Where a row sits in base pixels: a cluster sits at the midpoint of its
 * members (the count badge reads as "this stretch of time"), a single event
 * at its own position.
 */
export function rowBaseX(scale: TimelineScale, row: ClusterRow): number {
  if (row.kind === 'event') return scale(new Date(row.events[0].at));
  const first = scale(new Date(row.from));
  const last = scale(new Date(row.to));
  return (first + last) / 2;
}
