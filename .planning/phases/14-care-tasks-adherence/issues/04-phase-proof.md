# 14-04: Phase proof

**What to build:** The human-acceptance leg of Phase 14: cloud migration apply, RLS/pgTAP evidence, the owner test pass (assign as a doctor, complete as the patient), visual baselines, and the phase verdicts — including the §27 anti-gamification check on both surfaces.

**Blocked by:** 14-03 (the surfaces)

**Status:** ready-for-human

- [ ] Migration 0013 applied to the cloud Supabase project
- [ ] pgTAP suites for both tables: staff read; doctor-only authoring; patient-self-only completion (a patient CANNOT complete another patient's task); completion integrity to the task's patient/org; no completion update/delete; org isolation
- [ ] Owner test pass: doctor assigns a task with a due date, patient marks it done, the completion appears with actor + timestamp, the provider Overview shows the count
- [ ] Visual baselines regenerated for the patient Care tasks region and the provider Overview region (all applicable surfaces/viewports)
- [ ] `14-VERIFICATION.md` written: 12-row visual QA, INV-01..17, TASK-01..03 trace (§14, §27), deferred items listed
- [ ] ROADMAP.md + STATE.md synced to phase-14 agent-complete

**Gate evidence at close:** §20.4 owner gate · §21 visual QA · §22 role-based acceptance

## Notes

- Deferred to the owner (per session constraints): cloud applies, pgTAP against the live project, the interactive two-role pass, and baseline regeneration. Same split as Phases 07–13.
