# 06-07: Performance proof, fenced dev fixture and the phase verification

**What to build:** The phase is proven: a synthetic multi-thousand-event dataset shows the timeline stays fluid (bounded rendered-node counts, no per-frame React work), a dev-gated populated timeline gives the owner the visual review this phase owes, and `06-VERIFICATION.md` records every QA row (including rows 8–10, now applicable) and invariant with real evidence.

**Blocked by:** 01, 02, 03, 04, 05, 06

**Status:** ready-for-agent

- [ ] A synthetic fixture of thousands of events (tests/dev only, fenced like `src/lib/dev/mock-clinical.ts`, never imported by a product route or bundled) drives perf assertions
- [ ] Rendered-node count stays bounded at every zoom level (clustering caps), and the interaction path performs no React state updates per frame (TL-09, UX-04) — asserted structurally and by measurement of the pure pipeline (clustering + position math on the fixture)
- [ ] No jank-inducing re-render paths: scale/transform stay in refs, React renders structure only (the repo's scene-graph pattern)
- [ ] The dev gallery renders a populated timeline from the fenced fixture for the owner's visual review (dev-route flag only — D-26)
- [ ] `06-VERIFICATION.md` written: TL-01…09 + UX-04/05 trace, all 12 QA rows (8–10 evaluated for real now: axis height/month-divider spacing/node diameter/branch stroke within ±10% of reference, filled nodes use `accent`, branches collision-free; scrubber capsule `surfaceMuted` + ticks + year labels + dark window at overlay), INV-01…17 sweep
- [ ] A passing build is not acceptance (§20.7, §27); visual baselines and the owner's visual review remain deferred items with the same no-heavy-process constraint, listed explicitly
- [ ] Later-phase handoff noted: each new clinical table adds a projection mapper (Visits 07, Medications 08, Labs/Imaging 09, Allergies/Genetics 10) — the engine unchanged

**Gate evidence at close:** all TL-01…09 + UX-04/05 · QA rows 1–12 · INV sweep · deferral list for the visual gate
