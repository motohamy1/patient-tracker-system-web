# 13-04: Phase proof

**What to build:** The human-acceptance leg of Phase 13: cloud migration apply, the patient-scoped RLS/pgTAP evidence, the owner test pass (a real patient account), visual baselines, and the phase verdicts.

**Blocked by:** 13-03 (the quick log)

**Status:** ready-for-human

- [ ] Migration 0012 applied to the cloud Supabase project
- [ ] pgTAP suites for `patient_observations`: patient-can-log-own, patient-CANNOT-log-another-patient's, no patient update/delete, staff-select visibility, org isolation; the patients self-SELECT re-verified
- [ ] Owner test pass: sign in as the seeded patient, log a weight and a note, confirm both appear in the Health Snapshot, confirm no provider-only authoring is reachable from any patient surface
- [ ] Visual baselines regenerated for Patient Home (all applicable surfaces/viewports)
- [ ] `13-VERIFICATION.md` written: 12-row visual QA, INV-01..17, PTH-01..03 trace (§14, §26, §27), deferred items listed
- [ ] ROADMAP.md + STATE.md synced to phase-13 agent-complete

**Gate evidence at close:** §20.4 owner gate · §21 visual QA · §22 role-based acceptance (patient + unauthorized accounts)

## Notes

- Deferred to the owner (per session constraints): cloud applies, pgTAP against the live project, the interactive patient-account pass, and baseline regeneration. Same split as Phases 07–12.
