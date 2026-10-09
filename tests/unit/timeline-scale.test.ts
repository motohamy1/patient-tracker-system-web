// tests/unit/timeline-scale.test.ts — the timeline's pure geometry
// (TL-01 "D3 controls scales/temporal domain changes"; ticket 06-01;
// QA row 8 — the geometry this file pins is what the visual gate measures).
//
// Deterministic fixtures throughout: no Date.now, no local timezone in any
// assertion (d3-time works on UTC month intervals for ISO inputs).
import { describe, expect, it } from 'vitest';
import {
  AXIS_Y,
  TIMELINE_BAND_HEIGHT,
  buildTimeScale,
  eventDomain,
  monthTicks,
  nodeX,
} from '@/lib/timeline/scale';

describe('eventDomain', () => {
  it('has no domain without events (the caller renders the empty state)', () => {
    expect(eventDomain([])).toBeNull();
  });

  it('pads a single event by one month on each side', () => {
    const [from, to] = eventDomain(['2026-05-10T00:00:00Z'])!;
    expect(from.toISOString()).toBe('2026-04-10T00:00:00.000Z');
    expect(to.toISOString()).toBe('2026-06-09T00:00:00.000Z');
  });

  it('spans the real min/max for a real set', () => {
    const [from, to] = eventDomain([
      '2026-10-06T09:30:00Z',
      '2025-05-12T08:00:00Z',
      '2026-01-05T00:00:00Z',
    ])!;
    expect(from.toISOString()).toBe('2025-05-12T08:00:00.000Z');
    expect(to.toISOString()).toBe('2026-10-06T09:30:00.000Z');
  });
});

describe('buildTimeScale', () => {
  it('maps the domain into the padding-inset range', () => {
    const geometry = buildTimeScale({
      dates: ['2025-05-12T08:00:00Z', '2026-10-06T09:30:00Z'],
      width: 1000,
      padding: 24,
    })!;
    expect(geometry.scale.range()).toEqual([24, 976]);

    const first = nodeX(geometry.scale, '2025-05-12T08:00:00Z');
    const last = nodeX(geometry.scale, '2026-10-06T09:30:00Z');
    expect(first).toBe(24);
    expect(last).toBe(976);
    // a midpoint event lands strictly inside the band
    const mid = nodeX(geometry.scale, '2026-03-15T00:00:00Z');
    expect(mid).toBeGreaterThan(24);
    expect(mid).toBeLessThan(976);
  });

  it('returns null for an empty date set (no axis is fabricated)', () => {
    expect(buildTimeScale({ dates: [], width: 1000 })).toBeNull();
  });
});

describe('monthTicks — the d3-time lattice', () => {
  const geometry = buildTimeScale({
    dates: ['2025-05-12T08:00:00Z', '2026-10-06T09:30:00Z'],
    width: 1000,
    padding: 24,
  })!;
  const ticks = monthTicks(geometry.scale, geometry.domain);

  it('divides by whole months, clipped into the band', () => {
    expect(ticks).toHaveLength(17); // 2025-06 … 2026-10 inclusive
    expect(ticks[0].date.toISOString()).toBe('2025-06-01T00:00:00.000Z');
    expect(ticks[0].label).toBe('Jun');
    expect(ticks.at(-1)?.date.toISOString()).toBe('2026-10-01T00:00:00.000Z');
    expect(ticks.at(-1)?.label).toBe('Oct');
    for (const tick of ticks) {
      expect(tick.x).toBeGreaterThanOrEqual(24);
      expect(tick.x).toBeLessThanOrEqual(976);
    }
  });

  it('marks January as the year boundary for the ruler', () => {
    const january = ticks.find((tick) => tick.isYearStart);
    expect(january?.date.toISOString()).toBe('2026-01-01T00:00:00.000Z');
    expect(january?.year).toBe(2026);
  });

  it('is deterministic for the same inputs', () => {
    expect(monthTicks(geometry.scale, geometry.domain)).toEqual(ticks);
  });
});

describe('band geometry constants (QA row 8 measures against the reference)', () => {
  it('keeps the band height and the axis inside it', () => {
    expect(TIMELINE_BAND_HEIGHT).toBe(176);
    expect(AXIS_Y).toBeLessThan(TIMELINE_BAND_HEIGHT);
  });
});
