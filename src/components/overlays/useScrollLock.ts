'use client';

// useScrollLock — the document scroll lock for the overlay (D-22, FOUND-04).
//
// One concern, one file: this hook blocks background scrolling while an overlay
// is open and restores the previous values on cleanup. It lives apart from the
// focus trap so a later accessibility audit has one specific place to look
// (02-RESEARCH.md §Don't Hand-Roll).
//
// This deliberately does NOT do the classic "measure the scrollbar width and
// add padding-right" compensation. `scrollbar-gutter: stable` on the scroll
// container reserves the gutter whether or not the box overflows, so there is
// no measurement, no arithmetic and no layout shift — the failure mode that
// would move content and corrupt every visual baseline (02-RESEARCH.md
// §Don't Hand-Roll, T-02-48). `html` already carries `scrollbar-gutter: stable`
// in globals.css; setting it here as well keeps the guarantee local to the lock
// and makes the restore symmetric.
import { useEffect } from 'react';

export type UseScrollLockOptions = {
  /** Lock while true; restore on false or unmount. */
  active: boolean;
};

export function useScrollLock({ active }: UseScrollLockOptions): void {
  useEffect(() => {
    if (!active) return;

    // The document root is the scroll container for a page-level overlay.
    const scrollContainer = document.documentElement;
    const previousOverflow = scrollContainer.style.overflow;
    const previousGutter = scrollContainer.style.scrollbarGutter;

    scrollContainer.style.overflow = 'hidden';
    scrollContainer.style.scrollbarGutter = 'stable';

    return () => {
      scrollContainer.style.overflow = previousOverflow;
      scrollContainer.style.scrollbarGutter = previousGutter;
    };
  }, [active]);
}
