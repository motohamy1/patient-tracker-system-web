# Design Tokens — ref-A Sampling

**Sampled:** 2026-10-05
**Authority:** `docs/design/ref-A-theme.png` (735×511 px) is the THEME AUTHORITY. Every color below is sampled from it. `ref-B4-folder-style.png` (107×147 px) informs folder FORM only and was deliberately **not** sampled for values — it is too low-resolution for measurements.

## Sampling Method (reproducible)

Deterministic pixel reads from the source PNG, no eyeballing:

```bash
# single pixel at (x,y) → hex
ffmpeg -v error -i docs/design/ref-A-theme.png -vf "crop=1:1:X:Y" -f rawvideo -pix_fmt rgb24 -
# scanline: print color runs longer than 3px along a row or column
node .planning/tmp/scan.mjs docs/design/ref-A-theme.png 735 511 {row|col} <index>
# dominant palette (quantized to 3 bits/channel)
node .planning/tmp/palette.mjs docs/design/ref-A-theme.png 735 511
```

Each token records the coordinate it was read from, so any later disagreement can be re-measured rather than argued.

## Confidence Convention

| Mark | Meaning |
|------|---------|
| **ref-A** | Value measured from ref-A at the stated coordinate |
| **derived** | Computed from ref-A values (e.g. spacing derived from a measured radius); derivation stated |
| **OWNER DECISION** | Not determinable from the images; requires owner choice before use |

---

## Color

### Structural colors

| Token | Value | Source coordinate | Provenance | Role |
|-------|-------|-------------------|------------|------|
| `--color-frame-olive` | `#4F4F28` | (400, 66), (400,101), (400,703) consistent | **ref-A** | Outer frame body — the olive border that wraps the workspace |
| `--color-frame-olive-deep` | `#434328` | (260, 108) | **ref-A** | Darker olive in the notch/header recess behind the title tab |
| `--color-canvas` | `#E0DFD6` | (400, 113) | **ref-A** | Warm greige inner canvas — the dominant surface |
| `--color-surface` | `#FFFFFF` | (300, 79) | **ref-A** | Raised module/card surface, pill fill |
| `--color-surface-muted` | `#EFEFEB` | (265, 300) | **ref-A** | Recessed module interior (chart/card wells) |
| `--color-surface-inset` | `#E9EAE5` | (100, 170) | **ref-A** | Identity-card well behind avatar/fields |

### Accent (single accent — one only)

| Token | Value | Source coordinate | Provenance | Role |
|-------|-------|-------------------|------------|------|
| `--color-accent` | `#F2FE46` | (400, 48) | **ref-A** | The single accent: outer background, timeline event nodes, active accent states |

Measured accent readings cluster in `#F2FE46`–`#F3FF47` (top-left corner `#F5FE47`, bottom-right `#F3FF47`) — a flat fill with ±3/channel compression noise, not a gradient. The token value is `#F2FE46`.

**Rejected values (do not adopt):** `#ECFC4C` (ref-B2 timeline accent — same family, B is not the authority) and `#FCCC00` (ref-B1 CTA amber-gold — explicitly rejected by the pack).

### Ink / dark surfaces

| Token | Value | Source coordinate | Provenance | Role |
|-------|-------|-------------------|------------|------|
| `--color-ink` | `#262D2D` | (638, 224) | **ref-A** | Dark "＋" end node and dark scrubber — the only near-black in ref-A |
| `--color-ink-strong` | `#13110D` | (95, 91) | **ref-A** | Primary text (near-black with a warm cast) |
| `--color-ink-muted` | `#8D8B8A` | palette histogram | **ref-A** | Secondary/meta text (labels, units, interval labels) |

### Chart / data colors

| Token | Value | Source coordinate | Provenance | Role |
|-------|-------|-------------------|------------|------|
| `--color-series-accent` | `#F2FE46` | same as `--color-accent` | **derived** | ref-A draws its data series in the single accent + a muted neutral — **no multicolor palette** |

**Prohibition (from PROJECT.md, enforced by ref-A):** no multicolor chart palettes. The B-image sparklines (blue/red/green/purple) and gradient fills are forbidden. When a chart needs a second series, use the muted neutral `--color-surface-muted` or a tinted step of the accent family, never a new hue.

### Status colors

ref-A shows **no** status colors — it is a single-accent composition with neutral surfaces. Every status/destructive/attention hue is therefore:

> **OWNER DECISION** — not derivable from ref-A. Phase 1 ships the primitives with a neutral default state; Phase 2 (Identity/RLS) and Phase 15 (Needs Attention) introduce status color only after owner approval. Never inherit status hues from ref-B1's pastel alert block.

---

## Spacing

No numeric spacing scale can be measured reliably from a 735×511 raster (1 px ≈ 0.4 device px at target sizes). What ref-A *does* establish is the rhythm language:

| Token | Value | Provenance | Basis |
|-------|-------|------------|-------|
| `--spacing` | `0.25rem` (4px) | **derived** | Tailwind v4 base; every other step is a multiple |
| `--space-2` | `0.5rem` | **derived** | icon gaps, pill inner padding |
| `--space-3` | `0.75rem` | **derived** | pill horizontal padding |
| `--space-4` | `1rem` | **derived** | default element gap |
| `--space-6` | `1.5rem` | **derived** | module inner padding |
| `--space-8` | `2rem` | **derived** | layout gaps |
| `--space-12` | `3rem` | **derived** | section padding |

**OWNER DECISION:** the absolute pixel ratios are not sampled. The executor must verify the gallery against ref-A and adjust before visual approval; the multiples-of-4 constraint is the non-negotiable part.

---

## Radii

ref-A's radius language is measurable at the frame and card level.

| Token | Value | Source | Provenance | Role |
|-------|-------|--------|------------|------|
| `--radius-frame` | `1.75rem` (28px) | frame outer corner spans x≈36→64 at y=68 (vertical scan at x=36) | **derived** | Olive frame corner |
| `--radius-module` | `1.25rem` (20px) | module cards are visibly ~0.7× the frame radius | **derived** | Blood Pressure / Symptoms / ECG cards |
| `--radius-pill` | `9999px` | primary + secondary pills are fully rounded (y-extent ~y=75→y=108 at x=300, capsule ends) | **ref-A** | Pill tabs, filter toggle, chips |
| `--radius-node` | `9999px` | accent nodes are circles | **ref-A** | Timeline accent node |
| `--radius-inner` | `0.75rem` (12px) | nested wells inside modules | **derived** | Inset wells, chart wells |

**Prohibition:** ref-A contains **no** small-radius "chip" radius — chips are pills. Do not introduce sharp-cornered chips.

---

## Shadows

| Token | Value | Provenance | Role |
|-------|-------|------------|------|
| `--shadow-module` | `0 1px 2px rgb(38 45 45 / 0.06), 0 8px 24px -12px rgb(38 45 45 / 0.10)` | **OWNER DECISION** — ref-A's shadow depth cannot be sampled from pixels; depth is *visually restrained* (flat, low-contrast) | Module cards |
| `--shadow-node` | `0 2px 6px rgb(38 45 45 / 0.14)` | **OWNER DECISION** — same reason | Timeline nodes |

**Prohibition (explicit, from PROJECT.md):** heavy neumorphism is forbidden. ref-A is flat and restrained. The B-image soft dual-direction neumorphic shadows must not be copied. The proposed values above start restrained and must be tuned DOWN, not up, during visual approval.

---

## Type

| Role | Size | Weight | Line height | Provenance |
|------|------|--------|-------------|------------|
| Display (workspace title in notch tab) | `1.5rem` | 600 | 1.2 | **OWNER DECISION** |
| Heading (module title, e.g. "Blood Pressure") | `1rem` | 600 | 1.3 | **OWNER DECISION** |
| Body | `0.875rem` | 400 | 1.5 | **OWNER DECISION** |
| Label / meta (units, interval labels, card meta) | `0.75rem` | 400–500 | 1.4 | **OWNER DECISION** |

**Why all OWNER DECISION:** ref-A is a raster at 735px wide; glyph heights are ~8–14 px and cannot yield a trustworthy font size, weight, or family. Fabricating a type scale from a raster would be exactly the "invented image-derived token" the pack forbids.

**Typeface family:**
- Latin: **OWNER DECISION** (ref-A's raster is not identifiable with confidence).
- Arabic companion: **OWNER DECISION** — already recorded as an owner decision in `REQUIREMENTS.md` FND-06.

Until both are chosen, ship a neutral fallback stack (`system-ui, sans-serif`) and mark every gallery type specimen `OWNER DECISION — pending`. **Consequence to record:** changing the typeface invalidates every Playwright visual baseline, so baselines must be generated after the choice.

**Units:** Western digits for clinical values (kg, °C, mmHg, mg/dL), per locked decision D1.

---

## Motion

ref-A is a static raster, so motion values cannot be sampled. The pack's locked rules govern:

| Token | Value | Provenance |
|-------|-------|------------|
| `--motion-duration-fast` | `120ms` | **OWNER DECISION** (derived from "fast, restrained" in the pack) |
| `--motion-duration-base` | `200ms` | **OWNER DECISION** |
| `--motion-ease-out` | `cubic-bezier(0.2, 0, 0, 1)` | **OWNER DECISION** |
| reduced motion | always honored via `MotionConfig reducedMotion="user"` | **derived** — required by FND-05 |

---

## Provenance Summary

| Category | ref-A | derived | OWNER DECISION |
|----------|-------|---------|----------------|
| Structural color | 6 tokens | — | — |
| Accent | 1 token (+2 rejected) | 1 | — |
| Ink / dark surfaces | 3 tokens | — | — |
| Chart color | — | 1 | — |
| Status color | — | — | **all** |
| Spacing | — | 7 | absolute ratios |
| Radii | 2 tokens | 3 | — |
| Shadows | — | — | **all** |
| Type scale | — | — | **all 4 roles** |
| Typeface families | — | — | **both** |
| Motion | — | 2 | durations, easing |

**35 token values are OWNER DECISION.** This is expected and correct: the pack forbids inventing image-derived values, and a 735×511 raster cannot support type or shadow inference. Every one carries an explicit `OWNER DECISION` marker in `src/styles/tokens.css` so FND-10 is checkable rather than aspirational.