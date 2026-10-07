// src/lib/auth/capabilities.ts — the D-09 canonical capability map (AUTH-05/07).
//
// This is the SINGLE place a capability is defined and the single canonical
// role -> capability assignment. Server actions (plans 03-04/05) call
// `runsCapability()` in this file; migration 0002's RLS policies mirror this
// vocabulary in Postgres (identified at the role level):
//
//   - CAN_RETRIEVE_AUDIT is admin_owner's EXCLUSIVE capability (D-15): it must
//     stay byte-identical at the role level to migration 0003's admin_owner-only
//     audit_log select policy. provider_doctor never holds it.
//   - provider_doctor holds CAN_MANAGE_MEMBERSHIP for the membership surface,
//     which matches the Revision-r2 memberships SELECT policy
//     (own row OR (select private.user_org_role(org_id)) IN ('admin_owner',
//     'provider_doctor')) landed in 03-02 — audit retrieval is unaffected.
//   - patient's set contains ONLY CAN_SUBMIT_OBSERVATION (D-11): the type
//     system structurally cannot express clinical authoring for a patient
//     (AUTH-07) — there is no capability value a patient row could be granted
//     that authorizes clinically meaningful writes.
//
// Pure constants, no I/O, no env reads: exhaustive unit testing is cheap and
// the map is the contract (03-PATTERNS.md gate-module rules 1).

import type { Role } from '@/lib/auth/roles';

export type Capability = (typeof CAN_CERTIFIED)[number];

// `CAN_CERTIFIED` is the closed list; the exported constants below are the
// public spelling D-09 names. Keeping them as a tuple typed first means a new
// constant is added in exactly one place and `Capability` grows with it.
const CAN_CERTIFIED = [
  'CAN_AUTHOR_CLINICAL',
  'CAN_ENTER_VITALS',
  'CAN_SCHEDULE',
  'CAN_SUBMIT_OBSERVATION',
  'CAN_MANAGE_MEMBERSHIP',
  'CAN_RETRIEVE_AUDIT',
] as const;

export const CAN_AUTHOR_CLINICAL: Capability = 'CAN_AUTHOR_CLINICAL';
export const CAN_ENTER_VITALS: Capability = 'CAN_ENTER_VITALS';
export const CAN_SCHEDULE: Capability = 'CAN_SCHEDULE';
export const CAN_SUBMIT_OBSERVATION: Capability = 'CAN_SUBMIT_OBSERVATION';
export const CAN_MANAGE_MEMBERSHIP: Capability = 'CAN_MANAGE_MEMBERSHIP';
export const CAN_RETRIEVE_AUDIT: Capability = 'CAN_RETRIEVE_AUDIT';

// The D- assignments, once and forever:
//   provider_doctor  -> CAN_AUTHOR_CLINICAL, CAN_ENTER_VITALS, CAN_SCHEDULE,
//                       CAN_MANAGE_MEMBERSHIP
//   nurse            -> CAN_ENTER_VITALS
//   receptionist     -> CAN_SCHEDULE
//   patient          -> CAN_SUBMIT_OBSERVATION                        (D-11)
//   admin_owner      -> CAN_MANAGE_MEMBERSHIP, CAN_RETRIEVE_AUDIT    (D-15)
export const ROLE_CAPABILITIES: Record<Role, ReadonlySet<Capability>> = {
  provider_doctor: new Set([CAN_AUTHOR_CLINICAL, CAN_ENTER_VITALS, CAN_SCHEDULE, CAN_MANAGE_MEMBERSHIP]),
  nurse: new Set([CAN_ENTER_VITALS]),
  receptionist: new Set([CAN_SCHEDULE]),
  patient: new Set([CAN_SUBMIT_OBSERVATION]),
  admin_owner: new Set([CAN_MANAGE_MEMBERSHIP, CAN_RETRIEVE_AUDIT]),
};

// The ONLY spelling valid in product code (plans 03-04/05): a capability check
// is `runsCapability(role, capability)` or an RLS policy mirroring this map —
// never a re-derived role comparison, never a local set. Pure predicate so the
// whole vocabulary is table-testable without mocks.
export function runsCapability(role: Role, capability: Capability): boolean {
  return ROLE_CAPABILITIES[role].has(capability);
}
