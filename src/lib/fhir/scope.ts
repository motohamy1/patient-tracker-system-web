// src/lib/fhir/scope.ts — the documented mapping scope (Phase 21; INTR-01/02).
//
// THE SCOPE DECISION, once and forever: the mapping exists to make this
// workspace's clinical record EXCHANGEABLE — a receiving system gets the
// patient's story in FHIR R4 without the relational schema leaking. It is a
// projection layer, never a second source of truth: the relational model
// (PRODUCT-MASTER-SPEC §13) stays canonical, and nothing in the UI reads
// FHIR (INTR-02).
//
// MAPPED (the clinical chain §13 names):
//   Patient            → Patient
//   Encounter/Visit    → Encounter
//   Medications        → MedicationRequest
//   Labs               → Observation
//   Imaging            → DiagnosticReport
//   Allergies          → AllergyIntolerance
//   Vitals/observations→ Observation
//
// DELIBERATELY NOT MAPPED (recorded so the omission is a decision):
//   - Payments (invoices/payments): financial, not clinical; a billing
//     exchange is a separate concern with its own consent posture.
//   - Conversations (messages): the thread is a workspace surface, and a
//     message is not a clinical statement (COMM-02's boundary).
//   - Telehealth sessions: the session IS the encounter; mapping it twice
//     would duplicate the Encounter.
//   - Care tasks: a workflow object, exchangeable only inside this product's
//     care-plan semantics.
//   - Channel deliveries: operational plumbing, never clinical content.
//   - Documents' binary content: referenced by title/contentType where a
//     result row exists; the bytes stay in storage behind signed URLs.
export const FHIR_MAPPED_RESOURCES = [
  'Patient',
  'Encounter',
  'MedicationRequest',
  'Observation',
  'DiagnosticReport',
  'AllergyIntolerance',
] as const;

export const FHIR_OUT_OF_SCOPE = [
  'Invoices and payments (financial, not clinical)',
  'Conversation messages (a workspace surface, not a clinical statement)',
  'Telehealth sessions (the encounter itself — mapping it twice duplicates it)',
  'Care tasks (a workflow object with product-specific semantics)',
  'Channel deliveries (operational plumbing)',
  'Document bytes (stay behind signed URLs; referenced by metadata only)',
] as const;

/** The FHIR R4 code systems this mapping emits (stable, versioned). */
export const FHIR_CODE_SYSTEMS = {
  encounterClass: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
  encounterType: 'urn:patient-tracker:visit-type',
  medicationRxNorm: 'http://www.nlm.nih.gov/research/umls/rxnorm',
  labAnalyte: 'urn:patient-tracker:lab-analyte',
  labFlag: 'http://terminology.hl7.org/CodeSystem/observation-interpretation',
  imagingModality: 'http://dicom.nema.org/resources/ontology/DCM',
  allergySeverity: 'urn:patient-tracker:allergy-severity',
  observationCategory: 'http://terminology.hl7.org/CodeSystem/observation-category',
  vitalSigns: 'http://terminology.hl7.org/CodeSystem/observation-category',
  provenance: 'urn:patient-tracker:source',
  verification: 'urn:patient-tracker:verification',
} as const;

/**
 * THE INVARIANT (INTR-02): no FHIR-shaped UI. These strings exist so a
 * layout, route or workspace surface that emits them can be caught in
 * review — the mapping is an interoperability layer, never a screen.
 */
export const FHIR_UI_FORBIDDEN_TOKENS = ['resourceType', 'Bundle', 'fullUrl', 'valueQuantity'] as const;
