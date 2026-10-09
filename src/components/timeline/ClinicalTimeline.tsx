// ClinicalTimeline — the real timeline surface (TL-01/TL-02/TL-03/TL-04/TL-07;
// tickets 06-01…06-03; reference §5 axis grammar).
//
// React owns the SVG node tree; D3 owns ONLY the temporal math and the zoom
// BEHAVIOR — no imperative redraw of the tree, no second charting engine, no
// static drawing (§8.1, §27). The two-layer split is deliberate:
//   * structure (lattice, clusters, nodes, badges, selection, filter) is
//     React-rendered from pure helpers and re-computed when a gesture ENDS;
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
// Selection (TL-07): an event node opens its detail card at overlay
// elevation; a CLUSTER node instead zooms into the range it represents (a
// cluster is not a thing to select — expanding it is a range move). The card
// is dismissed by its close control, by clicking the band, or by Escape.
// Category filtering (TL-07) narrows the timeline to the event kinds present
// and recomposes the axis over the filtered set, so the axis always describes
// what is actually shown.
//
// 'use client' (the island boundary): the band measures its container,
// attaches the zoom behavior and owns the selection/filter state. All DATA
// arrives from the Server Component as props, so the query itself stays
// server-side under RLS.
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties, RefObject } from 'react';
import { select } from 'd3-selection';
import { zoom as d3Zoom, zoomIdentity } from 'd3-zoom';
import { AXIS_Y, TIMELINE_BAND_HEIGHT, buildTimeScale, monthTicks } from '@/lib/timeline/scale';
import {
  availableCategories,
  CARE_EVENT_CATEGORY_LABELS,
  filterByCategory,
  type CareEvent,
  type CareEventCategory,
} from '@/lib/timeline/events';
import { EventDetailCard } from '@/components/timeline/EventDetailCard';
import {
  clampTransform,
  clusterVisibleEvents,
  frameX,
  IDENTITY_TRANSFORM,
  levelForSpanDays,
  MAX_ZOOM_K,
  rowBaseX,
  transformForRange,
  visibleWindow,
  type ClusterRow,
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
/** Detail card width — also its positioning clamp (w-64 = 16rem = 256px). */
const CARD_WIDTH = 256;

const DAY_MS = 86_400_000;

type CategoryFilter = 'all' | CareEventCategory;

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

/** "2026-10-06" / "2026-10-06T09:30:00Z" → the UTC calendar date. */
function dayOf(iso: string): string {
  return iso.slice(0, 10);
}

export function ClinicalTimeline({
  events,
  initialTransform,
  onTransformEnd,
}: {
  events: readonly CareEvent[];
  /** A transform the scrubber (06-04) can hand in; clamped before use. */
  initialTransform?: TimelineTransform;
  /** Fired when a gesture or a cluster-zoom changes the transform. */
  onTransformEnd?: (transform: TimelineTransform) => void;
}) {
  const holderRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const width = useElementWidth(holderRef);

  const [transform, setTransform] = useState<TimelineTransform>(
    initialTransform ?? IDENTITY_TRANSFORM,
  );
  const [category, setCategory] = useState<CategoryFilter>('all');
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const categories = useMemo(() => availableCategories(events), [events]);
  const filteredEvents = useMemo(
    () => (category === 'all' ? [...events] : filterByCategory(events, category)),
    [events, category],
  );

  // One scale over the FULL (filtered) event domain — pan/zoom change which
  // slice is visible, never the scale's own law (stable under panning).
  const geometry = useMemo(
    () =>
      buildTimeScale({
        dates: filteredEvents.map((event) => event.at),
        width,
        padding: EDGE_PADDING,
      }),
    [filteredEvents, width],
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
      // The visible window stays inside the event domain: bounded pan, no
      // overscroll into empty space (06-02 criterion).
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

  const rows =
    geometry === null || window_ === null
      ? []
      : clusterVisibleEvents(filteredEvents, {
          fromMs: window_.fromMs,
          toMs: window_.toMs,
          level: levelForSpanDays((window_.toMs - window_.fromMs) / DAY_MS),
        });

  // A selection whose row left the view (filter change, re-cluster, pan)
  // simply stops being selected — no stale card floats over nothing.
  const selectedRow = rows.find((row) => row.key === selectedKey) ?? null;

  useEffect(() => {
    if (selectedKey !== null && selectedRow === null) setSelectedKey(null);
  }, [selectedKey, selectedRow]);

  useEffect(() => {
    if (selectedKey === null) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSelectedKey(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selectedKey]);

  if (geometry === null || window_ === null) {
    const filteredEmpty = events.length > 0;
    return (
      <div ref={holderRef} className="w-full">
        <FilterChips
          category={category}
          categories={categories}
          onSelect={setCategory}
        />
        <div className="flex flex-col items-center justify-center gap-xs text-center">
          {filteredEmpty ? (
            <>
              <span className="text-body font-semibold leading-body text-text-primary">
                {category === 'clinical'
                  ? 'No clinical events yet'
                  : 'No record activity yet'}
              </span>
              <span className="text-body leading-body text-text-secondary">
                Events of this kind will appear here as care progresses.
              </span>
            </>
          ) : (
            <>
              <span className="text-body font-semibold leading-body text-text-primary">
                No timeline events yet
              </span>
              <span className="text-body leading-body text-text-secondary">
                Visits, medications and results will appear here as care progresses.
              </span>
              <span className="text-label leading-label text-text-secondary">
                Document a visit to place the first event.
              </span>
            </>
          )}
        </div>
      </div>
    );
  }

  const lattice = monthTicks(
    geometry.scale,
    [new Date(window_.fromMs), new Date(window_.toMs)],
    Math.max(width, 1),
  );

  const firstAt = filteredEvents[0]?.at.slice(0, 10) ?? '';
  const lastAt = filteredEvents[filteredEvents.length - 1]?.at.slice(0, 10) ?? '';
  const clusterCount = rows.filter((row) => row.kind === 'cluster').length;
  const summary = `Timeline with ${filteredEvents.length} events, ${firstAt} to ${lastAt}${
    clusterCount === 1
      ? ', 1 cluster in view'
      : clusterCount > 1
        ? `, ${clusterCount} clusters in view`
        : ''
  }`;

  /** A cluster click frames the stretch it represents; an event click selects. */
  const onRowActivate = (row: ClusterRow) => {
    if (row.kind === 'cluster') {
      const next = transformForRange(
        geometry.scale,
        Math.max(width, 1),
        EDGE_PADDING,
        new Date(row.from).getTime(),
        new Date(row.to).getTime(),
      );
      setTransform(next);
      setSelectedKey(null);
      onTransformEnd?.(next);
      return;
    }
    setSelectedKey(row.key);
  };

  const selectedEvent =
    selectedRow !== null && selectedRow.kind === 'event' ? selectedRow.events[0] : null;
  const cardStyle: CSSProperties | null =
    selectedRow === null
      ? null
      : {
          left: `${Math.min(
            Math.max(frameX(transform.k, transform.tx, rowBaseX(geometry.scale, selectedRow)) - CARD_WIDTH / 2, 8),
            Math.max(width - CARD_WIDTH - 8, 8),
          )}px`,
          top: `${AXIS_Y + 16}px`,
        };

  return (
    <div ref={holderRef} className="relative w-full">
      <FilterChips category={category} categories={categories} onSelect={setCategory} />

      <svg
        ref={svgRef}
        role="img"
        aria-label={summary}
        viewBox={`0 0 ${Math.max(width, 1)} ${TIMELINE_BAND_HEIGHT}`}
        className="block h-auto w-full touch-none"
        onClick={() => setSelectedKey(null)}
      >
        {/* Lattice + axis are decoration and stay hidden from assistive tech. */}
        <g aria-hidden="true">
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
        </g>

        {/* Event nodes and cluster badges: real controls, exposed to AT. */}
        <g>
          {rows.map((row) => {
            const baseX = rowBaseX(geometry.scale, row);
            const x = frameX(transform.k, transform.tx, baseX);
            const isSelected = row.kind === 'event' && selectedRow?.key === row.key;

            if (row.kind === 'cluster') {
              return (
                <g
                  key={row.key}
                  data-base-x={baseX}
                  data-role="node"
                  data-count={row.count}
                  transform={`translate(${x},0)`}
                  role="button"
                  tabIndex={0}
                  aria-label={`${row.count} events between ${dayOf(row.from)} and ${dayOf(row.to)}. Expand this range.`}
                  className="cursor-pointer"
                  onClick={(event) => {
                    event.stopPropagation();
                    onRowActivate(row);
                  }}
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

            const event = row.events[0];
            return (
              <g
                key={row.key}
                data-base-x={baseX}
                data-role="node"
                data-count={row.count}
                transform={`translate(${x},0)`}
                role="button"
                tabIndex={0}
                aria-label={`${event.label}, ${dayOf(event.at)}`}
                aria-pressed={isSelected}
                className="cursor-pointer"
                onClick={(clickEvent) => {
                  clickEvent.stopPropagation();
                  onRowActivate(row);
                }}
              >
                {/* Inactive node: light with a stroked rim (reference §5).
                    The selected node reads active through the accent fill —
                    inside the one sanctioned accent list (INV-05). */}
                <circle
                  cy={AXIS_Y}
                  r={isSelected ? BADGE_RADIUS : NODE_RADIUS}
                  className={
                    isSelected ? 'fill-accent stroke-text-primary' : 'fill-surface stroke-text-primary'
                  }
                  strokeWidth={1}
                />
              </g>
            );
          })}
        </g>
      </svg>

      {selectedEvent !== null && cardStyle !== null ? (
        <EventDetailCard
          event={selectedEvent}
          style={cardStyle}
          onClose={() => setSelectedKey(null)}
        />
      ) : null}
    </div>
  );
}

/** The category filter — real pill controls, active one emphasized by fill. */
function FilterChips({
  category,
  categories,
  onSelect,
}: {
  category: CategoryFilter;
  categories: readonly CareEventCategory[];
  onSelect: (category: CategoryFilter) => void;
}) {
  if (categories.length <= 1) return null;
  const options: Array<{ value: CategoryFilter; label: string }> = [
    { value: 'all', label: 'All' },
    ...categories.map((value) => ({ value, label: CARE_EVENT_CATEGORY_LABELS[value] })),
  ];
  return (
    <div className="mb-sm flex items-center gap-xs" role="group" aria-label="Filter timeline">
      {options.map((option) => {
        const active = option.value === category;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            onClick={() => onSelect(option.value)}
            className={[
              'inline-flex min-h-8 items-center justify-center rounded-pill px-md text-label leading-label text-text-primary',
              active ? 'bg-surface-raised shadow-raised' : 'bg-transparent',
            ].join(' ')}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
