// src/lib/imaging/schemas.ts — Zod validation for the imaging lifecycle.
import { z } from 'zod';

export const imagingOrderIdSchema = z.string().uuid();

const instant = z
  .string()
  .refine((value) => !Number.isNaN(Date.parse(value)), 'Enter a valid date and time.')
  .transform((value) => new Date(value).toISOString());

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((value) => (value === undefined || value === '' ? null : value));

export const orderImagingSchema = z.object({
  patientId: z.string().uuid(),
  modality: z.string().trim().min(1, 'Enter the modality.').max(80),
  bodySite: optionalText(80),
  orderedAt: instant.optional(),
  notes: optionalText(400),
});

export const recordImagingResultSchema = z.object({
  orderId: imagingOrderIdSchema,
  impression: z.string().trim().min(1, 'Enter the impression.').max(4000),
  resultedAt: instant.optional(),
  documentId: z.string().uuid().optional().transform((value) => value ?? null),
});
