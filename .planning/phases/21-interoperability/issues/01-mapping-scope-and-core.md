# 21-01: The mapping scope and the core clinical chain

**What to build:** The documented scope decision and the pure projections of the clinical chain onto FHIR R4: Patient, Encounter, MedicationRequest. No DB tables, no I/O, no UI.

**Blocked by:** None

**Status:** resolved

- [x] `scope.ts`: the one-time scope decision — the six mapped resources, the six deliberate non-mappings (payments, messages, telehealth sessions, care tasks, deliveries, document bytes) each with its reason, the stable code systems, and the `FHIR_UI_FORBIDDEN_TOKENS` invariant list (INTR-02's tripwire)
- [x] `types.ts`: the hand-maintained FHIR R4 subset (only what the relational model carries; no codegen)
- [x] `mapping.ts`: pure `mapPatient` / `mapEncounter` / `mapMedicationRequest` — the record's provenance travels inside the resource's meta (§23: an AI-extracted or imported record is never indistinguishable from a clinician-verified one on either side of the exchange)
- [x] The relational model stays canonical; no new table, no row written anywhere by this phase

**Gate evidence at close:** INTR-01 (mapping on top of the clinical model) · §13 · §23

## Notes

- RxNorm codes the medications already carry flow into MedicationRequest.medicationCodeableConcept; a medication without one maps its name as text — the mapping never invents a code.
