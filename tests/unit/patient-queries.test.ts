// tests/unit/patient-queries.test.ts — the Phase-4 retrieval layer's unit proof
// (PROV-02, D-11, D-14, D-17..D-20, UX-07).
//
// The Neon query helper is mocked at the module boundary: `getSql()` returns a
// tagged-template spy that RECORDS the SQL text and every bound value, then
// resolves the harness rows. The assertions pin the SQL contract directly:
// escaped lowercase ilike over `search_text` (Pitfall 1), the D-11 status
// predicates, cumulative `limit shown+limit+1` — never an offset window
// (D-20/UX-07), stable order, and the total/hasMore derived from the probe row.
import { beforeAll, describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => ({
  sql: vi.fn(),
  rows: [] as unknown[],
}));

vi.mock('server-only', () => ({}));
vi.mock('@/lib/db/neon', () => ({ getSql: () => h.sql }));

import { listPatients, escapeLike } from '@/lib/patients/queries';
import { listPatientsQuerySchema } from '@/lib/patients/schemas';

const ORG = '10000000-0000-0000-0000-000000000001';

/** The most recent tagged-template call: its literal text + bound values. */
function lastSql(): { text: string; values: unknown[] } {
  const [strings, ...values] = h.sql.mock.calls.at(-1) as [TemplateStringsArray, ...unknown[]];
  return { text: strings.join('?'), values };
}

function row(i: number, total = 0) {
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
    total,
  };
}

beforeAll(() => {
  h.sql.mockImplementation(async () => h.rows);
});

describe('escapeLike — user text can never widen the match (Pitfall 1)', () => {
  it('backslash-escapes ILIKE wildcards', () => {
    expect(escapeLike('50%_a\\b')).toBe('50\\%\\_a\\\\b');
  });
});

describe('listPatients — one indexed query composes search + filter + page', () => {
  it('searches via a single escaped lowercase ilike on search_text (D-17/D-19)', async () => {
    h.rows = [];
    await listPatients({ orgId: ORG, q: '  AMina% ' });
    const { text, values } = lastSql();
    expect(text.match(/search_text ilike/g)).toHaveLength(1);
    expect(values).toContain('%amina\\%%');
    // the raw user text is never interpolated into the statement text
    expect(text).not.toContain('AMina');
  });

  it('attention filter is the two-status IN predicate (D-11)', async () => {
    await listPatients({ orgId: ORG, filter: 'attention' });
    const { text, values } = lastSql();
    expect(text).toContain("status in ('follow_up', 'needs_review')");
    expect(values).toContain(true); // attention flag on
  });

  it('critical filter is status = critical (D-11)', async () => {
    await listPatients({ orgId: ORG, filter: 'critical' });
    const { text, values } = lastSql();
    expect(text).toContain("status = 'critical'");
    expect(values).toContain(true); // critical flag on
  });

  it('today filters created OR updated within the client-local day (D-14)', async () => {
    await listPatients({ orgId: ORG, filter: 'today', day: '2026-10-08' });
    const { text, values } = lastSql();
    expect(text).toContain('created_at >=');
    expect(text).toContain('created_at <');
    expect(text).toContain('updated_at >=');
    expect(text).toContain('updated_at <');
    // window == the CLIENT's local calendar day of `day` (24h, local midnight)
    const localMidnight = new Date('2026-10-08T00:00:00');
    expect(values).toContain(localMidnight.toISOString());
    expect(values).toContain(new Date(localMidnight.getTime() + 86_400_000).toISOString());
  });

  it('orders last_activity_at desc with id tiebreak — stable paging (Pitfall 3)', async () => {
    await listPatients({ orgId: ORG });
    const { text } = lastSql();
    expect(text).toContain('order by last_activity_at desc, id desc');
  });

  it('fetches cumulatively 0..shown+limit — appends, never replaces (D-20/UX-07)', async () => {
    await listPatients({ orgId: ORG, shown: 24, limit: 24 });
    const { text, values } = lastSql();
    expect(text).toContain('limit');
    expect(values).toContain(49); // 0..48 inclusive + one probe row
  });

  it('hasMore probes one row past the window; total comes from the count window', async () => {
    h.rows = Array.from({ length: 25 }, (_, i) => row(i, 137)); // 25 fetched for window 24
    const page = await listPatients({ orgId: ORG, limit: 24 });
    expect(page.rows).toHaveLength(24);
    expect(page.hasMore).toBe(true);
    expect(page.total).toBe(137);

    h.rows = Array.from({ length: 24 }, (_, i) => row(i, 24));
    const last = await listPatients({ orgId: ORG, limit: 24 });
    expect(last.hasMore).toBe(false);
  });

  it('maps rows to the camelCase folder shape with a computed age', async () => {
    h.rows = [row(1, 1)];
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

  it('rejects a malformed day — the only day-bound value (Pitfall 1/2)', () => {
    expect(listPatientsQuerySchema.safeParse({ day: '10-08-2026' }).success).toBe(false);
    expect(listPatientsQuerySchema.safeParse({ day: '2026-10-08' }).success).toBe(true);
  });

  it('caps limit at 30 per D-20 (20–30 folders per page)', () => {
    expect(listPatientsQuerySchema.safeParse({ limit: 31 }).success).toBe(false);
    expect(listPatientsQuerySchema.safeParse({ limit: 30 }).success).toBe(true);
  });
});
