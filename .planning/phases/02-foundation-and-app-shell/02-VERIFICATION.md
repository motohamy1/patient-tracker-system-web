# Phase 2 — Verification Artifact (02-VERIFICATION.md)

**Phase:** 2 — Foundation and App Shell
**Plan:** 02-11
**Written by:** task-2 (automated), 2026-10-07
**Gate owner:** task-3 (blocking human-verify) — verdicts in §6 are **PENDING** until the gate runs.

This artifact is the phase's acceptance record. `PRODUCT-MASTER-SPEC.md` §27 makes
"declaring a feature complete solely because the build passes" a hard prohibition, so this file
records the per-row QA results and the per-ID invariant evaluations — not merely a green suite.

A green suite is **evidence**, not the gate. The gate is the twelve QA rows and every applicable
`INV-xx` evaluation, judged by a human against the reference images (§6).

---

## 1. Automated verification results (task-2)

Run as one chain from the repository root on the Windows workstation:

```
npm run lint && npx vitest run tests/unit && npm run build && npm run test:visual
```

**Exit code: 0** (the single chain).

| Command | Result | Evidence |
|---|---|---|
| `npm run lint` | **PASS** (exit 0) | `check-design-tokens: 0 violations across 45 file(s) — no-raw-hex, no-generic-healthcare-blue and token-reference-required all pass (INV-01, INV-03, INV-13, INV-14).` |
| `npx vitest run tests/unit` | **PASS** (exit 0) | `Test Files 15 passed (15)` · `Tests 124 passed (124)` |
| `npm run build` | **PASS** (exit 0) | `✓ Compiled successfully` · static generation 6/6. `prebuild` re-ran the token generator and the three checks, re-proving D-05 and D-13 end to end. |
| `npm run test:visual` | **PASS** (exit 0) | `56 passed` — 48 surface screenshots (6 surfaces × 4 viewports × 2 motion projects) + 8 security tests (4 × 2 projects). |

**Baseline generation act (T-02-81 mitigation).** The 48 baselines were regenerated deliberately on
2026-07 against a fresh production build via:

```
npm run test:visual -- --update-snapshots
```

and then re-run **without** the flag to prove the suite is green against the committed set
(`npm run test:visual` → exit 0). No baseline PNG was hand-tuned.

### 1.1 Phase 001 fence re-run

| Fence check | Result |
|---|---|
| No raw hex outside `docs/governance/tokens.json` | **PASS** — `no-raw-hex` reports 0 violations across 45 source files. Raw hex remains confined to `tokens.json` (all 15 color values live there). |
| The eight governance files are intact | **PASS** — `motion-rules.md`, `project-constitution.md`, `reference-manifest.json`, `reference-ui-specification.md`, `responsive-rules.md`, `tokens.json`, `ui-invariants.md`, `visual-qa-rules.md` (8/8 present). |
| `tokens.json` → `review.gateStatus` | **PASS** — `approved-with-changes` (the value plan 02-01's D-27 gate recorded; never `pending`). `frame` `#F1F4F8`, `surfaceMuted` `#E8E8ED` are the re-sampled, frozen values. |

---

## 2. The twelve visual-QA rows (`docs/governance/visual-qa-rules.md` §1)

Legend: **MC** = machine-checked (a Phase-002 check or unit test decides it);
**RE** = reviewer-evaluated (a human judges it against the reference images at the task-3 gate).
`N/A` rows are recorded as not-applicable in Phase 002, naming the owning phase.

| # | Check | Kind | Automated evidence | Reviewer instruction (task-3) |
|---|---|---|---|---|
| 1 | Outer structure | RE | — | Compare shell chrome (provider rail, top bar, workspace tab group, patient bar) against `provider-home-primary.jpg` and `patient-workspace-timeline-primary.jpg`; confirm columns/rails/grid match the cited grammar and no reflow is invented. |
| 2 | Color relationships | RE | `no-raw-hex` (0) proves token-only color; `no-generic-healthcare-blue` (0) | Confirm the frame reads as light warm gray (D-01), cards separate by shadow not border, and accent ≤ 10% of visible area by pixel share. **Contrast ratios are not machine-verifiable** — see §4. |
| 3 | Spacing rhythm | RE (MC-assist) | `token-vocabulary` unit test asserts only the six `space.` steps appear; `token-reference-required` (0) | Walk the shells and gallery; confirm every gap/padding is a `space.` step and **no page-level section gap exceeds 32px** (`space.2xl`). |
| 4 | Compactness | RE | — | Confirm no control/card height exceeds its closest reference counterpart and no card holds one line of content or fewer. |
| 5 | Card proportions | RE | — | Provider folder grid is 3 columns ≥1024px; workspace bottom row ≈ 55/22.5/22.5 ±3%. (Phase 004/005 own the real grid/bottom row; Phase 002 confirms the frame.) |
| 6 | Pill controls | RE (MC-assist) | `token-vocabulary` unit test asserts only the five `radius.` steps appear | Confirm navigation and compact controls use `radius.pill` and no control renders a corner ≤ 4px. |
| 7 | Typography hierarchy | RE (MC-assist) | `token-vocabulary` unit test asserts only the four `font.size` values and weights 400/600 | Confirm only those sizes/weights appear and `tabular-nums` is applied to every clinical/statistical value (proportional specimen beside it in gallery §2). |
| 8 | Timeline proportions | **N/A** | — | **Not applicable in Phase 002** — no timeline ships here. Owned by **Phase 006**. Record as N/A, never as a pass. |
| 9 | Node/branch behavior | **N/A** | — | **Not applicable in Phase 002** — no timeline ships here. Owned by **Phase 006**. Record as N/A. |
| 10 | Bottom scrubber | **N/A** | — | **Not applicable in Phase 002** — the scrubber ships with **Phase 006**. Record as N/A. |
| 11 | Visual density | RE | — | Confirm provider/workspace read dense and patient home reads sparse on the upper range of the same spacing scale; both read as one design language. |
| 12 | Accent restraint | RE (MC-assist) | `no-generic-healthcare-blue` (0); `accentSoft` primary CTA per INV-05 reviewed in the gallery | Confirm accent appears only on the reserved list, the provider-home primary CTA uses `accentSoft` never `accent`, and status color is limited to `success`/`info`/`warning` (D-04). |

**Note on FOUND-01 (clinical content) and FOUND-02 (shared-primitive composition).** These are
content/structural claims, not patterns. FOUND-01 is machine-assisted by
`tests/unit/dev-fixtures.test.ts` (the only `Patient`-shaped literal is confined to `src/lib/dev/`
and no product route imports it) plus `security.spec.ts` (no fixture literal in the client bundle);
the reviewer still reads every route and every `src/lib/dev/**` fixture to confirm no medication,
lab, vital or diagnosis appears. FOUND-02's structural claim ("screens composed from shared
primitives") is reviewer-evaluated.

---

## 3. Invariant registry (`docs/governance/ui-invariants.md`)

The **machine-checked subset is exactly `INV-01`, `INV-03`, `INV-13`, `INV-14`**, implemented by the
three Phase-002 checks (`no-raw-hex`, `no-generic-healthcare-blue`, `token-reference-required`). Every
other invariant is **reviewer-evaluated** against its stated objective check, some with a mechanical
assist noted. A missing evaluation, or a recorded failure, blocks acceptance.

| ID | Invariant | Kind | Evidence / reviewer instruction (task-3) |
|---|---|---|---|
| INV-01 | Token-only styling | **MC** | `no-raw-hex` + `token-reference-required`: 0 violations across 45 files. |
| INV-02 | No dark frame or dark nav | RE | Sample a structural-chrome region; confirm relative luminance ≥ 0.6 and no frame/nav region reads darker than `textPrimary`. |
| INV-03 | No generic blue/indigo/violet/purple | **MC** | `no-generic-healthcare-blue`: 0 matches. |
| INV-04 | One accent family; status is `success`/`info`/`warning` | RE (MC-assist) | `tokens.json` has exactly the 15 keys — no new tint token. Reviewer confirms status encoding is a subset of `success`/`info`/`warning`; pastel chips render from `canvas`/`surface`/`borderSubtle`. |
| INV-05 | Accent restraint | RE | Confirm `accent` appears only on the reserved list and ≤10% of visible area; `accentSoft` carries the primary CTA. A primary CTA painted `accent` **fails**. |
| INV-06 | No gamification | RE (MC-assist) | Repository-wide text search for `points`, `level`, `streak`, `reward`, `celebrat`, `confetti`, `firework`, `trophy`, `badge earned` returns zero UI-visible matches. |
| INV-07 | Radius scale (5 steps only) | RE (MC-assist) | `token-vocabulary` unit test asserts only `radius.sm/md/lg/xl/pill` appear; reviewer confirms the rendered radii belong to the scale. |
| INV-08 | Pill controls | RE (MC-assist) | `token-vocabulary` radius assertion. Reviewer confirms compact nav/controls use `radius.pill`. (The scrubber capsule is owned by Phase 006.) |
| INV-09 | No sharp corners (≤4px) | RE | Confirm no interactive element renders a computed radius ≤ 4px. |
| INV-10 | Spacing scale; no page gap > 32px | RE (MC-assist) | `token-vocabulary` asserts only the six `space.` steps appear; reviewer confirms no page-level section gap exceeds `space.2xl` (44px mobile targets are targets, not spacing). |
| INV-11 | Hairline lines (1px) | RE | Confirm every rule/divider/axis is 1px. (The timeline event-node stroke is owned by Phase 006.) |
| INV-12 | Compactness | RE | Confirm no card exceeds its reference counterpart's height and none holds one line without a stated information purpose. |
| INV-13 | Exactly two elevation levels | **MC** | `token-reference-required`: 0 violations. `tokens.json` → `shadow` contains exactly two keys (`raised`, `overlay`). |
| INV-14 | No invented shadows | **MC** | `token-reference-required`: 0 violations; zero local `box-shadow` literals. |
| INV-15 | Hairline borders only on true dividers | RE | Confirm `borderSubtle` appears on no card edge (only true dividers / table lines / axis / scrubber track). |
| INV-16 | No outlined cards | RE | Confirm no card renders a visible full-perimeter border; edges separate by `shadow.raised` alone. |
| INV-17 | No excessive glass/neumorphism; scrim from `textPrimary` | RE | Confirm the overlay scrim derives from `textPrimary` and no new token was introduced. (The dark scrubber viewport window and MRI card are owned by Phase 006.) |

**D-27 outcome (recorded here; confirmed by observation at the gate).** Plan 02-01 re-sampled
`frame` (`#F1F4F8`) and `surfaceMuted` (`#E8E8ED`) so the four surface roles are visually distinct
without a border (INV-15/16) or a third shadow (INV-13). The task-3 gate must confirm the four
`surfaceMuted` controls — the compact search field, the icon-toggle off state, the tab-bar container
and the inset note field specimen — now read with a **visible boundary** against their parent. If
they do not, the D-27 outcome is a **fail** and the phase does not close.

---

## 4. Contrast is NOT machine-verifiable (and neither is the 44px target)

`jsdom` computes no layout or colors, and a screenshot diff detects *change*, not *ratio*. The
following are reviewer-evaluated **only**:

- **Contrast of `text-*` against its `bg-*` token background** — compute WCAG ratios against the
  frozen values in `docs/governance/tokens.json` for the 52 enumerated pairings in §5.
- **Focus-visible ring appearance** — walk each shell and each gallery row with the keyboard;
  confirm a visible ring at every interactive primitive and that the ring on the overlay panel is
  visible against its scrim.
- **DOM focus order** — Tab through each shell; confirm the perceived order matches visual order.
- **44px minimum touch target** — at `390x844` and `768x1024`, measure every interactive primitive in
  both axes (`docs/governance/responsive-rules.md` §3–§4). Confirm mobile navigation is a
  horizontally scrolling pill strip, not a hamburger-only collapse.

### Frozen surface values (for the reviewer's ratio computation)

| Token | Value | Token | Value |
|---|---|---|---|
| `frame` | `#F1F4F8` | `textPrimary` | `#32353A` |
| `canvas` | `#DDE0E5` | `textSecondary` | `#C5C7CB` |
| `surface` | `#E0E3E8` | `borderSubtle` | `#A2A4AA` |
| `surfaceMuted` | `#E8E8ED` | `accent` | `#EEFE4E` |
| `surfaceRaised` | `#EBECF0` | `accentSoft` | `#FFCE03` |
| `frameForeground` | `#A9ACB0` | `success` / `warning` / `critical` / `info` | `#C5EADC` / `#FFC30C` / `#FFCBC8` / `#BDCDEF` |

Per 02-UI-SPEC.md §"Contrast Findings", only `textPrimary` clears WCAG AA against every light fill,
so every label/value/icon in Phase 2 is painted `textPrimary` and the remaining tokens are surface
fills and decorative tints (status is carried by a `textPrimary` label plus a tint dot).

---

## 5. Enumerated `text-*` / `bg-*` pairings (emitted by `scripts/check-design-tokens.mjs`)

The check script emits **52** text/bg pairings (`contrast-pairs`), advisory for the reviewer's WCAG
table and never part of the exit code. This is the finite list to compute ratios against.

```
src/components/dev/GallerySections.tsx  text=text-body  bg=bg-canvas
src/components/dev/GallerySections.tsx  text=text-display  bg=bg-canvas
src/components/dev/GallerySections.tsx  text=text-heading  bg=bg-canvas
src/components/dev/GallerySections.tsx  text=text-label  bg=bg-canvas
src/components/dev/GallerySections.tsx  text=text-text-primary  bg=bg-canvas
src/components/overlays/Overlay.tsx  text=text-body  bg=bg-text-primary
src/components/overlays/Overlay.tsx  text=text-heading  bg=bg-text-primary
src/components/overlays/Overlay.tsx  text=text-text-primary  bg=bg-text-primary
src/components/primitives/Button.tsx  text=text-body  bg=bg-accent-soft
src/components/primitives/Button.tsx  text=text-body  bg=bg-surface-raised
src/components/primitives/Button.tsx  text=text-text-primary  bg=bg-accent-soft
src/components/primitives/Button.tsx  text=text-text-primary  bg=bg-surface-raised
src/components/primitives/CompactControl.tsx  text=text-body  bg=bg-surface-muted
src/components/primitives/CompactControl.tsx  text=text-body  bg=bg-surface-raised
src/components/primitives/CompactControl.tsx  text=text-text-primary  bg=bg-surface-muted
src/components/primitives/CompactControl.tsx  text=text-text-primary  bg=bg-surface-raised
src/components/primitives/EmptyState.tsx  text=text-body  bg=bg-surface-raised
src/components/primitives/EmptyState.tsx  text=text-heading  bg=bg-surface-raised
src/components/primitives/EmptyState.tsx  text=text-text-primary  bg=bg-surface-raised
src/components/primitives/Pill.tsx  text=text-label  bg=bg-info
src/components/primitives/Pill.tsx  text=text-label  bg=bg-success
src/components/primitives/Pill.tsx  text=text-label  bg=bg-surface-muted
src/components/primitives/Pill.tsx  text=text-label  bg=bg-warning
src/components/primitives/Pill.tsx  text=text-text-primary  bg=bg-info
src/components/primitives/Pill.tsx  text=text-text-primary  bg=bg-success
src/components/primitives/Pill.tsx  text=text-text-primary  bg=bg-surface-muted
src/components/primitives/Pill.tsx  text=text-text-primary  bg=bg-warning
src/components/primitives/TabBar.tsx  text=text-label  bg=bg-surface-raised
src/components/primitives/TabBar.tsx  text=text-text-primary  bg=bg-surface-raised
src/components/shell/MobileNav.tsx  text=text-label  bg=bg-frame
src/components/shell/MobileNav.tsx  text=text-label  bg=bg-surface-muted
src/components/shell/MobileNav.tsx  text=text-label  bg=bg-surface-raised
src/components/shell/MobileNav.tsx  text=text-text-primary  bg=bg-frame
src/components/shell/MobileNav.tsx  text=text-text-primary  bg=bg-surface-muted
src/components/shell/MobileNav.tsx  text=text-text-primary  bg=bg-surface-raised
src/components/shell/PatientTopBar.tsx  text=text-body  bg=bg-frame
src/components/shell/PatientTopBar.tsx  text=text-body  bg=bg-success
src/components/shell/PatientTopBar.tsx  text=text-body  bg=bg-surface-raised
src/components/shell/PatientTopBar.tsx  text=text-text-primary  bg=bg-frame
src/components/shell/PatientTopBar.tsx  text=text-text-primary  bg=bg-success
src/components/shell/PatientTopBar.tsx  text=text-text-primary  bg=bg-surface-raised
src/components/shell/ProviderRail.tsx  text=text-text-primary  bg=bg-frame
src/components/shell/ProviderRail.tsx  text=text-text-primary  bg=bg-surface-raised
src/components/shell/ProviderTopBar.tsx  text=text-body  bg=bg-frame
src/components/shell/ProviderTopBar.tsx  text=text-body  bg=bg-surface-raised
src/components/shell/ProviderTopBar.tsx  text=text-label  bg=bg-frame
src/components/shell/ProviderTopBar.tsx  text=text-label  bg=bg-surface-raised
src/components/shell/ProviderTopBar.tsx  text=text-text-primary  bg=bg-frame
src/components/shell/ProviderTopBar.tsx  text=text-text-primary  bg=bg-surface-raised
src/components/shell/WorkspaceTopBar.tsx  text=text-heading  bg=bg-frame
src/components/shell/WorkspaceTopBar.tsx  text=text-label  bg=bg-frame
src/components/shell/WorkspaceTopBar.tsx  text=text-text-primary  bg=bg-frame
```

`bg-text-primary` pairings are the overlay scrim (the scrim is derived from `textPrimary`, INV-17),
so the text painted over it is the inverse; the reviewer confirms the overlay label clears the scrim.

---

## 6. Baseline portability

The 48 baseline PNGs at `tests/visual/baselines/{surface}/{viewport}/{state}.png` are **workstation-
local** artifacts. Playwright states plainly that browser rendering varies with host OS, version,
settings, hardware and power state. Everything pinnable is pinned (`deviceScaleFactor: 1`,
`animations: 'disabled'`, `caret: 'hide'`, `colorScheme: 'light'`, fixed timezone/locale, a fixed
`baseURL`, `reuseExistingServer: false`) and no `{platform}` segment is used, but a runner change
still invalidates the rasterization.

**Whoever adds CI must regenerate the baselines on that runner with `--update-snapshots` — never
copy the committed PNGs across.** No CI provider configuration exists in this repository (D-17), and
this phase creates none. (Threat T-02-80 / T-02-82.)

---

## 7. Human verification (task-3) — PENDING

> Filled at the blocking `checkpoint:human-verify` gate. A green suite is not the gate; the QA rows
> and reviewer-evaluated invariants are.

**Reviewer identity:** _pending_
**Review date:** _pending_

| QA # | Human verdict | Note |
|---|---|---|
| 1 | _pending_ | |
| 2 | _pending_ | |
| 3 | _pending_ | |
| 4 | _pending_ | |
| 5 | _pending_ | |
| 6 | _pending_ | |
| 7 | _pending_ | |
| 8 | **N/A** | Phase 006 |
| 9 | **N/A** | Phase 006 |
| 10 | **N/A** | Phase 006 |
| 11 | _pending_ | |
| 12 | _pending_ | |

| INV | Human verdict | Note |
|---|---|---|
| INV-02 | _pending_ | |
| INV-04 | _pending_ | |
| INV-05 | _pending_ | |
| INV-06 | _pending_ | |
| INV-07 | _pending_ | |
| INV-08 | _pending_ | |
| INV-09 | _pending_ | |
| INV-10 | _pending_ | |
| INV-11 | _pending_ | |
| INV-12 | _pending_ | |
| INV-15 | _pending_ | |
| INV-16 | _pending_ | |
| INV-17 | _pending_ | |

(`INV-01`, `INV-03`, `INV-13`, `INV-14` are machine-checked and need no human verdict.)

**D-27 outcome:** _pending — confirm the four `surfaceMuted` controls read with a visible boundary._

**Diagnostic-asset check:** _pending — open `docs/reference/patient-tracking-dashboard.jpg` and
confirm the shell does **not** resemble it (it is §3.7 diagnostic evidence, never a design source)._

**Focus-ring / focus-order check:** _pending._

**44px touch-target check:** _pending._

**Reduced-motion check:** _pending — OS preference plus `npm run test:visual -- --project=reduced-motion`._

---

*Phase: 2 — Foundation and App Shell · Plan 02-11 · verification written by task-2, human verdicts by task-3.*
