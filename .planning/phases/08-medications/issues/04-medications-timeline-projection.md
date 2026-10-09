# 08-04: Medications on the clinical timeline (MED-02)

**What to build:** Medication lifecycle changes appear on the patient's timeline as distinct `medication-started` / `medication-changed` / `medication-stopped` events, sourced from the medication-events history — the second real clinical producer of the timeline.

**Blocked by:** 08-01, 08-02

**Status:** resolved

- [ ] The Care-Event projection gains a medications mapper reading `medication_events` (the history, not the current row) so every change is its own event with its own instant
- [ ] Each event carries the medication name and the change detail in its label/summary — real values only, no fabricated events
- [ ] Events cluster and select through the existing engine unchanged; a medication's events can branch under their parent milestone when the data model marks them related (barring that, they render as independent events — no invented hierarchy)
- [ ] The projection signature stays additive; lifecycle + invite + visit behaviour unchanged
- [ ] Provenance carries the source (`medication_events`) and the event id so the detail card is truthful

**Gate evidence at close:** MED-02 · TL-02 extension · §27 (no fabricated events)
