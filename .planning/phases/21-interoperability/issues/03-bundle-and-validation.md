# 21-03: The bundle and the validation gate

**What to build:** The projection bundle over one patient (identity first, then the clinical chain in story order) and the pure structural validation that keeps the projection honest.

**Blocked by:** 21-02 (the mappings)

**Status:** resolved

- [x] `bundle.ts`: `buildPatientBundle(projection)` — a FHIR Bundle of type `collection`, stable fullUrls, deterministic entry order (patient, encounters, medication requests, vital observations, lab observations, allergies)
- [x] `validate.ts`: the pure structural gate — resourceType/id/required-fields per resource type, duplicate fullUrl detection, bundle type check; NOT a full FHIR validator (the StructureDefinitions are the exhaustive contract), the owner's unit target
- [x] INTR-02 proven: no `resourceType`/`Bundle`/`fullUrl`/`valueQuantity` token anywhere in `src/components` or `src/app` — the mapping is an interoperability layer, never a screen
- [x] Pure end to end: no I/O, no network, no client/server directive anywhere in `src/lib/fhir`

**Gate evidence at close:** INTR-01/02/03 · §13

## Notes

- An exchange endpoint (a route or a server action emitting the bundle) is deliberately out of scope for this phase: the mapping + validation are the deliverable, and an API surface is a product decision (§8's brief).
