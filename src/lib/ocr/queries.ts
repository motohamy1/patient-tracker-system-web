// src/lib/ocr/queries.ts — org-scoped extraction reads (Phase 12, OCR-01).
//
// RLS is inert on the single-owner Lakebase Postgres connection, so every read
// carries an explicit `org_id` predicate (the 0009 discipline); this module adds
// no visibility logic of its own. The document filename rides the FK so the
// intake list reads truthfully.
import { getSql } from '@/lib/db/neon';
import { signedDocumentUrl as requestSignedDocumentUrl } from '@/lib/storage/documents';
import type {
  ExtractionPayload,
  ExtractionStatus,
  OcrExtractionRecord,
} from '@/lib/ocr/status';

export type { OcrExtractionRecord };
import { isExtractionPayload } from '@/lib/ocr/provider';

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
  document_filename: string | null;
  document_storage_path: string | null;
};

function mapRow(row: ExtractionRow): OcrExtractionRecord {
  return {
    id: row.id,
    orgId: row.org_id,
    patientId: row.patient_id,
    documentId: row.document_id,
    storagePath: row.document_storage_path,
    documentName: row.document_filename,
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
  let rows: ExtractionRow[];
  try {
    const sql = getSql();
    rows = (await sql`
      select e.id, e.org_id, e.patient_id, e.document_id, e.status, e.payload, e.provider,
             e.rejection_reason, e.source, e.verification, e.verified_by, e.verified_at,
             e.created_at, e.updated_at,
             d.filename as document_filename, d.storage_path as document_storage_path
      from public.ocr_extractions e
      left join public.documents d on d.id = e.document_id
      where e.org_id = ${orgId} and e.patient_id = ${patientId}
      order by e.created_at desc, e.id desc
    `) as unknown as ExtractionRow[];
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`listOcrExtractions failed: ${message}`);
  }
  return rows.map(mapRow);
}

/** One extraction, org-scoped; null when the org scope hides it (no-leak denial). */
export async function getOcrExtraction(
  orgId: string,
  extractionId: string,
): Promise<OcrExtractionRecord | null> {
  let rows: ExtractionRow[];
  try {
    const sql = getSql();
    rows = (await sql`
      select e.id, e.org_id, e.patient_id, e.document_id, e.status, e.payload, e.provider,
             e.rejection_reason, e.source, e.verification, e.verified_by, e.verified_at,
             e.created_at, e.updated_at,
             d.filename as document_filename, d.storage_path as document_storage_path
      from public.ocr_extractions e
      left join public.documents d on d.id = e.document_id
      where e.org_id = ${orgId} and e.id = ${extractionId}
      limit 1
    `) as unknown as ExtractionRow[];
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`getOcrExtraction failed: ${message}`);
  }
  return rows[0] ? mapRow(rows[0]) : null;
}

/**
 * A short-lived signed URL for the original image (the clinician's reference
 * of record during verification, §11). Access is enforced in app code (the
 * org/patient path guard + workspace resolution); the object store only mints
 * the time-boxed URL.
 */
export async function signedDocumentUrl(storagePath: string, expiresInSeconds = 300): Promise<string | null> {
  try {
    return await requestSignedDocumentUrl(storagePath, expiresInSeconds);
  } catch {
    return null;
  }
}

/** The payload type re-export for the surface. */
export type { ExtractionPayload };
