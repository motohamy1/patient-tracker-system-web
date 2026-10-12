// src/lib/timeline/scale.ts — the timeline's pure geometry (d3-scale,
// d3-time; TL-01 "D3 controls scales… temporal domain changes").
//
// Everything here is a pure function over plain data so it unit-tests with
// fixed fixtures and renders identically on the server (the SVG tree React
// owns) and the client. D3 owns the temporal math — `scaleTime` for
// positions, `timeMonth` for the axis lattice; the renderer never invents
// its own pixel arithmetic, so the axis and the node layer cannot drift
// apart (the Phase-006 pattern the research prescribes).
//
// QA row 8 measures month-divider spacing, axis height and node diameter
// against the reference: the geometry constants live here and in the
// component as the single declaration of each.
import { scaleTime, type ScaleTime } from 'd3-scale';
import { utcMonth, type CountableTimeInterval } from 'd3-time';

/** Total band height in px — the desktop main band, calibrated to the patient
 *  detail reference's timeline canvas (a 322px-tall drawing: axis high, cards
 *  hanging beneath it, the month rail along the bottom). */
export const TIMELINE_BAND_HEIGHT = 322;

/** The axis sits high in the band so milestone branches and clinical cards hang
 *  below it (§7.2/§7.4), matching the reference's upper-axis composition. */
export const AXIS_Y = 44;

/** The month lattice runs from just under the band's top edge to the month
 *  rail — the reference draws full-height dividers, not ticks around the axis. */
export const LATTICE_TOP = 20;

/** Baseline of the month rail, and the foot of every lattice divider. */
export const MONTH_RAIL_Y = TIMELINE_BAND_HEIGHT - 22;

/** One month of padding around a single-event domain so a node is never glued to the edge. */
const SINGLE_EVENT_PADDING_MS = 30 * 86_400_000;

const MONTH_NAMES = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const;

export type TimelineScale = ScaleTime<number, number>;

export type AxisGeometry = {
  scale: TimelineScale;
  domain: [Date, Date];
  width: number;
};

/**
 * The [min,max] domain over real event instants. One event gets a padded
 * month of context; zero events have no domain and the caller renders the
 * empty state instead of an axis.
 */
export function eventDomain(dates: readonly string[]): [Date, Date] | null {
  if (dates.length === 0) return null;
  let min = Number.POSITIVE_INFINITY;
  let max = Number.NEGATIVE_INFINITY;
  for (const iso of dates) {
    const ms = new Date(iso).getTime();
    if (!Number.isFinite(ms)) continue;
    if (ms < min) min = ms;
    if (ms > max) max = ms;
  }
  if (!Number.isFinite(min)) return null;
  if (min === max) return [new Date(min - SINGLE_EVENT_PADDING_MS), new Date(max + SINGLE_EVENT_PADDING_MS)];
  return [new Date(min), new Date(max)];
}

/** The one time scale for the band. `padding` is the responsive edge inset. */
export function buildTimeScale(geometry: {
  dates: readonly string[];
  width: number;
  padding?: number;
}): AxisGeometry | null {
  const domain = eventDomain(geometry.dates);
  if (domain === null) return null;
  const padding = geometry.padding ?? 0;
  const width = Math.max(geometry.width, 0);
  const scale: TimelineScale = scaleTime()
    .domain(domain)
    .range([padding, Math.max(width - padding, padding + 1)]);
  return { scale, domain, width };
}

export type MonthTick = {
  /** The UTC-first tick instant. */
  date: Date;
  x: number;
  /** Month label; the year travels separately and only renders on January. */
  label: string;
  year: number;
  isYearStart: boolean;
};

/**
 * Month lattice across the visible domain: a divider and a label for every
 * month the band shows, clipped to the domain. `utcMonth.every(1)` IS the
 * interval — no hand-rolled calendar math (the STACK.md mandate: intervals
 * come from d3-time so axis and UI never disagree).
 *
 * UTC, not local, on purpose: a stored instant is absolute, and the axis is
 * rendered by the server (UTC) and re-rendered by a client in whatever
 * timezone the clinician sits in. A local-time interval would put the
 * divider between two different days depending on the machine — the same
 * record would draw different months on two screens (and risk SSR/client
 * drift). `timeMonth` is the local-time interval; `utcMonth` is the fixed
 * one, so 2025-06-01T00:00:00.000Z means the same thing everywhere.
 */
export function monthTicks(
  scale: TimelineScale,
  domain: readonly [Date, Date],
  /** Clip x to the band's pixel width (a zoomed window can overflow). */
  clipX: number = scale.range()[1],
): MonthTick[] {
  // `utcMonth` IS the every(1) interval — the identity step, stated as the
  // interval itself so no second interval object is derived.
  const interval: CountableTimeInterval = utcMonth;
  const start = interval.ceil(domain[0]);
  const end = domain[1];
  const ticks: MonthTick[] = [];
  let date: Date = start;
  while (date.getTime() <= end.getTime()) {
    const x = scale(date);
    if (x >= 0 && x <= clipX) {
      ticks.push({
        date,
        x,
        label: MONTH_NAMES[date.getUTCMonth()],
        year: date.getUTCFullYear(),
        isYearStart: date.getUTCMonth() === 0,
      });
    }
    date = interval.offset(date, 1);
  }
  return ticks;
}

/** Node geometry for one event at the band's current scale. */
export function nodeX(scale: TimelineScale, at: string): number {
  return scale(new Date(at));
}
