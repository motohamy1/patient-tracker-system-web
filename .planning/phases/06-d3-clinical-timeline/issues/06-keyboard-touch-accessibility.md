# 06-06: Keyboard, touch and accessibility pass

**What to build:** The timeline and scrubber work with keyboard and touch where practical: arrow-key panning, +/- zoom, tabbable event nodes with accessible names, Enter/Escape selection, 44px touch targets, and reduced-motion throughout. The timeline is the product's centerpiece and is never dropped on mobile.

**Blocked by:** 03, 04, 05

**Status:** ready-for-agent

- [ ] Keyboard: ArrowLeft/Right pan the timeline, +/- zoom, Tab moves through event nodes (each with an accessible name describing the event), Enter selects, Escape closes detail (§8.3/§8.8/§26)
- [ ] Focus is visible (focus ring uses the app's `textPrimary` outline convention from globals.css) and focus order is logical; the selected node carries `aria-current`/`aria-selected` idiom consistent with the repo
- [ ] Touch: drag-pan and pinch-zoom work (d3-zoom handles both), scrubber window drag works, all timeline/scrubber targets ≥44px in both axes (UX-05, §26)
- [ ] Mobile keeps the horizontal timeline and the scrubber — neither is dropped below 768px (responsive-rules §4)
- [ ] `prefers-reduced-motion` disables zoom/choreography transitions; the timeline stays fully usable instantly (§9)
- [ ] Semantic structure: the timeline region is labelled (`aria-label`), the SVG carries a described-by relationship, and non-informative marks stay `aria-hidden`
- [ ] Unit proof: keyboard handler mapping (or pure state transitions) for pan/zoom/select/close; render proof asserting focusable nodes with names, ≥44px classes on controls, `aria-hidden` on decorative marks

**Gate evidence at close:** TL-08, UX-05 · §8.3 interaction completeness · §26 responsive contract
