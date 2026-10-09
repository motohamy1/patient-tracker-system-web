# 15-04: Phase proof

**What to build:** The human-acceptance leg of Phase 15: cloud migration apply, RLS/pgTAP evidence, the owner two-role test pass (staff and patient exchanging messages), visual baselines, and the phase verdicts.

**Blocked by:** 15-03 (the surfaces)

**Status:** ready-for-human

- [ ] Migration 0014 applied to the cloud Supabase project
- [ ] pgTAP suites: staff-scoped select; patient-self select; the sender re-derivation (a patient cannot forge a staff message, staff cannot post as the patient); one-open-conversation-per-patient; org isolation; append-only proofs
- [ ] Owner test pass: doctor starts a thread from a folder card, the patient replies on their Home, both sides see the thread with correct unread counts, the close path closes the thread while keeping the log
- [ ] Visual baselines regenerated for `/provider/messages` and the patient Communication region (all applicable surfaces/viewports)
- [ ] `15-VERIFICATION.md` written: 12-row visual QA, INV-01..17, COMM-01..03 trace (§6, §15, §26), deferred items listed
- [ ] ROADMAP.md + STATE.md synced to phase-15 agent-complete

**Gate evidence at close:** §20.4 owner gate · §21 visual QA · §22 role-based acceptance

## Notes

- Deferred to the owner (per session constraints): cloud applies, pgTAP against the live project, the interactive two-role pass, and baseline regeneration. Same split as Phases 07–14.
