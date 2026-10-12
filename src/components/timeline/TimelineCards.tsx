// TimelineCards — the band's floating-card layer, rendered from the patient's
// REAL CareEvent rows (§23/§27). This replaces the decorative sample
// content that hung over the band before: no invented Blood-Pressure figure,
// no symptom list,
// no MRI tile date, no ECG rhythm — any card type whose real data has no
// visual source is DROPPED, never faked.
//
// Every card is a real <button> wired to the same selection the axis nodes
// use; the reference's drawn expand badge lives INSIDE the button, so the
// mark answers a click (INV-08: no dead or drawn-only controls).
//
// Kind → variant (real mappings only):
//   medication-started/changed/stopped → the olive chip (icon well + label);
//   visit/procedure/hospitalization/imaging/lab/care-plan-change → surface
//     cards (label + date, detail sub-line only when the event carries one);
//   record-created/invite-redeemed → compact surface cards (lifecycle
//     milestones are real milestones, rendered as the lifecycle facts).
//
// The layer container is pointer-events-none with pointer-events-auto cards,
// so the layer never blocks the SVG's pan/zoom gestures (the layer occupies
// the band's full box but only the cards themselves are touchable).
//
// Positions arrive in px from the host (computed from the time scale and the
// live transform), clamped there to the band — no reference-canvas percentage
// constants, and SSR-stable.
'use client';

import type { CareEvent, CareEventKind } from '@/lib/timeline/events';

/** A card is anchored by its left edge in the band's px coordinate space. */
export type TimelineCardPlacement = {
  event: CareEvent;
  leftPx: number;
  topPx: number;
};

/** Card left-edge clamp (px) — the band's edge inset, mirrors EDGE_PADDING. */
export const CARD_EDGE = 24;
/** Assumed card max width (surface variants 200px, chips less) for the clamp. */
export const CARD_MAX_WIDTH = 200;
/** Cards clear the node row's 44px hit band (y 22–66) and stay in the 442px band. */
export const CARD_MIN_TOP = 72;
export const CARD_MAX_TOP = 316;

/** The kinds that earn a floating card — every kind here maps to real data. */
export const FEATURED_CARD_KINDS: ReadonlySet<CareEventKind> = new Set<CareEventKind>([
  'visit',
  'diagnosis',
  'procedure',
  'hospitalization',
  'care-plan-change',
  'medication-started',
  'medication-changed',
  'medication-stopped',
  'lab-ordered',
  'lab-result',
  'imaging-ordered',
  'imaging-result',
  'record-created',
  'invite-redeemed',
]);

const MEDICATION_KINDS: ReadonlySet<CareEventKind> = new Set<CareEventKind>([
  'medication-started',
  'medication-changed',
  'medication-stopped',
]);

/** Lifecycle milestones render as compact cards; clinical as surface cards. */
const LIFECYCLE_KINDS: ReadonlySet<CareEventKind> = new Set<CareEventKind>([
  'record-created',
  'invite-redeemed',
]);

/** The stored instant's calendar date — the timeline's own UTC convention. */
function cardDate(iso: string): string {
  return iso.slice(0, 10);
}

/** The reference's 26px expand badge — now INSIDE the wired button. */
function ExpandBadge() {
  return (
    <span className="flex size-[26px] shrink-0 items-center justify-center rounded-pill bg-timeline-well">
      <svg width="13" height="13" viewBox="0 0 24 24" aria-hidden="true" className="text-timeline-ink">
        <path d="M7 7l10 10M17 7v10H7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </span>
  );
}

function MedicationGlyph() {
  return (
    <span className="flex size-[22px] shrink-0 items-center justify-center rounded-pill bg-timeline-surface text-timeline-ink">
      <svg width="13" height="13" viewBox="0 0 24 24" aria-hidden="true">
        <rect
          x="3"
          y="8"
          width="18"
          height="8"
          rx="4"
          transform="rotate(-40 12 12)"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        />
      </svg>
    </span>
  );
}

function CardButton({
  event,
  leftPx,
  topPx,
  className,
  onSelect,
  children,
  widthClass,
}: {
  event: CareEvent;
  leftPx: number;
  topPx: number;
  className: string;
  onSelect: (event: CareEvent) => void;
  children: React.ReactNode;
  widthClass?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(event)}
      aria-label={`${event.label}, ${cardDate(event.at)} — view detail`}
      style={{ left: `${leftPx}px`, top: `${topPx}px` }}
      className={`pointer-events-auto absolute text-left ${widthClass ?? ''} ${className}`}
    >
      {children}
    </button>
  );
}

/**
 * The floating cards over the timeline band — real events only, clickable.
 * Renders zero cards for a record with no featured events; a card without a
 * real event behind it is never rendered.
 */
export function TimelineCards({
  cards,
  onSelect,
}: {
  cards: ReadonlyArray<TimelineCardPlacement>;
  onSelect: (event: CareEvent) => void;
}) {
  // Defense in depth: only featured kinds ever render, so a card with no
  // real event mapping is never mounted even if a host forgets to filter.
  const real = cards.filter(({ event }) => FEATURED_CARD_KINDS.has(event.kind));
  if (real.length === 0) return null;
  return (
    <div className="pointer-events-none absolute inset-0">
      {real.map(({ event, leftPx, topPx }) => {
        if (MEDICATION_KINDS.has(event.kind)) {
          return (
            <CardButton
              key={event.id}
              event={event}
              leftPx={leftPx}
              topPx={topPx}
              onSelect={onSelect}
              className="flex items-center gap-sm rounded-pill bg-olive-chip py-[6px] pl-[6px] pr-md shadow-control"
            >
              <MedicationGlyph />
              <span className="whitespace-nowrap font-plex text-label font-medium leading-label text-timeline-surface">
                {event.label}
              </span>
              {event.detail ? (
                <span className="font-plex-code text-caption leading-caption text-timeline-surface/60">
                  {event.detail}
                </span>
              ) : null}
            </CardButton>
          );
        }
        const compact = LIFECYCLE_KINDS.has(event.kind);
        return (
          <CardButton
            key={event.id}
            event={event}
            leftPx={leftPx}
            topPx={topPx}
            onSelect={onSelect}
            widthClass={compact ? 'w-[160px]' : 'w-[200px]'}
            className={`flex flex-col items-start gap-[6px] rounded-panel bg-timeline-surface p-[15px] shadow-card-soft${
              compact ? ' p-[12px]' : ''
            }`}
          >
            <div className="flex w-full items-center justify-between gap-sm">
              <span className="font-plex text-label font-semibold leading-label text-timeline-ink">
                {event.label}
              </span>
              <ExpandBadge />
            </div>
            {event.detail ? (
              <span className="text-left font-plex text-caption leading-caption text-timeline-ink-soft">
                {event.detail}
              </span>
            ) : null}
            <span className="font-plex-code text-caption leading-caption text-timeline-ink-soft tabular-nums">
              {cardDate(event.at)}
            </span>
          </CardButton>
        );
      })}
    </div>
  );
}
