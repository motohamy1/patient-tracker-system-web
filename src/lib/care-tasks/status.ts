// src/lib/care-tasks/status.ts — care-task vocabularies (Phase 14; 0013 mirror).
export type CareTaskKind = 'measurement' | 'medication' | 'appointment' | 'follow-up' | 'other';

export const CARE_TASK_KINDS = [
  'measurement',
  'medication',
  'appointment',
  'follow-up',
  'other',
] as const satisfies readonly CareTaskKind[];

export const CARE_TASK_KIND_LABELS: Record<CareTaskKind, string> = {
  measurement: 'Measurement',
  medication: 'Medication',
  appointment: 'Appointment',
  'follow-up': 'Follow-up',
  other: 'Other',
};

export type CareTaskStatus = 'active' | 'archived';

export const CARE_TASK_STATUSES = ['active', 'archived'] as const satisfies readonly CareTaskStatus[];

export const CARE_TASK_STATUS_LABELS: Record<CareTaskStatus, string> = {
  active: 'Active',
  archived: 'Archived',
};

/** The completion's actor vocabulary (0013's check constraint mirror). */
export type CompletionSource = 'patient' | 'staff' | 'ai-extracted' | 'imported';

export const COMPLETION_SOURCE_LABELS: Record<CompletionSource, string> = {
  patient: 'Logged by the patient',
  staff: 'Logged by staff',
  'ai-extracted': 'AI-extracted',
  imported: 'Imported',
};
