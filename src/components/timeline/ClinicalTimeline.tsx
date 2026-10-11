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
import type { CSSProperties, KeyboardEvent as ReactKeyboardEvent } from 'react';
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
import { TimelineScrubber } from '@/components/timeline/TimelineScrubber';
import { useElementWidth } from '@/components/timeline/useElementWidth';
import { branchPath, hasChildren, layoutMilestones } from '@/lib/timeline/branches';
import {
  clampTransform,
  clusterVisibleEvents,
  frameX,
  IDENTITY_TRANSFORM,
  levelForSpanDays,
  MAX_ZOOM_K,
  rowBaseX,
  transformForCenter,
  transformForRange,
  visibleWindow,
  type ClusterRow,
  type TimelineTransform,
} from '@/lib/timeline/zoom';

/** First-paint width before measurement: matches the desktop content width. */
const DEFAULT_WIDTH = 1024;
/** Edge inset so the first and last node never touch the band's rim. */
const EDGE_PADDING = 24;
/** Node radius follows the cardiology reference: a filled accent disc that can hold its glyph (QA row 8's diameter law is re-measured against this reference at the owner's gate). */
const NODE_RADIUS = 13;
/** Divider half-length around the axis (reference hairline lattice). */
const DIVIDER_HALF_LENGTH = 24;
/** Cluster badge radius (the reference's dark count disc). */
const BADGE_RADIUS = 13;
/** Detail card width — also its positioning clamp (w-64 = 16rem = 256px). */
const CARD_WIDTH = 256;

const DAY_MS = 86_400_000;

type CategoryFilter = 'all' | CareEventCategory;

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
  const width = useElementWidth(holderRef, DEFAULT_WIDTH);

  const [transform, setTransform] = useState<TimelineTransform>(
    initialTransform ?? IDENTITY_TRANSFORM,
  );
  const [category, setCategory] = useState<CategoryFilter>('all');
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  /** One entry point for every deliberate transform change (gesture end,
   *  cluster zoom, scrubber) so the shared transform and its listener agree. */
  const applyTransform = (next: TimelineTransform) => {
    setTransform(next);
    onTransformEnd?.(next);
  };

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

  // Registries rebuilt after every render so they never hold detached nodes:
  // marks are TRANSLATED per frame; branch paths are RE-DRAWN per frame (their
  // two endpoints move independently, so a path cannot be translated).
  const registryRef = useRef<SVGGElement[]>([]);
  const branchPathsRef = useRef<SVGPathElement[]>([]);

  const applyFrame = (k: number, tx: number) => {
    for (const mark of registryRef.current) {
      mark.setAttribute('transform', `translate(${frameX(k, tx, Number(mark.dataset.baseX))},0)`);
    }
    for (const path of branchPathsRef.current) {
      path.setAttribute(
        'd',
        branchPath(
          frameX(k, tx, Number(path.dataset.parentBaseX)),
          Number(path.dataset.parentY),
          frameX(k, tx, Number(path.dataset.childBaseX)),
          Number(path.dataset.childY),
        ),
      );
    }
  };

  // After every render (SSR hydration, gesture-end re-render, resize, or a
  // caller-driven transform), the DOM sits exactly where the transform says.
  useEffect(() => {
    const svg = svgRef.current;
    if (svg === null) return;
    registryRef.current = Array.from(svg.querySelectorAll<SVGGElement>('g[data-base-x]'));
    branchPathsRef.current = Array.from(svg.querySelectorAll<SVGPathElement>('path[data-branch]'));
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
        applyTransform(next);
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

  // Milestone branches (TL-05): only events that genuinely carry sub-events
  // render a branch — with today's schema that set is empty, so nothing is
  // fabricated (§27). Child events are excluded from the flat node layer so a
  // sub-event is never drawn twice.
  const milestoneRows = rows.filter((row) => row.kind === 'event' && hasChildren(row.events[0]));
  const milestones = layoutMilestones(
    milestoneRows.map((row) => ({
      parentKey: row.key,
      parentBaseX: rowBaseX(geometry.scale, row),
      parentY: AXIS_Y,
      children: (row.events[0].children ?? []).map((child) => ({
        id: child.id,
        at: child.at,
        baseX: geometry.scale(new Date(child.at)),
      })),
    })),
  );
  const childIds = new Set(
    milestoneRows.flatMap((row) => (row.events[0].children ?? []).map((child) => child.id)),
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
      setSelectedKey(null);
      applyTransform(next);
      return;
    }
    setSelectedKey(row.key);
  };

  /** Zoom about the visible window's centre (the +/- keys and the scrubber). */
  const zoomByCentered = (factor: number) => {
    const centerMs = window_.fromMs + (window_.toMs - window_.fromMs) / 2;
    applyTransform(
      transformForCenter(geometry.scale, Math.max(width, 1), EDGE_PADDING, centerMs, transform.k * factor),
    );
  };

  /** Keyboard (TL-08): arrows pan, +/- zoom, Escape dismisses the detail. */
  const onTimelineKeyDown = (event: ReactKeyboardEvent<SVGSVGElement>) => {
    const panStep = Math.max(Math.max(width, 1) * 0.1, 40);
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      const direction = event.key === 'ArrowRight' ? -1 : 1;
      applyTransform(
        clampTransform(
          geometry.scale,
          { k: transform.k, tx: transform.tx + direction * panStep },
          Math.max(width, 1),
          EDGE_PADDING,
        ),
      );
      event.preventDefault();
      return;
    }
    if (event.key === '+' || event.key === '=') {
      zoomByCentered(1.6);
      event.preventDefault();
      return;
    }
    if (event.key === '-' || event.key === '_') {
      zoomByCentered(1 / 1.6);
      event.preventDefault();
      return;
    }
    if (event.key === 'Escape') setSelectedKey(null);
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
        role="group"
        aria-label={summary}
        viewBox={`0 0 ${Math.max(width, 1)} ${TIMELINE_BAND_HEIGHT}`}
        className="block h-auto w-full touch-none"
        tabIndex={0}
        onKeyDown={onTimelineKeyDown}
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
          {rows
            .filter((row) => !(row.kind === 'event' && childIds.has(row.events[0].id)))
            .map((row) => {
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
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      onRowActivate(row);
                    }
                  }}
                >
                  {/* A 44px invisible hit area: the visible node is small by
                      design, the touch target is not (UX-05/§26). A rect, not
                      a circle, so the drawn-node geometry stays exact. */}
                  <rect x={-22} y={AXIS_Y - 22} width={44} height={44} className="fill-transparent" />
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
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    onRowActivate(row);
                  }
                }}
              >
                {/* 44px invisible hit area (UX-05/§26) — the mark stays round.
                    A rect keeps the drawn-node geometry exact. */}
                <rect x={-22} y={AXIS_Y - 22} width={44} height={44} className="fill-transparent" />
                {/* The cardiology node: ONE filled accent disc with the
                    event's document mark set inside it, selected reads as an
                    ink rim (the one sanctioned accent list, INV-05). The
                    glyph is hand-drawn, round-capped, and it anchors to the
                    exact node centre — never a borrowed icon-pack shape. */}
                <circle
                  cy={AXIS_Y}
                  r={isSelected ? NODE_RADIUS + 2 : NODE_RADIUS}
                  className="fill-accent stroke-text-primary"
                  strokeWidth={isSelected ? 1.5 : 0}
                />
                <g className="stroke-text-primary">
                  <rect
                    x={-4.5}
                    y={AXIS_Y - 6.5}
                    width={9}
                    height={13}
                    rx={3}
                    className="fill-none"
                    strokeWidth={1.4}
                    strokeLinejoin="round"
                  />
                  <line x1={-2} x2={2} y1={AXIS_Y - 2} y2={AXIS_Y - 2} strokeWidth={1.4} strokeLinecap="round" />
                  <line x1={-2} x2={2} y1={AXIS_Y + 1.5} y2={AXIS_Y + 1.5} strokeWidth={1.4} strokeLinecap="round" />
                </g>
              </g>
            );
          })}
        </g>

        {/* Milestone branches (TL-05): thin, calm, collision-free curves in
            the same scene. Paths are redrawn per frame (both endpoints move),
            so they pan and zoom with their nodes. Today's schema produces no
            sub-events, so this layer renders nothing in the product — the
            algorithm and its dev fixture prove it until a phase supplies
            children (§27, no fabricated branches). */}
        {milestones.length > 0 ? (
          <g aria-hidden="true">
            {milestones.flatMap((milestone) =>
              milestone.placements.map((placement) => (
                <path
                  key={`branch-${milestone.parentKey}-${placement.childId}`}
                  data-branch
                  data-parent-base-x={milestone.parentBaseX}
                  data-child-base-x={placement.childBaseX}
                  data-parent-y={milestone.parentY}
                  data-child-y={placement.childY}
                  d={branchPath(
                    frameX(transform.k, transform.tx, milestone.parentBaseX),
                    milestone.parentY,
                    frameX(transform.k, transform.tx, placement.childBaseX),
                    placement.childY,
                  )}
                  className="fill-none stroke-text-primary"
                  strokeWidth={1}
                />
              )),
            )}
          </g>
        ) : null}

        {milestones.length > 0 ? (
          <g>
            {milestones.flatMap((milestone) =>
              milestone.placements.map((placement) => (
                <g
                  key={`child-${placement.childId}`}
                  data-base-x={placement.childBaseX}
                  data-role="branch-child"
                  transform={`translate(${frameX(transform.k, transform.tx, placement.childBaseX)},0)`}
                >
                  <circle
                    cy={placement.childY}
                    r={3}
                    className="fill-surface stroke-text-primary"
                    strokeWidth={1}
                  />
                </g>
              )),
            )}
          </g>
        ) : null}
      </svg>

      {selectedEvent !== null && cardStyle !== null ? (
        <EventDetailCard
          event={selectedEvent}
          style={cardStyle}
          onClose={() => setSelectedKey(null)}
        />
      ) : null}

      {/* The bottom scrubber shares this exact transform (TL-06) and the
          same real events for its density dots. */}
      <TimelineScrubber
        scale={geometry.scale}
        bandWidth={Math.max(width, 1)}
        pad={EDGE_PADDING}
        transform={transform}
        onTransform={applyTransform}
        events={filteredEvents}
      />
    </div>
  );
}

/** The category filter — real pill controls, active one emphasized by fill.
    Each option carries its own drawn glyph the same way the dark band's tab
    pills do; there is no icon pack row here, one glyph per living category. */
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
              'inline-flex min-h-11 items-center justify-center gap-xs rounded-pill px-md text-label leading-label md:min-h-8',
              active
                ? 'bg-surface-raised shadow-raised text-text-primary'
                : 'bg-surface-muted text-text-secondary',
            ].join(' ')}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
