# 17-04: Phase proof

**What to build:** The human-acceptance leg of Phase 17: cloud migration apply, RLS/pgTAP evidence, the owner test pass, visual baselines, and the phase verdicts.

**Blocked by:** 17-03 (the surfaces)

**Status:** ready-for-human

- [ ] Migration 0016 applied to the cloud Supabase project
- [ ] pgTAP suites: one active session per visit; transitions follow the closed vocabulary (a skip/repeat/backward move refused); the visit must belong to the same org+patient; only doctors write; a patient reads only their own session; org isolation
- [ ] Owner test pass: schedule a telehealth appointment, start the consultation from the appointment, confirm the visit moved to During Visit and the workspace links work, complete with documentation, confirm the visit reads as After Visit with the documentation in the visit record
- [ ] Visual baselines regenerated for the consultation surfaces (provider list, consultation workspace, patient join)
- [ ] `17-VERIFICATION.md` written: 12-row visual QA, INV-01..17, TH-01..03 trace, deferred items listed
- [ ] ROADMAP.md + STATE.md synced to phase-17 agent-complete

**Gate evidence at close:** §20.4 owner gate · §21 visual QA · §22 role-based acceptance

## Notes

- Deferred to the owner (per session constraints): cloud applies, pgTAP against the live project, the interactive pass, and baseline regeneration. Same split as Phases 07–16.
- The video transport decision (a provider, credentials, cost) is an owner call; the session model and surfaces ship regardless.
