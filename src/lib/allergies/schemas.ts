// src/lib/allergies/schemas.ts — Zod validation (ALG-01, AUTH-05).
import { z } from 'zod';
import { ALLERGY_SEVERITIES, ALLERGY_STATUSES } from '@/lib/allergies/status';

export const allergyIdSchema = z.string().uuid();

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

export const recordAllergySchema = z.object({
  patientId: z.string().uuid(),
  allergen: z.string().trim().min(1, 'Enter the allergen.').max(160),
  reaction: optionalText(200),
  severity: z.enum(ALLERGY_SEVERITIES).optional().transform((value) => value ?? null),
  notedAt: instant.optional(),
  notes: optionalText(400),
});

export const resolveAllergySchema = z.object({
  allergyId: allergyIdSchema,
  status: z.enum(ALLERGY_STATUSES),
});
