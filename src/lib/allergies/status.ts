// src/lib/allergies/status.ts — allergy vocabularies (ALG-01; 0009 mirror).
export type AllergySeverity = 'mild' | 'moderate' | 'severe' | 'anaphylaxis';

export const ALLERGY_SEVERITIES = [
  'mild',
  'moderate',
  'severe',
  'anaphylaxis',
] as const satisfies readonly AllergySeverity[];

export const ALLERGY_SEVERITY_LABELS: Record<AllergySeverity, string> = {
  mild: 'Mild',
  moderate: 'Moderate',
  severe: 'Severe',
  anaphylaxis: 'Anaphylaxis',
};

/** Closed D-04 tint family — warning for severity, critical for anaphylaxis. */
export const ALLERGY_SEVERITY_TOKEN: Record<AllergySeverity, 'neutral' | 'warning' | 'critical'> = {
  mild: 'neutral',
  moderate: 'warning',
  severe: 'warning',
  anaphylaxis: 'critical',
};

export type AllergyStatus = 'active' | 'resolved';

export const ALLERGY_STATUSES = ['active', 'resolved'] as const satisfies readonly AllergyStatus[];

export const ALLERGY_STATUS_LABELS: Record<AllergyStatus, string> = {
  active: 'Active',
  resolved: 'Resolved',
};

/** Provenance vocabularies (mirrors 0009). AI-extracted never reads as verified. */
export type ClinicalSource = 'clinician' | 'ai-extracted' | 'imported';
export type VerificationState = 'clinician-verified' | 'ai-extracted';

export const CLINICAL_SOURCE_LABELS: Record<ClinicalSource, string> = {
  clinician: 'Clinician-authored',
  'ai-extracted': 'AI-extracted, awaiting review',
  imported: 'Imported',
};

export const VERIFICATION_LABELS: Record<VerificationState, string> = {
  'clinician-verified': 'Clinician-verified',
  'ai-extracted': 'AI-extracted, awaiting review',
};
