// tests/unit/patient-record-query.test.ts — the getPatient contract
// (Phase-5 T-01, WSP-02, AUTH-03, ASVS V5 / T-02-52).
//
// Same harness idiom as tests/unit/patient-queries.test.ts: the Neon helper
// is mocked at the module boundary and every tagged-template call is recorded,
// then the SQL contract is asserted — one select of the record columns, org
// scope first (defense in depth over the inert RLS policies), the id bound as
// a parameter (never interpolated), a `limit 1` terminal, the row mapping, and
// the null/not-found and privilege-classified error branches.
import { beforeAll, describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => ({
  sql: vi.fn(),
  rows: [] as unknown[],
  error: null as { message?: string; code?: string } | null,
}));

vi.mock('server-only', () => ({}));
vi.mock('@/lib/db/neon', () => ({ getSql: () => h.sql }));

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
  h.sql.mockImplementation(async () => {
    if (h.error) throw h.error;
    return h.rows;
  });
});

describe('getPatient — one patient, org-scoped, id bound', () => {
  it('selects the record columns and filters org then id as bound parameters', async () => {
    h.error = null;
    h.rows = [];
    await getPatient(ORG, PATIENT_ID);

    const [strings, ...values] = h.sql.mock.calls.at(-1) as [TemplateStringsArray, ...unknown[]];
    const text = strings.join('?');
    expect(text).toContain('created_at');
    expect(text).toContain('updated_at');
    expect(text).toContain('last_activity_at');
    expect(text).toContain('from public.patients');
    expect(text).toContain('org_id =');
    expect(text).toContain('id =');
    expect(text).toContain('limit 1');
    // org scope first, then the id — both bound, never interpolated (T-02-52)
    expect(values).toEqual([ORG, PATIENT_ID]);
    expect(text).not.toContain(PATIENT_ID);
  });

  it('maps the row to a PatientRecord (D-10 fields untouched)', async () => {
    h.rows = [ROW];
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

  it('returns null when the org predicate filters the row away (another org reads nothing)', async () => {
    h.rows = [];
    const record = await getPatient(ORG, PATIENT_ID);
    expect(record).toBeNull();
  });

  it('classifies a permission failure so the caller can render denial (not "connection")', async () => {
    h.rows = [];
    h.error = { message: 'permission denied' };
    await expect(getPatient(ORG, PATIENT_ID)).rejects.toBeInstanceOf(SupabasePermissionError);
    await expect(getPatient(ORG, PATIENT_ID)).rejects.toThrow(
      'getPatient failed: permission denied',
    );
    h.error = null;
  });

  it('keeps a non-privilege failure a plain error', async () => {
    h.rows = [];
    h.error = { message: 'connection reset' };
    await expect(getPatient(ORG, PATIENT_ID)).rejects.toThrow(
      'getPatient failed: connection reset',
    );
    await expect(getPatient(ORG, PATIENT_ID)).rejects.not.toBeInstanceOf(SupabasePermissionError);
    h.error = null;
  });
});
