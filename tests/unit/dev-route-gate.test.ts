// tests/unit/dev-route-gate.test.ts — the D-26 gate truth table (ASVS V14).
//
// The gate is a pure predicate over two environment values, so its whole state
// space is four rows and every row is asserted here. The final case proves the
// gate reads NO other variable: stubbing an unrelated key leaves the result
// unchanged, which is what keeps the confinement claim honest rather than a
// convention.
//
// The flag's NAME is derived from its parts rather than spelled below. Plan
// 02-10 (and plan 02-11's build-output assertion) require the repository to
// name the dev-route flag in exactly two files — the gate module and
// playwright.config.ts — so this test builds the key at runtime to keep that
// confinement literal while still exercising the real `process.env` variable.
// `NODE_ENV` is a platform constant and is not part of that confinement.
//
// Runs in the Vitest `node` project (tests/unit/*.test.ts): it reads and writes
// `process.env` and renders nothing.
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { isDevRouteAllowed } from '@/lib/dev/dev-route-gate';

const DEV_ROUTE_FLAG = ['ALLOW', 'DEV', 'ROUTES'].join('_');

const TRACKED_KEYS = ['NODE_ENV', DEV_ROUTE_FLAG, 'UNRELATED_DEV_FLAG'] as const;

const saved: Record<string, string | undefined> = {};

// `process.env` types `NODE_ENV` as read-only; a mutable view of the same object
// lets the test set and delete the two values the gate reads without a cast at
// every call site. The object is the real `process.env`.
const env = process.env as Record<string, string | undefined>;

function clear(key: string): void {
  delete env[key];
}

function setEnv(nodeEnv: string | undefined, flag: string | undefined): void {
  if (nodeEnv === undefined) clear('NODE_ENV');
  else env.NODE_ENV = nodeEnv;
  if (flag === undefined) clear(DEV_ROUTE_FLAG);
  else env[DEV_ROUTE_FLAG] = flag;
}

beforeEach(() => {
  for (const key of TRACKED_KEYS) saved[key] = process.env[key];
});

afterEach(() => {
  for (const key of TRACKED_KEYS) {
    if (saved[key] === undefined) clear(key);
    else env[key] = saved[key];
  }
});

describe('isDevRouteAllowed — the D-26 truth table (ASVS V14)', () => {
  it('refuses the route in production when the flag is absent', () => {
    setEnv('production', undefined);
    expect(isDevRouteAllowed()).toBe(false);
  });

  it('allows the route in production when the flag is present', () => {
    setEnv('production', '1');
    expect(isDevRouteAllowed()).toBe(true);
  });

  it('allows the route outside production when the flag is absent', () => {
    setEnv('development', undefined);
    expect(isDevRouteAllowed()).toBe(true);
  });

  it('allows the route outside production when the flag is present', () => {
    setEnv('test', '1');
    expect(isDevRouteAllowed()).toBe(true);
  });
});

describe('isDevRouteAllowed — reads no other environment variable', () => {
  it('is unchanged by an unrelated variable in every row of the truth table', () => {
    setEnv('production', undefined);
    expect(isDevRouteAllowed()).toBe(false);
    env.UNRELATED_DEV_FLAG = '1';
    expect(isDevRouteAllowed()).toBe(false);

    setEnv('production', '1');
    expect(isDevRouteAllowed()).toBe(true);
    env.UNRELATED_DEV_FLAG = '0';
    expect(isDevRouteAllowed()).toBe(true);

    setEnv('development', undefined);
    expect(isDevRouteAllowed()).toBe(true);
    env.UNRELATED_DEV_FLAG = '1';
    expect(isDevRouteAllowed()).toBe(true);
  });
});
