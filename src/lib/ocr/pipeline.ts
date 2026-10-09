// src/lib/ocr/pipeline.ts — the §11 pipeline as pure steps (Phase 12,
// OCR-01).
//
// image → preprocessing → extraction → structured extraction →
// normalization → ambiguity/confidence analysis → (clinician verification →
// persistence, which live in actions.ts and the intake surface).
//
// PURE: no I/O, no clock, no network. The provider call is the only async
// step and it is injected, so the entire pipeline is deterministic and
// unit-testable given a provider stub. Normalization is deliberately
// record-local (trim, collapse whitespace, case-fold for comparison): the
// external vocabulary call (RxNorm) is an adapter point that is NOT faked
// here — no RXCUI is ever invented.
import { z } from 'zod';
import {
  EXTRACTED_FIELD_KEYS,
  LOW_CONFIDENCE,
  type ExtractedField,
  type ExtractedFieldKey,
  type ExtractionPayload,
} from '@/lib/ocr/status';
import type { ExtractionResult } from '@/lib/ocr/provider';

/** Preprocessing: the constraints any acceptable prescription image meets. */
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
export const ACCEPTED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'] as const;

export type PreprocessResult =
  | { ok: true }
  | { ok: false; reason: string };

export function preprocess(mimeType: string | null, sizeBytes: number): PreprocessResult {
  if (mimeType === null || !(ACCEPTED_MIME_TYPES as readonly string[]).includes(mimeType)) {
    return { ok: false, reason: 'That file is not an image or PDF we can read.' };
  }
  if (sizeBytes <= 0 || sizeBytes > MAX_UPLOAD_BYTES) {
    return { ok: false, reason: 'That file is empty or larger than 10 MB.' };
  }
  return { ok: true };
}

/** Structured extraction: the closed vocabulary, validated at the boundary. */
export const extractedFieldSchema = z.object({
  key: z.enum(EXTRACTED_FIELD_KEYS),
  value: z.string().max(500),
  confidence: z.number().min(0).max(1).nullable(),
  candidates: z.array(z.string().max(160)).max(8),
});

export const extractionPayloadSchema = z.object({
  provider: z.string().min(1).max(60),
  reason: z.string().max(400).optional(),
  fields: z.array(extractedFieldSchema).max(EXTRACTED_FIELD_KEYS.length),
});

export function parseExtractionPayload(value: unknown): ExtractionPayload | null {
  const parsed = extractionPayloadSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

/** Deterministic, record-local normalization (never a vocabulary guess). */
export function normalizeValue(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

/** Case-insensitive comparison key for candidate matching. */
function comparisonKey(value: string): string {
  return normalizeValue(value).toLowerCase();
}

/**
 * Candidate matching: the ONLY source of candidates is the patient's real
 * medication list (the record itself) — never an invented suggestion (§11:
 * "Possible candidate matches may be shown").
 */
export function matchCandidates(
  value: string,
  existingNames: readonly string[],
): readonly string[] {
  const key = comparisonKey(value);
  if (key === '') return [];
  const starts: string[] = [];
  const contains: string[] = [];
  for (const name of existingNames) {
    const candidateKey = comparisonKey(name);
    if (candidateKey === key) continue;
    if (candidateKey.startsWith(key)) starts.push(name);
    else if (candidateKey.includes(key)) contains.push(name);
  }
  return [...starts, ...contains].slice(0, 5);
}

export type PipelineInput = {
  providerResult: ExtractionResult;
  /** The patient's existing medication names — the candidate source. */
  existingMedicationNames: readonly string[];
};

export type PipelineOutput = {
  payload: ExtractionPayload;
  /** The field keys the pipeline could not read (empty value or low confidence). */
  unclearKeys: readonly ExtractedFieldKey[];
};

/**
 * Run the analysis half of the pipeline over a provider result: normalize
 * values, attach real candidates, and mark the unclear fields. The output is
 * the payload the extraction row stores, awaiting clinician verification.
 */
export function analyzeExtraction(input: PipelineInput): PipelineOutput {
  const fields: ExtractedField[] = [];
  for (const field of input.providerResult.fields) {
    const value = normalizeValue(field.value);
    if (value === '') continue; // an unread field is simply absent — never guessed
    fields.push({
      key: field.key,
      value,
      confidence: field.confidence,
      candidates: matchCandidates(value, input.existingMedicationNames),
    });
  }

  const unclearKeys = EXTRACTED_FIELD_KEYS.filter((key) => {
    const field = fields.find((candidate) => candidate.key === key);
    if (field === undefined) return true;
    return field.confidence !== null && field.confidence < LOW_CONFIDENCE;
  });

  return {
    payload: {
      provider: input.providerResult.provider,
      ...(input.providerResult.reason !== undefined ? { reason: input.providerResult.reason } : {}),
      fields,
    },
    unclearKeys,
  };
}

/** A field is unclear when it is missing or the provider read it weakly. */
export function isFieldUnclear(field: ExtractedField | undefined): boolean {
  if (field === undefined) return true;
  if (field.value.trim() === '') return true;
  return field.confidence !== null && field.confidence < LOW_CONFIDENCE;
}
