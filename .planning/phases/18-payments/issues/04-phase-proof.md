# 18-04: Phase proof

**What to build:** The human-acceptance leg of Phase 18: cloud migration apply, RLS/pgTAP evidence, the owner test pass, visual baselines, and the phase verdicts.

**Blocked by:** 18-03 (the surfaces)

**Status:** ready-for-human

- [ ] Migration 0017 applied to the cloud Supabase project
- [ ] pgTAP suites: append-only payments; a payment against a void or overpaid invoice refused; invoice↔patient/org integrity; a patient reads only their own invoices; the derived paid status (balance covered); org isolation
- [ ] Owner test pass: issue an invoice for a consultation, record a payment (confirm the honest `not_configured` state and its plain reason with no provider connected), confirm the earnings overview totals and the patient's billing view
- [ ] Visual baselines regenerated for the earnings overview and the patient billing surface
- [ ] `18-VERIFICATION.md` written: 12-row visual QA, INV-01..17, PAY-01..04 trace, deferred items listed
- [ ] ROADMAP.md + STATE.md synced to phase-18 agent-complete

**Gate evidence at close:** §20.4 owner gate · §21 visual QA · §22 role-based acceptance

## Notes

- Deferred to the owner (per session constraints): cloud applies, pgTAP against the live project, the interactive pass, and baseline regeneration. Same split as Phases 07–17.
- The payment-provider decision (a PSP, credentials, cost) is an owner call; the abstraction and the honest record ship regardless.
