# 07-04: Visits on the clinical timeline (VIS-02)

**What to build:** A visit appears on the patient's timeline as a real clinical event, and its follow-up appears as a related sub-event on a branch — the first genuine producer of the Phase-6 branch layer. The projection stays a read-model; the visit row remains the source of truth.

**Blocked by:** 07-01, 07-03

**Status:** resolved

- [ ] The Care-Event projection gains a visits mapper: each visit becomes a `visit` event (category clinical) positioned at its schedule/occurrence instant, labelled from the visit type or reason (real values only)
- [ ] A visit's follow-up becomes a child event (`follow-up`) so the branch layer renders it thin and collision-free — no fabricated relationships
- [ ] Only visits the RLS-scoped read returns project; a receptionist with `CAN_SCHEDULE` but no clinical capability still sees the visit's scheduling event (no clinical documentation leaks into the event label)
- [ ] The Overview projection signature extends additively (existing lifecycle + invite behaviour unchanged)
- [ ] The timeline band, clustering, selection detail and scrubber all work with the new events unchanged — no engine changes (§8.2: one projection, many producers)
- [ ] Event provenance carries the source table and the visit id so the detail card is truthful

**Gate evidence at close:** VIS-02 · TL-02 extension · §27 (no fabricated events) · branch layer exercised by real data
