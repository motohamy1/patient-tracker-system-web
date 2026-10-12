// EventDetailCard — the selected event's contextual detail (TL-07;
// ticket 06-03). Rendered at the OVERLAY elevation (`shadow-overlay`, the
// second and only other level — INV-13), anchored to the selected node.
//
// Content is the event's REAL payload and provenance only (§23/§27): label,
// stored instant, where the record came from, and its verification state. An
// AI-extracted event would say so in the same slot as a system or clinician
// one — the three states are never rendered indistinguishably.
//
// Dismissible: a wired close control (never a dead ✕), the band's empty area,
// and Escape (wired in the host). Rendered instantly — no entrance animation
// to interrupt, reduced-motion safe by construction (§9).
//
// Presentational only: the host owns the anchored position via `style`.
import type { CSSProperties } from 'react';
import { X } from 'lucide-react';
import { makeIcon } from '@/components/primitives';
import type { CareEvent } from '@/lib/timeline/events';

const CloseGlyph = makeIcon(X);

const SOURCE_LABEL: Record<CareEvent['source']['table'], string> = {
  patients: 'Patient record',
  invitations: 'Invitation',
  visits: 'Visit',
  medication_events: 'Medication history',
  lab_orders: 'Lab order',
  lab_results: 'Lab result',
  imaging_orders: 'Imaging order',
  imaging_results: 'Imaging result',
};

const VERIFICATION_LABEL: Record<CareEvent['verification'], string> = {
  'clinician-verified': 'Clinician-verified',
  'ai-extracted': 'AI-extracted, awaiting review',
  'system-generated': 'System-generated',
};

/** "2026-10-06 09:30" from a stored ISO instant — UTC, tabular, unambiguous. */
function formatInstant(iso: string): string {
  return `${iso.slice(0, 10)} ${iso.slice(11, 16)}`;
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-md">
      <span className="text-label leading-label text-text-secondary">{label}</span>
      <span className="text-label leading-label text-text-primary tabular-nums">{value}</span>
    </div>
  );
}

export function EventDetailCard({
  event,
  style,
  onClose,
}: {
  event: CareEvent;
  style: CSSProperties;
  onClose: () => void;
}) {
  return (
    <div
      role="dialog"
      aria-label={`Event detail: ${event.label}`}
      style={style}
      className="absolute z-10 flex w-64 flex-col gap-sm rounded-panel bg-timeline-surface p-lg shadow-card-soft"
    >
      <div className="flex items-start justify-between gap-md">
        <span className="font-plex text-heading font-semibold leading-heading text-timeline-ink">
          {event.label}
        </span>
        <button
          type="button"
          aria-label="Close event detail"
          onClick={onClose}
          className="inline-flex size-11 shrink-0 items-center justify-center rounded-pill bg-timeline-well p-sm text-timeline-ink md:size-8"
        >
          <CloseGlyph size="sm" />
        </button>
      </div>

      <div className="flex flex-col gap-xs">
        <DetailRow label="When" value={formatInstant(event.at)} />
        <DetailRow label="Source" value={SOURCE_LABEL[event.source.table]} />
        <DetailRow label="Verification" value={VERIFICATION_LABEL[event.verification]} />
      </div>
    </div>
  );
}
