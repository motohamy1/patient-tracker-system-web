# Reference-UI Specification — ref-B1–B4 against ref-A

**Written:** 2026-10-05 (Phase 01, Plan 01-05, FND-02/FND-07/FND-08)
**Theme authority:** `docs/design/ref-A-theme.png` (Level A)
**Sources under review:** `docs/design/ref-B1-provider-home.jpg`, `docs/design/ref-B2-patient-overview.jpg`, `docs/design/ref-B3-patient-home.jpg`, `docs/design/ref-B4-folder-style.png`
**Token values:** `docs/design/tokens.md` (every numeric value below comes from there, ref-A only)

## Purpose

This is the artifact Phase 1's manual approval gate reads. For every element visible in the
B references it records one decision — `adopted`, `restyled`, `superseded`, or `rejected` —
and names the ref-A token that carries the element, so Phase 4/5/6/17 work reads a token
instead of re-deciding the visual language.

The pack's conflict rule governs: **A wins on every visual decision; B wins only where A is
silent about a screen's layout.** Nothing here invents a measurement. `ref-B4-folder-style.png`
is **form only** — no dimension, radius, colour value, or spacing from it appears in this
document or in `reconciliation.md`.

## Decision Table

| Element | Source | Decision | ref-A token used | Conflict resolved | Phase |
|---|---|---|---|---|---|
| Primary pill tab group + icons | ref-B1/B2 | adopted | `--radius-pill` | none — ref-A draws the same fully rounded capsule row | 4 |
| Folder anatomy (back panel, tab, pocket, peeking cards, badge) | ref-B4 | restyled | `--radius-module`, `--radius-inner` | B4 folder colours NOT inherited — D11 pending | 6 |
| Folder peeking cards showing images/thumbnails | ref-B4 | rejected | — | B4 photo thumbnails would expose clinical data on a shared screen | 6 |
| Unlabeled left icon rail (6 icons) | ref-B1 | rejected | — | D6: meanings undefined; use profile dropdown + command palette | 15 |
| Wait Times / New Admits stat tiles | ref-B1 | rejected | — | D7: requires scheduling/admission data we do not collect | 6 |
| Tab bar (Overview/Visits/…/Vital Signs/Communication) | ref-B2 | superseded | — | Locked order wins: Overview \| AI Analytics \| Visits \| Medications \| Labs \| Imaging \| Allergies \| Genetics; Vital Signs inside Overview; Communication under the profile dropdown | 4 |
| Multicolor sparklines, gradient fills | ref-B1/B2/B3 | rejected | — | ref-A uses one accent; B-image palettes are forbidden | 9–11 |
| Heavy neumorphic shadows | ref-B1/B2/B3 | rejected | `--shadow-module` (restrained) | ref-A is flat | all |
| Pastel red alert block | ref-B1 | rejected | — | Forbidden; status colour is an OWNER DECISION until approved | 15 |
| 3D pill / alarm-clock illustration | ref-B3 | rejected | — | 3D illustration forbidden; flat line icons only | 17 |
| Tablet bezel | ref-B3 | rejected | — | B3 bezel is a mockup, not UI | 17 |
| "ECG" cards showing trend areas | ref-B2 | rejected | — | Rejected **as waveform**: B2's ECG cards are trends; render a waveform only for real waveform data | 9 |
| Leaked label "Next Action' Hero Card" | ref-B3 | rejected | — | Prompt label leaked into a heading; B-text defect | 17 |
| Filter bar overlapping the folder grid | ref-B1 | rejected | — | Overlapping elements are forbidden; filters sit ABOVE the grid | 6 |
| Next-action card, health snapshot, quick log, care plan | ref-B3 | adopted | `--space-*`, `--radius-module` (layout only) | restyle flat; no 3D, no gamification | 17 |
| Identity card, vital cards, bottom scrubber, timeline branches | ref-B2 + ref-A | adopted | `--color-surface-inset`, `--color-ink` | ref-B2's cool blue-grey surfaces replaced with ref-A warm tokens | 4–5 |

**Decision vocabulary (exhaustive).** `adopted` — used as shown, mapped to a ref-A token.
`restyled` — the B form is kept, the B surface treatment is replaced. `superseded` — the
locked decisions override it and the B version is never built. `rejected` — never built, for
the reason in its row.

## Rows that exist because the images cannot answer the question

These are recorded as decisions with their reason, but the underlying value is **not**
determinable from any reference image and must not be inferred from one.

| Question the images leave open | Where it surfaces | Recorded as |
|---|---|---|
| Folder colour scheme for the patient list (ref-B4 shows saturated colours with no legend) | Phase 6 patient folders | **UNKNOWN — needs owner decision** (D11). Neutral folder bodies from `--color-surface`/`--color-surface-muted`, status on the tab and in a small single-accent label, is the recommended default. |
| Status / critical hue for alerts and the Needs Attention queue (ref-A contains none) | Phases 2, 15 | **UNKNOWN — needs owner decision**. `StatusLabel` ships neutral ink only until a hue is approved; ref-B1's pastel red alert panel is not the source. |
| Specialty lens inside the notch title tab | Phase 4 workspace shell | **UNKNOWN — needs owner decision** (D5). Default per the pack: the current workspace context, no lens affordance. |
| Icon stroke weight (`strokeWidth={1.5}` is a first pass, not a measurement) | Phase 4 onward | **UNKNOWN — needs owner decision** at visual approval. |
| Latin and Arabic typefaces | Every screen; invalidates all visual baselines | **UNKNOWN — needs owner decision** (FND-06). Neutral `system-ui` fallback ships for now. |
| Module shadow depth (`--shadow-module`) | Every raised surface | **UNKNOWN — needs owner decision**. Starts restrained; tune DOWN only. |

## Reading rule for later phases

1. Find the element in the table above.
2. If its decision is `adopted` or `restyled`, read the named token from
   `src/styles/tokens.css` and use it. Do not re-derive a value from an image.
3. If its decision is `superseded` or `rejected`, the B reference is not a specification.
   Build from the locked decision recorded in the row, or do not build it.
4. If the value is `UNKNOWN`, stop and ask the owner. An OWNER DECISION is never resolved by
   picking whichever B image looks closest.

See `docs/design/reconciliation.md` for the A-vs-B conflicts behind these rows.

## Open Decisions

1. **Folder colours (D11)** — UNKNOWN — needs owner decision. Recommended: neutral ref-A
   folder bodies with status carried by the tab and a single-accent label, never a rainbow.
2. **Status / critical colour** — UNKNOWN — needs owner decision. ref-A defines none;
   `StatusLabel` stays neutral ink until a hue is approved.
3. **Specialty lens in the notch title tab (D5)** — UNKNOWN — needs owner decision. Default:
   current workspace context only.
4. **Icon stroke weight** — UNKNOWN — needs owner decision. Current `1.5` is a first pass.
5. **Latin typeface** — UNKNOWN — needs owner decision. Current `system-ui` fallback.
6. **Arabic companion typeface (FND-06)** — UNKNOWN — needs owner decision, and must be
   settled before visual baselines are trusted: changing it invalidates every baseline.
7. **`--shadow-module` depth** — UNKNOWN — needs owner decision. Starts restrained.
8. **Type scale ratios** — UNKNOWN — needs owner decision; ref-A is a raster and cannot yield
   a trustworthy scale.