// src/lib/ocr/actions.ts — the prescription pipeline's server actions
// (Phase 12, OCR-01..04; AUTH-05).
//
// Four actions, four pipeline stages, one rule: NOTHING becomes clinical truth
// through this file without a clinician's explicit confirmation.
//   1. uploadPrescriptionAction   — preprocessing + storage + the work item
//   2. requestExtractionAction    — provider extraction + analysis (payload)
//   3. rejectExtractionAction     — a recorded decision, never a deletion
//   4. confirmExtractionAction    — the ONE persistence path: clinician-
//                                   confirmed fields → the medication record
//                                   with its extracted origin preserved (§23)
//
// Every action re-checks CAN_AUTHOR_CLINICAL server-side; the UI gating is a
// courtesy, never the boundary (§3.1/§12).
'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { resolveWorkspaceRole } from '@/lib/auth/workspace';
import { CAN_AUTHOR_CLINICAL, runsCapability, type Capability } from '@/lib/auth/capabilities';
import { listMedications } from '@/lib/medications/queries';
import { getProvider } from '@/lib/ocr/provider';
import { analyzeExtraction, parseExtractionPayload, preprocess } from '@/lib/ocr/pipeline';
import {
  confirmExtractionSchema,
  rejectExtractionSchema,
  requestExtractionSchema,
  uploadPrescriptionSchema,
} from '@/lib/ocr/schemas';
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

async function requireAuthor() {
  const resolution = await resolveWorkspaceRole('provider');
  if (resolution.kind !== 'signed-in') return null;
  if (!runsCapability(resolution.role, CAN_AUTHOR_CLINICAL)) return null;
  return resolution;
}

function revalidateExtractionSurfaces(patientId: string, extractionId?: string) {
  revalidatePath(`/provider/patients/${patientId}/medications`);
  if (extractionId !== undefined) {
    revalidatePath(`/provider/patients/${patientId}/medications/intake/${extractionId}`);
  }
}

/**
 * Stage 1 — upload. The browser writes the object to the private bucket
 * (RLS-scoped, staff-only) and hands us the path; this action validates the
 * path belongs to THIS org/patient, runs preprocessing, and creates the
 * document row + the extraction work item in one step. A failure at any point
 * leaves no orphan row.
 */
export async function uploadPrescriptionAction(input: unknown): Promise<OcrActionResult> {
  const parsed = uploadPrescriptionSchema.safeParse(input);
  if (!parsed.success) return { ok: false, kind: 'invalid' };

  const actor = await requireAuthor();
  if (!actor) return { ok: false, kind: 'forbidden' };

  // The path must be exactly <org>/<patient>/… — the storage policies read the
  // org from the path, so a foreign path is a policy violation waiting to
  // happen even before the row exists.
  const prefix = `${actor.orgId}/${parsed.data.patientId}/`;
  if (!parsed.data.storagePath.startsWith(prefix)) return { ok: false, kind: 'forbidden' };

  const checked = preprocess(parsed.data.mimeType, parsed.data.sizeBytes);
  if (!checked.ok) return { ok: false, kind: 'invalid' };

  const supabase = await createClient();
  const { data: patient, error: patientError } = await supabase
    .from('patients')
    .select('id')
    .eq('id', parsed.data.patientId)
    .eq('org_id', actor.orgId)
    .maybeSingle();
  if (patientError) return { ok: false, kind: 'error' };
  if (!patient) return { ok: false, kind: 'not-found' };

  const { data: document, error: documentError } = await supabase
    .from('documents')
    .insert({
      org_id: actor.orgId,
      patient_id: parsed.data.patientId,
      kind: 'prescription',
      storage_path: parsed.data.storagePath,
      filename: parsed.data.filename,
      mime_type: parsed.data.mimeType,
      size_bytes: parsed.data.sizeBytes,
    })
    .select('id')
    .single();
  if (documentError || !document) return { ok: false, kind: 'error' };

  const { data: extraction, error: extractionError } = await supabase
    .from('ocr_extractions')
    .insert({
      org_id: actor.orgId,
      patient_id: parsed.data.patientId,
      document_id: document.id,
    })
    .select('id')
    .single();
  if (extractionError || !extraction) return { ok: false, kind: 'error' };

  revalidateExtractionSurfaces(parsed.data.patientId);
  return { ok: true, extractionId: extraction.id };
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

  const supabase = await createClient();
  const { data: extraction, error: extractionError } = await supabase
    .from('ocr_extractions')
    .select('id, patient_id, status, document_id, documents(storage_path, mime_type)')
    .eq('org_id', actor.orgId)
    .eq('id', parsed.data.extractionId)
    .maybeSingle();
  if (extractionError) return { ok: false, kind: 'error' };
  if (!extraction) return { ok: false, kind: 'not-found' };
  if (extraction.status !== 'awaiting_extraction') return { ok: false, kind: 'invalid' };

  const document = extraction.documents as { storage_path: string; mime_type: string | null } | null;
  if (document === null) return { ok: false, kind: 'not-found' };

  // Real candidates only: the patient's own medication list.
  const medications = await listMedications(actor.orgId, extraction.patient_id as string);

  const provider = getProvider();
  const result = await provider.extract({
    documentId: extraction.document_id as string,
    storagePath: document.storage_path,
    mimeType: document.mime_type,
  });

  const { payload, unclearKeys } = analyzeExtraction({
    providerResult: result,
    existingMedicationNames: medications.map((medication) => medication.name),
  });

  const { error: updateError } = await supabase
    .from('ocr_extractions')
    .update({
      status: 'extracted',
      provider: payload.provider,
      payload: {
        provider: payload.provider,
        fields: payload.fields.map((field) => ({ ...field, candidates: [...field.candidates] })),
        ...(payload.reason !== undefined ? { reason: payload.reason } : {}),
      },
    })
    .eq('id', parsed.data.extractionId)
    .eq('org_id', actor.orgId);
  if (updateError) return { ok: false, kind: 'error' };

  revalidateExtractionSurfaces(extraction.patient_id as string, parsed.data.extractionId);
  return { ok: true, extractionId: parsed.data.extractionId, unclearKeys, reason: result.reason };
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

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('ocr_extractions')
    .update({ status: 'rejected', rejection_reason: parsed.data.reason })
    .eq('id', parsed.data.extractionId)
    .eq('org_id', actor.orgId)
    .select('id, patient_id')
    .maybeSingle();
  if (error) return { ok: false, kind: 'error' };
  if (!data) return { ok: false, kind: 'not-found' };

  revalidateExtractionSurfaces(data.patient_id, parsed.data.extractionId);
  return { ok: true, extractionId: data.id };
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

  const supabase = await createClient();
  const { data: extraction, error: extractionError } = await supabase
    .from('ocr_extractions')
    .select('id, patient_id, status')
    .eq('org_id', actor.orgId)
    .eq('id', parsed.data.extractionId)
    .maybeSingle();
  if (extractionError) return { ok: false, kind: 'error' };
  if (!extraction) return { ok: false, kind: 'not-found' };
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

  const { data: medicationId, error: medicationError } = await supabase.rpc('record_extracted_medication', {
    p_org_id: actor.orgId,
    p_patient_id: extraction.patient_id as string,
    p_name: parsed.data.fields.medication_name,
    p_dose_amount: doseAmount,
    p_dose_unit: doseUnit,
    p_frequency: frequency !== undefined && frequency !== '' ? frequency : null,
    p_route: route !== undefined && route !== '' ? route : null,
    p_started_at: null,
  });
  if (medicationError || typeof medicationId !== 'string') return { ok: false, kind: 'error' };

  const { error: verifyError } = await supabase
    .from('ocr_extractions')
    .update({ status: 'verified' })
    .eq('id', parsed.data.extractionId)
    .eq('org_id', actor.orgId);
  if (verifyError) return { ok: false, kind: 'error' };

  revalidateExtractionSurfaces(extraction.patient_id as string, parsed.data.extractionId);
  revalidatePath(`/provider/patients/${extraction.patient_id}/overview`);
  return { ok: true, medicationId, extractionId: parsed.data.extractionId };
}

/** Capability re-export for the surfaces (the UI mirror, never the boundary). */
export type { Capability };
