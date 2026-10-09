# 06-04: The bottom time scrubber

**What to build:** A compact bottom scrubber that shares the timeline's single transform: capsule track in the `surfaceMuted` family, circular +/- zoom buttons that are wired, density ticks with year labels, and the dark viewport window (scrim from `textPrimary`, overlay elevation) that shows and drags the current range. It integrates with the reference design and stays small — never a secondary navigation bar.

**Blocked by:** 02

**Status:** ready-for-agent

- [ ] Full-width capsule track in `surfaceMuted`, circular +/- zoom buttons that call the timeline zoom (never dead controls); the track carries tick marks of varying heights and year labels (§8.6, reference §5)
- [ ] The dark viewport window renders at overlay elevation with a scrim derived from `textPrimary` (no new token — INV-17); dragging it moves the visible range, dragging inside pans
- [ ] The scrubber and the timeline share ONE zoom transform: dragging the window pans the timeline, zooming the timeline moves the window — a single source of truth
- [ ] Scrubber brush/pointer selection composes with `d3-brush` or equivalent over the same time scale as the timeline axis (no second scale)
- [ ] Touch usable on mobile: window drag and +/- are ≥44px targets; the scrubber is never dropped below the 768px band edge (§26/UX-05)
- [ ] Reduced motion: window/pan transitions are instant or omitted under `prefers-reduced-motion` (§9)
- [ ] Unit proof: range↔transform conversion helpers in both directions; render proof of window geometry for a given transform fixture

**Gate evidence at close:** TL-06 · QA rows 5, 10 (scrubber, capsule/ticks/year labels/viewport at overlay) · UX-05 (mobile targets) · INV-08, INV-13, INV-14, INV-17
