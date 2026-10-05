"use client";

/*
 * The ONLY sanctioned motion layer.
 *
 * RULE, enforced by a lint rule in eslint.config.mjs and by tests/unit/motion.test.tsx:
 * components outside `src/components/motion/` must NOT import `motion/react` (or the
 * uninstalled `framer-motion`) directly. They compose these primitives instead, because
 * every primitive below absorbs the app-wide reduced-motion policy internally. A caller
 * that imports Motion directly can silently opt out of FND-05, and that failure is
 * invisible in review.
 *
 * Why every primitive is a Client Component: `useReducedMotion` cannot run in a Server
 * Component. Keeping the boundary at this one layer — instead of at each usage — is what
 * lets the locale layout stay a Server Component with server-resolved `lang`/`dir`.
 *
 * Reduced-motion states here are DESIGNED, not discovered: under
 * `<MotionConfig reducedMotion="user">` the transform-carrying animations degrade to
 * instant, opacity-only or instant state changes.
 */

import { motion, useReducedMotion } from "motion/react";
import { durations, easeOut, fade, pressScale, revealUp } from "./variants";

/**
 * Opacity only, so it is safe as-is under reduced motion: Motion preserves opacity
 * animations when `reducedMotion="user"` is set. Use for loaders and content swaps.
 */
export function Fade({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div className={className} {...fade}>
      {children}
    </motion.div>
  );
}

/** Reveal on mount. Reduced motion swaps the translate for an opacity-only fade. */
export function RevealUp({ children, className }: { children: React.ReactNode; className?: string }) {
  const shouldReduceMotion = useReducedMotion();
  return (
    <motion.div
      className={className}
      {...(shouldReduceMotion ? { initial: { opacity: 0 }, animate: { opacity: 1 } } : revealUp)}
    >
      {children}
    </motion.div>
  );
}

/**
 * Tap feedback. Reduced motion drops the scale (a vestibular trigger) but keeps the
 * transition, so colour/opacity feedback driven through the same element still lands.
 */
export function PressScale({ children, className }: { children: React.ReactNode; className?: string }) {
  const shouldReduceMotion = useReducedMotion();
  return (
    <motion.button type="button" className={className} {...(shouldReduceMotion ? { whileTap: {} } : pressScale)}>
      {children}
    </motion.button>
  );
}

/**
 * Height expand/collapse for a parent-controlled `open` state.
 *
 * Reduced motion uses an instant state change: the panel is `hidden` rather than
 * animated to zero height, which is both the correct reduced state and the correct
 * accessibility state. DESIGN NOTE for later phases: every `layout`-driven indicator —
 * the Phase 4 active tab underline, the Phase 6 folder peek, timeline node expansion —
 * becomes an instant jump under reduced motion. That is the intended behaviour and must
 * be designed for at the resting state, not patched later.
 */
export function ExpandCollapse({
  open,
  children,
  className,
}: {
  open: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  const shouldReduceMotion = useReducedMotion();
  if (shouldReduceMotion) {
    return (
      <motion.div className={className} initial={false} animate={{}} hidden={!open}>
        {children}
      </motion.div>
    );
  }
  return (
    <motion.div
      className={className}
      style={{ overflow: "hidden" }}
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: open ? "auto" : 0, opacity: open ? 1 : 0 }}
      transition={{ duration: durations.base, ease: easeOut }}
    >
      {children}
    </motion.div>
  );
}
