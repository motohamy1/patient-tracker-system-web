# Visual QA Rules — the reference-UI acceptance gate

This document is the **normative** visual gate used at every UI phase's design gate. It carries
the 12-row pass/fail checklist derived from `PRODUCT-MASTER-SPEC.md` §21, the Playwright
visual-regression harness contract that Phase 002 builds against, and the phase rejection
conditions. It contains **no raw color value**; every color resolves through
`docs/governance/tokens.json` and is cited by token name.

---

## 1. Pass/fail checklist (PRODUCT-MASTER-SPEC.md §21)

This is the normative visual gate used at every UI phase's design gate.
`docs/governance/reference-ui-specification.md` §8.1 mirrors this table, so **any divergence
between the two is a defect in one of them** — the row numbers and check names must agree
row-for-row.

Evaluate **every** row against the running surface. Any single row that fails **blocks the
phase**.

| # | Check | Objective pass condition |
|---|---|---|
| 1 | Outer structure | Columns, rails and grid placement match the cited per-surface grammar section in `docs/governance/reference-ui-specification.md` (Provider Home grammar, Patient Workspace and D3 Timeline grammar, or Patient Home grammar); no reflow is invented. |
| 2 | Color relationships | The frame renders as a light warm gray per D-01; cards separate by shadow and not by border; accent occupies at most 10% of visible area, estimated as a pixel-share pass over a screenshot. |
| 3 | Spacing rhythm | Every gap and padding value is one of `space.xs` through `space.2xl`; no page-level section gap exceeds 32px. |
| 4 | Compactness | No control or card height exceeds that of its closest reference counterpart; no card holds one line of content or fewer. |
| 5 | Card proportions | The provider folder grid is 3 columns at 1024px and above; the workspace bottom row measures approximately 55/22.5/22.5 within plus or minus 3% of the rendered widths. |
| 6 | Pill controls | Navigation and compact controls use `radius.pill`; no sharp-corner control at or below 4px appears anywhere. |
| 7 | Typography hierarchy | Only `font.size` values and weights 400 and 600 appear; `tabular-nums` is applied to every clinical and statistical value. |
| 8 | Timeline proportions | Axis height, month divider spacing, node diameter and branch stroke width are within plus or minus 10% of the reference measurements. |
| 9 | Node/branch behavior | Filled nodes use `accent`; branches are thin, smooth and collision-free, with no crossings between sibling sub-event arcs. |
| 10 | Bottom scrubber | The capsule track renders in `surfaceMuted`, tick marks are present, year labels are present, and the dark viewport window renders at the overlay shadow level. |
| 11 | Visual density | Provider and workspace surfaces read as dense; patient home reads as sparse using the upper range of the same spacing scale; both read as the same design language. |
| 12 | Accent restraint | Accent appears only on the reserved list (timeline event nodes and count badges, milestone markers, primary CTA, active/selected emphasis markers, key state indicator dots); status color is limited to `success`, `info` and `warning` per D-04. |

**Procedure.** Evaluate every row; any row failing blocks the phase. Record the per-row result in
the phase's verification artifact. The three invariant groups in
`docs/governance/ui-invariants.md` — visual character (`INV-01` through `INV-06`), geometry
(`INV-07` through `INV-12`) and depth and elevation (`INV-13` through `INV-17`) — are evaluated
at the same gate. A phase is accepted only when every QA row and every applicable invariant
passes.

---

## 2. Playwright visual-regression harness contract (built in Phase 002)

This is a **written contract only**. The harness and its committed baselines are **built in
Phase 002** (D-18); this phase creates **no test file, no config and no baseline image**. The
five items below are the target Phase 002 builds against instead of inventing one.

- **Viewports.** `1440x900` (canonical desktop), `1280x800`, `768x1024` (tablet) and `390x844`
  (mobile).
- **Baseline naming.** `tests/visual/baselines/{surface}/{viewport}/{state}.png` — for example
  `provider-home/1440x900/default.png`.
- **States.** `default` and `reduced-motion`.
- **Capture.** Against a production build, CSS animations disabled during capture, and the
  `reduced-motion` variant captured via emulation.
- **Tolerance.** `maxDiffPixelRatio: 0.01` and per-pixel `threshold: 0.2`; any diff beyond
  tolerance fails the gate. Baselines are **committed rather than gitignored**; regeneration is a
  deliberate `--update-snapshots` act recorded in the phase that regenerated it.

---

## 3. Rejection conditions

These are the `PRODUCT-MASTER-SPEC.md` §21 conditions. Reject the phase if:

- the surface looks like a generic SaaS dashboard even when the requested functionality works;
- new features introduce a different visual language;
- the implementation starts becoming overly gamified.

These conditions **override a passing functional test run** and they **override a passing
build**. "The build passes" is not done — declaring a feature complete solely because the
`build passes` is a `PRODUCT-MASTER-SPEC.md` §27 hard prohibition. Completion requires the named
acceptance criteria, the QA rows above and the applicable invariants to pass.

---

*Normative copy of the acceptance gate; mirrored by `docs/governance/reference-ui-specification.md`
§8.1. Companion to `docs/governance/ui-invariants.md`.*
