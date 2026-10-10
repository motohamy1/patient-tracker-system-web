// src/lib/telehealth/schemas.ts — Zod validation for the consultation
// workflow (Phase 17). Parse BEFORE any capability check or write.
import { z } from 'zod';
import { SESSION_STATUSES, TRANSPORT_STATES } from '@/lib/telehealth/status';

export const visitIdSchema = z.string().uuid();

export const startConsultationSchema = z.object({
  visitId: visitIdSchema,
});

export const cancelConsultationSchema = z.object({
  visitId: visitIdSchema,
  reason: z.string().trim().min(1, 'Say why the consultation was cancelled.').max(500),
});

// The completion writes the visit's clinical block, so it carries the same
// optional-clearing shape as the in-person documentation form (07-02).
export const completeConsultationSchema = z.object({
  visitId: visitIdSchema,
  reason: z.string().trim().max(2000).optional(),
  documentation: z.string().trim().max(8000).optional(),
  followUp: z.string().trim().max(2000).optional(),
  followUpAt: z.string().date().optional(),
});

export const sessionStatusSchema = z.enum(SESSION_STATUSES);
export const transportStateSchema = z.enum(TRANSPORT_STATES);
