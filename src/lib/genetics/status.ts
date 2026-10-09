// src/lib/genetics/status.ts — genetics vocabularies (ALG-02; 0009 mirror).
export type GeneticKind = 'variant' | 'pharmacogenomic' | 'hereditary-condition' | 'other';

export const GENETIC_KINDS = [
  'variant',
  'pharmacogenomic',
  'hereditary-condition',
  'other',
] as const satisfies readonly GeneticKind[];

export const GENETIC_KIND_LABELS: Record<GeneticKind, string> = {
  variant: 'Variant',
  pharmacogenomic: 'Pharmacogenomic',
  'hereditary-condition': 'Hereditary condition',
  other: 'Other',
};

export type GeneticSignificance =
  | 'pathogenic'
  | 'likely_pathogenic'
  | 'uncertain'
  | 'likely_benign'
  | 'benign';

export const GENETIC_SIGNIFICANCES = [
  'pathogenic',
  'likely_pathogenic',
  'uncertain',
  'likely_benign',
  'benign',
] as const satisfies readonly GeneticSignificance[];

export const GENETIC_SIGNIFICANCE_LABELS: Record<GeneticSignificance, string> = {
  pathogenic: 'Pathogenic',
  likely_pathogenic: 'Likely pathogenic',
  uncertain: 'Uncertain significance',
  likely_benign: 'Likely benign',
  benign: 'Benign',
};

/** Closed tint family (critical for pathogenic … success for benign). */
export const GENETIC_SIGNIFICANCE_TOKEN: Record<
  GeneticSignificance,
  'critical' | 'warning' | 'info' | 'success' | 'neutral'
> = {
  pathogenic: 'critical',
  likely_pathogenic: 'warning',
  uncertain: 'info',
  likely_benign: 'success',
  benign: 'success',
};
