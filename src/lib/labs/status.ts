// src/lib/labs/status.ts — lab vocabularies (LAB-01; migration 0008 mirror).
export type LabOrderStatus = 'ordered' | 'resulted' | 'cancelled';

export const LAB_ORDER_STATUSES = [
  'ordered',
  'resulted',
  'cancelled',
] as const satisfies readonly LabOrderStatus[];

export const LAB_ORDER_STATUS_LABELS: Record<LabOrderStatus, string> = {
  ordered: 'Ordered',
  resulted: 'Resulted',
  cancelled: 'Cancelled',
};

/** Closed D-04 tint family (info/warning/neutral). */
export const LAB_ORDER_STATUS_TOKEN: Record<LabOrderStatus, 'info' | 'warning' | 'neutral'> = {
  ordered: 'info',
  resulted: 'warning',
  cancelled: 'neutral',
};

/** A result's abnormal flag — success/critical families only, never colour-only. */
export type LabFlag = 'normal' | 'low' | 'high' | 'critical';

export const LAB_FLAGS = ['normal', 'low', 'high', 'critical'] as const satisfies readonly LabFlag[];

export const LAB_FLAG_LABELS: Record<LabFlag, string> = {
  normal: 'Normal',
  low: 'Low',
  high: 'High',
  critical: 'Critical',
};

export const LAB_FLAG_TOKEN: Record<LabFlag, 'success' | 'warning' | 'critical' | 'neutral'> = {
  normal: 'success',
  low: 'warning',
  high: 'warning',
  critical: 'critical',
};

export type LabSource = 'clinician' | 'ai-extracted' | 'imported';

export const LAB_SOURCE_LABELS: Record<LabSource, string> = {
  clinician: 'Clinician-authored',
  'ai-extracted': 'AI-extracted, awaiting review',
  imported: 'Imported',
};
