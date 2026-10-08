// tests/unit/patient-schema.test.ts — the Phase-4 status/capability drift proof.
//
// Three layers, all read from the MIGRATION FILE itself (never restated — the
// same discipline tests/unit/auth-capabilities.test.ts applies to 0001):
//  1. PATIENT_STATUSES is byte-identical to 0005's `status` check constraint
//     (D-09: one vocabulary, two languages).
//  2. DEFAULT_PATIENT_STATUS / labels / D-10 token mapping match the SQL
//     default and the 04-UI-SPEC copy contract (D-10/D-13).
//  3. CAN_MANAGE_PATIENTS' role list is byte-identical to 0005's patients
//     policy role list — the capability map and RLS mirror each other, and the
//     patient role structurally cannot hold it (AUTH-07).
//
// Runs in the Vitest `node` project (fs read + pure predicates, no DOM).
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  CAN_MANAGE_PATIENTS,
  ROLE_CAPABILITIES,
  runsCapability,
} from '@/lib/auth/capabilities';
import {
  DEFAULT_PATIENT_STATUS,
  PATIENT_STATUSES,
  PATIENT_STATUS_LABELS,
  PATIENT_STATUS_TOKEN,
} from '@/lib/patients/status';

const MIGRATION = 'supabase/migrations/0005_patients.sql';
const REPO_ROOT = fileURLToPath(new URL('../..', import.meta.url));
const sql = readFileSync(`${REPO_ROOT}${MIGRATION}`, 'utf8');

// The exact role list 0005's three patients policies use — the RLS half of
// the capability mirror.
const POLICY_ROLE_LIST = "('provider_doctor', 'nurse', 'receptionist', 'admin_owner')";

describe('status vocabulary — byte-identical to migration 0005 (D-09)', () => {
  it('spells exactly the five check-constraint literals', () => {
    expect(PATIENT_STATUSES).toHaveLength(5);
    for (const literal of PATIENT_STATUSES) {
      expect(sql.includes(`'${literal}'`), `'${literal}' in ${MIGRATION}`).toBe(true);
    }
  });

  it('defaults to "new" on both sides (D-13)', () => {
    expect(DEFAULT_PATIENT_STATUS).toBe('new');
    expect(sql.includes("default 'new'"), 'SQL default matches').toBe(true);
  });

  it('carries the exact UI-SPEC labels (sentence case, no exclamation)', () => {
    expect(PATIENT_STATUS_LABELS).toEqual({
      stable: 'Stable',
      follow_up: 'Follow-up',
      needs_review: 'Needs review',
      critical: 'Critical',
      new: 'New',
    });
  });
});

describe('D-10 — the only sanctioned status→token mapping', () => {
  it('maps stable/follow_up/needs_review/critical/new per 04-CONTEXT D-10', () => {
    expect(PATIENT_STATUS_TOKEN).toEqual({
      stable: 'success',
      follow_up: 'warning',
      needs_review: 'info',
      critical: 'critical',
      new: 'info',
    });
  });

  it('uses only the frozen token families — no new tint (INV-04 inventory)', () => {
    const families = new Set(Object.values(PATIENT_STATUS_TOKEN));
    for (const family of families) {
      expect(['success', 'warning', 'info', 'critical']).toContain(family);
    }
  });
});

describe('CAN_MANAGE_PATIENTS — capability/RLS mirror (AUTH-05, D-01)', () => {
  it('0005 patients policies name exactly the four staff roles', () => {
    // Comments may restate the list; only executable policy lines count.
    const sqlCode = sql
      .split('\n')
      .filter((line) => !line.trimStart().startsWith('--'))
      .join('\n');
    // 4 executable occurrences: select(1) + insert-with-check(1) + update
    // USING(1) + update WITH CHECK(1) — the double clause is Pitfall 6/9.
    const occurrences = sqlCode.split(POLICY_ROLE_LIST).length - 1;
    expect(occurrences, 'all three policies carry the list; UPDATE twice').toBe(4);
  });

  it('every staff role holds it; the patient role never can (AUTH-07)', () => {
    for (const role of ['provider_doctor', 'nurse', 'receptionist', 'admin_owner'] as const) {
      expect(runsCapability(role, CAN_MANAGE_PATIENTS)).toBe(true);
    }
    expect(runsCapability('patient', CAN_MANAGE_PATIENTS)).toBe(false);
    expect(Array.from(ROLE_CAPABILITIES.patient)).toEqual(['CAN_SUBMIT_OBSERVATION']);
  });

  it('never grants it to a role the policies do not name (no widening)', () => {
    const holders = (Object.keys(ROLE_CAPABILITIES) as Array<keyof typeof ROLE_CAPABILITIES>)
      .filter((role) => ROLE_CAPABILITIES[role].has(CAN_MANAGE_PATIENTS));
    expect(holders.sort()).toEqual(
      ['admin_owner', 'nurse', 'provider_doctor', 'receptionist'].sort(),
    );
  });
});

describe('0005 structural guardrails (D-07/D-21/D-22)', () => {
  it('MRN + timestamp columns are trigger-owned — the triggers exist', () => {
    expect(sql.includes('assign_patient_mrn')).toBe(true);
    expect(sql.includes('touch_patient_timestamps')).toBe(true);
    expect(sql.includes('pg_advisory_xact_lock'), 'per-org MRN lock').toBe(true);
  });

  it('creates ONLY patients among clinical tables (D-21)', () => {
    const tables = [...sql.matchAll(/create table public\.(\w+)/g)].map((m) => m[1]);
    expect(tables).toEqual(['patients']);
  });

  it('extends the invite with the patient link + auto-connect (D-04)', () => {
    expect(sql.includes('patient_id uuid references public.patients(id)')).toBe(true);
    expect(sql.includes('create or replace function public.redeem_invite')).toBe(true);
    expect(sql.includes("'patientLinked'")).toBe(true);
  });

  it('has no delete grant or delete policy (record immortality)', () => {
    expect(sql.includes('for delete')).toBe(false);
    expect(/grant delete/i.test(sql)).toBe(false);
  });
});
