// src/lib/ocr/actions.ts — the prescription pipeline's server actions
// (Phase 12, OCR-01..04; AUTH-05).
//
// Five actions, the pipeline's stages plus the presigned upload seam. One rule:
// NOTHING becomes clinical truth through this file without a clinician's
// explicit confirmation.
//   0. createPrescriptionUploadAction — mints a presigned PUT so the browser
//                                      never holds storage credentials
//   1. uploadPrescriptionAction   — preprocessing + storage + the work item
//   2. requestExtractionAction    — provider extraction + analysis (payload)
//   3. rejectExtractionAction     — a recorded decision, never a deletion
//   4. confirmExtractionAction    — the ONE persistence path: clinician-
//                                   confirmed fields → the medication record
//                                   with its extracted origin preserved (§23)
//
// Every action re-checks CAN_AUTHOR_CLINICAL server-side; the UI gating is a
// courtesy, never the boundary (§3.1/§12). RLS is inert on the single-owner
// Lakebase Postgres connection, so every read carries an explicit `org_id`
// predicate and every write runs under `withAppUser` (the triggers read
// `public.app_uid()` for provenance and role).
'use server';

import { revalidatePath } from 'next/cache';
import { getSql } from '@/lib/db/neon';
import { withAppUser } from '@/lib/db/client';
import { getSessionUser } from '@/lib/auth/session';
import { resolveWorkspaceRole } from '@/lib/auth/workspace';
import { CAN_AUTHOR_CLINICAL, runsCapability, type Capability } from '@/lib/auth/capabilities';
import { listMedications } from '@/lib/medications/queries';
import { getProvider } from '@/lib/ocr/provider';
import { analyzeExtraction, parseExtractionPayload, preprocess } from '@/lib/ocr/pipeline';
import {
  confirmExtractionSchema,
  createPrescriptionUploadSchema,
  rejectExtractionSchema,
  requestExtractionSchema,
  uploadPrescriptionSchema,
} from '@/lib/ocr/schemas';
import { signedUploadUrl } from '@/lib/storage/documents';
import { MEDICATION_FREQUENCIES, MEDICATION_ROUTES } from '@/lib/medications/status';

export type OcrActionResult =
  | {
      ok: true;
      extractionId?: string;
      unclearKeys?: readonly string[];
      reason?: string;
      medicationId?: string;
    }
  | { ok: false; kind: 'invalid' | 'forbidden' | 'not-found' | 'error' };

const MIME_EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'application/pdf': 'pdf',
};

async function requireAuthor() {
  const resolution = await resolveWorkspaceRole('provider');
  if (resolution.kind !== 'signed-in') return null;
  if (!runsCapability(resolution.role, CAN_AUTHOR_CLINICAL)) return null;
  const user = await getSessionUser();
  if (!user) return null;
  return { ...resolution, uid: user.id };
}

function revalidateExtractionSurfaces(patientId: string, extractionId?: string) {
  revalidatePath(`/provider/patients/${patientId}/medications`);
  if (extractionId !== undefined) {
    revalidatePath(`/provider/patients/${patientId}/medications/intake/${extractionId}`);
  }
}

/**
 * Stage 0 — the presigned upload seam. The browser cannot hold storage
 * credentials and a File cannot ride a server action safely (body-size limit),
 * so the server mints a time-boxed PUT URL for THIS org/patient path; the
 * client PUTs the object, then calls uploadPrescriptionAction with the same
 * field names. The path is server-derived, never client-supplied.
 */
export async function createPrescriptionUploadAction(
  input: unknown,
): Promise<
  | { ok: true; storagePath: string; uploadUrl: string }
  | { ok: false; kind: 'invalid' | 'forbidden' | 'not-found' | 'error' }
> {
  const parsed = createPrescriptionUploadSchema.safeParse(input);
  if (!parsed.success) return { ok: false, kind: 'invalid' };

  const actor = await requireAuthor();
  if (!actor) return { ok: false, kind: 'forbidden' };

  const checked = preprocess(parsed.data.mimeType, parsed.data.sizeBytes);
  if (!checked.ok) return { ok: false, kind: 'invalid' };

  let patients: { id: string }[];
  try {
    const sql = getSql();
    patients = (await sql`
      select id from public.patients
      where id = ${parsed.data.patientId} and org_id = ${actor.orgId}
      limit 1
    `) as unknown as { id: string }[];
  } catch {
    return { ok: false, kind: 'error' };
  }
  if (patients.length === 0) return { ok: false, kind: 'not-found' };

  const filenameExtension = /\.([A-Za-z0-9]{1,8})$/.exec(parsed.data.filename)?.[1]?.toLowerCase();
  const extension = MIME_EXTENSIONS[parsed.data.mimeType] ?? filenameExtension ?? 'bin';
  const storagePath = `${actor.orgId}/${parsed.data.patientId}/${crypto.randomUUID()}.${extension}`;

  try {
    const uploadUrl = await signedUploadUrl(storagePath, parsed.data.mimeType);
    return { ok: true, storagePath, uploadUrl };
  } catch {
    return { ok: false, kind: 'error' };
  }
}

/**
 * Stage 1 — upload. The browser writes the object to the private bucket
 * (org/patient path convention, staff-only) and hands us the path; this action
 * validates the path belongs to THIS org/patient, runs preprocessing, and
 * creates the document row + the extraction work item in one step. A failure at
 * any point leaves no orphan row.
 */
export async function uploadPrescriptionAction(input: unknown): Promise<OcrActionResult> {
  const parsed = uploadPrescriptionSchema.safeParse(input);
  if (!parsed.success) return { ok: false, kind: 'invalid' };

  const actor = await requireAuthor();
  if (!actor) return { ok: false, kind: 'forbidden' };

  // The path must be exactly <org>/<patient>/… — the storage convention reads
  // the org from the path, so a foreign path is a scope violation waiting to
  // happen even before the row exists.
  const prefix = `${actor.orgId}/${parsed.data.patientId}/`;
  if (!parsed.data.storagePath.startsWith(prefix)) return { ok: false, kind: 'forbidden' };

  const checked = preprocess(parsed.data.mimeType, parsed.data.sizeBytes);
  if (!checked.ok) return { ok: false, kind: 'invalid' };

  try {
    const sql = getSql();
    const patients = (await sql`
      select id from public.patients
      where id = ${parsed.data.patientId} and org_id = ${actor.orgId}
      limit 1
    `) as unknown as { id: string }[];
    if (patients.length === 0) return { ok: false, kind: 'not-found' };

    // One transaction: the document row and the extraction work item land
    // together, so a failure at any point leaves no orphan row.
    const extractionId = await withAppUser(actor.uid, async (tx) => {
      const document = await tx.query<{ id: string }>(
        `insert into public.documents (org_id, patient_id, kind, storage_path, filename, mime_type, size_bytes)
         values ($1, $2, 'prescription', $3, $4, $5, $6)
         returning id`,
        [
          actor.orgId,
          parsed.data.patientId,
          parsed.data.storagePath,
          parsed.data.filename,
          parsed.data.mimeType,
          parsed.data.sizeBytes,
        ],
      );
      const documentId = document.rows[0]?.id;
      if (documentId === undefined) return undefined;

      const extraction = await tx.query<{ id: string }>(
        `insert into public.ocr_extractions (org_id, patient_id, document_id)
         values ($1, $2, $3)
         returning id`,
        [actor.orgId, parsed.data.patientId, documentId],
      );
      return extraction.rows[0]?.id;
    });
    if (extractionId === undefined) return { ok: false, kind: 'error' };

    revalidateExtractionSurfaces(parsed.data.patientId);
    return { ok: true, extractionId };
  } catch {
    return { ok: false, kind: 'error' };
  }
}

/**
 * Stage 2 — extraction. Calls the configured provider (honest zero-field
 * result when none is configured), analyzes the output, and stores the payload
 * on the row. The row moves to `extracted`: awaiting verification, NEVER
 * authoritative.
 */
export async function requestExtractionAction(input: unknown): Promise<OcrActionResult> {
  const parsed = requestExtractionSchema.safeParse(input);
  if (!parsed.success) return { ok: false, kind: 'invalid' };

  const actor = await requireAuthor();
  if (!actor) return { ok: false, kind: 'forbidden' };

  type ExtractionRow = {
    id: string;
    patient_id: string;
    status: string;
    document_id: string;
    document_storage_path: string | null;
    document_mime_type: string | null;
  };

  let extraction: ExtractionRow;
  try {
    const sql = getSql();
    const rows = (await sql`
      select e.id, e.patient_id, e.status, e.document_id,
             d.storage_path as document_storage_path, d.mime_type as document_mime_type
      from public.ocr_extractions e
      left join public.documents d on d.id = e.document_id
      where e.org_id = ${actor.orgId} and e.id = ${parsed.data.extractionId}
      limit 1
    `) as unknown as ExtractionRow[];
    const found = rows[0];
    if (!found) return { ok: false, kind: 'not-found' };
    extraction = found;
  } catch {
    return { ok: false, kind: 'error' };
  }

  if (extraction.status !== 'awaiting_extraction') return { ok: false, kind: 'invalid' };
  if (extraction.document_storage_path === null) return { ok: false, kind: 'not-found' };

  try {
    // Real candidates only: the patient's own medication list.
    const medications = await listMedications(actor.orgId, extraction.patient_id);

    const provider = getProvider();
    const result = await provider.extract({
      documentId: extraction.document_id,
      storagePath: extraction.document_storage_path,
      mimeType: extraction.document_mime_type,
    });

    const { payload, unclearKeys } = analyzeExtraction({
      providerResult: result,
      existingMedicationNames: medications.map((medication) => medication.name),
    });

    const storedPayload = {
      provider: payload.provider,
      fields: payload.fields.map((field) => ({ ...field, candidates: [...field.candidates] })),
      ...(payload.reason !== undefined ? { reason: payload.reason } : {}),
    };

    await withAppUser(actor.uid, async (tx) => {
      await tx.query(
        `update public.ocr_extractions
         set status = 'extracted', provider = $1, payload = $2::jsonb
         where id = $3 and org_id = $4`,
        [payload.provider, JSON.stringify(storedPayload), parsed.data.extractionId, actor.orgId],
      );
    });

    revalidateExtractionSurfaces(extraction.patient_id, parsed.data.extractionId);
    return { ok: true, extractionId: parsed.data.extractionId, unclearKeys, reason: result.reason };
  } catch {
    return { ok: false, kind: 'error' };
  }
}

/**
 * Stage 3 — rejection. A recorded decision with a reason; the row stays for the
 * audit trail (0011 forbids deletion).
 */
export async function rejectExtractionAction(input: unknown): Promise<OcrActionResult> {
  const parsed = rejectExtractionSchema.safeParse(input);
  if (!parsed.success) return { ok: false, kind: 'invalid' };

  const actor = await requireAuthor();
  if (!actor) return { ok: false, kind: 'forbidden' };

  try {
    const updated = await withAppUser(actor.uid, async (tx) => {
      const { rows } = await tx.query<{ id: string; patient_id: string }>(
        `update public.ocr_extractions
         set status = 'rejected', rejection_reason = $1
         where id = $2 and org_id = $3
         returning id, patient_id`,
        [parsed.data.reason, parsed.data.extractionId, actor.orgId],
      );
      return rows[0] ?? null;
    });
    if (!updated) return { ok: false, kind: 'not-found' };

    revalidateExtractionSurfaces(updated.patient_id, parsed.data.extractionId);
    return { ok: true, extractionId: updated.id };
  } catch {
    return { ok: false, kind: 'error' };
  }
}

/**
 * Stage 4 — confirmation + persistence. The ONLY path from an image to the
 * clinical record. Requires the extraction to be in `extracted` (the DB's
 * transition table enforces the rest), persists through the definer function
 * that pairs source='ai-extracted' with verification='clinician-verified' —
 * the medication always shows it came from a prescription and was confirmed by
 * a clinician (§23) — and only then marks the extraction verified.
 *
 * A validation failure (an unclear required field) persists NOTHING (OCR-03).
 */
export async function confirmExtractionAction(input: unknown): Promise<OcrActionResult> {
  const parsed = confirmExtractionSchema.safeParse(input);
  if (!parsed.success) return { ok: false, kind: 'invalid' };

  const actor = await requireAuthor();
  if (!actor) return { ok: false, kind: 'forbidden' };

  let extraction: { id: string; patient_id: string; status: string };
  try {
    const sql = getSql();
    const rows = (await sql`
      select id, patient_id, status from public.ocr_extractions
      where org_id = ${actor.orgId} and id = ${parsed.data.extractionId}
      limit 1
    `) as unknown as { id: string; patient_id: string; status: string }[];
    const found = rows[0];
    if (!found) return { ok: false, kind: 'not-found' };
    extraction = found;
  } catch {
    return { ok: false, kind: 'error' };
  }

  // Only an extracted (never-yet-verified) job may be confirmed; the DB's
  // transition guard is the second enforcement.
  if (extraction.status !== 'extracted') return { ok: false, kind: 'invalid' };

  const frequency = parsed.data.fields.frequency?.trim();
  const route = parsed.data.fields.route?.trim();
  if (frequency !== undefined && frequency !== '' && !(MEDICATION_FREQUENCIES as readonly string[]).includes(frequency)) {
    return { ok: false, kind: 'invalid' };
  }
  if (route !== undefined && route !== '' && !(MEDICATION_ROUTES as readonly string[]).includes(route)) {
    return { ok: false, kind: 'invalid' };
  }

  // Dose parsing: the confirmed dosage free-text is parsed into the record's
  // structured amount + unit when it is unambiguous ("10 mg"); anything else
  // is kept as free text in the duration/notes-free structured fields and is
  // never guessed into a number.
  const dosageText = parsed.data.fields.dosage?.trim() ?? '';
  const doseMatch = /^(\d+(?:\.\d+)?)\s*([A-Za-z]+)?$/.exec(dosageText);
  const doseAmount = doseMatch !== null ? Number(doseMatch[1]) : null;
  const doseUnit = doseMatch !== null ? (doseMatch[2] ?? null) : null;

  try {
    const medicationId = await withAppUser(actor.uid, async (tx) => {
      const { rows } = await tx.query<{ payload: string | null }>(
        `select public.record_extracted_medication($1, $2, $3, $4, $5, $6, $7, $8) as payload`,
        [
          actor.orgId,
          extraction.patient_id,
          parsed.data.fields.medication_name,
          doseAmount,
          doseUnit,
          frequency !== undefined && frequency !== '' ? frequency : null,
          route !== undefined && route !== '' ? route : null,
          null,
        ],
      );
      return rows[0]?.payload ?? null;
    });
    if (typeof medicationId !== 'string') return { ok: false, kind: 'error' };

    await withAppUser(actor.uid, async (tx) => {
      await tx.query(
        `update public.ocr_extractions set status = 'verified' where id = $1 and org_id = $2`,
        [parsed.data.extractionId, actor.orgId],
      );
    });

    revalidateExtractionSurfaces(extraction.patient_id, parsed.data.extractionId);
    revalidatePath(`/provider/patients/${extraction.patient_id}/overview`);
    return { ok: true, medicationId, extractionId: parsed.data.extractionId };
  } catch {
    return { ok: false, kind: 'error' };
  }
}

/** Capability re-export for the surfaces (the UI mirror, never the boundary). */
export type { Capability };
