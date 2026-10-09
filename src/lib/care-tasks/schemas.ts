// src/lib/care-tasks/schemas.ts — Zod validation for the Phase-14 workflow.
import { z } from 'zod';
import { CARE_TASK_KINDS, CARE_TASK_STATUSES, type CareTaskStatus } from '@/lib/care-tasks/status';

export const careTaskIdSchema = z.string().uuid();

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

export const assignCareTaskSchema = z.object({
  patientId: z.string().uuid(),
  title: z.string().trim().min(1, 'Enter what the task is.').max(160),
  detail: optionalText(400),
  kind: z.enum(CARE_TASK_KINDS),
  dueAt: instant.optional(),
});

export const careTaskTransitionSchema = z.object({
  taskId: careTaskIdSchema,
});

export const completeCareTaskSchema = z.object({
  taskId: careTaskIdSchema,
  note: optionalText(400),
  completedAt: instant.optional(),
});

/** The archive target is the only legal status transition. */
export const CARE_TASK_ARCHIVE_TARGET = 'archived' satisfies CareTaskStatus;
