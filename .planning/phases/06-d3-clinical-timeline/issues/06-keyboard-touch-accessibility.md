# 06-06: Keyboard, touch and accessibility pass

**What to build:** The timeline and scrubber work with keyboard and touch where practical: arrow-key panning, +/- zoom, tabbable event nodes with accessible names, Enter/Escape selection, 44px touch targets, and reduced-motion throughout. The timeline is the product's centerpiece and is never dropped on mobile.

**Blocked by:** 03, 04, 05

**Status:** resolved

- [x] Keyboard: ArrowLeft/Right pan the timeline, +/- zoom, Tab moves through event nodes (each with an accessible name describing the event), Enter selects, Escape closes detail (§8.3/§8.8/§26)
- [x] Focus is visible (focus ring uses the app's `textPrimary` outline convention from globals.css) and focus order is logical; the selected node carries `aria-current`/`aria-selected` idiom consistent with the repo
- [x] Touch: drag-pan and pinch-zoom work (d3-zoom handles both), scrubber window drag works, all timeline/scrubber targets ≥44px in both axes (UX-05, §26)
- [x] Mobile keeps the horizontal timeline and the scrubber — neither is dropped below 768px (responsive-rules §4)
- [x] `prefers-reduced-motion` disables zoom/choreography transitions; the timeline stays fully usable instantly (§9)
- [x] Semantic structure: the timeline region is labelled (`aria-label`), the SVG carries a described-by relationship, and non-informative marks stay `aria-hidden`
- [ ] Unit proof: keyboard handler mapping (or pure state transitions) for pan/zoom/select/close; render proof asserting focusable nodes with names, ≥44px classes on controls, `aria-hidden` on decorative marks — **DEFERRED: owner directs no new tests this session**

**Gate evidence at close:** TL-08, UX-05 · §8.3 interaction completeness · §26 responsive contract

## Comments

### 2026-10-09 — resolved (owner test pass deferred)

- **Keyboard:** the band svg is focusable (`tabIndex={0}`, `role="group"`,
  labelled) and handles ArrowLeft/Right (pan by 10% of the band, clamped),
  `+`/`=` and `-`/`_` (zoom about the visible window centre through
  `transformForCenter`), and Escape (dismiss the detail card). Event and
  cluster nodes are `role="button"` with `tabIndex={0}`, an accessible name
  ("Record updated, 2026-10-06" / "5 events between … and …. Expand this
  range.") and Enter/Space activation; the selected node carries
  `aria-pressed` (the repo's toggle idiom, as CompactControl uses).
- **Focus:** the global `:focus-visible { outline: 2px solid textPrimary }`
  ring applies to the focusable svg and node groups (never removed anywhere);
  logical order follows DOM order, which is chronological because rows are
  sorted by time.
- **Touch / targets:** d3-zoom already provides touch drag-pan and pinch-zoom;
  the scrubber window drag is pointer-based (works for touch). Every node
  carries a 44×44 transparent hit RECT (a rect, not a circle, so the drawn
  geometry stays exact) and the scrubber's +/− buttons are `size-11`; filter
  chips are `min-h-11 md:min-h-8` (the repo's touch-then-compact pattern) —
  all ≥44px below the 768px edge.
- **Mobile:** no timeline or scrubber element is hidden or dropped below any
  band edge (responsive-rules §4/UX-05).
- **Reduced motion:** there are no entrance/zoom-state transitions to
  suppress; every change is instant, so the criterion holds by construction
  (consistent with 06-02/06-03).
- **Semantics:** the band section is `aria-label="Timeline"`; lattice
  dividers, month labels and the axis sit in an `aria-hidden` group; the
  branch connectors are `aria-hidden` (decorative), while branch child nodes
  remain real marks.
- **One further guard assertion was updated** (reported, not hidden):
  `timeline-render.test.tsx` asserted the svg `role="img"` from 06-01. An
  `img` role is a leaf and would HIDE the interactive event nodes from
  assistive tech, so the role is now `group` — the assertion was updated to
  match the deliberate a11y correction.
- **Verification:** `tsc --noEmit` 0, suite 473/473, token lint 0, build exit 0.
