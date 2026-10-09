// ClinicalTimeline — the real timeline surface (TL-01/TL-02, ticket 06-01;
// reference §5 axis grammar).
//
// React owns the SVG node tree; D3 owns ONLY the temporal math
// (`buildTimeScale`, `monthTicks` from lib/timeline/scale) — no imperative
// redraw, no second charting engine, no static drawing (§8.1, §27). The zoom
// transform layer (06-02) attaches to a scene-group ref added later; until
// then nodes sit at their scale-derived x and nothing else is interactive.
//
// The band renders the reference grammar: a 1px hairline axis
// (`borderSubtle` — the one sanctioned axis token, INV-15), month dividers,
// month labels below, and circular event nodes. No event nodes exist for
// kinds the schema does not produce yet (provenance kept honest, §27): every
// circle here is a real stored record.
//
// Empty is a deliberate state: the band keeps its frame and states the
// timeline's absence in §7 copy — never a fabricated axis, tick or date.
//
// 'use client' (the island boundary): the band measures its container, which
// needs a ref/lifecycle. All DATA arrives from the Server Component as props,
// so the query itself stays server-side under RLS.
'use client';

import { useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';
import {
  AXIS_Y,
  TIMELINE_BAND_HEIGHT,
  buildTimeScale,
  monthTicks,
  nodeX,
} from '@/lib/timeline/scale';
import type { CareEvent } from '@/lib/timeline/events';

/** First-paint width before measurement: matches the desktop content width. */
const DEFAULT_WIDTH = 1024;
/** Edge inset so the first and last node never touch the band's rim. */
const EDGE_PADDING = 24;
/** Node diameter follows the reference (QA row 8: node diameter ±10%). */
const NODE_RADIUS = 4;
/** Divider half-length around the axis (reference hairline lattice). */
const DIVIDER_HALF_LENGTH = 24;

function useElementWidth(ref: RefObject<HTMLDivElement | null>): number {
  const [width, setWidth] = useState(DEFAULT_WIDTH);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const measure = () => {
      const next = element.clientWidth;
      if (next > 0) setWidth(next);
    };
    measure();
    // jsdom (unit render proof) has no ResizeObserver; the measure() above
    // already ran, and a 0 measurement keeps the first-paint default.
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref]);
  return width;
}

export function ClinicalTimeline({ events }: { events: readonly CareEvent[] }) {
  const holderRef = useRef<HTMLDivElement>(null);
  const width = useElementWidth(holderRef);

  const geometry = buildTimeScale({
    dates: events.map((event) => event.at),
    width,
    padding: EDGE_PADDING,
  });

  if (geometry === null) {
    return (
      <div ref={holderRef} className="w-full">
        <div className="flex flex-col items-center justify-center gap-xs text-center">
          <span className="text-body font-semibold leading-body text-text-primary">
            No timeline events yet
          </span>
          <span className="text-body leading-body text-text-secondary">
            Visits, medications and results will appear here as care progresses.
          </span>
          <span className="text-label leading-label text-text-secondary">
            Document a visit to place the first event.
          </span>
        </div>
      </div>
    );
  }

  const ticks = monthTicks(geometry.scale, geometry.domain);
  const summary =
    events.length === 1
      ? `Timeline with 1 event, ${events[0].label} on ${events[0].at.slice(0, 10)}`
      : `Timeline with ${events.length} events, ${events[0].at.slice(0, 10)} to ${
          events[events.length - 1].at.slice(0, 10)
        }`;

  return (
    <div ref={holderRef} className="w-full">
      <svg
        role="img"
        aria-label={summary}
        viewBox={`0 0 ${Math.max(width, 1)} ${TIMELINE_BAND_HEIGHT}`}
        className="block h-auto w-full"
      >
        <g aria-hidden="true">
          {/* Month dividers — the 1px lattice, borderSubtle only (INV-15). */}
          {ticks.map((tick) => (
            <line
              key={`divider-${tick.date.toISOString()}`}
              x1={tick.x}
              x2={tick.x}
              y1={AXIS_Y - DIVIDER_HALF_LENGTH}
              y2={AXIS_Y + DIVIDER_HALF_LENGTH}
              className="stroke-border-subtle"
              strokeWidth={1}
            />
          ))}

          {/* The hairline axis. */}
          <line
            x1={0}
            x2={Math.max(width, 1)}
            y1={AXIS_Y}
            y2={AXIS_Y}
            className="stroke-border-subtle"
            strokeWidth={1}
          />

      {/* Month labels, plus the year in its place on January (ruler language). */}
      {ticks.map((tick) => (
        <text
          key={`label-${tick.date.toISOString()}`}
          x={tick.x}
          y={AXIS_Y + DIVIDER_HALF_LENGTH + 14}
          textAnchor="middle"
          className="text-label fill-text-primary"
        >
          {tick.isYearStart ? tick.year : tick.label}
        </text>
      ))}

          {/* Event nodes — real records only, positioned by the D3 scale. */}
          {events.map((event) => (
            <circle
              key={event.id}
              cx={nodeX(geometry.scale, event.at)}
              cy={AXIS_Y}
              r={NODE_RADIUS}
              className="fill-surface stroke-text-primary"
              strokeWidth={1}
            />
          ))}
        </g>
      </svg>
    </div>
  );
}
