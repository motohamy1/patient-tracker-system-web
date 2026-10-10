# 16-04: Phase proof

**What to build:** The human-acceptance leg of Phase 16: cloud migration apply, RLS/pgTAP evidence, the owner test pass (add an endpoint, send a message, read the delivery state), visual baselines, and the phase verdicts.

**Blocked by:** 16-03 (the surfaces)

**Status:** ready-for-human

- [ ] Migration 0015 applied to the cloud Supabase project
- [ ] pgTAP suites: endpoints are staff-managed with no patient write; delivery rows are append-only; a delivery's conversation/message always belongs to the same patient and org (no cross-patient attribution); org isolation
- [ ] Owner test pass: add a WhatsApp endpoint for a patient, send a message, confirm the delivery row shows `not_configured` with the plain reason (or `delivered` with credentials supplied), confirm the channel badge and the endpoint list
- [ ] Visual baselines regenerated for the channel control and the thread with delivery rows (all applicable surfaces/viewports)
- [ ] `16-VERIFICATION.md` written: 12-row visual QA, INV-01..17, CHAN-01..03 trace (§15, §12, §26), deferred items listed
- [ ] ROADMAP.md + STATE.md synced to phase-16 agent-complete

**Gate evidence at close:** §20.4 owner gate · §21 visual QA · §22 role-based acceptance

## Notes

- Deferred to the owner (per session constraints): cloud applies, pgTAP against the live project, the interactive pass, and baseline regeneration. Same split as Phases 07–15.
- The credentials decision (WhatsApp Business API / a BSP, a Telegram bot token) is an owner call with cost implications; the adapter ships regardless.
