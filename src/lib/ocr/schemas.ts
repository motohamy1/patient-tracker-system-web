// src/lib/ocr/schemas.ts — Zod validation for the Phase-12 pipeline.
//
// Every action parses BEFORE any capability check or write. The confirm
// schema is the §11 guarantee made enforceable: a required field with no
// confirmed value fails validation, so an unclear medication name or dose can
// never be persisted (OCR-03).
import { z } from 'zod';
import { EXTRACTED_FIELD_KEYS } from '@/lib/ocr/status';

export const extractionIdSchema = z.string().uuid();

export const MAX_UPLOAD_BYTES_SCHEMA = z.number().int().positive().max(10 * 1024 * 1024);

/** The upload payload the browser sends after its direct Storage write. */
export const uploadPrescriptionSchema = z.object({
  patientId: z.string().uuid(),
  storagePath: z
    .string()
    .min(1)
    .max(400)
    .regex(/^[0-9a-fA-F-]{36}\/[0-9a-fA-F-]{36}\/[0-9a-fA-F-]{36}(\.[A-Za-z0-9]{1,8})?$/),
  filename: z.string().trim().min(1).max(200),
  mimeType: z.enum(['image/jpeg', 'image/png', 'image/webp', 'application/pdf']),
  sizeBytes: MAX_UPLOAD_BYTES_SCHEMA,
});

/** The clinician's confirmed field values — the only path to persistence. */
export const confirmExtractionSchema = z.object({
  extractionId: extractionIdSchema,
  fields: z.object({
    medication_name: z.string().trim().min(1, 'Confirm the medication name.').max(120),
    dosage: z.string().trim().max(200).optional(),
    frequency: z.string().trim().max(60).optional(),
    route: z.string().trim().max(60).optional(),
    duration: z.string().trim().max(120).optional(),
    notes: z.string().trim().max(1000).optional(),
  }),
});

export const rejectExtractionSchema = z.object({
  extractionId: extractionIdSchema,
  reason: z.string().trim().min(1, 'Say why this extraction is not usable.').max(400),
});

export const requestExtractionSchema = z.object({
  extractionId: extractionIdSchema,
});

/** The closed key list, for the surface's per-field rendering. */
export const FIELD_KEYS = EXTRACTED_FIELD_KEYS;
