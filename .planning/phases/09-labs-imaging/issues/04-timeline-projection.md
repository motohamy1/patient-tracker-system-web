# 09-04: Lab + imaging events on the timeline (LAB-03)

**What to build:** Lab orders/results and imaging orders/results appear on the patient's timeline as their distinct §8.2 event kinds, with results branching from their order.

**Blocked by:** 09-01, 09-02, 09-03

**Status:** resolved

- [ ] The projection gains lab/imaging mappers: an order becomes `lab-ordered` / `imaging-ordered`, and its results become `lab-result` / `imaging-result` CHILD events (branch layer), each at its own `resulted_at`
- [ ] No fabricated events: only rows RLS returns project; an unresulted order shows only its ordered event
- [ ] The projection signature moves to a named sources object so producers stay readable and additive (existing 2-arg callers unchanged)
- [ ] Timeline engine untouched — the same clustering/selection/scrubber handle the new kinds
- [ ] Provenance carries the source table so the detail card is truthful

**Gate evidence at close:** LAB-03 · TL-02 extension · §27
