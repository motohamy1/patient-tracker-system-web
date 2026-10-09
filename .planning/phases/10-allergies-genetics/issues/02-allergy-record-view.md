# 10-02: Allergy record + view with provenance (ALG-01)

**What to build:** A clinician can record an allergy (allergen, reaction, severity, status, notes) and see it with its provenance; everyone with staff access can view allergies without gaining authoring rights.

**Blocked by:** 10-01

**Status:** resolved

- [ ] `recordAllergyAction` parses with Zod, requires `CAN_AUTHOR_CLINICAL` server-side, returns a typed result (never throws on expected failure)
- [ ] Severity and status are the closed vocabularies mirrored in TypeScript; no new value is invented client-side
- [ ] Allergies list renders allergen, reaction, severity (closed tint family), status, noting date and provenance (`source` + `verification` labels)
- [ ] Non-authors (nurse/receptionist) read-only: no record control rendered; the action refuses them anyway
- [ ] Resolving an allergy is an explicit clinical action with the §7 verb-as-heading confirmation
- [ ] Empty/error/retry states deliberate (§24)

**Gate evidence at close:** ALG-01 · §7 · §24 · INV-04 (closed severity tints)
