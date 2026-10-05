# Reconciliation — ref-A vs ref-B

**Written:** 2026-10-05 (Phase 01, Plan 01-05)
**Theme authority:** `docs/design/ref-A-theme.png`
**Companion document:** `docs/design/reference-ui-spec.md` (the per-element decision table)

## Conflict rule

From the pack's reference hierarchy, unchanged:

> **A wins on every visual decision. B wins only where A is silent about a screen's layout.**
> Content in A and B is illustrative; the project's own content replaces it.

Every conflict below is recorded with the losing side, the winning side, and the token that
carries the resolution. Content shown in any reference is placeholder content and is never
copied.

## 1. Three different accent yellows — resolved to ref-A

| Reference | Accent seen | Outcome |
|---|---|---|
| ref-A | `#F2FE46` (lime) | **WINS** — `--color-accent` |
| ref-B2 timeline | `#ECFC4C` (lime, close to A) | rejected — close is not equal; B is not the authority |
| ref-B1 "Add New Patient" button | `#FCCC00` (amber-gold) | rejected — explicitly rejected by the pack |

**Resolution:** one accent token, `--color-accent: #F2FE46`. `--color-series-accent` is a
deliberate alias of the same value, not a second hue. Any chart that needs a second series
uses `--color-surface-muted` or a tinted step of the accent family. Adding a third accent is
a violation of the single-accent rule enforced by `tests/unit/tokens.test.ts`.

## 2. Warm greige canvas vs cool blue-grey surfaces — resolved to ref-A

ref-B1/B2/B3 use cool blue-grey light surfaces (`#DEE4EA`, `#F0F0F6`) with no olive frame.
ref-A uses a warm greige canvas inside an olive frame.

**Resolution:** ref-A's structural tokens win: `--color-frame-olive`, `--color-frame-olive-deep`,
`--color-canvas`, `--color-surface`, `--color-surface-muted`, `--color-surface-inset`. The
cool blue-greys are not sampled, not tokenized, and not used. "AppFrame is not decoration" is
enforced by the gallery rendering inside the real frame.

## 3. Neumorphism, gradients, multicolor charts — resolved to ref-A

ref-B1/B2/B3 carry heavier soft neumorphic shadows, gradient fills, pastel circular buttons,
and multicolor sparklines (blue, red, green, purple). ref-A is flat, restrained, single-accent.

**Resolution:** ref-A wins on all four.

- Shadows: `--shadow-module` / `--shadow-node`, both single-layer and restrained, and tuned
  **down** only. Heavy dual-direction neumorphism is forbidden.
- Gradients: forbidden outright. `tests/unit/tokens.test.ts` greps `src/` for `gradient`,
  `backdrop-blur`, `backdrop-filter`, and `confetti`, and
  `tests/visual/design-gallery.spec.ts` asserts the rendered gallery HTML matches none of them.
- Multicolor chart palettes: forbidden. Chart color = accent + muted neutrals.
- Pastel circular buttons: replaced by flat capsules and flat line icons.

## 4. Tablet bezel (ref-B3) — rejected

The B3 bezel is a **mockup**, not UI. It is not reproduced on any screen, at any viewport.
Phase 17 renders patient home inside the real app frame.

## 5. B-text defects — never copied

The references contain prompt and copy defects. None are carried into the product:

- The leaked prompt label `"Next Action' Hero Card"` used as a heading in ref-B3.
- Typos: "Mao", "Mays", "wiked", "Connition", "kat", "Marwıs".
- Duplicated patient names across folder cards in ref-B1.
- The filter toggle bar overlapping the folder grid in ref-B1. Overlapping elements are
  forbidden; filters sit **above** the grid.

The gallery in Phase 1 carries no product copy at all — only type specimens and neutral labels
— precisely so none of this text can leak in.

## 6. ref-B2's tab bar — superseded by the locked order

ref-B2 shows `Overview | Visits | Medications | Labs | Imaging | Vital Signs | Communication`.
That bar is outdated. The locked order is:

```
Overview | AI Analytics | Visits | Medications | Labs | Imaging | Allergies | Genetics
```

Vital Signs live **inside Overview**. Communication lives in a dropdown under the doctor's
profile. The B2 bar is not a specification and Phase 4 builds the locked order.

## 7. ref-B2's "ECG" cards — trends, not waveforms

ref-B2 labels several cards "ECG" that are in fact trend areas. A waveform is rendered **only**
where the underlying data is an actual waveform. Trend data renders as a trend. This is a data
fidelity rule (Phase 9), not a style rule.

## 8. ref-B4 — form only, no values inherited

`ref-B4-folder-style.png` contributes the **shape and behaviour** of the patient folder only:
open folder with a back panel and tab, a front pocket, record cards peeking out of the top, a
patient name and record count at the bottom, and a small avatar badge.

Its colours are **not** inherited. It shows multiple saturated folder colours with no legend
attached, which is decision D11 and is recorded as
**UNKNOWN — needs owner decision** in `reference-ui-spec.md`. No dimension, radius, colour
value, or spacing was extracted from it, and none appears in either document.

## Open Decisions

1. **Folder colours (D11)** — UNKNOWN — needs owner decision. Recommended default: neutral
   ref-A folder bodies (`--color-surface`, `--color-surface-muted`), status carried by the tab
   and a small single-accent label. A restrained status-coloured mode using ref-A-family muted
   tones is the alternative. Never a rainbow.
2. **Status / critical colour** — UNKNOWN — needs owner decision. ref-A defines none;
   `StatusLabel` ships neutral ink only. ref-B1's pastel red alert panel is rejected and is not
   the source.
3. **Specialty lens in the notch title tab (D5)** — UNKNOWN — needs owner decision. Default:
   current workspace context, no lens.
4. **Icon stroke weight** — UNKNOWN — needs owner decision. `strokeWidth={1.5}` is a first
   pass for approval, not a measured value.
5. **Latin typeface** — UNKNOWN — needs owner decision. Ships `system-ui, sans-serif`.
6. **Arabic companion typeface (FND-06)** — UNKNOWN — needs owner decision, and it must be
   settled before the Playwright baselines are trusted: changing it invalidates every baseline.
7. **`--shadow-module` depth** — UNKNOWN — needs owner decision. Starts restrained; tune down.
8. **Type scale ratios** — UNKNOWN — needs owner decision; a raster cannot yield a trustworthy
   scale, so none was invented.
9. **Left icon rail (D6)** — the references show six unlabeled icons; the pack's default is to
   drop them until meanings are defined, in favour of the profile dropdown + command palette.
   `reference-ui-spec.md` records the rejection; confirming D6 remains open.
10. **Daily Stats scope (D7)** — the references show Wait Times and New Admits, which require
    scheduling/admission data this product does not collect. The table records the rejection;
    confirming the reduced scope (Total Patients, Completed today) remains open.