// The reduced-motion contract test (FOUND-05, T-02-35, T-02-36).
//
// The motion package's reduced-motion hook is mocked at the module boundary so
// the assertions read the values `useShellMotion()` returns rather than reaching
// into the module's internals; the test survives a refactor of how the variants
// are assembled. `useReducedMotion` is replaced by a plain function, so calling
// the hook in the test needs no React renderer.
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MOTION } from '@/styles/tokens.generated';

const harness = vi.hoisted(() => ({ reducedMotion: false }));

vi.mock('motion/react', () => ({
  useReducedMotion: () => harness.reducedMotion,
}));

import { useShellMotion } from '@/lib/motion';

beforeEach(() => {
  harness.reducedMotion = false;
});

describe('useShellMotion — the reduced branch is opacity-only at the fast duration', () => {
  it('resolves slow to the fast value under reduction, so no second duration is reachable', () => {
    harness.reducedMotion = true;
    const motion = useShellMotion();
    expect(motion.duration('slow')).toBe(MOTION.duration.fastSec);
    expect(motion.duration('slow')).not.toBe(MOTION.duration.slowSec);
    expect(motion.duration('fast')).toBe(MOTION.duration.fastSec);
  });

  it('exposes only an opacity property on stateChange() under reduction', () => {
    harness.reducedMotion = true;
    const pair = useShellMotion().stateChange();
    // Asserted positively: an added transform key makes this list longer and fails.
    expect(Object.keys(pair.initial)).toEqual(['opacity']);
    expect(Object.keys(pair.animate)).toEqual(['opacity']);
    expect(Object.keys(pair.exit)).toEqual(['opacity']);
  });

  it('degrades fadeAndLift() to exactly fade() under reduction', () => {
    harness.reducedMotion = true;
    const motion = useShellMotion();
    expect(motion.fadeAndLift()).toEqual(motion.fade());
    expect(motion.fadeAndLift().animate).not.toHaveProperty('y');
  });

  it('returns the exit curve for ease(true) and the standard curve for ease(false) in both branches', () => {
    for (const reduced of [true, false]) {
      harness.reducedMotion = reduced;
      const motion = useShellMotion();
      expect(motion.ease(true)).toEqual(MOTION.easing.exit);
      expect(motion.ease(false)).toEqual(MOTION.easing.standard);
    }
  });
});

describe('useShellMotion — the full-motion branch', () => {
  it('resolves slow to the slow duration and lifts fadeAndLift() off fade()', () => {
    harness.reducedMotion = false;
    const motion = useShellMotion();
    expect(motion.duration('slow')).toBe(MOTION.duration.slowSec);
    expect(motion.duration('fast')).toBe(MOTION.duration.fastSec);
    expect(motion.fadeAndLift()).not.toEqual(motion.fade());
    expect(motion.fadeAndLift().animate).toHaveProperty('y');
  });
});

describe('useShellMotion — only two duration values are reachable', () => {
  it('never returns a number outside the two frozen durations', () => {
    const frozen = [MOTION.duration.fastSec, MOTION.duration.slowSec];
    const reachable: number[] = [];
    for (const reduced of [true, false]) {
      harness.reducedMotion = reduced;
      const motion = useShellMotion();
      reachable.push(motion.duration('fast'), motion.duration('slow'));
    }
    expect(reachable).toHaveLength(4);
    for (const value of reachable) {
      expect(frozen).toContain(value);
    }
  });
});
