// src/lib/patient/schemas.ts — Zod validation for the patient's only
// authoring surface (Phase 13, PTH-02).
//
// The closed kind vocabulary IS the permission model's visible edge: a patient
// can log a measurement from this list or a note. A measurement needs its
// value (two for blood pressure); a note needs only text. Parse BEFORE any
// capability check or write.
import { z } from 'zod';
import { OBSERVATION_KINDS, OBSERVATION_UNITS } from '@/lib/patient/status';

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

export const logObservationSchema = z
  .object({
    kind: z.enum(OBSERVATION_KINDS),
    value: z
      .union([z.string(), z.number()])
      .optional()
      .transform((raw) => {
        if (raw === undefined || raw === '') return null;
        const parsed = typeof raw === 'number' ? raw : Number(raw);
        return Number.isFinite(parsed) ? parsed : Number.NaN;
      })
      .refine((value) => value === null || !Number.isNaN(value), 'Enter a number.'),
    secondValue: z
      .union([z.string(), z.number()])
      .optional()
      .transform((raw) => {
        if (raw === undefined || raw === '') return null;
        const parsed = typeof raw === 'number' ? raw : Number(raw);
        return Number.isFinite(parsed) ? parsed : Number.NaN;
      })
      .refine((value) => value === null || !Number.isNaN(value), 'Enter a number.'),
    unit: z.enum(OBSERVATION_UNITS).optional().transform((value) => value ?? null),
    note: optionalText(1000),
    observedAt: instant.optional(),
  })
  .superRefine((value, ctx) => {
    if (value.kind === 'note') {
      if (value.note === null) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Write the note.' });
      }
      return;
    }
    if (value.kind === 'blood_pressure') {
      if (value.value === null || value.secondValue === null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Record both numbers of your blood pressure reading.',
        });
      }
      return;
    }
    if (value.value === null) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Enter the measurement.' });
    }
  });
