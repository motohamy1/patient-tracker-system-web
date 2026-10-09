// TimelineScrubber — the compact bottom scrubber (TL-06; ticket 06-04;
// reference §5: full-width capsule track, circular +/- buttons, thin ticks of
// varying heights, year labels, dark viewport window at overlay depth).
//
// It shares ONE transform with the timeline: the track maps the FULL event
// domain ([§8.6] months, years, density), the window is the visible slice,
// and every interaction — window drag, track click/drag, +/- — returns the
// next transform through the same pure helpers the timeline itself uses
// (`transformForCenter`, `visibleWindow`), so the two surfaces can never
// disagree. `d3-brush` is not needed: the window drag IS a brush over the
// same d3 time scale, expressed with pointer events (equivalent, and it
// keeps one source of truth for the range).
//
// Mobile (UX-05/§26): the scrubber is never dropped below 768px; the +/-
// buttons are 44px targets and the window drag is pointer-based, so touch
// works without a hover.
//
// The window's dark fill is the scrubber's scrim, derived from `textPrimary`
// (`fill-text-primary` with opacity) — no new token (INV-17) — and it is the
// overlay-level element by construction.
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

const SCRUBBER_HEIGHT = 48;
const TRACK_Y = 8;
const TRACK_H = 24;
const WINDOW_Y = 6;
const WINDOW_H = 28;
const DAY_MS = 86_400_000;

const ZOOM_STEP = 1.6;

function TrackTicks({ trackScale, trackWidth }: { trackScale: TimelineScale; trackWidth: number }) {
  // The lattice over the WHOLE domain (not the visible window): the scrubber
  // shows the record's full extent, months and years, at a fixed scale.
  const domain = trackScale.domain() as [Date, Date];
  const ticks = monthTicks(trackScale, domain, trackWidth);
  return (
    <g aria-hidden="true">
      {ticks.map((tick) => {
        const height = tick.isYearStart ? 16 : 8;
        return (
          <line
            key={`tick-${tick.date.toISOString()}`}
            x1={tick.x}
            x2={tick.x}
            y1={SCRUBBER_HEIGHT / 2 - height / 2}
            y2={SCRUBBER_HEIGHT / 2 + height / 2}
            className="stroke-border-subtle"
            strokeWidth={1}
          />
        );
      })}
      {ticks
        .filter((tick) => tick.isYearStart)
        .map((tick) => (
          <text
            key={`year-${tick.date.toISOString()}`}
            x={tick.x + 3}
            y={SCRUBBER_HEIGHT - 4}
            className="text-label fill-text-primary"
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
}: {
  scale: TimelineScale;
  /** The band's width — the coordinate space the transform lives in. */
  bandWidth: number;
  pad: number;
  transform: TimelineTransform;
  onTransform: (next: TimelineTransform) => void;
}) {
  const holderRef = useRef<HTMLDivElement>(null);
  const trackWidth = useElementWidth(holderRef, 1024);
  const dragRef = useRef<{ pointerId: number; mode: 'window' | 'track'; startX: number; startCenterMs: number } | null>(null);

  const domain = scale.domain() as [Date, Date];
  const domainMs: [number, number] = [domain[0].getTime(), domain[1].getTime()];
  const trackScale = scaleTime().domain(domain).range([0, Math.max(trackWidth, 1)]);

  const window_ = visibleWindow(scale, transform, Math.max(bandWidth, 1));
  const windowFromX = trackScale(new Date(window_.fromMs));
  const windowToX = trackScale(new Date(window_.toMs));
  const windowX = Math.min(windowFromX, windowToX);
  const windowW = Math.max(Math.abs(windowToX - windowFromX), 8);

  /** Move by a pixel delta on the track (linear time scale → linear px). */
  const dragTo = (mode: 'window' | 'track', x: number) => {
    const msPerPx = (domainMs[1] - domainMs[0]) / Math.max(trackWidth, 1);
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
    <div className="mt-sm flex w-full items-center gap-sm" role="group" aria-label="Timeline range">
      <button
        type="button"
        aria-label="Zoom out"
        onClick={() => zoomBy(1 / ZOOM_STEP)}
        className="inline-flex size-11 shrink-0 items-center justify-center rounded-pill bg-surface text-text-primary"
      >
        <MinusGlyph size="sm" />
      </button>
      <button
        type="button"
        aria-label="Zoom in"
        onClick={() => zoomBy(ZOOM_STEP)}
        className="inline-flex size-11 shrink-0 items-center justify-center rounded-pill bg-surface text-text-primary"
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
          {/* Capsule track (reference: surfaceMuted family — the band's own
              recessed tone made explicit as the track). */}
          <rect
            x={0}
            y={TRACK_Y}
            width={Math.max(trackWidth, 1)}
            height={TRACK_H}
            rx={TRACK_H / 2}
            className="fill-surface"
          />

          <TrackTicks trackScale={trackScale} trackWidth={trackWidth} />

          {/* The dark viewport window — scrim derived from textPrimary, no
              new token (INV-17); round caps, overlay-level element. */}
          <rect
            x={windowX}
            y={WINDOW_Y}
            width={windowW}
            height={WINDOW_H}
            rx={WINDOW_H / 2}
            className="fill-text-primary"
            opacity={0.85}
          />
        </svg>
      </div>
    </div>
  );
}
