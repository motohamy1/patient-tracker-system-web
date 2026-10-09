// src/lib/labs/schemas.ts — Zod validation for the lab lifecycle (AUTH-05).
import { z } from 'zod';
import { LAB_FLAGS } from '@/lib/labs/status';

export const labOrderIdSchema = z.string().uuid();
export const labResultIdSchema = z.string().uuid();

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

const optionalNumber = z
  .union([z.string(), z.number()])
  .optional()
  .transform((value) => {
    if (value === undefined || value === '') return null;
    const parsed = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(parsed) ? parsed : Number.NaN;
  })
  .refine((value) => value === null || !Number.isNaN(value), 'Enter a numeric value.');

export const orderLabSchema = z.object({
  patientId: z.string().uuid(),
  name: z.string().trim().min(1, 'Enter a test or panel name.').max(160),
  orderedAt: instant.optional(),
  notes: optionalText(400),
});

export const recordLabResultSchema = z.object({
  orderId: labOrderIdSchema,
  analyte: z.string().trim().min(1, 'Enter the analyte.').max(120),
  value: optionalNumber,
  unit: optionalText(20),
  referenceRange: optionalText(60),
  flag: z.enum(LAB_FLAGS).optional().transform((value) => value ?? null),
  resultedAt: instant.optional(),
});
