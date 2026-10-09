// src/lib/ai/status.ts — AI insight vocabularies (Phase 11; 0010 mirror).
//
// The closed vocabularies here mirror migration 0010's check constraints
// byte-for-byte (the drift discipline every clinical table follows). §10's
// priority questions map onto five insight kinds; nothing else can be stored.
export type InsightKind = 'change' | 'summary' | 'attention' | 'trend' | 'documentation-gap';

export const INSIGHT_KINDS = [
  'change',
  'summary',
  'attention',
  'trend',
  'documentation-gap',
] as const satisfies readonly InsightKind[];

export const INSIGHT_KIND_LABELS: Record<InsightKind, string> = {
  change: 'What changed',
  summary: 'Summary',
  attention: 'Needs attention',
  trend: 'Trends',
  'documentation-gap': 'Documentation gaps',
};

/** One calm sentence per kind explaining what the group is (§7 copy contract). */
export const INSIGHT_KIND_BLURBS: Record<InsightKind, string> = {
  change: 'New or changed activity in the recent window compared with the period before it.',
  summary: 'A structured summary of the record for the selected period.',
  attention: 'Facts in the record that need a clinician to look.',
  trend: 'The same measurement taken more than once, read as a direction.',
  'documentation-gap': 'Observations about fields the record has not filled in.',
};

/**
 * Provenance (§10): who or what produced this output. `system-derived` is the
 * deterministic generator of this phase; `ai-generated` is reserved for a
 * model-backed generator a later iteration may add — the distinction is
 * already enforceable at the data layer.
 */
export type InsightProvenance = 'system-derived' | 'ai-generated';

export const INSIGHT_PROVENANCE_LABELS: Record<InsightProvenance, string> = {
  'system-derived': 'System-derived',
  'ai-generated': 'AI-generated',
};

/**
 * Verification (§23): an AI output defaults to `ai-extracted` so it can never
 * render as clinician-verified. Accepting an insight is a clinician's decision
 * about the observation and flips this to `clinician-verified`.
 */
export type InsightVerification = 'ai-extracted' | 'clinician-verified';

export const INSIGHT_VERIFICATION_LABELS: Record<InsightVerification, string> = {
  'ai-extracted': 'Unreviewed AI output',
  'clinician-verified': 'Confirmed by clinician',
};

/** The human-review lifecycle (AI-02). */
export type ReviewState = 'pending' | 'dismissed' | 'accepted';

export const REVIEW_STATES = ['pending', 'dismissed', 'accepted'] as const satisfies readonly ReviewState[];

export const REVIEW_STATE_LABELS: Record<ReviewState, string> = {
  pending: 'Awaiting review',
  dismissed: 'Dismissed',
  accepted: 'Accepted',
};

/**
 * A structured reference to the REAL source row an insight was derived from.
 * An insight without evidence is not allowed to exist (0010's check).
 */
export type InsightEvidenceRef = {
  table:
    | 'patients'
    | 'visits'
    | 'medications'
    | 'medication_events'
    | 'lab_orders'
    | 'lab_results'
    | 'imaging_orders'
    | 'imaging_results'
    | 'allergies';
  id: string;
  label: string;
};

/** The period an insight covers; null for point-in-time findings. */
export type InsightWindow = { from: string; to: string };

/** A stored insight row, mapped to camelCase like every other domain record. */
export type AiInsightRecord = {
  id: string;
  orgId: string;
  patientId: string;
  kind: InsightKind;
  title: string;
  body: string;
  evidence: readonly InsightEvidenceRef[];
  window: InsightWindow | null;
  provenance: InsightProvenance;
  verification: InsightVerification;
  reviewState: ReviewState;
  reviewedBy: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
};
