// tests/unit/patient-record-query.test.ts — the getPatient contract
// (Phase-5 T-01, WSP-02, AUTH-03, ASVS V5 / T-02-52).
//
// Same harness idiom as tests/unit/patient-queries.test.ts: the Supabase
// server client is mocked at the module boundary with a chainable fake that
// RECORDS every chained call, then the exact PostgREST contract is asserted —
// one select of the record columns, org scope first (defense in depth over
// RLS), the id bound as a predicate (never interpolated), a maybeSingle
// terminal, the row mapping, and the null/not-found and error branches.
import { beforeAll, describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => ({
  calls: [] as Array<[string, ...unknown[]]>,
  single: null as unknown,
  error: null as { message: string } | null,
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
    const chain: Record<string, unknown> = {};
    for (const op of ['select', 'eq']) {
      chain[op] = record(op);
    }
    chain.maybeSingle = () => {
      h.calls.push(['maybeSingle']);
      return Promise.resolve({ data: h.single, error: h.error });
    };
    return { from: () => chain };
  },
}));

import { getPatient, SupabasePermissionError } from '@/lib/patients/queries';

const ORG = '10000000-0000-0000-0000-000000000001';
const PATIENT_ID = '11111111-1111-4111-8111-111111111111';

const ROW = {
  id: PATIENT_ID,
  first_name: 'Tiffany',
  last_name: 'Woodward',
  dob: '1990-01-01',
  sex: 'F',
  mrn: 'MRN-0007',
  status: 'stable',
  user_id: 'user-1',
  last_activity_at: '2026-10-06T09:30:00Z',
  created_at: '2025-05-12T08:00:00Z',
  updated_at: '2026-10-06T09:30:00Z',
};

beforeAll(() => {
  h.calls.length = 0;
  h.error = null;
});

describe('getPatient — one patient, org-scoped, id bound', () => {
  it('selects the record columns and filters org then id as bound predicates', async () => {
    h.calls.length = 0;
    h.error = null;
    h.single = null;
    await getPatient(ORG, PATIENT_ID);

    const select = h.calls.find((c) => c[0] === 'select');
    expect(select).toBeDefined();
    expect(String(select?.[1])).toContain('created_at');
    expect(String(select?.[1])).toContain('updated_at');
    expect(String(select?.[1])).toContain('last_activity_at');

    const eqs = h.calls.filter((c) => c[0] === 'eq');
    expect(eqs).toEqual([
      ['eq', 'org_id', ORG],
      ['eq', 'id', PATIENT_ID],
    ]);
    expect(h.calls.map((c) => c[0])).toEqual(['select', 'eq', 'eq', 'maybeSingle']);
  });

  it('maps the row to a PatientRecord (D-10 fields untouched)', async () => {
    h.calls.length = 0;
    h.single = ROW;
    const record = await getPatient(ORG, PATIENT_ID);

    expect(record).not.toBeNull();
    expect(record).toMatchObject({
      id: PATIENT_ID,
      firstName: 'Tiffany',
      lastName: 'Woodward',
      dob: '1990-01-01',
      sex: 'F',
      mrn: 'MRN-0007',
      status: 'stable',
      userId: 'user-1',
      lastActivityAt: '2026-10-06T09:30:00Z',
      createdAt: '2025-05-12T08:00:00Z',
      updatedAt: '2026-10-06T09:30:00Z',
    });
    expect(typeof record?.age).toBe('number');
  });

  it('returns null when RLS filters the row away (another org reads nothing)', async () => {
    h.calls.length = 0;
    h.single = null;
    const record = await getPatient(ORG, PATIENT_ID);
    expect(record).toBeNull();
  });

  it('classifies a permission failure so the caller can render denial (not "connection")', async () => {
    h.calls.length = 0;
    h.single = null;
    h.error = { message: 'permission denied' };
    await expect(getPatient(ORG, PATIENT_ID)).rejects.toBeInstanceOf(SupabasePermissionError);
    await expect(getPatient(ORG, PATIENT_ID)).rejects.toThrow(
      'getPatient failed: permission denied',
    );
    h.error = null;
  });

  it('keeps a non-privilege failure a plain error', async () => {
    h.calls.length = 0;
    h.single = null;
    h.error = { message: 'connection reset' };
    await expect(getPatient(ORG, PATIENT_ID)).rejects.toThrow(
      'getPatient failed: connection reset',
    );
    await expect(getPatient(ORG, PATIENT_ID)).rejects.not.toBeInstanceOf(SupabasePermissionError);
    h.error = null;
  });
});
