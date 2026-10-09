# 11-04: Phase proof

**What to build:** The human-acceptance leg of Phase 11: cloud migration apply, RLS/pgTAP evidence, the owner test pass, visual baselines, and the phase verdicts.

**Blocked by:** 11-03 (the surface)

**Status:** ready-for-human

- [ ] Migration 0010 applied to the cloud Supabase project and 0001..0009 drift re-checked
- [ ] pgTAP suites for `ai_insights`: staff-scoped SELECT, doctor-only INSERT, review-column immutability, no-DELETE, org isolation
- [ ] Owner test pass: generate insights on a seeded patient, accept one, dismiss one, confirm provenance badges and the evidence links, confirm the denied surface for unauthorized roles
- [ ] Visual baselines regenerated for the AI Analytics tab (all applicable surfaces/viewports)
- [ ] `11-VERIFICATION.md` written: 12-row visual QA, INV-01..17, AI-01/02/03 + cross-refs (§10, §23, §27), deferred items listed
- [ ] ROADMAP.md + STATE.md synced to phase-11 agent-complete

**Gate evidence at close:** §20.4 owner gate · §21 visual QA · §22 role-based acceptance

## Notes

- Deferred to the owner (per session constraints): cloud applies, pgTAP runs against the live project, the interactive pass, and baseline regeneration. Same split as Phases 07–10.
