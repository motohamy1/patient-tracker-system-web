// tests/unit/patient-actions.test.ts — the Phase-4 mutation layer's unit proof
// (PROV-04, D-01, D-04, D-06, D-07, D-13, D-22, AUTH-05).
//
// Static idiom of tests/unit/auth-actions.test.ts: 'use server' actions mocked
// at the Neon/workspace/next-cache boundaries. `getSql()` and the `withAppUser`
// transaction client are tagged/parameterized spies, so the SQL text and bound
// parameters are asserted directly. The load-bearing assertions: the create
// statement carries ONLY identity columns (never mrn/updated_at/
// last_activity_at — trigger-owned), every mutation is capability-gated, the
// patient-linked invite carries patient_id, and success revalidates /provider.
import { beforeEach, describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => ({
  role: 'provider_doctor' as string,
  org: '10000000-0000-0000-0000-000000000001',
  uid: '00000000-0000-0000-0000-0000000000d1',
  sql: vi.fn(),
  query: vi.fn(),
  getSessionUser: vi.fn(),
  patientRow: null as Record<string, unknown> | null,
}));

vi.mock('server-only', () => ({}));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('@/lib/auth/workspace', () => ({
  resolveWorkspaceRole: async () => ({
    kind: 'signed-in',
    role: h.role,
    orgId: h.org,
  }),
}));
vi.mock('@/lib/auth/session', () => ({ getSessionUser: h.getSessionUser }));
vi.mock('@/lib/db/neon', () => ({ getSql: () => h.sql }));
vi.mock('@/lib/db/client', () => ({
  withAppUser: (_userId: string | null, fn: (tx: { query: unknown }) => unknown) =>
    fn({ query: h.query }),
}));

import { revalidatePath } from 'next/cache';
import {
  changePatientStatusAction,
  createPatientAction,
  sendPatientInviteAction,
} from '@/lib/patients/actions';

const PATIENT_ID = '40000000-0000-4000-8000-000000000009';

const VALID = {
  firstName: 'Amina',
  lastName: 'Farid',
  dob: '1990-05-12',
  sex: 'M',
  phone: '+201000000011',
};

/** The insert column list, normalized out of the recorded SQL text. */
function insertColumns(text: string, table: string): string[] {
  const match = text.match(new RegExp(`insert into public\\.${table}\\s*\\(([^)]+)\\)`, 's'));
  return (match?.[1] ?? '').split(',').map((column) => column.trim());
}

function queryCall(fragment: string): [string, unknown[]] {
  const call = h.query.mock.calls.find(([text]) => String(text).includes(fragment));
  return call as unknown as [string, unknown[]];
}

beforeEach(() => {
  h.role = 'provider_doctor';
  h.patientRow = { id: PATIENT_ID, org_id: h.org, user_id: null, first_name: 'Un' };
  vi.clearAllMocks();
  h.getSessionUser.mockResolvedValue({ id: h.uid, email: 'doc@example.com' });
  h.sql.mockReset().mockImplementation(async () => (h.patientRow ? [h.patientRow] : []));
  h.query.mockReset().mockImplementation(async (text: string) => {
    if (text.includes('insert into public.patients')) {
      return {
        rows: [
          {
            id: 'patient-1',
            first_name: 'Amina',
            last_name: 'Farid',
            mrn: 'MRN-0007',
            status: 'new',
          },
        ],
      };
    }
    if (text.includes('update public.patients')) return { rows: [{ id: 'patient-1' }] };
    return { rows: [] };
  });
});

describe('createPatientAction — D-01/D-06/D-07/D-13 (AUTH-05)', () => {
  it('inserts EXACTLY the identity columns — trigger-owned columns never appear', async () => {
    const result = await createPatientAction(VALID);
    expect(result.ok).toBe(true);
    expect(h.query).toHaveBeenCalledTimes(1);
    const [text, params] = h.query.mock.calls[0] as [string, unknown[]];
    // D-23 identity subset + org; NO status (SQL default 'new'), NO mrn/mrn_seq,
    // NO created_at/updated_at/last_activity_at/search_text (D-07/D-22).
    expect(insertColumns(text, 'patients')).toEqual([
      'org_id',
      'first_name',
      'last_name',
      'dob',
      'sex',
      'phone',
    ]);
    expect(params).toEqual([h.org, 'Amina', 'Farid', '1990-05-12', 'M', '+201000000011']);
    expect(revalidatePath).toHaveBeenCalledWith('/provider'); // D-06: no navigation
  });

  it('returns the auto-assigned MRN back to the caller (D-07)', async () => {
    const result = await createPatientAction(VALID);
    expect(result.ok && result.patient?.mrn).toBe('MRN-0007');
    expect(result.ok && result.patient?.status).toBe('new');
  });

  it('rejects invalid input BEFORE any database call (Zod first)', async () => {
    const bad = { ...VALID, firstName: '  ', dob: '2099-01-01' };
    const result = await createPatientAction(bad);
    expect(result).toEqual({ ok: false, kind: 'invalid' });
    expect(h.query).not.toHaveBeenCalled();
    expect(h.sql).not.toHaveBeenCalled();
  });

  it('forbids a principal without CAN_MANAGE_PATIENTS (AUTH-05)', async () => {
    h.role = 'patient';
    const result = await createPatientAction(VALID);
    expect(result).toEqual({ ok: false, kind: 'forbidden' });
    expect(h.query).not.toHaveBeenCalled();
  });
});

describe('changePatientStatusAction — D-13/D-22', () => {
  it('updates ONLY { status } by id — timestamps are trigger-owned', async () => {
    const result = await changePatientStatusAction(
      '40000000-0000-4000-8000-000000000001',
      'critical',
    );
    expect(result.ok).toBe(true);
    const [text, params] = h.query.mock.calls[0] as [string, unknown[]];
    const setClause = text.match(/update public\.patients set ([\s\S]+?) where/)?.[1] ?? '';
    expect(setClause.trim()).toBe('status = $1');
    expect(text).not.toContain('updated_at');
    expect(text).not.toContain('last_activity_at');
    expect(params).toEqual(['critical', '40000000-0000-4000-8000-000000000001', h.org]);
    expect(revalidatePath).toHaveBeenCalledWith('/provider');
  });

  it('rejects an unknown status against the D-09 vocabulary', async () => {
    const result = await changePatientStatusAction(
      '40000000-0000-4000-8000-000000000001',
      'meltdown' as never,
    );
    expect(result).toEqual({ ok: false, kind: 'invalid' });
    expect(h.query).not.toHaveBeenCalled();
  });

  it('forbids the patient role', async () => {
    h.role = 'patient';
    const result = await changePatientStatusAction(
      '40000000-0000-4000-8000-000000000001',
      'stable',
    );
    expect(result).toEqual({ ok: false, kind: 'forbidden' });
  });
});

describe('sendPatientInviteAction — D-04/D-15 (invite stays membership-gated)', () => {
  it('creates a role=patient invitation WITH the patient link', async () => {
    const result = await sendPatientInviteAction(PATIENT_ID);
    expect(result.ok).toBe(true);

    const [text, params] = queryCall('insert into public.invitations');
    expect(text).toContain('patient_id');
    expect(insertColumns(text, 'invitations')).toContain('patient_id');
    // D-04 auto-connect, role=patient, created_by from the session (never the payload)
    expect(params[1]).toBe('patient');
    expect(params[4]).toBe(h.uid);
    expect(params[5]).toBe(PATIENT_ID);
    expect(String(params[2])).toMatch(/^[0-9a-f]{64}$/);
    expect(result.ok && result.link?.startsWith('/invite/')).toBe(true);
    expect(result.ok && typeof result.shortCode).toBe('string');
    expect(revalidatePath).toHaveBeenCalledWith('/provider'); // D-22 bump re-render
  });

  it('refuses an already-linked patient (D-15: unlinked only)', async () => {
    h.patientRow = { id: PATIENT_ID, org_id: h.org, user_id: 'u-linked', first_name: 'Li' };
    const result = await sendPatientInviteAction(PATIENT_ID);
    expect(result).toEqual({ ok: false, kind: 'error' });
    expect(h.query).not.toHaveBeenCalled();
  });

  it('forbids roles without CAN_MANAGE_MEMBERSHIP — nurse gets nothing (Open Q4)', async () => {
    h.role = 'nurse';
    const result = await sendPatientInviteAction(PATIENT_ID);
    expect(result).toEqual({ ok: false, kind: 'forbidden' });
    expect(h.query).not.toHaveBeenCalled();
  });

  it('rejects a malformed patient id before touching anything', async () => {
    const result = await sendPatientInviteAction('not-a-uuid');
    expect(result).toEqual({ ok: false, kind: 'invalid' });
    expect(h.query).not.toHaveBeenCalled();
  });
});
