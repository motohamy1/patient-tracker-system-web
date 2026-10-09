# 06-05: Milestone branches (thin, calm, collision-aware)

**What to build:** Main milestones can branch to related sub-events: thin, precisely curved, spatially predictable paths that never cross into spaghetti. The layout algorithm (lane assignment, curvature, collision avoidance) is pure and unit-tested, and the product renders branches only when an event genuinely has sub-events — no invented parent/child data to demo the feature.

**Blocked by:** 01

**Status:** ready-for-agent

- [ ] A pure branch-layout function assigns sibling sub-events to collision-free lanes below their parent milestone and returns smooth curved SVG path data deterministically for a given input set
- [ ] Paths render thin (≤ timeline event-node stroke convention), smoothly curved, spatially predictable (lane order = chronological), and never cross between siblings (TL-05; QA row 9 objective)
- [ ] Branches participate in the zoom transform (drawn inside the same transformed scene group), so they scale/pan with the timeline rather than being re-laid-out per frame
- [ ] Reveal/expand behavior is interruptible and reduced-motion compatible (§9); branches never animate at the cost of interaction (§25)
- [ ] Product honesty: with today's schema, no event has sub-events, so no branch renders in the product path; the algorithm, its unit proof, and a dev-gallery fixture (fenced like `mock-clinical.ts`) demonstrate it
- [ ] Unit proof: lane assignment (no overlaps), curve determinism, ordering; a fixture-driven render proof of branch geometry inside the timeline subtree

**Gate evidence at close:** TL-05 · QA row 9 (branches thin/smooth/collision-free) · §27 (no fake branches in product) · INV-05 (no accent beyond nodes/badges)

## Notes

- Blocking edge is intentionally only 01: branch paths live inside the transformed scene graph that 02 introduces, so 02's transform applies to them without further coupling.
