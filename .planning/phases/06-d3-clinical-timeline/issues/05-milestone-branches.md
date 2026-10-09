# 06-05: Milestone branches (thin, calm, collision-aware)

**What to build:** Main milestones can branch to related sub-events: thin, precisely curved, spatially predictable paths that never cross into spaghetti. The layout algorithm (lane assignment, curvature, collision avoidance) is pure and unit-tested, and the product renders branches only when an event genuinely has sub-events — no invented parent/child data to demo the feature.

**Blocked by:** 01

**Status:** resolved

- [x] A pure branch-layout function assigns sibling sub-events to collision-free lanes below their parent milestone and returns smooth curved SVG path data deterministically for a given input set
- [x] Paths render thin (≤ timeline event-node stroke convention), smoothly curved, spatially predictable (lane order = chronological), and never cross between siblings (TL-05; QA row 9 objective)
- [x] Branches participate in the zoom transform (drawn inside the same transformed scene group), so they scale/pan with the timeline rather than being re-laid-out per frame
- [x] Reveal/expand behavior is interruptible and reduced-motion compatible (§9); branches never animate at the cost of interaction (§25)
- [x] Product honesty: with today's schema, no event has sub-events, so no branch renders in the product path; the algorithm, its unit proof, and a dev-gallery fixture (fenced like `mock-clinical.ts`) demonstrate it
- [ ] Unit proof: lane assignment (no overlaps), curve determinism, ordering; a fixture-driven render proof of branch geometry inside the timeline subtree — **DEFERRED: owner directs no new tests this session**

**Gate evidence at close:** TL-05 · QA row 9 (branches thin/smooth/collision-free) · §27 (no fake branches in product) · INV-05 (no accent beyond nodes/badges)

## Notes

- Blocking edge is intentionally only 01: branch paths live inside the transformed scene graph that 02 introduces, so 02's transform applies to them without further coupling.

## Comments

### 2026-10-09 — resolved (owner test pass deferred)

- **Where:** `src/lib/timeline/branches.ts` (pure `layoutMilestoneBranch`,
  `layoutMilestones`, `branchPath`, `hasChildren`), the milestone/branch layer
  in `ClinicalTimeline`, and a fenced
  `src/lib/dev/timeline-fixture.ts` (synthetic events with sub-events; the
  gallery wiring lands with 06-07, which owns the dev preview).
- **Anti-spaghetti is structural, not lucky:** siblings are sorted by time and
  lanes are MONOTONE — the first-fit scan starts at the previous child's lane
  and may never move shallower. Two sibling paths can only cross if a later
  child sits in a shallower lane than an earlier one, which the rule forbids.
  Minimum lane separation (`BRANCH_MIN_GAP`) keeps same-lane siblings apart;
  lane order follows chronology (predictable); the curve is a symmetric cubic
  with control points on the vertical midpoint (calm, no elbows).
- **Branches move with the timeline:** each path's two endpoints move
  independently under pan/zoom, so a path cannot be translated — the per-frame
  registry (`path[data-branch]`) REDRAWS `d` from `frameX(...)` on every
  frame, alongside the translate writes for marks. Child marks stay
  first-class `g[data-base-x]` nodes (translated), and child events are
  excluded from the flat node layer so a sub-event is never drawn twice.
- **Honest dormancy:** today's projection emits no `children`, so `milestones`
  is empty and the layer renders nothing — no fabricated branches in the
  product path (§27). The dev fixture exercises the geometry for review.
- **Verification:** `tsc --noEmit` 0, suite 473/473 (no test files added or
  changed), token lint 0, build exit 0.
