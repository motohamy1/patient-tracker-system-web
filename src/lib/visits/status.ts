// src/lib/visits/status.ts — the visit stage vocabulary (VIS-01).
//
// Byte-identical TypeScript mirror of migration 0006's `stage` check
// constraint, following the patients/status.ts discipline: the array is
// derived FROM the union so both sides fail typecheck together, and the SQL
// check can never drift from this file without a visible edit.
//
// Three stages, no more: Pre-Visit → During Visit → After Visit (§19 Ph007).
// `nextStage` is the ONLY place the linear order is expressed, so a UI stepper
// and a server transition can never disagree about the sequence.
export type VisitStage = 'pre_visit' | 'during_visit' | 'after_visit';

export const VISIT_STAGES = [
  'pre_visit',
  'during_visit',
  'after_visit',
] as const satisfies readonly VisitStage[];

export const DEFAULT_VISIT_STAGE: VisitStage = 'pre_visit';

/** Sentence-case labels (§7 copy contract). */
export const VISIT_STAGE_LABELS: Record<VisitStage, string> = {
  pre_visit: 'Pre-visit',
  during_visit: 'During visit',
  after_visit: 'After visit',
};

/** The sanctioned status tint per stage (INV-04 closed set: info/warning/success). */
export const VISIT_STAGE_TOKEN: Record<VisitStage, 'info' | 'warning' | 'success'> = {
  pre_visit: 'info',
  during_visit: 'warning',
  after_visit: 'success',
};

/** The linear successor, or null at the final stage. */
export function nextStage(stage: VisitStage): VisitStage | null {
  const index = VISIT_STAGES.indexOf(stage);
  return VISIT_STAGES[index + 1] ?? null;
}

/** 0-based position in the workflow — the stepper's index. */
export function stageIndex(stage: VisitStage): number {
  return VISIT_STAGES.indexOf(stage);
}

/** Visit provenance source vocabulary (mirrors migration 0006's check). */
export type VisitSource = 'clinician' | 'ai-extracted' | 'imported';

export const VISIT_SOURCE_LABELS: Record<VisitSource, string> = {
  clinician: 'Clinician-authored',
  'ai-extracted': 'AI-extracted, awaiting review',
  imported: 'Imported',
};
