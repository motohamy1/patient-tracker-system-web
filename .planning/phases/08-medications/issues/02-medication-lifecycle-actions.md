# 08-02: Medication lifecycle actions with provenance

**What to build:** A clinician can start a medication, change it, pause it, resume it and stop it; every transition writes the current state AND a history row in one server-validated move, so the current view and the trail can never disagree.

**Blocked by:** 08-01

**Status:** resolved

- [ ] Actions: `startMedication`, `changeMedication`, `pauseMedication`, `resumeMedication`, `stopMedication` — each Zod-parsed, `CAN_AUTHOR_CLINICAL`-gated server-side, returning typed results (never throwing on expected failure)
- [ ] Each transition writes the `medications` row and its `medication_events` row atomically (one DB function or one transaction-shaped action), so state and history cannot drift
- [ ] Illegal transitions are rejected server-side (no stop-when-stopped, no resume-when-active) with a typed result, mirrored by the UI's enabled controls (no dead controls)
- [ ] Dose changes record the before/after snapshot in the event detail (structured)
- [ ] Provenance: actor from verified claims; `source` and verification state carried so a future AI-extracted medication (Phase 12) can never look clinician-verified
- [ ] Stop/change confirm with the clinical verb as the heading and the verb as the confirm label (§7), never OK/Cancel

**Gate evidence at close:** MED-01 · §7 destructive-confirmation contract · AUTH-05 · §23 provenance
