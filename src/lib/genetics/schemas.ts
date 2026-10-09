// src/lib/genetics/schemas.ts — Zod validation (ALG-02, AUTH-05).
import { z } from 'zod';
import { GENETIC_KINDS, GENETIC_SIGNIFICANCES } from '@/lib/genetics/status';

export const geneticFindingIdSchema = z.string().uuid();

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

export const recordGeneticFindingSchema = z.object({
  patientId: z.string().uuid(),
  kind: z.enum(GENETIC_KINDS),
  gene: optionalText(80),
  variant: optionalText(160),
  interpretation: optionalText(4000),
  significance: z.enum(GENETIC_SIGNIFICANCES).optional().transform((value) => value ?? null),
  reportedAt: instant.optional(),
  documentId: z.string().uuid().optional().transform((value) => value ?? null),
});
