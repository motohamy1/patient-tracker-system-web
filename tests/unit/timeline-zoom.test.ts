// tests/unit/timeline-zoom.test.ts — the timeline's interaction math
// (TL-03/TL-04; ticket 06-02; §8.3/§8.4/§25).
//
// Everything a d3-zoom behavior computes is asserted here as a pure
// function: the frame law, the visible window, the pan clamp (the domain
// never leaves the band), the semantic level ladder, and the clustering that
// bounds how many marks exist at any zoom (deterministic, capped).
import { describe, expect, it } from 'vitest';
import { buildTimeScale, nodeX } from '@/lib/timeline/scale';
import {
  clampTransform,
  clusterVisibleEvents,
  frameX,
  levelForSpanDays,
  MAX_ZOOM_K,
  rowBaseX,
  visibleWindow,
  type ClusterableEvent,
} from '@/lib/timeline/zoom';

const WIDTH = 1024;
const PAD = 24;

const scale = buildTimeScale({
  dates: ['2025-05-12T08:00:00Z', '2026-10-06T09:30:00Z'],
  width: WIDTH,
  padding: PAD,
})!.scale;

// 6 events: one isolated, four inside one quarter, one at the far end.
const DOMAIN = {
  fromMs: new Date('2025-05-12T08:00:00Z').getTime(),
  toMs: new Date('2026-10-06T09:30:00Z').getTime(),
};

const FIXTURE: ClusterableEvent[] = [
  { id: 'a', at: '2025-05-12T08:00:00Z' },
  { id: 'b', at: '2026-09-03T09:00:00Z' },
  { id: 'c', at: '2026-09-03T10:00:00Z' },
  { id: 'd', at: '2026-09-03T11:00:00Z' },
  { id: 'e', at: '2026-09-03T12:00:00Z' },
  { id: 'f', at: '2026-10-06T09:30:00Z' },
];

describe('frameX — the one positional law (screenX = k * baseX + tx)', () => {
  it('is identity at rest', () => {
    expect(frameX(1, 0, 500)).toBe(500);
  });

  it('scales around the origin then translates', () => {
    expect(frameX(2, -40, 500)).toBe(960);
  });
});

describe('visibleWindow — what the band actually shows', () => {
  it('spans the whole domain at rest', () => {
    const window_ = visibleWindow(scale, { k: 1, tx: 0 }, WIDTH);
    expect(window_.from).toBe('2025-05-12T08:00:00.000Z');
    expect(window_.to).toBe('2026-10-06T09:30:00.000Z');
  });

  it('halves the span at k=2, anchored on the left', () => {
    const window_ = visibleWindow(scale, { k: 2, tx: 0 }, WIDTH);
    expect(window_.from).toBe('2025-05-12T08:00:00.000Z');
    // screen x = 2 * baseX + 0 → the band's right edge shows baseX = WIDTH/2
    expect(window_.toMs).toBe(scale.invert(WIDTH / 2).getTime());
  });

  it('never reads past the domain', () => {
    const window_ = visibleWindow(scale, { k: 24, tx: -10_000 }, WIDTH);
    expect(window_.fromMs).toBeGreaterThanOrEqual(new Date('2025-05-12T08:00:00Z').getTime());
  });
});

describe('clampTransform — pan never leaves the event domain', () => {
  it('holds k inside the extent', () => {
    expect(clampTransform(scale, { k: 0.2, tx: 0 }, WIDTH, PAD).k).toBe(1);
    expect(clampTransform(scale, { k: 100, tx: 0 }, WIDTH, PAD).k).toBe(MAX_ZOOM_K);
  });

  it('centers content narrower than the band (k=1) instead of letting it drift', () => {
    expect(clampTransform(scale, { k: 1, tx: 999 }, WIDTH, PAD).tx).toBe(0);
    expect(clampTransform(scale, { k: 1, tx: -999 }, WIDTH, PAD).tx).toBe(0);
  });

  it('bounds tx so the visible window stays inside the domain at k=2', () => {
    // txMax = -k·pad (right edge of the window at the domain's right edge)
    expect(clampTransform(scale, { k: 2, tx: 999 }, WIDTH, PAD).tx).toBe(-2 * PAD);
    // txMin = width − k·(width − pad)
    expect(clampTransform(scale, { k: 2, tx: -999 }, WIDTH, PAD).tx).toBe(
      WIDTH - 2 * (WIDTH - PAD),
    );
  });
});

describe('levelForSpanDays — the semantic-zoom ladder (§8.4)', () => {
  it('maps coarse spans to coarse buckets and deep spans to events', () => {
    expect(levelForSpanDays(3000)).toBe('year');
    expect(levelForSpanDays(400)).toBe('quarter');
    expect(levelForSpanDays(100)).toBe('month');
    expect(levelForSpanDays(30)).toBe('week');
    expect(levelForSpanDays(5)).toBe('day');
    expect(levelForSpanDays(0.5)).toBe('event');
  });
});

describe('clusterVisibleEvents — bounded, chronological, deterministic', () => {

  it('clusters the four same-quarter events and leaves the rest alone', () => {
    const rows = clusterVisibleEvents(FIXTURE, { ...DOMAIN, level: 'quarter' });
    expect(rows).toHaveLength(2);
    expect(rows[0].kind).toBe('event');
    expect(rows[0].count).toBe(1);
    expect(rows[1].kind).toBe('cluster');
    expect(rows[1].count).toBe(5);
    expect(rows[1].events.map((e) => e.id)).toEqual(['b', 'c', 'd', 'e', 'f']);
    expect(rows[1].from).toBe('2026-09-03T09:00:00Z');
    expect(rows[1].to).toBe('2026-10-06T09:30:00Z');
  });

  it('reveals individual events at the deepest level', () => {
    const rows = clusterVisibleEvents(FIXTURE, { ...DOMAIN, level: 'event' });
    expect(rows).toHaveLength(6);
    expect(rows.every((row) => row.kind === 'event')).toBe(true);
    expect(rows.map((row) => row.events[0].at)).toEqual([...FIXTURE.map((e) => e.at)].sort());
  });

  it('ignores events outside the visible window', () => {
    const rows = clusterVisibleEvents(FIXTURE, {
      fromMs: new Date('2026-01-01T00:00:00Z').getTime(),
      toMs: new Date('2026-10-06T09:30:00Z').getTime(),
      level: 'quarter',
    });
    expect(rows.flatMap((row) => row.events).map((e) => e.id)).toEqual(['b', 'c', 'd', 'e', 'f']);
  });

  it('caps rows at maxNodes by nearest-neighbour merge, preserving every event', () => {
    const dense: ClusterableEvent[] = Array.from({ length: 200 }, (_, i) => ({
      id: `d-${i}`,
      at: new Date(DOMAIN.fromMs + i * 3_600_000).toISOString(), // one per hour, ~8 days
    }));
    const rows = clusterVisibleEvents(dense, { ...DOMAIN, level: 'event', maxNodes: 6 });
    expect(rows.length).toBeLessThanOrEqual(6);
    expect(rows.flatMap((row) => row.events)).toHaveLength(200);
    // chronological order survives the merge
    const order = rows.flatMap((row) => row.events.map((e) => e.at));
    expect([...order].sort()).toEqual(order);
  });

  it('is byte-identical for identical input', () => {
    const a = clusterVisibleEvents(FIXTURE, { ...DOMAIN, level: 'quarter' });
    const b = clusterVisibleEvents(FIXTURE, { ...DOMAIN, level: 'quarter' });
    expect(a).toEqual(b);
  });

  it('returns nothing for an empty window', () => {
    expect(clusterVisibleEvents([], { ...DOMAIN, level: 'year' })).toEqual([]);
  });
});

describe('rowBaseX — where a row sits in base pixels', () => {
  it('places a single event at its own position', () => {
    const row = clusterVisibleEvents(FIXTURE, { ...DOMAIN, level: 'event' })[5];
    expect(rowBaseX(scale, row)).toBe(nodeX(scale, row.events[0].at));
  });

  it('places a cluster at the midpoint of its members', () => {
    const [row] = clusterVisibleEvents(FIXTURE, { ...DOMAIN, level: 'quarter' }).filter(
      (r) => r.kind === 'cluster',
    );
    const mid = (nodeX(scale, row.from) + nodeX(scale, row.to)) / 2;
    expect(rowBaseX(scale, row)).toBeCloseTo(mid, 6);
  });
});
