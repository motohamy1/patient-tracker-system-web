# 08-03: The Medications tab surface

**What to build:** The patient workspace's Medications tab becomes the lifecycle surface: active medications first with structured dose/frequency/route and duration, paused and stopped below, and lifecycle controls that a clinician can drive end-to-end. Deliberate states throughout.

**Blocked by:** 08-01, 08-02

**Status:** ready-for-agent

- [ ] `medications/page.tsx` renders the patient's real medications under org RLS, grouped by state (active / paused / stopped) with structured dose, frequency, route and dates (tabular-nums)
- [ ] Lifecycle controls are present exactly for roles holding `CAN_AUTHOR_CLINICAL` and for legal transitions only (no dead controls; others read-only)
- [ ] Empty state follows §7 ("No medications yet" + what will appear + next step); loading/error/retry/permission-denied are deliberate (§24)
- [ ] Density and grammar: semantic status pills (closed tint family), `radius.pill` controls, no one-line cards, only `space.*` steps
- [ ] No clinical value or interaction warning is invented (no CDSS decisions rendered)
- [ ] A medication's history is visible in its detail (the event trail), each event reading as started/changed/paused/stopped with its real timestamp

**Gate evidence at close:** MED-01 UI half · §24 · QA rows 1/3/4/6/7/11 · INV-04/05/07/08/10/12
