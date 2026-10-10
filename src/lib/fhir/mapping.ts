// src/lib/fhir/mapping.ts — the pure projections: relational records →
// FHIR R4 resources (Phase 21, ticket 21-01/21-02; INTR-01).
//
// Pure functions, no I/O, no client/server directive: each takes the SAME
// record shape the workspace UI reads and returns one FHIR resource. The
// provenance from the relational model travels INSIDE the resource's meta
// (§23: an extracted or imported record is never indistinguishable from a
// clinician-verified one — the exchange carries that distinction too).
import type { PatientRecord } from '@/lib/patients/queries';
import type { VisitRecord } from '@/lib/visits/queries';
import type { VisitStage } from '@/lib/visits/status';
import type { MedicationRecord } from '@/lib/medications/queries';
import type { LabResultRecord } from '@/lib/labs/queries';
import type { ImagingResultRecord } from '@/lib/imaging/queries';
import type { AllergyRecord } from '@/lib/allergies/queries';
import type { PatientObservationRecord } from '@/lib/patient/queries';
import type { FhirCoding } from '@/lib/fhir/types';
import {
  FHIR_CODE_SYSTEMS,
} from '@/lib/fhir/scope';
import type {
  FhirAllergyIntolerance,
  FhirCodeableConcept,
  FhirDiagnosticReport,
  FhirEncounter,
  FhirMedicationRequest,
  FhirObservation,
  FhirPatient,
  FhirReference,
} from '@/lib/fhir/types';

function subject(patientId: string): FhirReference {
  return { reference: `Patient/${patientId}` };
}

/** The provenance tag the relational model carries (never dropped). */
function provenance(source: string): FhirCoding[] {
  return [{ system: FHIR_CODE_SYSTEMS.provenance, code: source, display: source }];
}

// ── Patient ────────────────────────────────────────────────────────────────

export function mapPatient(patient: PatientRecord): FhirPatient {
  return {
    resourceType: 'Patient',
    id: patient.id,
    meta: {
      tag: provenance('clinician'),
    },
    identifier: [{ system: 'urn:patient-tracker:mrn', value: patient.mrn }],
    name: [{ family: patient.lastName, given: [patient.firstName] }],
    gender: patient.sex === 'M' ? 'male' : patient.sex === 'F' ? 'female' : 'unknown',
    birthDate: patient.dob,
  };
}

// ── Encounter ──────────────────────────────────────────────────────────────

const VISIT_STAGE_TO_STATUS: Record<VisitStage, FhirEncounter['status']> = {
  pre_visit: 'planned',
  during_visit: 'in-progress',
  after_visit: 'finished',
};

const VISIT_SOURCE_TO_META: Record<string, string> = {
  clinician: 'clinician',
  'ai-extracted': 'ai-extracted',
  imported: 'imported',
};

export function mapEncounter(visit: VisitRecord, patientId?: string): FhirEncounter {
  return {
    resourceType: 'Encounter',
    id: visit.id,
    meta: {
      tag: provenance(VISIT_SOURCE_TO_META[visit.source] ?? 'clinician'),
      lastUpdated: visit.updatedAt,
    },
    status: VISIT_STAGE_TO_STATUS[visit.stage],
    class: { system: FHIR_CODE_SYSTEMS.encounterClass, code: 'AMB', display: 'ambulatory' },
    type: visit.visitType !== null ? [{ text: visit.visitType }] : undefined,
    subject: subject(patientId ?? visit.patientId),
    period: { start: visit.scheduledAt },
    reasonCode: visit.reason !== null ? [{ text: visit.reason }] : undefined,
    hospitalization: visit.followUp !== null ? { dischargeDisposition: { text: visit.followUp } } : undefined,
  };
}

// ── MedicationRequest ──────────────────────────────────────────────────────

const MEDICATION_STATUS_TO_FHIR: Record<string, FhirMedicationRequest['status']> = {
  active: 'active',
  paused: 'on-hold',
  stopped: 'stopped',
};

export function mapMedicationRequest(medication: MedicationRecord): FhirMedicationRequest {
  const doseText =
    medication.doseAmount !== null
      ? `${medication.doseAmount}${medication.doseUnit !== null ? ` ${medication.doseUnit}` : ''}`
      : undefined;

  return {
    resourceType: 'MedicationRequest',
    id: medication.id,
    meta: {
      tag: [
        ...provenance(medication.source),
        // An unreviewed AI-extracted medication carries its verification
        // state into the exchange (§23) — the receiver can tell it apart
        // exactly as this workspace's UI does.
        ...(medication.verification !== 'clinician-verified'
          ? [{ system: FHIR_CODE_SYSTEMS.verification, code: medication.verification }]
          : []),
      ],
      lastUpdated: medication.updatedAt,
    },
    status: MEDICATION_STATUS_TO_FHIR[medication.status] ?? 'active',
    intent: 'order',
    subject: subject(medication.patientId),
    medicationCodeableConcept: {
      coding: medication.rxnormCode !== null
        ? [{ system: FHIR_CODE_SYSTEMS.medicationRxNorm, code: medication.rxnormCode, display: medication.name }]
        : undefined,
      text: medication.name,
    },
    authoredOn: medication.startedAt,
    dosageInstruction: [
      {
        text: doseText,
        timing: medication.frequency !== null ? { code: { text: medication.frequency.replace(/_/g, ' ') } } : undefined,
        route: medication.route !== null ? { text: medication.route } : undefined,
      },
    ],
  };
}

// ── Observation (labs) ─────────────────────────────────────────────────────

const LAB_FLAG_TO_INTERPRETATION: Record<string, { code: string; display: string }> = {
  normal: { code: 'N', display: 'Normal' },
  low: { code: 'L', display: 'Low' },
  high: { code: 'H', display: 'High' },
  critical: { code: 'AA', display: 'Critical' },
};

export function mapLabObservation(lab: LabResultRecord, patientId: string): FhirObservation {
  return {
    resourceType: 'Observation',
    id: lab.id,
    meta: { tag: provenance(lab.source) },
    status: 'final',
    category: [
      {
        coding: [{ system: FHIR_CODE_SYSTEMS.observationCategory, code: 'laboratory', display: 'Laboratory' }],
      },
    ],
    code: { coding: [{ system: FHIR_CODE_SYSTEMS.labAnalyte, code: lab.analyte, display: lab.analyte }], text: lab.analyte },
    subject: subject(patientId),
    effectiveDateTime: lab.resultedAt,
    valueQuantity: lab.value !== null ? { value: lab.value, unit: lab.unit ?? undefined } : undefined,
    interpretation: lab.flag !== null
      ? [{ coding: [{ system: FHIR_CODE_SYSTEMS.labFlag, ...(LAB_FLAG_TO_INTERPRETATION[lab.flag] ?? {}) }] }]
      : undefined,
    referenceRange: lab.referenceRange !== null ? [{ text: lab.referenceRange }] : undefined,
  };
}

// ── DiagnosticReport (imaging) ─────────────────────────────────────────────

export function mapImagingReport(imaging: ImagingResultRecord, patientId: string): FhirDiagnosticReport {
  return {
    resourceType: 'DiagnosticReport',
    id: imaging.id,
    meta: { tag: provenance(imaging.source) },
    status: 'final',
    category: [
      { coding: [{ system: FHIR_CODE_SYSTEMS.observationCategory, code: 'imaging', display: 'Imaging' }] },
    ],
    code: {
      coding: imaging.orderModality !== null
        ? [{ system: FHIR_CODE_SYSTEMS.imagingModality, code: imaging.orderModality }]
        : undefined,
      text: imaging.orderModality ?? 'Imaging result',
    },
    subject: subject(patientId),
    effectiveDateTime: imaging.resultedAt,
    conclusion: imaging.impression,
    presentedForm: [{ title: imaging.documentName ?? undefined }],
  };
}

// ── AllergyIntolerance ─────────────────────────────────────────────────────

const ALLERGY_STATUS_TO_CODE: Record<string, string> = {
  active: 'active',
  resolved: 'resolved',
};

const ALLERGY_SEVERITY_TO_CRITICALITY: Record<string, 'low' | 'high' | 'unable-to-assess'> = {
  mild: 'low',
  moderate: 'low',
  severe: 'high',
  anaphylaxis: 'high',
};

const VERIFICATION_TO_FHIR = {
  'clinician-verified': 'confirmed',
  'ai-extracted': 'unconfirmed',
} as const;

export function mapAllergy(allergy: AllergyRecord): FhirAllergyIntolerance {
  return {
    resourceType: 'AllergyIntolerance',
    id: allergy.id,
    meta: {
      tag: [
        ...provenance(allergy.source),
        { system: FHIR_CODE_SYSTEMS.verification, code: VERIFICATION_TO_FHIR[allergy.verification] },
      ],
    },
    clinicalStatus: {
      coding: [{ code: ALLERGY_STATUS_TO_CODE[allergy.status] ?? 'active' }],
    },
    verificationStatus: {
      coding: [{ code: VERIFICATION_TO_FHIR[allergy.verification] }],
    },
    type: 'allergy',
    criticality: allergy.severity !== null ? ALLERGY_SEVERITY_TO_CRITICALITY[allergy.severity] : undefined,
    code: { text: allergy.allergen },
    patient: subject(allergy.patientId),
    recordedDate: allergy.notedAt,
    // The record's single reaction becomes FHIR's reaction[0]. — an
    // unreviewed AI-extracted allergy never reads as clinician-confirmed,
    // on either side of the exchange (§23).
    reaction: allergy.reaction !== null
      ? [{ manifestation: [{ text: allergy.reaction }], severity: allergy.severity ?? undefined }]
      : undefined,
    note: allergy.notes !== null ? [{ text: allergy.notes }] : undefined,
  };
}

// ── Observation (patient vitals) ───────────────────────────────────────────

export function mapVitalObservation(observation: PatientObservationRecord, patientId: string): FhirObservation {
  return {
    resourceType: 'Observation',
    id: observation.id,
    meta: { tag: provenance(observation.source) },
    status: 'final',
    category: [
      { coding: [{ system: FHIR_CODE_SYSTEMS.vitalSigns, code: 'vital-signs', display: 'Vital signs' }] },
    ],
    code: { text: observation.kind.replace(/_/g, ' ') },
    subject: subject(patientId),
    effectiveDateTime: observation.observedAt,
    valueQuantity:
      observation.valueNumeric !== null
        ? { value: observation.valueNumeric, unit: observation.unit ?? undefined }
        : undefined,
    valueString: observation.valueNumeric === null ? (observation.note ?? undefined) : undefined,
    note: observation.note !== null && observation.valueNumeric !== null ? [{ text: observation.note }] : undefined,
  };
}

// Re-export the record types the mapping consumes so the scope of the
// projection is visible from one module.
export type { PatientRecord, VisitRecord, MedicationRecord, LabResultRecord, ImagingResultRecord, AllergyRecord, PatientObservationRecord };
