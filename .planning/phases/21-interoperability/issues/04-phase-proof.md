# 21-04: Phase proof

**What to build:** The human-acceptance leg of Phase 21: the owner's unit pass over the pure mappings and the validation, the scope verdicts, and the phase record.

**Blocked by:** 21-03 (the bundle + validation)

**Status:** ready-for-human

- [ ] Owner unit pass over `src/lib/fhir/*` (pure): every mapping's field coverage, the closed-vocabulary maps, the validation's required fields, the duplicate-fullUrl proof
- [ ] A sample patient projected by hand (a visit, an active medication with an RxNorm code, a lab with a flag, an AI-extracted allergy) and checked against FHIR R4's required fields
- [ ] The scope verdicts: confirm the six mapped resources and the six deliberate non-mappings (§8's brief)
- [ ] `21-VERIFICATION.md` written: INV-01..17, the INTR-01..03 trace, the scope table, deferred items
- [ ] ROADMAP.md + STATE.md synced to phase-21 agent-complete

**Gate evidence at close:** §20.4 owner gate · §22 acceptance

## Notes

- Deferred to the owner (per session constraints): the unit pass and the scope verdicts. Same split as Phases 07–20. No migration this phase.
