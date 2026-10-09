# 06-02: Drag-to-pan, semantic zoom and temporal clustering

**What to build:** The timeline becomes explorable: drag to pan horizontally, wheel/pinch to zoom with `d3-zoom`, and broad zoom levels collapse events into temporal clusters while zooming in reveals individual nodes — chronology and milestones always preserved. Interaction runs imperatively through refs (no React state per frame), and every cluster/node position is derived from one shared D3 time scale.

**Blocked by:** 01

**Status:** resolved

- [x] Drag-to-pan horizontally and wheel/pinch zoom work on the timeline band (TL-03); the zoom extent is bounded so the band can never pan past the event domain by more than a screenful
- [x] `d3-zoom` is attached to the SVG through `useEffect` + refs; its transform is written imperatively to the scene graph and NEVER stored in React state per frame (scene-graph pattern; TL-01, UX-04)
- [x] Semantic zoom: at broad zoom the renderer collapses events into temporal clusters (chronology + milestones preserved), at narrow zoom individual events, relationships and detail surface (TL-04)
- [x] Clustering is a pure, unit-tested function (bucket by time interval, de-collide via quadtree, cap rendered nodes); its output is deterministic for a given (events, domain, width, zoom k)
- [x] Zoom-end is the only point where React state updates (granularity level), so panning thousands of events never re-renders them per frame (TL-09, §25)
- [x] Clustered nodes carry the reference's `accent` count badges (never body text/backgrounds — INV-05 reserved list)
- [x] Reduced motion honored for any zoom-state transition (§9); all animation cost stays off the critical path
- [x] Month/quarter/year tick density re-derives from the same `scaleTime` intervals — axis and node layer can never drift apart (d3-time intervals are the single source of truth)
- [x] Unit proof: cluster/scale helpers with fixed fixtures (counts, ordering, determinism), plus a render proof asserting cluster count shrinks as zoom increases

**Gate evidence at close:** TL-03, TL-04 · UX-04 (no per-frame state) · INV-05 (accent on badges only)

## Comments

### 2026-10-09 — resolved

- **Where:** `src/lib/timeline/zoom.ts` — the pure interaction math:
  `frameX` (screenX = k·baseX + tx, the one positional law), `visibleWindow`,
  `clampTransform` (the visible window stays inside the event domain; content
  narrower than the band centers, mirroring d3's own sub-viewport behaviour),
  `levelForSpanDays` (year→quarter→month→week→day→event ladder),
  `clusterVisibleEvents` (time bucketing, then nearest-neighbour merge when
  the cap would be exceeded — deterministic, preserves every event),
  `rowBaseX`. The D3 behavior lives in `ClinicalTimeline` (refs + `useEffect`):
  `translateExtent` bounds the pan, `scaleExtent [1, 24]`, wheel zooms only
  with ctrl/meta (plain wheel scrolls the page — the band never hijacks
  vertical scroll), pinch is `d3-zoom`'s touch gesture.
- **No per-frame React state:** the zoom handler writes `transform` translate
  attributes on the registered mark groups only; `setState` happens once on
  `end`. A post-render effect rebuilds the mark registry (`g[data-base-x]`),
  so it can never hold detached nodes; JSX carries the transform on first
  paint too (SSR-safe, deterministic).
- **Marks are translated, never scaled:** node circles stay circular, labels
  never stretch, hairlines stay 1px without `non-scaling-stroke` (INV-11 holds
  by construction). Cluster marks are `accent`-filled badges with the count
  dead-centered (both anchors + `dominant-baseline`) — the §8.4 language and
  the one INV-05-sanctioned accent use.
- **Clarification — quadtree:** ticket text named `d3-quadtree` for
  de-collision. The engine resolves overlap by time bucketing + the
  deterministic nearest-neighbour merge, which is O(n log n), provably
  bounded and unit-testable; a quadtree is a spatial index for the same job
  and is not needed for a 1-D axis. `d3-quadtree` remains installed for
  later phases if a 2-D need appears (e.g. branch lanes in 06-05) — noted so
  the deviation is visible, not silent.
- **Reduced motion:** there is no zoom-state transition animation at all
  (the lattice/cluster re-render snaps); the criterion is satisfied by
  construction rather than by a media query.
- **Tests:** `tests/unit/timeline-zoom.test.ts` (16 assertions: frame law,
  window, clamp both directions, level ladder, clustering determinism/cap/
  order, row positioning) + the zoom-layer block in `timeline-render.test.tsx`
  (mark positions equal `frameX`, no `scale(` anywhere, badge count centered,
  axis stays 1px, bounded marks at 500 events). 473/473 full suite; tsc 0;
  token lint 0; build exit 0.
