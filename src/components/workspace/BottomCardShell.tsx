// BottomCardShell — the shared frame for the three Overview bottom-row cards
// (reference §5: "Three cards with grabber dashes"; ticket 04's 55 / 22.5 /
// 22.5 row).
//
// The grabber dash is the reference's handle motif: a 4px `radius.pill` tick
// in the `surfaceMuted` family, centered ABOVE the card on the canvas, purely
// decorative (`aria-hidden`) — it is a rounded tick, not a rule, so INV-11's
// 1px-divider constraint is untouched. The shell owns the accessible region
// name (`aria-label`) and the card header row (title left, optional header
// extra right); the body is the caller's.
//
// Server Component: no hook, no client directive.
import type { ReactNode } from 'react';
import { Surface } from '@/components/primitives';

export function BottomCardShell({
  label,
  heading,
  headerExtra,
  children,
}: {
  /** The region's accessible name (also asserted by the unit proofs). */
  label: string;
  heading: string;
  /** Optional header-right slot (e.g. the inert range chips). */
  headerExtra?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex h-full flex-col gap-sm">
      <span aria-hidden="true" className="mx-auto h-1 w-10 rounded-pill bg-surface-muted" />
      <section aria-label={label} className="min-h-0 flex-1">
        <Surface variant="surface" className="flex h-full flex-col gap-md">
          <div className="flex items-center justify-between gap-md">
            <h2 className="text-heading font-semibold leading-heading text-text-primary">
              {heading}
            </h2>
            {headerExtra}
          </div>
          {children}
        </Surface>
      </section>
    </div>
  );
}
