// src/lib/fhir/bundle.ts — the projection bundle (Phase 21, ticket 21-03;
// INTR-01/03).
//
// Composes the per-record mappings into a FHIR R4 Bundle of type
// `collection` over ONE patient: the identity first, then the clinical chain
// in the order a receiver reads a story (encounters, medications,
// observations, reports, allergies). Pure: the caller reads the rows; this
// module only projects them.
import type { PatientRecord } from '@/lib/patients/queries';
import type { VisitRecord } from '@/lib/visits/queries';
import type { MedicationRecord } from '@/lib/medications/queries';
import type { LabResultRecord } from '@/lib/labs/queries';
import type { AllergyRecord } from '@/lib/allergies/queries';
import type { PatientObservationRecord } from '@/lib/patient/queries';
import {
  mapAllergy,
  mapEncounter,
  mapLabObservation,
  mapMedicationRequest,
  mapPatient,
  mapVitalObservation,
} from '@/lib/fhir/mapping';
import type { FhirBundle, FhirBundleEntry } from '@/lib/fhir/types';

export type PatientProjection = {
  patient: PatientRecord;
  visits: readonly VisitRecord[];
  medications: readonly MedicationRecord[];
  labs: readonly LabResultRecord[];
  allergies: readonly AllergyRecord[];
  observations: readonly PatientObservationRecord[];
};

/**
 * Project one patient's clinical record into a FHIR Bundle. The relational
 * model stays canonical; this is a projection, and the provenance travels
 * inside each resource's meta.
 */
export function buildPatientBundle(
  projection: PatientProjection,
  options: { timestamp?: string } = {},
): FhirBundle {
  const entries: FhirBundleEntry[] = [];

  entries.push({ fullUrl: `urn:uuid:${projection.patient.id}`, resource: mapPatient(projection.patient) });

  for (const visit of projection.visits) {
    entries.push({ fullUrl: `urn:uuid:encounter-${visit.id}`, resource: mapEncounter(visit, projection.patient.id) });
  }
  for (const medication of projection.medications) {
    entries.push({ fullUrl: `urn:uuid:medicationrequest-${medication.id}`, resource: mapMedicationRequest(medication) });
  }
  for (const observation of projection.observations) {
    entries.push({
      fullUrl: `urn:uuid:observation-${observation.id}`,
      resource: mapVitalObservation(observation, projection.patient.id),
    });
  }
  for (const lab of projection.labs) {
    entries.push({ fullUrl: `urn:uuid:observation-lab-${lab.id}`, resource: mapLabObservation(lab, projection.patient.id) });
  }
  for (const allergy of projection.allergies) {
    entries.push({ fullUrl: `urn:uuid:allergyintolerance-${allergy.id}`, resource: mapAllergy(allergy) });
  }

  return {
    resourceType: 'Bundle',
    type: 'collection',
    ...(options.timestamp !== undefined ? { timestamp: options.timestamp } : {}),
    entry: entries,
  };
}
