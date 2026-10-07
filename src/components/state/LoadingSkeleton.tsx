// src/components/state/LoadingSkeleton.tsx — the UX-01 loading baseline
// (03-UI-SPEC.md §8.5).
//
// Token-derived skeleton blocks: `bg-surface-muted` bars at `radius.md`,
// `gap-lg` separation, NO border class, NO third shadow, sized to the real
// subsequent rows. The bare word "Loading" as a screen is banned; the pulse —
// the only motion here — runs at `motion.duration.slow` with `easing.standard`
// and is disabled when reduced motion is active. The CSS-motion route keeps this
// a Server Component: the reduced-motion contract needs no JS branch.
import type { ReactNode } from 'react';

export type SkeletonBar = 'sm' | 'md' | 'lg';

const BAR_HEIGHT: Record<SkeletonBar, string> = {
  sm: 'h-3',
  md: 'h-4',
  lg: 'h-8',
};

const PULSE_CSS = `
@keyframes skeleton-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}
.skeleton-pulse {
  animation: skeleton-pulse var(--duration-slow) var(--ease-standard) infinite;
}
@media (prefers-reduced-motion: reduce) {
  .skeleton-pulse { animation: none; }
}
`;

export function LoadingSkeleton({
  bars = ['md', 'md', 'lg', 'md'],
  className,
}: {
  /** One entry per row block; the block paints the real row's height. */
  bars?: readonly SkeletonBar[];
  className?: string;
}) {
  return (
    <>
      <style>{PULSE_CSS}</style>
      <div className={['flex w-full flex-col gap-lg', className].filter(Boolean).join(' ')}>
        <span className="sr-only" role="status">
          Loading
        </span>
        {bars.map((bar, index) => (
          <div
            key={index}
            aria-hidden="true"
            className={`skeleton-pulse rounded-md bg-surface-muted ${BAR_HEIGHT[bar]}`}
          />
        ))}
      </div>
    </>
  );
}
