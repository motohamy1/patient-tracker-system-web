// src/lib/ocr/queries.ts — RLS-scoped extraction reads (Phase 12, OCR-01).
//
// Migration 0011's SELECT policy restricts rows to the org's four staff roles;
// this module adds no visibility logic of its own (the 0009 discipline). The
// document filename rides the FK so the intake list reads truthfully.
import { createClient } from '@/lib/supabase/server';
import type {
  ExtractionPayload,
  ExtractionStatus,
  OcrExtractionRecord,
} from '@/lib/ocr/status';

export type { OcrExtractionRecord };
import { isExtractionPayload } from '@/lib/ocr/provider';

const SELECT_COLUMNS =
  'id, org_id, patient_id, document_id, status, payload, provider, rejection_reason, source, verification, verified_by, verified_at, created_at, updated_at, documents(filename, storage_path)';

type ExtractionRow = {
  id: string;
  org_id: string;
  patient_id: string;
  document_id: string;
  status: ExtractionStatus;
  payload: unknown;
  provider: string | null;
  rejection_reason: string | null;
  source: string;
  verification: string;
  verified_by: string | null;
  verified_at: string | null;
  created_at: string;
  updated_at: string;
  documents: { filename: string; storage_path: string } | null;
};

function mapRow(row: ExtractionRow): OcrExtractionRecord {
  return {
    id: row.id,
    orgId: row.org_id,
    patientId: row.patient_id,
    documentId: row.document_id,
    storagePath: row.documents?.storage_path ?? null,
    documentName: row.documents?.filename ?? null,
    status: row.status,
    provider: row.provider,
    payload: isExtractionPayload(row.payload) ? row.payload : null,
    rejectionReason: row.rejection_reason,
    source: row.source,
    verification: row.verification,
    verifiedBy: row.verified_by,
    verifiedAt: row.verified_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** The patient's extraction jobs, newest first (bound predicates only). */
export async function listOcrExtractions(
  orgId: string,
  patientId: string,
): Promise<OcrExtractionRecord[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('ocr_extractions')
    .select(SELECT_COLUMNS)
    .eq('org_id', orgId)
    .eq('patient_id', patientId)
    .order('created_at', { ascending: false })
    .order('id', { ascending: false });

  if (error) throw new Error(`listOcrExtractions failed: ${error.message}`);
  return ((data ?? []) as ExtractionRow[]).map(mapRow);
}

/** One extraction, org-scoped; null when RLS hides it (no-leak denial). */
export async function getOcrExtraction(
  orgId: string,
  extractionId: string,
): Promise<OcrExtractionRecord | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('ocr_extractions')
    .select(SELECT_COLUMNS)
    .eq('org_id', orgId)
    .eq('id', extractionId)
    .maybeSingle();

  if (error) throw new Error(`getOcrExtraction failed: ${error.message}`);
  return data ? mapRow(data as ExtractionRow) : null;
}

/**
 * A short-lived signed URL for the original image (the clinician's reference
 * of record during verification, §11). The storage policies gate who may read
 * it; this helper only mints the URL.
 */
export async function signedDocumentUrl(storagePath: string, expiresInSeconds = 300): Promise<string | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.storage
    .from('patient-documents')
    .createSignedUrl(storagePath, expiresInSeconds);
  if (error || !data) return null;
  return data.signedUrl;
}

/** The payload type re-export for the surface. */
export type { ExtractionPayload };
