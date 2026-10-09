// src/lib/visits/schemas.ts — Zod validation for the visit workflow
// (VIS-01/VIS-03, AUTH-05 pre-validation).
//
// Every server action parses with one of these BEFORE any capability check or
// write; a malformed payload never reaches the database. Dates arrive as
// strings from forms and are validated as instants/days here, then bound as
// values — never interpolated (ASVS V5).
import { z } from 'zod';
import { VISIT_STAGES } from '@/lib/visits/status';

export const visitIdSchema = z.string().uuid();

/** A parseable instant, normalised to ISO for the timestamptz bind. */
const instant = z
  .string()
  .refine((value) => !Number.isNaN(Date.parse(value)), 'Enter a valid date and time.')
  .transform((value) => new Date(value).toISOString());

/** A calendar day (YYYY-MM-DD) for the `date` column. */
const calendarDay = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Enter a valid date.');

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((value) => (value === undefined || value === '' ? null : value));

/**
 * Front-desk-capable creation: scheduling fields always, the pre-visit reason
 * only when the authoring capability is present (the action nulls it
 * otherwise; the DB guard enforces the same rule).
 */
export const createVisitSchema = z.object({
  patientId: z.string().uuid(),
  scheduledAt: instant,
  visitType: optionalText(80),
  location: optionalText(120),
  reason: optionalText(400),
});

/** An explicit stage move (Pre → During → After), never a free edit. */
export const visitStageSchema = z.enum(VISIT_STAGES);

/** Clinical documentation write: any subset, all clinician-owned fields. */
export const saveVisitDocumentationSchema = z.object({
  visitId: visitIdSchema,
  reason: optionalText(400),
  documentation: optionalText(4000),
  followUp: optionalText(400),
  followUpAt: calendarDay.optional().transform((value) => value ?? null),
});

export type CreateVisitInput = z.infer<typeof createVisitSchema>;
export type SaveVisitDocumentationInput = z.infer<typeof saveVisitDocumentationSchema>;
