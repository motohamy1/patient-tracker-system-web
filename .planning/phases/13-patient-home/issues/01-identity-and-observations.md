# 13-01: Patient identity resolution + patient observation substrate

**What to build:** The patient workspace gets its own honest data layer: the signed-in patient's own record is resolved from their verified identity (never from client state), and patient-generated observations land in a real table where a patient can only ever write their own rows.

**Blocked by:** None (can start immediately)

**Status:** resolved

- [ ] `patient_observations` table: org/patient FKs + the recording `user_id`, `kind` in a closed vocabulary (`weight`, `blood_pressure`, `glucose`, `temperature`, `pulse`, `note`), `value_numeric` (nullable for a note), `value_secondary` (nullable — the diastolic half of a blood-pressure reading), `unit`, `note`, `observed_at`, provenance (`source` defaulting to `patient`), timestamps — §13/§14
- [ ] RLS: INSERT only for the patient themself (`patient_id` joined to `user_id = auth.uid()`), enforced by policy AND a definer guard; UPDATE/DELETE for nobody (a logged observation is a record, not an editable draft); SELECT for the four staff roles (safety) and for the patient themself
- [ ] A patient can never author into another patient's row or invent a provider role — the guard trigger re-derives the patient from the session (AUTH-07, PTH-02)
- [ ] Audit trigger (0003 pattern) on insert
- [ ] `getPatientForCurrentUser()`: resolves the patient record from the verified session (the patients table's own `user_id`), returning null when the account has no linked record; no client state, no URL parameter
- [ ] `listPatientObservations(orgId, patientId)` for the patient's own log and the staff read path
- [ ] `database.types.ts` gains the table (hand-maintained until CLI regeneration)

**Gate evidence at close:** PTH-02 (allowed observation types only, data-layer enforced) · §12 · AUTH-07 · §14

## Notes

- The closed kind vocabulary is the "explicitly allowed types" of PTH-02: the patient cannot record a diagnosis, a medication, or a clinical impression — only the listed measurements and a note.
- Staff visibility is by design (a logged weight or a glucose reading is clinically relevant); the patient-facing surface is Phase 13's own work, and the provider-workspace surfacing rides Phase 14 (TASK-02) rather than being built twice.
