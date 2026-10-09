# 07-03: The visit workflow — Pre-Visit → During Visit → After Visit

**What to build:** A clinician can take one visit through the three stages: capture the pre-visit reason, document during the visit, and record the follow-up after it. Each transition is an explicit, server-validated move with its own form; the stage vocabulary is closed and shown as a semantic stepper.

**Blocked by:** 07-01, 07-02

**Status:** ready-for-agent

- [ ] The stage vocabulary is exactly `pre_visit → during_visit → after_visit` in one declaration (`status.ts` mirror of the SQL check, 0005 drift discipline)
- [ ] Clinician actions: save pre-visit reason, move to During, save documentation, move to After, save follow-up (text + date) — each Zod-parsed and `CAN_AUTHOR_CLINICAL`-gated server-side
- [ ] Transitions are validated server-side (no skipping backwards silently; a move is explicit) and audit-recorded with the before/after diff
- [ ] The workflow surfaces as a stepper whose stages are semantic (not color-only), with the current stage emphasized by fill/shadow (INV-05/INV-08)
- [ ] Loading, empty, error/retry and permission-denied states are deliberate for the workflow and its forms (§24); a denied stage shows the §7 no-leak copy
- [ ] Destructive/clinical-significant actions name the verb (e.g. "Complete visit"), never OK/Cancel (§7)
- [ ] Every value renders through semantic tokens; text weights 400/600 and `tabular-nums` on dates (§7/QA row 7)

**Gate evidence at close:** VIS-01 · §7 copy contract · §24 states · INV-04/05/07/08 · audit diff
