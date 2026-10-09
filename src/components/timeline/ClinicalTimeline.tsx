// ClinicalTimeline — the real timeline surface (TL-01/TL-02; tickets 06-01
// and 06-02; reference §5 axis grammar).
//
// React owns the SVG node tree; D3 owns ONLY the temporal math and the zoom
// BEHAVIOR — no imperative redraw of the tree, no second charting engine, no
// static drawing (§8.1, §27). The two-layer split is deliberate:
//   * structure (lattice, clusters, nodes, badges) is React-rendered from
//     pure helpers and re-computed when a gesture ENDS;
//   * per-frame motion is imperative `transform` writes on the existing
//     marks, driven by `d3-zoom` through a ref.
// No React state changes per frame (UX-04/TL-09): a pan across thousands of
// events never re-renders them — the registry of marks is capped by
// clustering before any frame begins.
//
// Marks are translated, never scaled: `screenX = k * baseX + tx` is applied
// as a translate on each mark group, so node circles stay circular, label
// text never stretches, and hairlines stay 1px without a non-scaling-stroke
// escape hatch (INV-11 holds by construction).
//
// 'use client' (the island boundary): the band measures its container and
// attaches the zoom behavior. All DATA arrives from the Server Component as
// props, so the query itself stays server-side under RLS.
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { RefObject } from 'react';
import { select } from 'd3-selection';
import { zoom as d3Zoom, zoomIdentity } from 'd3-zoom';
import { AXIS_Y, TIMELINE_BAND_HEIGHT, buildTimeScale, monthTicks } from '@/lib/timeline/scale';
import type { CareEvent } from '@/lib/timeline/events';
import {
  clampTransform,
  clusterVisibleEvents,
  frameX,
  IDENTITY_TRANSFORM,
  levelForSpanDays,
  MAX_ZOOM_K,
  rowBaseX,
  visibleWindow,
  type TimelineTransform,
} from '@/lib/timeline/zoom';

/** First-paint width before measurement: matches the desktop content width. */
const DEFAULT_WIDTH = 1024;
/** Edge inset so the first and last node never touch the band's rim. */
const EDGE_PADDING = 24;
/** Node diameter follows the reference (QA row 8: node diameter ±10%). */
const NODE_RADIUS = 4;
/** Divider half-length around the axis (reference hairline lattice). */
const DIVIDER_HALF_LENGTH = 24;
/** Cluster badge radius (the reference's small accent count badge). */
const BADGE_RADIUS = 7;

const DAY_MS = 86_400_000;

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

export function ClinicalTimeline({
  events,
  initialTransform,
  onTransformEnd,
}: {
  events: readonly CareEvent[];
  /** A transform the scrubber (06-04) can hand in; clamped before use. */
  initialTransform?: TimelineTransform;
  /** Fired when a gesture ends or the transform changes structurally. */
  onTransformEnd?: (transform: TimelineTransform) => void;
}) {
  const holderRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const width = useElementWidth(holderRef);

  const [transform, setTransform] = useState<TimelineTransform>(
    initialTransform ?? IDENTITY_TRANSFORM,
  );

  // One scale over the FULL event domain — pan/zoom change which slice is
  // visible, never the scale's own law (positions stay stable under panning).
  const geometry = useMemo(
    () =>
      buildTimeScale({
        dates: events.map((event) => event.at),
        width,
        padding: EDGE_PADDING,
      }),
    [events, width],
  );

  // Registry of marks carrying a `data-base-x`; rebuilt after every render so
  // it never holds detached nodes.
  const registryRef = useRef<SVGGElement[]>([]);

  const applyFrame = (k: number, tx: number) => {
    for (const mark of registryRef.current) {
      mark.setAttribute('transform', `translate(${frameX(k, tx, Number(mark.dataset.baseX))},0)`);
    }
  };

  // After every render (SSR hydration, gesture-end re-render, resize, or a
  // caller-driven transform), the DOM sits exactly where the transform says.
  useEffect(() => {
    const svg = svgRef.current;
    if (svg === null) return;
    registryRef.current = Array.from(svg.querySelectorAll<SVGGElement>('g[data-base-x]'));
    applyFrame(transform.k, transform.tx);
  });

  // The zoom behavior attaches once per width (its extent depends on width)
  // and once per caller-driven transform (06-04 sync).
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg || geometry === null) return;
    const behavior = d3Zoom<SVGSVGElement, unknown>()
      .scaleExtent([1, MAX_ZOOM_K])
      // The event domain's edges may not travel past the band's edges:
      // bounded pan, no overscroll into empty space (06-02 criterion).
      .translateExtent([
        [EDGE_PADDING, 0],
        [width - EDGE_PADDING, TIMELINE_BAND_HEIGHT],
      ])
      // Plain wheel keeps scrolling the page; ctrl/meta+wheel zooms (a
      // timeline must never hijack vertical scrolling). Touch pinch is the
      // mobile zoom gesture and is untouched by this filter.
      .filter((event: Event) => {
        if (event.type === 'wheel') {
          const wheel = event as WheelEvent;
          return wheel.ctrlKey || wheel.metaKey;
        }
        return true;
      })
      .on('zoom', (event: { transform: { k: number; x: number } }) => {
        applyFrame(event.transform.k, event.transform.x); // per-frame motion
      })
      .on('end', (event: { transform: { k: number; x: number } }) => {
        const next = clampTransform(
          geometry.scale,
          { k: event.transform.k, tx: event.transform.x },
          width,
          EDGE_PADDING,
        );
        setTransform(next);
        onTransformEnd?.(next);
      });

    select(svg).call(behavior);
    if (initialTransform !== undefined) {
      // A caller-supplied transform (scrubber sync) enters through the same
      // behavior, so the imperative frame and the React state agree.
      select(svg).call(
        behavior.transform,
        zoomIdentity.translate(initialTransform.tx, 0).scale(initialTransform.k),
      );
    }
    return () => {
      select(svg).on('.zoom', null);
    };
  }, [width, geometry, initialTransform]);

  const window_ =
    geometry === null ? null : visibleWindow(geometry.scale, transform, Math.max(width, 1));

  if (geometry === null || window_ === null) {
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

  const spanDays = (window_.toMs - window_.fromMs) / DAY_MS;
  const level = levelForSpanDays(spanDays);
  const lattice = monthTicks(
    geometry.scale,
    [new Date(window_.fromMs), new Date(window_.toMs)],
    Math.max(width, 1),
  );
  const rows = clusterVisibleEvents(events, {
    fromMs: window_.fromMs,
    toMs: window_.toMs,
    level,
  });

  const firstAt = events[0]?.at.slice(0, 10) ?? '';
  const lastAt = events[events.length - 1]?.at.slice(0, 10) ?? '';
  const clusterCount = rows.filter((row) => row.kind === 'cluster').length;
  const summary = `Timeline with ${events.length} events, ${firstAt} to ${lastAt}${
    clusterCount === 1
      ? ', 1 cluster in view'
      : clusterCount > 1
        ? `, ${clusterCount} clusters in view`
        : ''
  }`;

  return (
    <div ref={holderRef} className="w-full">
      <svg
        ref={svgRef}
        role="img"
        aria-label={summary}
        viewBox={`0 0 ${Math.max(width, 1)} ${TIMELINE_BAND_HEIGHT}`}
        className="block h-auto w-full touch-none"
      >
        <g aria-hidden="true">
          {/* Month dividers — the 1px lattice, borderSubtle only (INV-15). */}
          {lattice.map((tick) => (
            <g
              key={`divider-${tick.date.toISOString()}`}
              data-base-x={tick.x}
              data-role="divider"
              transform={`translate(${frameX(transform.k, transform.tx, tick.x)},0)`}
            >
              <line
                x1={0}
                x2={0}
                y1={AXIS_Y - DIVIDER_HALF_LENGTH}
                y2={AXIS_Y + DIVIDER_HALF_LENGTH}
                className="stroke-border-subtle"
                strokeWidth={1}
              />
            </g>
          ))}

          {/* Month labels, plus the year in its place on January. */}
          {lattice.map((tick) => (
            <g
              key={`label-${tick.date.toISOString()}`}
              data-base-x={tick.x}
              data-role="label"
              transform={`translate(${frameX(transform.k, transform.tx, tick.x)},0)`}
            >
              <text
                x={0}
                y={AXIS_Y + DIVIDER_HALF_LENGTH + 14}
                textAnchor="middle"
                className="text-label fill-text-primary"
              >
                {tick.isYearStart ? tick.year : tick.label}
              </text>
            </g>
          ))}

          {/* The hairline axis — fixed to the band, translated by nobody. */}
          <line
            x1={0}
            x2={Math.max(width, 1)}
            y1={AXIS_Y}
            y2={AXIS_Y}
            className="stroke-border-subtle"
            strokeWidth={1}
          />

          {/* Event nodes and cluster badges, each at its transform-derived x. */}
          {rows.map((row) => {
            const baseX = rowBaseX(geometry.scale, row);
            const x = frameX(transform.k, transform.tx, baseX);
            if (row.kind === 'cluster') {
              return (
                <g
                  key={row.key}
                  data-base-x={baseX}
                  data-role="node"
                  data-count={row.count}
                  transform={`translate(${x},0)`}
                >
                  {/* Filled accent node + count badge — the §8.4 dense-zoom
                      language. The count is centered on the badge with BOTH
                      anchors plus dominant-baseline, never off-axis. */}
                  <circle cy={AXIS_Y} r={BADGE_RADIUS} className="fill-accent" />
                  <text
                    x={0}
                    y={AXIS_Y}
                    textAnchor="middle"
                    dominantBaseline="central"
                    className="text-label fill-text-primary"
                  >
                    {row.count}
                  </text>
                </g>
              );
            }
            return (
              <g
                key={row.key}
                data-base-x={baseX}
                data-role="node"
                data-count={row.count}
                transform={`translate(${x},0)`}
              >
                {/* Inactive/past node: light with a stroked rim (reference §5). */}
                <circle
                  cy={AXIS_Y}
                  r={NODE_RADIUS}
                  className="fill-surface stroke-text-primary"
                  strokeWidth={1}
                />
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
}
