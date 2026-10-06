'use client';

// The single motion vocabulary module (FOUND-05).
//
// Normative source: docs/governance/motion-rules.md §1 — there are exactly two
// durations (`duration.fast` 120ms and `duration.slow` 240ms) and exactly two
// curves (`easing.standard` and `easing.exit`). A third duration or a fourth
// curve requires a decision recorded in docs/governance/tokens.json; a component
// may never declare one locally. This module re-exports the generated constants
// from src/styles/tokens.generated.ts rather than retyping them, so the numbers
// an animation runs on are the frozen token values and nothing else.
//
// Every animation in the shell routes through `useShellMotion()`. The reduced
// branch (`prefers-reduced-motion: reduce`) is opacity-only at the fastest
// tokenized duration, and it is resolved truthily rather than compared against
// `false`, because `useReducedMotion` may return a falsy value on the first
// server render and a `reduce === false` comparison would flash full motion on
// hydration (02-RESEARCH.md Assumptions Log A1).
//
// Two-layer motion contract (docs/governance/motion-rules.md §2): Framer Motion
// owns component entrance and exit, layout transitions, panels, sheets and
// compact micro-interactions. GSAP owns complex SVG drawing and timeline
// choreography and is the second layer owned by Phase 006; it is NOT used in
// this phase and the two libraries are never combined for one animation. GSAP
// reads `var(--duration-fast)` rather than a literal.
//
// Assertion of record: a component whose animation does not go through
// `useShellMotion` fails this phase's acceptance (FOUND-05). Plan 02-11's
// `reduced-motion` Playwright project is the machine evidence that the branch
// exists on every surface, not only in one gallery section.
import { useReducedMotion } from 'motion/react';
import { MOTION } from '@/styles/tokens.generated';

/** The two duration keys. No third key is reachable. */
export type MotionKey = 'fast' | 'slow';

/** A motion variant pair: the Framer Motion `initial` / `animate` / `exit` shape. */
export type MotionVariantPair = {
  initial: Record<string, number>;
  animate: Record<string, number>;
  exit: Record<string, number>;
};

// Re-exported generated constants. The values live in tokens.json; this module
// owns only their names.
export const DURATION_FAST_SEC = MOTION.duration.fastSec;
export const DURATION_SLOW_SEC = MOTION.duration.slowSec;
export const EASING_STANDARD = MOTION.easing.standard;
export const EASING_EXIT = MOTION.easing.exit;

// The two durations in milliseconds for CSS-side callers, derived from the same
// seconds constants — never a second, retyped number.
export const DURATION_FAST_MS = MOTION.duration.fastSec * 1000;
export const DURATION_SLOW_MS = MOTION.duration.slowSec * 1000;

/**
 * The shell motion hook. Call once per animated component; it is the only
 * sanctioned way to name a duration or a curve.
 */
export function useShellMotion() {
  // Treated truthily: on the first server render this may be a falsy value.
  const shouldReduceMotion = useReducedMotion();
  const reduce = Boolean(shouldReduceMotion);

  /** Seconds for the requested key; the fast value under reduction. */
  const duration = (motionKey: MotionKey): number => {
    if (reduce) return DURATION_FAST_SEC;
    return motionKey === 'slow' ? DURATION_SLOW_SEC : DURATION_FAST_SEC;
  };

  /** The standard cubic-bezier array, or the exit curve when requested. */
  const ease = (exit = false): number[] =>
    exit ? [...EASING_EXIT] : [...EASING_STANDARD];

  /** The shared opacity-only pair used by any element that fades in or out. */
  const fade = (): MotionVariantPair => ({
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  });

  /**
   * Opacity plus a short translate for panels and sheets. Under reduction it
   * returns the same opacity-only pair as `fade()`, so a panel can never
   * reintroduce a transform on the reduced branch.
   */
  const fadeAndLift = (): MotionVariantPair => {
    if (reduce) return fade();
    return {
      initial: { opacity: 0, y: 8 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: 8 },
    };
  };

  /** Opacity-only pair for hover, toggle and pill state changes, always fast. */
  const stateChange = (): MotionVariantPair => ({
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  });

  return { reduce, duration, ease, fade, fadeAndLift, stateChange };
}
