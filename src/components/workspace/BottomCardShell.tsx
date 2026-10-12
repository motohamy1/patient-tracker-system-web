// BottomCardShell — the shared frame for the three Overview bottom-row cards
// (reference §5: "Three cards with grabber dashes"; the patient-detail
// reference draws them as 20px-radius surfaces, 20px padded, with the heading
// left and the reference's expand mark right).
//
// The grabber dash the earlier reference drew above each card is GONE in the
// patient-detail reference: the cards now separate from the canvas by
// `shadow-raised` alone, so the dash would be a decorative tic with nothing
// left to signal (the anti-slop rule it answered — "these lift" — is now
// carried by the shadow itself).
//
// The expand mark in each header is a DRAWN MARK, not a control: it takes no
// pointer events and is hidden from assistive tech, because this phase wires no
// destination behind it and a badge that invites a click it cannot answer is
// worse than no badge (INV-08, no-fake-interactivity).
//
// Server Component: no hook, no client directive.
import type { ReactNode } from 'react';

/** The reference's expand mark: a diagonal out-arrow. Decorative only. */
function ExpandMark() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 16 16"
      aria-hidden="true"
      className="shrink-0 text-text-secondary"
    >
      <path
        d="M5 11L11 5M11 5H6M11 5v5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function BottomCardShell({
  label,
  heading,
  bodyClassName = '',
  children,
}: {
  /** The region's accessible name (also asserted by the unit proofs). */
  label: string;
  heading: string;
  /** Alignment of the body: the reference centres Labs and Recent Records but
   *  lets Vital Signs History fill. */
  bodyClassName?: string;
  children: ReactNode;
}) {
  return (
    <section
      aria-label={label}
      className="flex h-full flex-col gap-md rounded-card bg-surface p-xl shadow-raised"
    >
      <div className="flex items-center justify-between gap-md">
        <h2 className="font-grotesk text-heading font-semibold leading-heading text-text-primary">
          {heading}
        </h2>
        <ExpandMark />
      </div>
      <div className={`flex min-h-0 flex-1 flex-col ${bodyClassName}`}>{children}</div>
    </section>
  );
}
