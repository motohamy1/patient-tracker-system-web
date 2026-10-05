/*
 * Shared motion variants and transitions.
 *
 * NO client-directive here on purpose: this module holds plain data, so Server
 * Components may import it without crossing the client boundary.
 *
 * TOKEN PAIRING — maintained by hand, verified by tests/unit/motion.test.tsx:
 * these numeric seconds and easing mirror `--motion-duration-fast`,
 * `--motion-duration-base` and `--motion-ease-out` in src/styles/tokens.css. Motion
 * needs numbers in seconds; CSS needs length strings, so the two cannot literally share
 * one declaration. If the CSS tokens change, change these too — the test fails
 * otherwise.
 */

/** Cubic-bezier control points, matching `--motion-ease-out`. */
export const easeOut = [0.2, 0, 0, 1] as const;

export const durations = { fast: 0.12, base: 0.2 } as const;

export const fade = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: durations.base, ease: easeOut },
};

export const revealUp = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0 },
  transition: { duration: durations.base, ease: easeOut },
};

export const pressScale = {
  whileTap: { scale: 0.98 },
  transition: { duration: durations.fast, ease: easeOut },
};
