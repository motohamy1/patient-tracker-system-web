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
  'CAN_MANAGE_PATIENTS',
  'CAN_RETRIEVE_AUDIT',
  'CAN_VIEW_GENETICS',
  'CAN_REVIEW_AI',
  'CAN_MESSAGE',
  'CAN_MANAGE_BILLING',
] as const;

export const CAN_AUTHOR_CLINICAL: Capability = 'CAN_AUTHOR_CLINICAL';
export const CAN_ENTER_VITALS: Capability = 'CAN_ENTER_VITALS';
export const CAN_SCHEDULE: Capability = 'CAN_SCHEDULE';
export const CAN_SUBMIT_OBSERVATION: Capability = 'CAN_SUBMIT_OBSERVATION';
export const CAN_MANAGE_MEMBERSHIP: Capability = 'CAN_MANAGE_MEMBERSHIP';
// Phase 4 (D-01/D-13, PROV-04): create a patient record + change folder
// status. Held by the four staff roles; the patient role can never hold it —
// AUTH-07's structural exclusion is preserved (see the header note).
export const CAN_MANAGE_PATIENTS: Capability = 'CAN_MANAGE_PATIENTS';
export const CAN_RETRIEVE_AUDIT: Capability = 'CAN_RETRIEVE_AUDIT';
// Phase 10 (ALG-02/ALG-03): genetics is a SENSITIVE category. This capability
// mirrors migration 0009's genetics SELECT policy byte-for-byte at the role
// level (provider_doctor + admin_owner): it exists so the UI can show a
// truthful denial instead of an empty list — the data layer remains the
// enforcement, this is its UI mirror (the CAN_RETRIEVE_AUDIT precedent).
export const CAN_VIEW_GENETICS: Capability = 'CAN_VIEW_GENETICS';
// Phase 11 (AI-02): AI output requires human review. This capability mirrors
// migration 0010's ai_insights UPDATE policy byte-for-byte at the role level
// (provider_doctor + nurse): it gates the Accept/Dismiss controls so the UI
// and the data layer can never disagree about who may review. Generation
// itself stays with provider_doctor (CAN_AUTHOR_CLINICAL).
export const CAN_REVIEW_AI: Capability = 'CAN_REVIEW_AI';
// Phase 15 (COMM-01..03): messaging through the unified conversation model.
// Mirrors migration 0014's conversations write policy byte-for-byte at the role
// level (provider_doctor + nurse): it gates the composer and the
// thread-opening controls so the UI and the data layer cannot disagree.
export const CAN_MESSAGE: Capability = 'CAN_MESSAGE';
// Phase 18 (PAY-01/03): billing. Mirrors migration 0017's invoice/payment
// write policies byte-for-byte at the role level (provider_doctor +
// receptionist + admin_owner): billing is front-desk and owner work — the
// nurse never writes a ledger row, and the patient never does either. It
// gates the issue/void/record controls so the UI and the data layer cannot
// disagree; the RLS policies remain the enforcement.
export const CAN_MANAGE_BILLING: Capability = 'CAN_MANAGE_BILLING';

// The D- assignments, once and forever:
//   provider_doctor  -> CAN_AUTHOR_CLINICAL, CAN_ENTER_VITALS, CAN_SCHEDULE,
//                       CAN_MANAGE_MEMBERSHIP, CAN_MANAGE_PATIENTS
//   nurse            -> CAN_ENTER_VITALS, CAN_MANAGE_PATIENTS
//   receptionist     -> CAN_SCHEDULE, CAN_MANAGE_PATIENTS
//   patient          -> CAN_SUBMIT_OBSERVATION                        (D-11)
//   admin_owner      -> CAN_MANAGE_MEMBERSHIP, CAN_RETRIEVE_AUDIT,
//                       CAN_MANAGE_PATIENTS, CAN_VIEW_GENETICS
//   provider_doctor  -> … CAN_VIEW_GENETICS (Phase 10's sensitive-category read)
//
// CAN_MANAGE_PATIENTS (Phase 4): walk-in registration is front-desk work
// (D-01) and every staff role manages the folder workspace; the patient set
// above stays observation-only so AUTH-07's structural claim holds verbatim.
// Migration 0005's patients policies mirror this role list byte-for-byte.
//   - CAN_REVIEW_AI is the UI mirror of 0010's ai_insights UPDATE policy.
//   - CAN_MESSAGE is the UI mirror of 0014's conversations write policy.
//   - CAN_MANAGE_BILLING (Phase 18) is the UI mirror of 0017's invoice and
//     payment write policies: provider_doctor + receptionist + admin_owner.
//     The nurse never holds it and the patient structurally cannot (AUTH-07).
export const ROLE_CAPABILITIES: Record<Role, ReadonlySet<Capability>> = {
  provider_doctor: new Set([CAN_AUTHOR_CLINICAL, CAN_ENTER_VITALS, CAN_SCHEDULE, CAN_MANAGE_MEMBERSHIP, CAN_MANAGE_PATIENTS, CAN_VIEW_GENETICS, CAN_REVIEW_AI, CAN_MESSAGE, CAN_MANAGE_BILLING]),
  nurse: new Set([CAN_ENTER_VITALS, CAN_MANAGE_PATIENTS, CAN_REVIEW_AI, CAN_MESSAGE]),
  receptionist: new Set([CAN_SCHEDULE, CAN_MANAGE_PATIENTS, CAN_MANAGE_BILLING]),
  patient: new Set([CAN_SUBMIT_OBSERVATION]),
  admin_owner: new Set([CAN_MANAGE_MEMBERSHIP, CAN_RETRIEVE_AUDIT, CAN_MANAGE_PATIENTS, CAN_VIEW_GENETICS, CAN_MANAGE_BILLING]),
};

// The ONLY spelling valid in product code (plans 03-04/05): a capability check
// is `runsCapability(role, capability)` or an RLS policy mirroring this map —
// never a re-derived role comparison, never a local set. Pure predicate so the
// whole vocabulary is table-testable without mocks.
export function runsCapability(role: Role, capability: Capability): boolean {
  return ROLE_CAPABILITIES[role].has(capability);
}
