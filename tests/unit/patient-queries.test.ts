// tests/unit/patient-queries.test.ts — the Phase-4 retrieval layer's unit proof
// (PROV-02, D-11, D-14, D-17..D-20, UX-07).
//
// Static idiom of tests/unit/membership-surface.test.tsx: mock the Supabase
// server client at the module boundary with a chainable query-builder fake
// that RECORDS every chained call, then assert the exact PostgREST contract:
// escaped ilike (Pitfall 1), filter predicates (D-11), cumulative range —
// never an offset window (D-20/UX-07), stable order, and total/hasMore.
import { beforeAll, describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => ({
  calls: [] as Array<[string, ...unknown[]]>,
  data: [] as unknown[],
  count: null as number | null,
}));

vi.mock('server-only', () => ({}));
vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => {
    const record =
      (name: string) =>
      (...args: unknown[]): unknown => {
        h.calls.push([name, ...args]);
        return chain;
      };
    // Thenable builder: every terminal await resolves with the harness payload.
    const chain: Record<string, unknown> = {};
    for (const op of ['select', 'eq', 'in', 'ilike', 'or', 'order', 'range']) {
      chain[op] = record(op);
    }
    chain.then = (onOk: (v: unknown) => unknown) =>
      onOk({ data: h.data, error: null, count: h.count });
    return { from: () => chain };
  },
}));

import { listPatients, escapeLike } from '@/lib/patients/queries';
import { listPatientsQuerySchema } from '@/lib/patients/schemas';

const ORG = '10000000-0000-0000-0000-000000000001';

function callsNamed(name: string) {
  return h.calls.filter((c) => c[0] === name);
}

function row(i: number) {
  return {
    id: `p-${i}`,
    first_name: `First${i}`,
    last_name: `Last${i}`,
    dob: '1990-05-12',
    sex: 'F',
    mrn: `MRN-00${i}`,
    status: 'stable',
    user_id: null,
    last_activity_at: '2026-10-01T00:00:00Z',
  };
}

beforeAll(() => {
  h.calls.length = 0;
});

describe('escapeLike — user text can never widen the match (Pitfall 1)', () => {
  it('backslash-escapes ILIKE wildcards', () => {
    expect(escapeLike('50%_a\\b')).toBe('50\\%\\_a\\\\b');
  });
});

describe('listPatients — one indexed query composes search + filter + page', () => {
  it('searches via a single escaped lowercase ilike on search_text (D-17/D-19)', async () => {
    h.calls.length = 0;
    h.data = [];
    h.count = 0;
    await listPatients({ orgId: ORG, q: '  AMina% ' });
    const ilike = callsNamed('ilike')[0];
    expect(ilike).toBeDefined();
    expect(ilike[1]).toBe('search_text');
    expect(ilike[2]).toBe('%amina\\%%');
    // no .or() unless the today filter is active — user text never enters one
    expect(callsNamed('or')).toHaveLength(0);
  });

  it('attention filter is the two-status IN predicate (D-11)', async () => {
    h.calls.length = 0;
    await listPatients({ orgId: ORG, filter: 'attention' });
    const inn = callsNamed('in')[0];
    expect(inn?.[1]).toBe('status');
    expect(inn?.[2]).toEqual(['follow_up', 'needs_review']);
    expect(callsNamed('eq').filter((c) => c[1] === 'status')).toHaveLength(0);
  });

  it('critical filter is status = critical (D-11)', async () => {
    h.calls.length = 0;
    await listPatients({ orgId: ORG, filter: 'critical' });
    const statusEq = callsNamed('eq').find((c) => c[1] === 'status');
    expect(statusEq?.[2]).toBe('critical');
  });

  it('today filters created OR updated within the client-local day (D-14)', async () => {
    h.calls.length = 0;
    await listPatients({ orgId: ORG, filter: 'today', day: '2026-10-08' });
    const or = callsNamed('or')[0];
    expect(or).toBeDefined();
    const expr = String(or[1]);
    expect(expr).toContain('created_at.gte.');
    expect(expr).toContain('created_at.lt.');
    expect(expr).toContain('updated_at.gte.');
    expect(expr).toContain('updated_at.lt.');
    // window == the CLIENT's local calendar day of `day` (24h, local midnight)
    const localMidnight = new Date('2026-10-08T00:00:00');
    expect(expr).toContain(`created_at.gte.${localMidnight.toISOString()}`);
    expect(expr).toContain(
      `created_at.lt.${new Date(localMidnight.getTime() + 86_400_000).toISOString()}`,
    );
  });

  it('orders last_activity_at desc with id tiebreak — stable paging (Pitfall 3)', async () => {
    h.calls.length = 0;
    await listPatients({ orgId: ORG });
    const orders = callsNamed('order');
    expect(orders[0]).toEqual(['order', 'last_activity_at', { ascending: false }]);
    expect(orders[1]).toEqual(['order', 'id', { ascending: false }]);
  });

  it('fetches cumulatively 0..shown+limit — appends, never replaces (D-20/UX-07)', async () => {
    h.calls.length = 0;
    await listPatients({ orgId: ORG, shown: 24, limit: 24 });
    const range = callsNamed('range')[0];
    expect(range).toEqual(['range', 0, 48]);
  });

  it('hasMore probes one row past the window; total comes from the exact count', async () => {
    h.calls.length = 0;
    h.data = Array.from({ length: 25 }, (_, i) => row(i)); // 25 fetched for window 24
    h.count = 137;
    const page = await listPatients({ orgId: ORG, limit: 24 });
    expect(page.rows).toHaveLength(24);
    expect(page.hasMore).toBe(true);
    expect(page.total).toBe(137);

    h.data = Array.from({ length: 24 }, (_, i) => row(i));
    const last = await listPatients({ orgId: ORG, limit: 24 });
    expect(last.hasMore).toBe(false);
  });

  it('maps rows to the camelCase folder shape with a computed age', async () => {
    h.calls.length = 0;
    h.data = [row(1)];
    h.count = 1;
    const page = await listPatients({ orgId: ORG });
    const r = page.rows[0];
    expect(r.firstName).toBe('First1');
    expect(r.lastActivityAt).toBe('2026-10-01T00:00:00Z');
    expect(r.age).toBeGreaterThanOrEqual(35); // dob 1990 — computed, never printed raw
    expect(Object.keys(r)).not.toContain('phone'); // card fields only — minimization
  });
});

describe('listPatientsQuerySchema — the URL contract (D-11/D-14/D-20)', () => {
  it('defaults: filter all, shown 0, limit 24 (8 rows × 3 columns)', () => {
    const parsed = listPatientsQuerySchema.parse({});
    expect(parsed).toEqual({ filter: 'all', shown: 0, limit: 24 });
  });

  it('rejects a malformed day — the only .or()-bound value (Pitfall 1/2)', () => {
    expect(listPatientsQuerySchema.safeParse({ day: '10-08-2026' }).success).toBe(false);
    expect(listPatientsQuerySchema.safeParse({ day: '2026-10-08' }).success).toBe(true);
  });

  it('caps limit at 30 per D-20 (20–30 folders per page)', () => {
    expect(listPatientsQuerySchema.safeParse({ limit: 31 }).success).toBe(false);
    expect(listPatientsQuerySchema.safeParse({ limit: 30 }).success).toBe(true);
  });
});
