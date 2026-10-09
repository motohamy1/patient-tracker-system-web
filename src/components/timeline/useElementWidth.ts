// useElementWidth — measure a container's pixel width (client only).
//
// Shared by the timeline band and the scrubber track, both of which size
// their SVG viewBox from the real container width. jsdom has no
// ResizeObserver; the synchronous first measure still runs, and a 0
// measurement keeps the first-paint default so SSR and unit renders are
// deterministic.
'use client';

import { useEffect, useState } from 'react';
import type { RefObject } from 'react';

export function useElementWidth(ref: RefObject<HTMLElement | null>, fallback: number): number {
  const [width, setWidth] = useState(fallback);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const measure = () => {
      const next = element.clientWidth;
      if (next > 0) setWidth(next);
    };
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref]);
  return width;
}
