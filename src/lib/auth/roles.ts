// src/lib/auth/roles.ts — the D-09 canonical role vocabulary (AUTH-07).
//
// The `Role` union is the BYTE-IDENTICAL TypeScript mirror of migration
// 0001_org_membership.sql's Postgres check constraint
// ('provider_doctor', 'nurse', 'receptionist', 'patient', 'admin_owner').
// D-09: there is exactly one canonical vocabulary for roles; 03-02 landed the
// Postgres half of it and this file is the TS half. Spelling a new role string
// anywhere else — or editing one side without the other — is a vocabulary
// drift; the ROLES array is derived FROM the union so the two sides fail
// typecheck together, and tests/unit/auth-capabilities.test.ts diffs these
// literals against the migration file itself.
//
// This module makes no authorization decision: the role -> capability mapping
// lives in src/lib/auth/capabilities.ts (the same D-09 canonical map), RLS
// enforcement lives in migration 0002 (supabase), and the per-request
// resolution of which role applies lives in src/lib/auth/workspace.ts.

export type Role = 'provider_doctor' | 'nurse' | 'receptionist' | 'patient' | 'admin_owner';

// Derived from the union itself: adding or renaming a Role variant updates this
// array automatically, while removing one without updating consumers here keeps
// `satisfies` honest — the constraint drift is caught at typecheck, not runtime.
export const ROLES = [
  'provider_doctor',
  'nurse',
  'receptionist',
  'patient',
  'admin_owner',
] as const satisfies readonly Role[];

export type MembershipRow = {
  orgId: string;
  role: Role;
};
