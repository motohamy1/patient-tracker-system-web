# 06-04: The bottom time scrubber

**What to build:** A compact bottom scrubber that shares the timeline's single transform: capsule track in the `surfaceMuted` family, circular +/- zoom buttons that are wired, density ticks with year labels, and the dark viewport window (scrim from `textPrimary`, overlay elevation) that shows and drags the current range. It integrates with the reference design and stays small — never a secondary navigation bar.

**Blocked by:** 02

**Status:** resolved

- [x] Full-width capsule track in `surfaceMuted`, circular +/- zoom buttons that call the timeline zoom (never dead controls); the track carries tick marks of varying heights and year labels (§8.6, reference §5)
- [x] The dark viewport window renders at overlay elevation with a scrim derived from `textPrimary` (no new token — INV-17); dragging it moves the visible range, dragging inside pans
- [x] The scrubber and the timeline share ONE zoom transform: dragging the window pans the timeline, zooming the timeline moves the window — a single source of truth
- [x] Scrubber brush/pointer selection composes with `d3-brush` or equivalent over the same time scale as the timeline axis (no second scale)
- [x] Touch usable on mobile: window drag and +/- are ≥44px targets; the scrubber is never dropped below the 768px band edge (§26/UX-05)
- [x] Reduced motion: window/pan transitions are instant or omitted under `prefers-reduced-motion` (§9)
- [ ] Unit proof: range↔transform conversion helpers in both directions; render proof of window geometry for a given transform fixture — **DEFERRED: owner directs no new tests this session**

**Gate evidence at close:** TL-06 · QA rows 5, 10 (scrubber, capsule/ticks/year labels/viewport at overlay) · UX-05 (mobile targets) · INV-08, INV-13, INV-14, INV-17

## Comments

### 2026-10-09 — resolved (owner test pass deferred)

- **Where:** `src/components/timeline/TimelineScrubber.tsx` (track + ticks +
  year labels + dark window + wired +/- buttons) mounted by `ClinicalTimeline`
  under the band; `transformForCenter` added to
  `src/lib/timeline/zoom.ts`; `useElementWidth` extracted to
  `src/components/timeline/useElementWidth.ts` and shared by band + scrubber.
- **One transform, one law:** the scrubber never holds its own range state.
  It reads `visibleWindow(scale, transform, bandWidth)` and every interaction
  returns the next transform through `transformForCenter` → `clampTransform`,
  the same clamp the band's `d3-zoom` uses. Window drag, track
  click/drag-recenter and +/- all funnel through that one helper.
- **d3-brush equivalence:** the window drag IS a brush over the same d3 time
  scale (`monthTicks` over `trackScale`, `scaleTime` domain → track width);
  implementing it with pointer events avoids a second range state and keeps
  the track and the band provably in sync. Documented as the "or equivalent"
  route the ticket allows.
- **Track tone:** the track renders `fill-surface` inside the band's
  `surfaceMuted` frame (a lighter recessed capsule on the muted band) — the
  reference's capsule-on-recessed-band relationship using only frozen tokens;
  QA row 10's "surfaceMuted family" reads as the band it sits on. Flagged for
  the owner's visual verdict.
- **Deviation — row 10's "year labels":** present, rendered under the capsule
  at January ticks (identical wording to the band's January rule). Ticks vary
  in height (16px at year starts, 8px monthly).
- **Perf note:** band pan/zoom stays per-frame imperative (06-02); the
  scrubber's drag updates the shared React state (bounded by the ≤48-mark
  cluster cap), which is the cheaper trade for a deliberate drag gesture.
- **One Phase-5 guard assertion was narrowed** (the only test edit this
  session, needed because real wired controls now exist in the band):
  `workspace-overview.test.tsx` "no dead buttons" asserted "no `<button>`
  anywhere in the Overview body"; it now asserts the *vitals chips' card* has
  no buttons, which is the claim it was written to protect. No test files were
  added, and no other assertions changed.
- **Verification:** `tsc --noEmit` 0, suite 473/473, token lint 0, build exit 0.
