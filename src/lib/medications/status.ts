// src/lib/medications/status.ts — the medication vocabularies (MED-01/MED-03).
//
// Byte-identical TypeScript mirrors of migration 0007's check constraints
// (status / frequency / route), following the patients/status.ts discipline:
// the arrays derive FROM the unions so the SQL and this file fail typecheck
// together if either edits alone.
//
// CDSS-READINESS WITHOUT DECISIONS (§27/MED-03): these are STRUCTURED
// vocabularies (a queryable frequency, a queryable route, a numeric dose), the
// substrate a future interaction checker needs. No interaction logic, no
// contraindication rule and no dosing decision lives here or anywhere else.
export type MedicationStatus = 'active' | 'paused' | 'stopped';

export const MEDICATION_STATUSES = [
  'active',
  'paused',
  'stopped',
] as const satisfies readonly MedicationStatus[];

export const DEFAULT_MEDICATION_STATUS: MedicationStatus = 'active';

export const MEDICATION_STATUS_LABELS: Record<MedicationStatus, string> = {
  active: 'Active',
  paused: 'Paused',
  stopped: 'Stopped',
};

/** The sanctioned tint per status — closed D-04 family (success/warning/neutral). */
export const MEDICATION_STATUS_TOKEN: Record<MedicationStatus, 'success' | 'warning' | 'neutral'> = {
  active: 'success',
  paused: 'warning',
  stopped: 'neutral',
};

export type MedicationFrequency =
  | 'once_daily'
  | 'twice_daily'
  | 'three_times_daily'
  | 'four_times_daily'
  | 'weekly'
  | 'as_needed';

export const MEDICATION_FREQUENCIES = [
  'once_daily',
  'twice_daily',
  'three_times_daily',
  'four_times_daily',
  'weekly',
  'as_needed',
] as const satisfies readonly MedicationFrequency[];

export const MEDICATION_FREQUENCY_LABELS: Record<MedicationFrequency, string> = {
  once_daily: 'Once daily',
  twice_daily: 'Twice daily',
  three_times_daily: 'Three times daily',
  four_times_daily: 'Four times daily',
  weekly: 'Weekly',
  as_needed: 'As needed',
};

export type MedicationRoute =
  | 'oral'
  | 'topical'
  | 'inhaled'
  | 'injection'
  | 'sublingual'
  | 'rectal'
  | 'ophthalmic'
  | 'otic'
  | 'nasal'
  | 'other';

export const MEDICATION_ROUTES = [
  'oral',
  'topical',
  'inhaled',
  'injection',
  'sublingual',
  'rectal',
  'ophthalmic',
  'otic',
  'nasal',
  'other',
] as const satisfies readonly MedicationRoute[];

export const MEDICATION_ROUTE_LABELS: Record<MedicationRoute, string> = {
  oral: 'Oral',
  topical: 'Topical',
  inhaled: 'Inhaled',
  injection: 'Injection',
  sublingual: 'Sublingual',
  rectal: 'Rectal',
  ophthalmic: 'Ophthalmic',
  otic: 'Otic',
  nasal: 'Nasal',
  other: 'Other',
};

/** The lifecycle history vocabulary (mirrors 0007's medication_events check). */
export type MedicationEventKind = 'started' | 'changed' | 'paused' | 'resumed' | 'stopped';

export const MEDICATION_EVENT_LABELS: Record<MedicationEventKind, string> = {
  started: 'Medication started',
  changed: 'Medication changed',
  paused: 'Medication paused',
  resumed: 'Medication resumed',
  stopped: 'Medication stopped',
};

export type MedicationSource = 'clinician' | 'ai-extracted' | 'imported';

export const MEDICATION_SOURCE_LABELS: Record<MedicationSource, string> = {
  clinician: 'Clinician-authored',
  'ai-extracted': 'AI-extracted, awaiting review',
  imported: 'Imported',
};

/**
 * The legal status transitions (MED-01). A resume returns to `active`; a
 * stopped medication is historical and has no successor. The server action
 * consults this ONE table; the UI disables what it forbids.
 */
export const MEDICATION_STATUS_TRANSITIONS: Record<MedicationStatus, readonly MedicationStatus[]> = {
  active: ['paused', 'stopped'],
  paused: ['active', 'stopped'],
  stopped: [],
};

export function canTransition(from: MedicationStatus, to: MedicationStatus): boolean {
  return MEDICATION_STATUS_TRANSITIONS[from].includes(to);
}
