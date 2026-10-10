# 21-02: Observations, reports and allergies

**What to build:** The rest of the clinical chain's projection: labs to Observation, imaging to DiagnosticReport, vitals to Observation, allergies to AllergyIntolerance — with the record's severity/flag/verification carried across.

**Blocked by:** 21-01 (the scope + core)

**Status:** resolved

- [x] `mapLabObservation`: analyte, value+unit, reference range, interpretation (the closed lab-flag vocabulary → FHIR interpretation codes)
- [x] `mapImagingReport`: modality as the report code, the impression as the conclusion, the linked document by metadata only (bytes stay behind signed URLs — scope.ts)
- [x] `mapVitalObservation`: kind, value, unit, note; a note-only entry maps as valueString
- [x] `mapAllergy`: allergen, the single reaction as reaction[0], severity → criticality, and the verification state into BOTH clinicalStatus and meta (§23)
- [x] Closed vocabularies map to closed FHIR code sets; an unmapped value degrades to text, never to a guess

**Gate evidence at close:** INTR-01 · §23

## Notes

- The allergy mapping is the clearest provenance case: an unreviewed AI-extracted allergy must not read as clinician-confirmed to a receiving system.
