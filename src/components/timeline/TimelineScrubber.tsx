// TimelineScrubber — the COMPACT bottom scrubber (TL-06; §8.1/§8.2).
//
// One transform with the timeline: the track maps the record's temporal extent,
// the window is the visible slice, and every interaction — window drag, track
// click/drag, +/- — returns the next transform through the same pure helpers the
// timeline itself uses (`transformForCenter`, `visibleWindow`), so the two
// surfaces can never disagree. `d3-brush` is not needed: the window drag IS a
// brush over the same d3 time scale, expressed with pointer events.
//
// REDESIGN (2026-10-12, §8.1): the scrubber is visually SECONDARY to the main
// timeline — a compact capsule track on a muted warm surface, thin ticks with
// restrained year labels, a DARK OLIVE selected viewport window, and small
// chartreuse event-density marks only where real events exist. It is never a
// thick charcoal band.
//
// SENSIBLE TEMPORAL MARGINS (§8.2): the track maps the event domain PADDING by
// a modest margin on each side, so at the resting zoom the visible window is a
// PORTION of the track rather than a bar stretched across the whole thing (the
// "oversized dark rectangle" failure). The margins are pure presentation — the
// density dots still land on the real event instants, and the window always
// describes the true visible range, so no event date is misrepresented.
//
// Mobile (UX-05/§26): the scrubber is never dropped; the +/- buttons are 44px
// targets and the window drag is pointer-based, so touch works without a hover.
//
// The window's dark fill is the scrubber's scrim, derived from `textPrimary`
// (INV-17) — no new token — the overlay-level element by construction.
//
// Server/client: 'use client' (pointer + size measurement).
'use client';

import { useRef } from 'react';
import { Minus, Plus } from 'lucide-react';
import { makeIcon } from '@/components/primitives';
import { useElementWidth } from '@/components/timeline/useElementWidth';
import { monthTicks } from '@/lib/timeline/scale';
import type { TimelineScale } from '@/lib/timeline/scale';
import { scaleTime } from 'd3-scale';
import {
  transformForCenter,
  visibleWindow,
  type TimelineTransform,
} from '@/lib/timeline/zoom';

const MinusGlyph = makeIcon(Minus);
const PlusGlyph = makeIcon(Plus);

const SCRUBBER_HEIGHT = 44;
/** The track is the full capsule; the selected window is inset 6px inside it,
 *  which is the reference's own relationship (a 32px window in a 44px track). */
const TRACK_Y = 0;
const TRACK_H = 44;
const WINDOW_Y = 6;
const WINDOW_H = 32;
const DAY_MS = 86_400_000;

/** Temporal margin around the event domain: 25% of the span, or 30 days min. */
const MARGIN_RATIO = 0.25;
const MIN_MARGIN_MS = 30 * DAY_MS;

const ZOOM_STEP = 1.6;

function TrackTicks({
  trackScale,
  trackWidth,
  trackDomain,
}: {
  trackScale: TimelineScale;
  trackWidth: number;
  trackDomain: readonly [Date, Date];
}) {
  // The lattice over the WHOLE padded track (not the visible window): the
  // scrubber shows the record's temporal context at a fixed scale. The
  // reference draws a taller tick on each year and a shorter one on each
  // month, both centred on the capsule.
  const ticks = monthTicks(trackScale, trackDomain, trackWidth);
  return (
    <g aria-hidden="true">
      {ticks.map((tick) => {
        const height = tick.isYearStart ? 20 : 12;
        return (
          <line
            key={`tick-${tick.date.toISOString()}`}
            x1={tick.x}
            x2={tick.x}
            y1={SCRUBBER_HEIGHT / 2 - height / 2}
            y2={SCRUBBER_HEIGHT / 2 + height / 2}
            className="stroke-rail-tick"
            strokeWidth={1}
          />
        );
      })}
      {ticks
        .filter((tick) => tick.isYearStart)
        .map((tick) => (
          <text
            key={`year-${tick.date.toISOString()}`}
            x={tick.x}
            y={SCRUBBER_HEIGHT - 4}
            textAnchor="middle"
            className="font-plex-code text-[10.5px] fill-rail-label"
          >
            {tick.year}
          </text>
        ))}
    </g>
  );
}

export function TimelineScrubber({
  scale,
  bandWidth,
  pad,
  transform,
  onTransform,
  events = [],
}: {
  scale: TimelineScale;
  /** The band's width — the coordinate space the transform lives in. */
  bandWidth: number;
  pad: number;
  transform: TimelineTransform;
  onTransform: (next: TimelineTransform) => void;
  /** The REAL events for the density dots (the reference's scrubber marks). */
  events?: readonly { at: string }[];
}) {
  const holderRef = useRef<HTMLDivElement>(null);
  const trackWidth = useElementWidth(holderRef, 1024);
  const dragRef = useRef<{ pointerId: number; mode: 'window' | 'track'; startX: number; startCenterMs: number } | null>(null);

  const domain = scale.domain() as [Date, Date];
  const spanMs = Math.max(domain[1].getTime() - domain[0].getTime(), DAY_MS);
  const marginMs = Math.max(spanMs * MARGIN_RATIO, MIN_MARGIN_MS);
  const trackDomain: [Date, Date] = [
    new Date(domain[0].getTime() - marginMs),
    new Date(domain[1].getTime() + marginMs),
  ];
  const trackSpanMs = trackDomain[1].getTime() - trackDomain[0].getTime();
  const trackScale = scaleTime().domain(trackDomain).range([0, Math.max(trackWidth, 1)]);

  const window_ = visibleWindow(scale, transform, Math.max(bandWidth, 1));
  const windowFromX = trackScale(new Date(window_.fromMs));
  const windowToX = trackScale(new Date(window_.toMs));
  const windowX = Math.min(windowFromX, windowToX);
  const windowW = Math.max(Math.abs(windowToX - windowFromX), 8);

  /** Move by a pixel delta on the track (linear time scale → linear px). */
  const dragTo = (mode: 'window' | 'track', x: number) => {
    const msPerPx = trackSpanMs / Math.max(trackWidth, 1);
    if (mode === 'window') {
      const drag = dragRef.current;
      if (!drag) return;
      const centerMs = drag.startCenterMs + (x - drag.startX) * msPerPx;
      onTransform(transformForCenter(scale, Math.max(bandWidth, 1), pad, centerMs, transform.k));
      return;
    }
    const centerMs = trackScale.invert(Math.min(Math.max(x, 0), trackWidth)).getTime();
    onTransform(transformForCenter(scale, Math.max(bandWidth, 1), pad, centerMs, transform.k));
  };

  const zoomBy = (factor: number) => {
    const visibleMs = window_.toMs - window_.fromMs;
    const centerMs = window_.fromMs + visibleMs / 2;
    const nextK = transform.k * factor;
    onTransform(transformForCenter(scale, Math.max(bandWidth, 1), pad, centerMs, nextK));
  };

  const endDrag = (pointerId: number) => {
    dragRef.current = null;
    holderRef.current?.releasePointerCapture?.(pointerId);
  };

  return (
    <div className="mt-[85px] flex w-full items-center gap-sm" role="group" aria-label="Timeline range">
      <button
        type="button"
        aria-label="Zoom out"
        onClick={() => zoomBy(1 / ZOOM_STEP)}
        className="inline-flex size-11 shrink-0 items-center justify-center rounded-pill bg-timeline-surface text-timeline-ink shadow-control"
      >
        <MinusGlyph size="sm" />
      </button>
      <button
        type="button"
        aria-label="Zoom in"
        onClick={() => zoomBy(ZOOM_STEP)}
        className="inline-flex size-11 shrink-0 items-center justify-center rounded-pill bg-timeline-surface text-timeline-ink shadow-control"
      >
        <PlusGlyph size="sm" />
      </button>

      <div ref={holderRef} className="min-w-0 flex-1">
        <svg
          viewBox={`0 0 ${Math.max(trackWidth, 1)} ${SCRUBBER_HEIGHT}`}
          className="block h-auto w-full touch-none"
          aria-label={`Timeline range: ${new Date(window_.fromMs).toISOString().slice(0, 10)} to ${new Date(window_.toMs).toISOString().slice(0, 10)}`}
          role="img"
          onPointerDown={(event) => {
            event.preventDefault();
            const rect = event.currentTarget.getBoundingClientRect();
            const scaleFactor = Math.max(trackWidth, 1) / Math.max(rect.width, 1);
            const x = (event.clientX - rect.left) * scaleFactor;
            const onWindow = x >= windowX && x <= windowX + windowW;
            const mode: 'window' | 'track' = onWindow ? 'window' : 'track';
            dragRef.current = {
              pointerId: event.pointerId,
              mode,
              startX: x,
              startCenterMs: window_.fromMs + (window_.toMs - window_.fromMs) / 2,
            };
            event.currentTarget.setPointerCapture?.(event.pointerId);
            // A tap on the track recentres immediately (a click is a move).
            if (mode === 'track') dragTo('track', x);
          }}
          onPointerMove={(event) => {
            const drag = dragRef.current;
            if (!drag || drag.pointerId !== event.pointerId) return;
            const rect = event.currentTarget.getBoundingClientRect();
            const scaleFactor = Math.max(trackWidth, 1) / Math.max(rect.width, 1);
            dragTo(drag.mode, (event.clientX - rect.left) * scaleFactor);
          }}
          onPointerUp={(event) => endDrag(event.pointerId)}
          onPointerCancel={(event) => endDrag(event.pointerId)}
        >
          {/* Capsule track — the reference's `scrubberTrack` fill. Its inset
              ring is a second 1px-inset stroke, so the boundary reads as the
              reference's inset shadow rather than a drawn border (INV-15). */}
          <rect
            x={0}
            y={TRACK_Y}
            width={Math.max(trackWidth, 1)}
            height={TRACK_H}
            rx={TRACK_H / 2}
            className="fill-rail-track"
          />
          <rect
            x={1}
            y={TRACK_Y + 1}
            width={Math.max(trackWidth, 1) - 2}
            height={TRACK_H - 2}
            rx={(TRACK_H - 2) / 2}
            className="fill-none stroke-timeline-ink"
            strokeOpacity={0.08}
            strokeWidth={2}
          />

          <TrackTicks
            trackScale={trackScale}
            trackWidth={trackWidth}
            trackDomain={trackDomain}
          />

          {/* Density dots: every real event lands as one small dot on the
              track (§8.1) — drawn where the event truly sits, muted against
              the track fill. */}
          <g aria-hidden="true">
            {events.map((event, index) => (
              <circle
                key={`${event.at}-${index}`}
                cx={trackScale(new Date(event.at))}
                cy={SCRUBBER_HEIGHT / 2}
                r={2.2}
                className="fill-rail-label"
              />
            ))}
          </g>

          {/* The selected viewport window — the reference's dark olive capsule.
              Round caps, overlay level. */}
          <rect
            x={windowX}
            y={WINDOW_Y}
            width={windowW}
            height={WINDOW_H}
            rx={WINDOW_H / 2}
            className="fill-scrubber-window"
          />

          {/* The same real events again, clipped to the window and painted in
              the node accent — the reference brightens the dots that fall
              inside the selection rather than drawing invented ones. */}
          <g aria-hidden="true">
            <defs>
              <clipPath id="scrubber-window-clip">
                <rect
                  x={windowX}
                  y={WINDOW_Y}
                  width={windowW}
                  height={WINDOW_H}
                  rx={WINDOW_H / 2}
                />
              </clipPath>
            </defs>
            <g clipPath="url(#scrubber-window-clip)">
              {events.map((event, index) => (
                <circle
                  key={`win-${event.at}-${index}`}
                  cx={trackScale(new Date(event.at))}
                  cy={SCRUBBER_HEIGHT / 2}
                  r={2.4}
                  className="fill-marker"
                />
              ))}
            </g>
          </g>
        </svg>
      </div>
    </div>
  );
}
