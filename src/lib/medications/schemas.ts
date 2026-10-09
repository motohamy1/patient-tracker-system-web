// src/lib/medications/schemas.ts — Zod validation for the lifecycle (AUTH-05).
//
// Parse BEFORE any capability check or write. `doseAmount` arrives as a form
// string; the schema coerces it to a positive number and rejects junk. An
// omitted field is a deliberate clear on `change`; `start` requires a name.
import { z } from 'zod';
import { MEDICATION_FREQUENCIES, MEDICATION_ROUTES } from '@/lib/medications/status';

export const medicationIdSchema = z.string().uuid();

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

const doseAmount = z
  .union([z.string(), z.number()])
  .optional()
  .transform((value) => {
    if (value === undefined || value === '') return null;
    const parsed = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : Number.NaN;
  })
  .refine((value) => value === null || !Number.isNaN(value), 'Enter a dose greater than zero.');

export const startMedicationSchema = z.object({
  patientId: z.string().uuid(),
  name: z.string().trim().min(1, 'Enter a medication name.').max(120),
  doseAmount,
  doseUnit: optionalText(20),
  frequency: z.enum(MEDICATION_FREQUENCIES).optional().transform((value) => value ?? null),
  route: z.enum(MEDICATION_ROUTES).optional().transform((value) => value ?? null),
  startedAt: instant.optional(),
});

export const changeMedicationSchema = z.object({
  medicationId: medicationIdSchema,
  name: z.string().trim().min(1).max(120),
  doseAmount,
  doseUnit: optionalText(20),
  frequency: z.enum(MEDICATION_FREQUENCIES).optional().transform((value) => value ?? null),
  route: z.enum(MEDICATION_ROUTES).optional().transform((value) => value ?? null),
});

export const medicationTransitionSchema = z.object({
  medicationId: medicationIdSchema,
});

export type StartMedicationInput = z.infer<typeof startMedicationSchema>;
export type ChangeMedicationInput = z.infer<typeof changeMedicationSchema>;
