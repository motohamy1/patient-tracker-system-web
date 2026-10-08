// src/lib/patients/status.ts — the D-09/D-10 patient-status vocabulary (PROV-03).
//
// Byte-identical TypeScript mirror of migration 0005_patients.sql's `status`
// check constraint, following src/lib/auth/roles.ts' discipline: the array is
// derived FROM the union so both sides fail typecheck together; tests/unit/
// patient-schema.test.ts diffs these literals against the migration file, so
// editing one side without the other is caught at test time, never at runtime.
//
// D-13: new patients default to `new`. D-10: the status -> token mapping lives
// here ONCE (04-UI-SPEC §Color) — stable→success, follow_up→warning,
// needs_review→info, critical→critical, new→info — and every surface consumes
// PATIENT_STATUS_TOKEN rather than re-deriving a mapping. No component may
// invent a sixth status or a fourth token family.

export type PatientStatus = 'stable' | 'follow_up' | 'needs_review' | 'critical' | 'new';

export const PATIENT_STATUSES = [
  'stable',
  'follow_up',
  'needs_review',
  'critical',
  'new',
] as const satisfies readonly PatientStatus[];

// D-13: the SQL default mirrors this value; the drift test asserts both.
export const DEFAULT_PATIENT_STATUS: PatientStatus = 'new';

// 04-UI-SPEC §Copywriting — sentence case, exact strings.
export const PATIENT_STATUS_LABELS: Record<PatientStatus, string> = {
  stable: 'Stable',
  follow_up: 'Follow-up',
  needs_review: 'Needs review',
  critical: 'Critical',
  new: 'New',
};

// D-10 — the ONLY sanctioned status→token mapping. Consumed by FolderCard's
// status line and the Pill tone; never re-derived at a call site.
export const PATIENT_STATUS_TOKEN: Record<PatientStatus, 'success' | 'warning' | 'info' | 'critical'> = {
  stable: 'success',
  follow_up: 'warning',
  needs_review: 'info',
  critical: 'critical',
  new: 'info',
};
