"use client";

/*
 * App-wide reduced-motion policy (FND-05).
 *
 * `MotionConfig`'s own default is `reducedMotion: "never"`, so WITHOUT this provider
 * every primitive in the app silently ignores the operating system's reduced-motion
 * setting — and the failure is invisible, because animations simply keep playing.
 * One provider at the root is the whole fix.
 *
 * CSS and Motion are independent mechanisms and both are configured:
 *   - CSS owns static hover/focus affordances, via Tailwind's `motion-safe` /
 *     `motion-reduce` variants, keyed off `prefers-reduced-motion`.
 *   - Motion owns enter / exit / layout motion, via `reducedMotion` here.
 * Neither one configures the other.
 *
 * The client boundary lives HERE, not at each usage: `MotionConfig` is client-only and
 * the locale layout must stay a Server Component so `lang`/`dir` are correct in the
 * first paint.
 */

import { MotionConfig } from "motion/react";

export function MotionProvider({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
