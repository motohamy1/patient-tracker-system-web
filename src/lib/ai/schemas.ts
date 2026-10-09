// src/lib/ai/schemas.ts — Zod validation for the Phase-11 AI surfaces.
//
// The review schema is deliberately narrow: a review action can carry ONLY an
// insight id and the decision. Reviewer identity and timestamps are taken from
// the authenticated session inside 0010's guard trigger — the client has no
// column through which it could claim to be someone else (AI-02, §12).
import { z } from 'zod';
import { REVIEW_STATES } from '@/lib/ai/status';

export const insightIdSchema = z.string().uuid();

export const generateInsightsSchema = z.object({
  patientId: z.string().uuid(),
});

/** The decision a clinician may record against an unreviewed insight. */
export const reviewInsightSchema = z.object({
  insightId: insightIdSchema,
  decision: z.enum(['accepted', 'dismissed']),
});
