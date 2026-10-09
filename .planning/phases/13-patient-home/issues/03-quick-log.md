# 13-03: Quick Log — the patient's only authoring surface

**What to build:** The Quick Log: a patient records a measurement (weight, blood pressure, glucose, temperature, pulse) or a note, and it appears in their Health Snapshot. It is the ONLY thing a patient can write anywhere in the product — the closed vocabulary, the self-scoped RLS and the capability check all say so.

**Blocked by:** 13-02 (the surface)

**Status:** resolved

- [ ] Quick Log control on Patient Home: kind picker (the closed vocabulary only), value + unit fields (numeric), a second value for blood pressure, an optional note, and the date/time it was taken
- [ ] The action requires the patient capability (`CAN_SUBMIT_OBSERVATION`, held by the patient role only) and re-derives the patient from the verified session — a staff account recording on a patient's behalf is not a path this surface builds (PTH-02, AUTH-07)
- [ ] Validation: numeric parsing with units from a small closed set; a note kind needs no value; nothing incomplete persists; the result appears in the Health Snapshot immediately (server-action + refresh)
- [ ] The logged observation records `observed_at` (when the patient says it was taken) separately from `created_at`, with provenance `source = patient`
- [ ] Failure and success states are deliberate (no silent save; the patient is told the log saved) — and the copy never turns logging into a game (§27)
- [ ] Recent observations render in the Health Snapshot region with their values, units, dates and provenance

**Gate evidence at close:** PTH-02 (the allowed set) · PTH-03 · AUTH-05/07 · §14

## Notes

- This is the patient's whole write surface; everything else on their Home is read-only by construction. The type system cannot express a clinical write for a patient account (AUTH-07's structural exclusion), and this action does not weaken it.
