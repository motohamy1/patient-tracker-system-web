// src/lib/fhir/validate.ts — the structural validation of the emitted
// resources (Phase 21, ticket 21-03; INTR-03).
//
// Pure and deliberately small: FHIR requires a resourceType, an id and a
// handful of required fields per type, and this workspace's mapping must
// never emit a resource that violates them. This is NOT a full FHIR
// validator (the official StructureDefinitions are the exhaustive contract);
// it is the invariant gate that keeps the projection honest — and the
// owner's unit target (no I/O, no network).
import type { FhirBundle, FhirBundleEntry } from '@/lib/fhir/types';

export type ValidationIssue = {
  path: string;
  message: string;
};

export type ValidationResult = {
  ok: boolean;
  issues: ValidationIssue[];
};

/** The required fields per resource type, as FHIR R4 defines them. */
const REQUIRED: Record<FhirBundleEntry['resource']['resourceType'], string[]> = {
  Patient: [],
  Encounter: ['status', 'subject'],
  MedicationRequest: ['status', 'intent', 'subject'],
  Observation: ['status', 'code', 'subject'],
  DiagnosticReport: ['status', 'code', 'subject'],
  AllergyIntolerance: ['patient'],
};

function isPresent(value: unknown): boolean {
  if (value === undefined || value === null) return false;
  if (typeof value === 'string') return value.trim() !== '';
  return true;
}

/** Validate one resource (the structural subset, INTR-03). */
export function validateResource(resource: FhirBundleEntry['resource']): ValidationResult {
  const issues: ValidationIssue[] = [];

  if (resource.resourceType === undefined) {
    issues.push({ path: 'resourceType', message: 'A FHIR resource must carry a resourceType.' });
    return { ok: false, issues };
  }
  if (!isPresent(resource.id)) {
    issues.push({ path: 'id', message: `A ${resource.resourceType} must carry an id.` });
  }

  for (const field of REQUIRED[resource.resourceType] ?? []) {
    if (!isPresent((resource as unknown as Record<string, unknown>)[field])) {
      issues.push({ path: field, message: `A ${resource.resourceType} must carry ${field}.` });
    }
  }

  return { ok: issues.length === 0, issues };
}

/** Validate a whole bundle: every resource structurally valid, entries unique. */
export function validateBundle(bundle: FhirBundle): ValidationResult {
  const issues: ValidationIssue[] = [];
  const seen = new Set<string>();

  if (bundle.resourceType !== 'Bundle') {
    issues.push({ path: 'resourceType', message: 'The bundle must be a FHIR Bundle.' });
  }
  if (bundle.type !== 'collection') {
    issues.push({ path: 'type', message: 'This workspace emits bundles of type "collection".' });
  }

  bundle.entry.forEach((entry, index) => {
    if (!isPresent(entry.fullUrl)) {
      issues.push({ path: `entry[${index}].fullUrl`, message: 'Every entry must carry a fullUrl.' });
    } else {
      if (seen.has(entry.fullUrl)) {
        issues.push({ path: `entry[${index}].fullUrl`, message: `Duplicate fullUrl: ${entry.fullUrl}.` });
      }
      seen.add(entry.fullUrl);
    }
    const resourceResult = validateResource(entry.resource);
    for (const issue of resourceResult.issues) {
      issues.push({ path: `entry[${index}].resource.${issue.path}`, message: issue.message });
    }
  });

  return { ok: issues.length === 0, issues };
}
