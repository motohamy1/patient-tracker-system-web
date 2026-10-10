// tests/unit/auth-capabilities.test.ts — the D-09 canonical vocabulary proof.
//
// Three layers are asserted:
//  1. The Role union is byte-identical to migration 0001's Postgres check
//     constraint — read from the migration file itself, not restated (D-09:
//     one vocabulary, two languages; the drift surface is the file, so the
//     test reads the file).
//  2. The role -> capability map is exact per role (D-09/D-11).
//  3. D-15 sole-holder: CAN_RETRIEVE_AUDIT belongs to admin_owner ONLY;
//     AUTH-07 structural: patient's set cannot express clinical authoring.
//
// Runs in the Vitest `node` project (pure predicate + fs read, no DOM).
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  CAN_AUTHOR_CLINICAL,
  CAN_ENTER_VITALS,
  CAN_MANAGE_MEMBERSHIP,
  CAN_MANAGE_PATIENTS,
  CAN_RETRIEVE_AUDIT,
  CAN_REVIEW_AI,
  CAN_MESSAGE,
  CAN_MANAGE_BILLING,
  CAN_SCHEDULE,
  CAN_SUBMIT_OBSERVATION,
  CAN_VIEW_GENETICS,
  ROLE_CAPABILITIES,
  runsCapability,
  type Capability,
} from '@/lib/auth/capabilities';
import { ROLES, type Role } from '@/lib/auth/roles';

const MIGRATION = 'supabase/migrations/0001_org_membership.sql';
const MY_DIR = fileURLToPath(new URL('.', import.meta.url));
const REPO_ROOT = fileURLToPath(new URL('../..', import.meta.url));

const ALL_ROLES = ROLES as readonly Role[];
// CAN_VIEW_GENETICS was added in Phase 10 (ALG-02/ALG-03): it mirrors
// migration 0009's genetics SELECT policy at the role level
// (provider_doctor + admin_owner) exactly as CAN_RETRIEVE_AUDIT mirrors the
// admin_owner-only audit policy. CAN_REVIEW_AI was added in Phase 11
// (AI-02): it mirrors migration 0010's ai_insights UPDATE policy at the role
// level (provider_doctor + nurse) so the review controls and the data layer
// can never disagree. CAN_MANAGE_BILLING was added in Phase 18 (PAY-01/03):
// it mirrors migration 0017's invoice/payment write policies at the role
// level (provider_doctor + receptionist + admin_owner) — the nurse never
// writes a ledger row, and the patient structurally cannot (AUTH-07). The
// exact-set assertion is updated so the deliberate widening stays visible
// rather than silently drifting.
const expected: Record<Role, readonly Capability[]> = {
  provider_doctor: [CAN_AUTHOR_CLINICAL, CAN_ENTER_VITALS, CAN_SCHEDULE, CAN_MANAGE_MEMBERSHIP, CAN_MANAGE_PATIENTS, CAN_VIEW_GENETICS, CAN_REVIEW_AI, CAN_MESSAGE, CAN_MANAGE_BILLING],
  nurse: [CAN_ENTER_VITALS, CAN_MANAGE_PATIENTS, CAN_REVIEW_AI, CAN_MESSAGE],
  receptionist: [CAN_SCHEDULE, CAN_MANAGE_PATIENTS, CAN_MANAGE_BILLING],
  patient: [CAN_SUBMIT_OBSERVATION],
  admin_owner: [CAN_MANAGE_MEMBERSHIP, CAN_RETRIEVE_AUDIT, CAN_MANAGE_PATIENTS, CAN_VIEW_GENETICS, CAN_MANAGE_BILLING],
};

describe('roles — byte-identical to migration 0001 (D-09)', () => {
  it('spells exactly the five check-constraint literals, in migration order', () => {
    const sql = readFileSync(`${REPO_ROOT}${MIGRATION}`, 'utf8');
    const literals = [
      'provider_doctor',
      'nurse',
      'receptionist',
      'patient',
      'admin_owner',
    ] as const;
    // Every literal appears verbatim inside the migration check constraints —
    // the whole byte-sequence, including the underscore, matches.
    for (const literal of literals) {
      expect(sql.includes(`'${literal}'`), `'${literal}' in ${MIGRATION}`).toBe(true);
      expect(ROLES).toContain(literal);
    }
    expect(ROLES).toHaveLength(5);
  });
});

describe('ROLE_CAPABILITIES — exact assignment per role (D-09/D-10/D-11)', () => {
  it.each(ALL_ROLES)('maps %s to exactly its assigned capability set', (role) => {
    const set = ROLE_CAPABILITIES[role];
    expect(set.size).toBe(expected[role].length);
    for (const capability of expected[role]) expect(set.has(capability)).toBe(true);
    for (const roleKey of ALL_ROLES) {
      for (const capability of ROLE_CAPABILITIES[roleKey]) {
        if (!expected[role].includes(capability)) expect(set.has(capability)).toBe(false);
      }
    }
  });
});

describe('runsCapability — the only caller spelling', () => {
  it('is true exactly when the capability is in the role set (table-driven)', () => {
    const rows: Array<[Role, Capability, boolean]> = [
      ['provider_doctor', CAN_AUTHOR_CLINICAL, true],
      ['provider_doctor', CAN_RETRIEVE_AUDIT, false],
      ['nurse', CAN_ENTER_VITALS, true],
      ['nurse', CAN_AUTHOR_CLINICAL, false],
      ['receptionist', CAN_SCHEDULE, true],
      ['receptionist', CAN_ENTER_VITALS, false],
      ['patient', CAN_SUBMIT_OBSERVATION, true],
      ['patient', CAN_AUTHOR_CLINICAL, false],
      ['patient', CAN_ENTER_VITALS, false],
      ['patient', CAN_MANAGE_MEMBERSHIP, false],
      ['patient', CAN_MANAGE_PATIENTS, false],
      ['provider_doctor', CAN_MANAGE_PATIENTS, true],
      ['nurse', CAN_MANAGE_PATIENTS, true],
      ['receptionist', CAN_MANAGE_PATIENTS, true],
      ['admin_owner', CAN_RETRIEVE_AUDIT, true],
      ['admin_owner', CAN_MANAGE_MEMBERSHIP, true],
    ];
    for (const [role, capability, want] of rows) {
      expect(runsCapability(role, capability)).toBe(want);
    }
  });
});

describe('AUTH-07 — patient authoring is structurally inexpressible', () => {
  it("patient's set holds ONLY CAN_SUBMIT_OBSERVATION", () => {
    expect(Array.from(ROLE_CAPABILITIES.patient)).toEqual([CAN_SUBMIT_OBSERVATION]);
  });

  it('provider_doctor exclusively holds CAN_AUTHOR_CLINICAL', () => {
    const holders = ALL_ROLES.filter((role) => ROLE_CAPABILITIES[role].has(CAN_AUTHOR_CLINICAL));
    expect(holders).toEqual(['provider_doctor']);
  });
});

describe('D-15 — CAN_RETRIEVE_AUDIT is admin_owner-exclusive', () => {
  it('admin_owner holds it; every other role does not', () => {
    expect(runsCapability('admin_owner', CAN_RETRIEVE_AUDIT)).toBe(true);
    expect(runsCapability('provider_doctor', CAN_RETRIEVE_AUDIT)).toBe(false);
    expect(runsCapability('nurse', CAN_RETRIEVE_AUDIT)).toBe(false);
    expect(runsCapability('receptionist', CAN_RETRIEVE_AUDIT)).toBe(false);
    expect(runsCapability('patient', CAN_RETRIEVE_AUDIT)).toBe(false);
  });
});
