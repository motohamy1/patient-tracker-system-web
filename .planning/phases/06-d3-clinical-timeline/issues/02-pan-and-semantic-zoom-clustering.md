# 06-02: Drag-to-pan, semantic zoom and temporal clustering

**What to build:** The timeline becomes explorable: drag to pan horizontally, wheel/pinch to zoom with `d3-zoom`, and broad zoom levels collapse events into temporal clusters while zooming in reveals individual nodes — chronology and milestones always preserved. Interaction runs imperatively through refs (no React state per frame), and every cluster/node position is derived from one shared D3 time scale.

**Blocked by:** 01

**Status:** ready-for-agent

- [ ] Drag-to-pan horizontally and wheel/pinch zoom work on the timeline band (TL-03); the zoom extent is bounded so the band can never pan past the event domain by more than a screenful
- [ ] `d3-zoom` is attached to the SVG through `useEffect` + refs; its transform is written imperatively to the scene graph and NEVER stored in React state per frame (scene-graph pattern; TL-01, UX-04)
- [ ] Semantic zoom: at broad zoom the renderer collapses events into temporal clusters (chronology + milestones preserved), at narrow zoom individual events, relationships and detail surface (TL-04)
- [ ] Clustering is a pure, unit-tested function (bucket by time interval, de-collide via quadtree, cap rendered nodes); its output is deterministic for a given (events, domain, width, zoom k)
- [ ] Zoom-end is the only point where React state updates (granularity level), so panning thousands of events never re-renders them per frame (TL-09, §25)
- [ ] Clustered nodes carry the reference's `accent` count badges (never body text/backgrounds — INV-05 reserved list)
- [ ] Reduced motion honored for any zoom-state transition (§9); all animation cost stays off the critical path
- [ ] Month/quarter/year tick density re-derives from the same `scaleTime` intervals — axis and node layer can never drift apart (d3-time intervals are the single source of truth)
- [ ] Unit proof: cluster/scale helpers with fixed fixtures (counts, ordering, determinism), plus a render proof asserting cluster count shrinks as zoom increases

**Gate evidence at close:** TL-03, TL-04 · UX-04 (no per-frame state) · INV-05 (accent on badges only)

## Notes

- This ticket owns the interaction layer only; selection detail, scrubber, branches and keyboard land in 03–06 against this geometry.
