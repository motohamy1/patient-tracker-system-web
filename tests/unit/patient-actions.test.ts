// tests/unit/patient-actions.test.ts — the Phase-4 mutation layer's unit proof
// (PROV-04, D-01, D-04, D-06, D-07, D-13, D-22, AUTH-05).
//
// Static idiom of tests/unit/auth-actions.test.ts: 'use server' actions mocked
// at the Supabase/workspace/next-cache boundaries. The load-bearing assertions:
// the create payload carries ONLY identity columns (never mrn/updated_at/
// last_activity_at — trigger-owned), every mutation is capability-gated, the
// patient-linked invite carries patient_id, and success revalidates /provider.
import { beforeEach, describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => ({
  role: 'provider_doctor' as string,
  inserts: [] as Array<{ table: string; payload: Record<string, unknown> }>,
  updates: [] as Array<Record<string, unknown>>,
  patientRow: null as Record<string, unknown> | null,
}));

vi.mock('server-only', () => ({}));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('@/lib/auth/workspace', () => ({
  resolveWorkspaceRole: async () => ({
    kind: 'signed-in',
    role: h.role,
    orgId: '10000000-0000-0000-0000-000000000001',
  }),
}));
vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    auth: {
      getClaims: async () => ({
        data: { claims: { sub: '00000000-0000-0000-0000-0000000000d1' } },
        error: null,
      }),
    },
    from: (table: string) => {
      if (table === 'invitations') {
        return {
          insert: (payload: Record<string, unknown>) => {
            h.inserts.push({ table, payload });
            return { error: null };
          },
        };
      }
      // public.patients
      return {
        insert: (payload: Record<string, unknown>) => ({
          select: () => ({
            single: async () => {
              h.inserts.push({ table, payload });
              return {
                data: {
                  id: 'patient-1',
                  first_name: payload.first_name,
                  last_name: payload.last_name,
                  mrn: 'MRN-0007',
                  status: 'new',
                },
                error: null,
              };
            },
          }),
        }),
        update: (payload: Record<string, unknown>) => ({
          eq: (_col: string, _id: string) => {
            h.updates.push(payload);
            return {
              select: () => ({
                maybeSingle: async () => ({ data: { id: 'patient-1' }, error: null }),
              }),
            };
          },
        }),
        select: () => ({
          eq: () => ({
            maybeSingle: async () => ({ data: h.patientRow, error: null }),
          }),
        }),
      };
    },
  }),
}));

import { revalidatePath } from 'next/cache';
import {
  changePatientStatusAction,
  createPatientAction,
  sendPatientInviteAction,
} from '@/lib/patients/actions';

const VALID = {
  firstName: 'Amina',
  lastName: 'Farid',
  dob: '1990-05-12',
  sex: 'M',
  phone: '+201000000011',
};

beforeEach(() => {
  h.role = 'provider_doctor';
  h.inserts.length = 0;
  h.updates.length = 0;
  h.patientRow = { id: '40000000-0000-4000-8000-000000000009', org_id: '10000000-0000-0000-0000-000000000001', user_id: null, first_name: 'Un' };
  vi.clearAllMocks();
});

describe('createPatientAction — D-01/D-06/D-07/D-13 (AUTH-05)', () => {
  it('inserts EXACTLY the identity columns — trigger-owned columns never appear', async () => {
    const result = await createPatientAction(VALID);
    expect(result.ok).toBe(true);
    expect(h.inserts).toHaveLength(1);
    const keys = Object.keys(h.inserts[0].payload).sort();
    // D-23 identity subset + org; NO status (SQL default 'new'), NO mrn/mrn_seq,
    // NO created_at/updated_at/last_activity_at/search_text (D-07/D-22).
    expect(keys).toEqual(['dob', 'first_name', 'last_name', 'org_id', 'phone', 'sex']);
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
    expect(h.inserts).toHaveLength(0);
  });

  it('forbids a principal without CAN_MANAGE_PATIENTS (AUTH-05)', async () => {
    h.role = 'patient';
    const result = await createPatientAction(VALID);
    expect(result).toEqual({ ok: false, kind: 'forbidden' });
    expect(h.inserts).toHaveLength(0);
  });
});

describe('changePatientStatusAction — D-13/D-22', () => {
  it('updates ONLY { status } by id — timestamps are trigger-owned', async () => {
    const result = await changePatientStatusAction('40000000-0000-4000-8000-000000000001', 'critical');
    expect(result.ok).toBe(true);
    expect(h.updates).toEqual([{ status: 'critical' }]);
    expect(revalidatePath).toHaveBeenCalledWith('/provider');
  });

  it('rejects an unknown status against the D-09 vocabulary', async () => {
    const result = await changePatientStatusAction('40000000-0000-4000-8000-000000000001', 'meltdown' as never);
    expect(result).toEqual({ ok: false, kind: 'invalid' });
    expect(h.updates).toHaveLength(0);
  });

  it('forbids the patient role', async () => {
    h.role = 'patient';
    const result = await changePatientStatusAction('40000000-0000-4000-8000-000000000001', 'stable');
    expect(result).toEqual({ ok: false, kind: 'forbidden' });
  });
});

describe('sendPatientInviteAction — D-04/D-15 (invite stays membership-gated)', () => {
  it('creates a role=patient invitation WITH the patient link', async () => {
    const result = await sendPatientInviteAction('40000000-0000-4000-8000-000000000009');
    expect(result.ok).toBe(true);
    expect(h.inserts).toHaveLength(1);
    const invite = h.inserts[0];
    expect(invite.table).toBe('invitations');
    expect(invite.payload.role).toBe('patient');
    expect(invite.payload.patient_id).toBe('40000000-0000-4000-8000-000000000009'); // D-04 auto-connect
    expect(invite.payload.created_by).toBe('00000000-0000-0000-0000-0000000000d1'); // claims sub, never getSession
    expect(invite.payload.token_digest).toMatch(/^[0-9a-f]{64}$/);
    expect(result.ok && result.link?.startsWith('/invite/')).toBe(true);
    expect(result.ok && typeof result.shortCode).toBe('string');
    expect(revalidatePath).toHaveBeenCalledWith('/provider'); // D-22 bump re-render
  });

  it('refuses an already-linked patient (D-15: unlinked only)', async () => {
    h.patientRow = { id: '40000000-0000-4000-8000-000000000009', org_id: '10000000-0000-0000-0000-000000000001', user_id: 'u-linked', first_name: 'Li' };
    const result = await sendPatientInviteAction('40000000-0000-4000-8000-000000000009');
    expect(result).toEqual({ ok: false, kind: 'error' });
    expect(h.inserts).toHaveLength(0);
  });

  it('forbids roles without CAN_MANAGE_MEMBERSHIP — nurse gets nothing (Open Q4)', async () => {
    h.role = 'nurse';
    const result = await sendPatientInviteAction('40000000-0000-4000-8000-000000000009');
    expect(result).toEqual({ ok: false, kind: 'forbidden' });
    expect(h.inserts).toHaveLength(0);
  });

  it('rejects a malformed patient id before touching anything', async () => {
    const result = await sendPatientInviteAction('not-a-uuid');
    expect(result).toEqual({ ok: false, kind: 'invalid' });
    expect(h.inserts).toHaveLength(0);
  });
});
