// src/components/state/StateVariant.tsx — the UX-01 error/retry baseline
// (03-UI-SPEC.md §8.5).
//
// A 30-line composition over the shared `EmptyState` primitive — never a fork.
// Title is "Couldn't load {surface}", the body is the §7 default, and the
// action is a `secondary` Button labelled "Try again" whose onClick re-runs the
// server action. While a retry is in flight the button carries aria-busy and
// the EmptyState STAYS rendered — never a blank swap between states.
import { Button } from '@/components/primitives';
import { EmptyState } from '@/components/primitives/EmptyState';

export type StateVariantProps = {
  /** The surface name interpolated into the title ('Couldn't load {surface}'). */
  surface: string;
  /** Re-runs the surface's server action. */
  onRetry?: () => void;
  /** True while the retry request is in flight: the button reports aria-busy. */
  retrying?: boolean;
  className?: string;
};

export function StateVariant({ surface, onRetry, retrying, className }: StateVariantProps) {
  return (
    <EmptyState
      title={`Couldn't load ${surface}`}
      body="Check your connection and try again."
      className={className}
      action={{ label: 'Try again', onClick: onRetry, ariaBusy: retrying }}
    />
  );
}
