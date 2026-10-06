// tests/unit/dev-route-gate.test.ts — the D-26 gate truth table (ASVS V14).
//
// The gate is a pure predicate over two environment values, so its whole state
// space is four rows and every row is asserted here. The final case proves the
// gate reads NO other variable: stubbing an unrelated key leaves the result
// unchanged, which is what keeps the confinement claim honest rather than a
// convention.
//
// Runs in the Vitest `node` project (tests/unit/*.test.ts): it reads and writes
// `process.env` and renders nothing.
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { isDevRouteAllowed } from '@/lib/dev/dev-route-gate';

const TRACKED_KEYS = ['NODE_ENV', 'ALLOW_DEV_ROUTES', 'UNRELATED_DEV_FLAG'] as const;

const saved: Record<string, string | undefined> = {};

function clear(key: string): void {
  delete process.env[key];
}

function setEnv(nodeEnv: string | undefined, flag: string | undefined): void {
  if (nodeEnv === undefined) clear('NODE_ENV');
  else process.env.NODE_ENV = nodeEnv;
  if (flag === undefined) clear('ALLOW_DEV_ROUTES');
  else process.env.ALLOW_DEV_ROUTES = flag;
}

beforeEach(() => {
  for (const key of TRACKED_KEYS) saved[key] = process.env[key];
});

afterEach(() => {
  for (const key of TRACKED_KEYS) {
    if (saved[key] === undefined) clear(key);
    else process.env[key] = saved[key];
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
    process.env.UNRELATED_DEV_FLAG = '1';
    expect(isDevRouteAllowed()).toBe(false);

    setEnv('production', '1');
    expect(isDevRouteAllowed()).toBe(true);
    process.env.UNRELATED_DEV_FLAG = '0';
    expect(isDevRouteAllowed()).toBe(true);

    setEnv('development', undefined);
    expect(isDevRouteAllowed()).toBe(true);
    process.env.UNRELATED_DEV_FLAG = '1';
    expect(isDevRouteAllowed()).toBe(true);
  });
});
