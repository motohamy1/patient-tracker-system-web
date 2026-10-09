// src/lib/imaging/status.ts — imaging vocabularies (LAB-02; 0008 mirror).
export type ImagingOrderStatus = 'ordered' | 'resulted' | 'cancelled';

export const IMAGING_ORDER_STATUSES = [
  'ordered',
  'resulted',
  'cancelled',
] as const satisfies readonly ImagingOrderStatus[];

export const IMAGING_ORDER_STATUS_LABELS: Record<ImagingOrderStatus, string> = {
  ordered: 'Ordered',
  resulted: 'Resulted',
  cancelled: 'Cancelled',
};

export const IMAGING_ORDER_STATUS_TOKEN: Record<ImagingOrderStatus, 'info' | 'warning' | 'neutral'> = {
  ordered: 'info',
  resulted: 'warning',
  cancelled: 'neutral',
};

/** Common modalities — a suggestion list, not a constraint: the DB keeps the
 *  column free text so an unusual modality is never blocked. */
export const IMAGING_MODALITY_SUGGESTIONS = [
  'X-ray',
  'CT',
  'MRI',
  'Ultrasound',
  'Mammography',
  'PET',
] as const;

export type ImagingSource = 'clinician' | 'ai-extracted' | 'imported';

export const IMAGING_SOURCE_LABELS: Record<ImagingSource, string> = {
  clinician: 'Clinician-authored',
  'ai-extracted': 'AI-extracted, awaiting review',
  imported: 'Imported',
};
