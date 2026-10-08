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
  /** Surface name interpolated into the title ('Couldn't load {surface}'). */
  surface: string;
  /** Re-runs the surface's server action. */
  onRetry?: () => void;
  /**
   * Server-Component retry target: an anchor that re-requests the same route.
   * One of `onRetry` or `retryHref` must be supplied, so the "Try again"
   * action is never a dead control (D-24); a page with no client action uses
   * this form (Phase-5 Overview).
   */
  retryHref?: string;
  /** True while the retry request is in flight: the button reports aria-busy. */
  retrying?: boolean;
  className?: string;
};

export function StateVariant({
  surface,
  onRetry,
  retryHref,
  retrying,
  className,
}: StateVariantProps) {
  return (
    <EmptyState
      title={`Couldn't load ${surface}`}
      body="Check your connection and try again."
      className={className}
      action={{ label: 'Try again', onClick: onRetry, href: retryHref, ariaBusy: retrying }}
    />
  );
}
