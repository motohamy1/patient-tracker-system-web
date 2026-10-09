// src/lib/ocr/status.ts — prescription extraction vocabularies (Phase 12;
// 0011 mirror).
//
// The extraction payload vocabulary is the contract between ANY provider and
// the verification surface: a closed set of field keys, each carrying a value,
// a confidence, and candidate matches. A provider can add providers; it can
// never add field keys without a migration (the same drift discipline every
// clinical vocabulary follows).
export type ExtractionStatus = 'awaiting_extraction' | 'extracted' | 'verified' | 'rejected';

export const EXTRACTION_STATUSES = [
  'awaiting_extraction',
  'extracted',
  'verified',
  'rejected',
] as const satisfies readonly ExtractionStatus[];

export const EXTRACTION_STATUS_LABELS: Record<ExtractionStatus, string> = {
  awaiting_extraction: 'Awaiting extraction',
  extracted: 'Extracted — awaiting verification',
  verified: 'Verified and recorded',
  rejected: 'Rejected',
};

/** Closed tint family for the status pill (D-04). */
export const EXTRACTION_STATUS_TOKEN: Record<
  ExtractionStatus,
  'neutral' | 'info' | 'success' | 'critical'
> = {
  awaiting_extraction: 'neutral',
  extracted: 'info',
  verified: 'success',
  rejected: 'critical',
};

/**
 * The prescription field keys (§11's pipeline): medication name, dosage,
 * frequency, route, duration and free-text notes. Unclear values are never
 * guessed — a field the pipeline could not read is simply absent/empty and
 * the surface marks it unclear.
 */
export type ExtractedFieldKey =
  | 'medication_name'
  | 'dosage'
  | 'frequency'
  | 'route'
  | 'duration'
  | 'notes';

export const EXTRACTED_FIELD_KEYS = [
  'medication_name',
  'dosage',
  'frequency',
  'route',
  'duration',
  'notes',
] as const satisfies readonly ExtractedFieldKey[];

export const EXTRACTED_FIELD_LABELS: Record<ExtractedFieldKey, string> = {
  medication_name: 'Medication name',
  dosage: 'Dosage',
  frequency: 'Frequency',
  route: 'Route',
  duration: 'Duration',
  notes: 'Notes',
};

/** The fields that must be confirmed before anything may be persisted. */
export const REQUIRED_FIELD_KEYS: readonly ExtractedFieldKey[] = ['medication_name'];

/** Below this confidence a field is treated as unclear by the surface. */
export const LOW_CONFIDENCE = 0.75;

/**
 * One extracted field: the value the provider read (possibly empty = unclear),
 * the provider's confidence (null = the provider expressed none), and the
 * candidate matches offered for the clinician to choose from (real rows only).
 */
export type ExtractedField = {
  key: ExtractedFieldKey;
  value: string;
  confidence: number | null;
  candidates: readonly string[];
};

/** The payload envelope 0010's check constraint guarantees. */
export type ExtractionPayload = {
  provider: string;
  reason?: string;
  fields: readonly ExtractedField[];
};

/** A stored extraction row, mapped to camelCase like every domain record. */
export type OcrExtractionRecord = {
  id: string;
  orgId: string;
  patientId: string;
  documentId: string;
  /** The stored object path (staff-scoped signed URL source). */
  storagePath: string | null;
  documentName: string | null;
  status: ExtractionStatus;
  provider: string | null;
  payload: ExtractionPayload | null;
  rejectionReason: string | null;
  source: string;
  verification: string;
  verifiedBy: string | null;
  verifiedAt: string | null;
  createdAt: string;
  updatedAt: string;
};
