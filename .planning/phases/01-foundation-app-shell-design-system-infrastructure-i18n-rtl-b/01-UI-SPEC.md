---
phase: 1
slug: foundation-app-shell-design-system-infrastructure-i18n-rtl-base-visual-regression-harness
status: draft
shadcn_initialized: false
preset: none
created: 2026-10-05
---

# Phase 1 — UI Design Contract

> Visual and interaction contract for Phase 1. Generated from `docs/design/ref-A-theme.png` (theme authority), with `docs/design/tokens.md` sampled values as the numeric source.

---

## Design System

| Property | Value |
|----------|-------|
| Tool | **none — custom primitives.** No shadcn, no component registry. ref-A's language (olive frame, notch tab, capsule pills, single lime accent) is not expressible through shadcn's neutral default theme, and PROJECT.md forbids adding dependencies without a written reason. |
| Preset | not applicable |
| Component library | none — hand-built primitives in `src/components/ui/` |
| Icon library | Theme-matched **line icons**, hand-authored as inline SVG in `src/components/ui/icons/`. No icon package (adding `lucide-react` etc. would be an unapproved dependency, and ref-A's stroke weights must be matched exactly). |
| Font | **OWNER DECISION** — both Latin and Arabic families unresolved. Ship `system-ui, sans-serif` fallback until chosen. Arabic companion typeface is already an open owner decision (FND-06). |

---

## Composition (ref-A, the frame)

Measured from the 735×511 raster; see `docs/design/tokens.md` for coordinates.

```
┌─────────────────────────────────────────────────────────┐  ← outer field: --color-accent (#F2FE46)
│  ╭───────────────────────────────────────────────────╮  │
│  │ ⓧ │ Cardiology                        ⌕  ᗒ  ♀  ♊  ⚕ │  │  ← olive frame (#4F4F28)
│  │   ╰── title tab (notch) ──╯   [primary pill tabs]  │  │     notch tab is the raised
│  │   ┌─────────────────────────────────────────────┐   │  │     canvas-colored tab that
│  │   │ [avatar] Female 24              Diagnosis   │   │  │     breaks out of the frame
│  │   │          Tiffany Woodward    │ Hypertension │   │  │
│  │   ├─────────────────────────────────────────────┤   │  │
│  │   │  ▭  ⬤  ⬤   ⬤  ⬤   ●   ━━━ timeline line ━━━  ⊕  │   │  ← accent nodes, dark "+" node
│  │   │      ╰─╮ rounded elbow branches              │   │  │
│  │   │   ▭chip │ Blood Pressure  ▭chip              │   │  │
│  │   │  ◗────╯  ◗────╯               Average 160/110│  │  │
│  │   │  ▭▭▭▭▭▭▭ bottom scrubber (dark, highlighted)  │   │  │
│  │   └─────────────────────────────────────────────┘   │  │
│  ╰───────────────────────────────────────────────────╯  │
└─────────────────────────────────────────────────────────┘
```

**Frame primitives** (FND-03):
- Outer field is `--color-accent`; the app frame is `--color-frame-olive` with `--radius-frame` (28px), inset from the viewport edge.
- **Notch-tab header:** the title tab ("Cardiology") is a canvas-colored rounded tab that breaks out of the olive bar's top edge; a circular close control sits to its inline-start. This is the layout primitive every later phase reuses.
- Header also hosts the primary pill tab group (inline-end), each pill = line icon + label.

**Non-goal for Phase 1:** the notch title shows current workspace context only. Whether it later shows a specialty lens is unresolved owner decision D5 — build the tab as a text slot, not a specialty-lens component.

---

## Spacing Scale

Declared in `src/styles/tokens.css` as `@theme static`. All values are multiples of 4; the base is Tailwind v4's `--spacing: 0.25rem`.

| Token | Value | Usage |
|-------|-------|-------|
| `--space-2` | 0.5rem (8px) | Icon gaps, pill inner padding |
| `--space-3` | 0.75rem (12px) | Pill horizontal padding, chip gaps |
| `--space-4` | 1rem (16px) | Default element spacing |
| `--space-6` | 1.5rem (24px) | Module inner padding |
| `--space-8` | 2rem (32px) | Layout gaps |
| `--space-12` | 3rem (48px) | Section padding |

Exceptions: the olive frame's inset from the viewport edge is `--space-4` on desktop and `--space-2` on mobile (touch-first, per ref-A's compact framing).

**RTL rule:** every spacing token maps to a *logical* property only — `padding-inline`, `margin-block`, `inset-inline`, `border-start-start-radius`. Physical forms (`margin-left`, `left`, `text-align: left`, `rounded-tl-*`) are banned; a test asserts their absence.

---

## Typography

| Role | Size | Weight | Line Height | Provenance |
|------|------|--------|-------------|------------|
| Display (notch title) | 1.5rem | 600 | 1.2 | OWNER DECISION |
| Heading (module title) | 1rem | 600 | 1.3 | OWNER DECISION |
| Body | 0.875rem | 400 | 1.5 | OWNER DECISION |
| Label / meta | 0.75rem | 500 | 1.4 | OWNER DECISION |

Declared as paired `--text-*` / `--text-*--line-height` tokens so size and line height stay coupled.

**Typeface:** OWNER DECISION (Latin + Arabic). Until chosen, `system-ui, sans-serif`.

**Clinical numerals:** Western digits in both locales — `Intl.NumberFormat(locale, { numberingSystem: 'latn' })`. Units are explicit and never abbreviated silently (kg, °C, mmHg, mg/dL).

---

## Color

Ref-A is a **single-accent** composition: warm greige canvas, near-white raised modules, olive structural frame, one lime accent, one near-black for the end node and scrubber. Full sampled table with coordinates is in `docs/design/tokens.md`.

| Role | Value | Usage |
|------|-------|-------|
| Outer field / accent | `#F2FE46` | Outer background, timeline event nodes, active accent state |
| Frame (structural) | `#4F4F28` | Olive frame, notch header bar |
| Canvas (dominant) | `#E0DFD6` | Inner canvas, title tab |
| Surface | `#FFFFFF` | Raised module cards, pills |
| Surface muted | `#EFEFEB` | Recessed module wells, chart interiors |
| Ink (dark surface) | `#262D2D` | "＋" end node, bottom scrubber |
| Ink (text) | `#13110D` | Primary text |
| Ink muted | `#8D8B8A` | Labels, units, interval labels |
| Destructive / status | **OWNER DECISION** | Not present in ref-A. Ship neutral defaults; add only after owner approval. |

**Accent reserved for:** timeline event nodes, the active primary/secondary pill state, and the outer field. **Never** for generic interactive affordances, links, hover states, or chart series — those use ink and muted neutrals.

**Rejected (must not appear):** `#ECFC4C` (ref-B2 accent), `#FCCC00` (ref-B1 CTA amber), B-image cool blue-grey surfaces `#DEE4EA`/`#F0F0F6`, B-image multicolor sparklines, B-image gradient fills, B-image pastel alert block, B-image heavy neumorphic shadows, B-image 3D pill/alarm-clock illustration, tablet bezel from ref-B3.

---

## Primitive Inventory (FND-03, FND-04)

| Primitive | Description | ref-A reference |
|-----------|-------------|-----------------|
| `AppFrame` | Olive rounded frame inset in the accent outer field | Frame body, corners ~(28px) |
| `NotchHeader` | Title tab breaking out of the frame top edge + circular close control | "Cardiology" tab, ⓧ button |
| `PrimaryPillTabs` | Capsule tab group: line icon + label, active state | "Treatment Dynamics · Vitals · Medications · Labs · Allergies · Genetics" |
| `SecondaryPillRow` | Smaller capsule row with a filter toggle | "Office Visits · Medications · Labs · Pressure · Hospitalizations · Imaging" |
| `CircularIconButton` | Round icon-only control | ⓧ close control |
| `Chip` | Capsule chip: record type + line icon + date | Medication chips ("Aspirin ×2") |
| `ModuleSurface` | Raised rounded card | Blood Pressure / Symptoms / ECG cards |
| `StatusLabel` | Small neutral label | **OWNER DECISION** — no status color in ref-A |
| `DarkScrubber` | Near-black rounded band with a highlighted visible window | Bottom scrubber |
| `AccentNode` | Filled lime circle on the timeline | Accent event nodes |
| `LineIcon` | Theme-matched single-stroke icon set | All icons in ref-A |

**Gallery contract (FND-07):** `/[locale]/design-gallery` renders every primitive above in every state (default, hover, focus-visible, active, disabled) across desktop/mobile and LTR/RTL. Direction and locale are driven by URL, never a client toggle, so each direction is its own deterministic page.

**Glyph rule:** peeking cards, chips, and modules never display clinical images, results, or diagnoses — only record types, line icons, and dates. (Applies from Phase 6 onward; the gallery uses placeholder labels only.)

---

## Motion Contract

| Aspect | Rule | Provenance |
|--------|------|------------|
| Duration | 120ms fast / 200ms base | OWNER DECISION (derived from "fast, restrained") |
| Easing | `cubic-bezier(0.2, 0, 0, 1)` | OWNER DECISION |
| Library | `motion` (formerly Framer Motion) via `motion/react` | Approved stack; vendor rename recorded as the written reason |
| Reduced motion | One root `<MotionConfig reducedMotion="user">` | Required by FND-05 |
| CSS vs JS | CSS `motion-safe`/`motion-reduce` for hover/focus; Motion for enter/exit/layout | Independent mechanisms — both must be configured |

**Reduced-motion state must be designed, not discovered:** `layout`-driven indicators (active tab underline, folder peek, node expansion) become instant jumps under reduced motion. Design that resting state.

---

## RTL Contract

| Concern | Rule |
|---------|------|
| Direction source | Server-resolved on `<html lang dir>` from `[locale]`; never computed in a client hook |
| Layout | Logical CSS properties only; physical forms banned and test-asserted |
| Text alignment | `text-start` / `text-end` only |
| Corner radii | `rounded-s` / `rounded-e` logical variants only |
| Clinical numerals | Western digits via `numberingSystem: 'latn'` |
| Timeline axis (Phase 5) | Stays chronological left→right inside RTL pages — locked decision, force with an explicit `ltr:` variant |
| Forced exception | Any component that must not flip declares its own direction explicitly (timeline axis only) |

---

## Copywriting Contract

Phase 1 ships primitives with **no product copy** — the gallery uses type specimens and neutral labels. This contract is recorded now so Phase 4 inherits it rather than inventing voice:

| Element | Copy |
|---------|------|
| Primary CTA | Specific verb + noun ("Add patient", "Start visit") — never "Click here" |
| Empty state heading | States what is missing, honestly ("No visits recorded yet") |
| Empty state body | What is missing + the next action |
| Error state | Problem + solution path ("Could not load labs. Retry.") |
| Destructive confirmation | Action name: confirmation copy ("Delete record: this cannot be undone.") |
| Language | Arabic + English from the first component; no English-only fallback strings |
| Forbidden | Gamification language (points, levels, badges, streaks); claim of saved data when data is local only |

---

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| shadcn official | **none** | not applicable |
| third-party | **none** | not applicable |

No component registry is used. All primitives are hand-built from `docs/design/tokens.css`. This is a deliberate safety position: a registry block cannot silently inject a neutral-theme visual language into a product whose theme authority is ref-A.

---

## Prohibitions (must-NOT, from ref-A reconciliation + PROJECT.md)

These are negative checks. They belong in `must_haves.prohibitions`, never in `must_haves.truths`.

| Statement | Status | Verification |
|-----------|--------|--------------|
| No gradients anywhere | resolved | Grep `src/` for `gradient` → zero matches |
| No glassmorphism / backdrop-blur | resolved | Grep for `backdrop-blur`, `backdrop-filter` → zero matches |
| No heavy neumorphism (dual soft shadow pairs) | resolved | Every shadow token is single-layer; assert token list |
| No 3D illustration or 3D icons | resolved | No 3D assets; icon set is single-stroke SVG |
| No multicolor chart palettes | resolved | Chart tokens = accent + muted neutrals only |
| No pastel alert blocks | resolved | No pastel surfaces in tokens |
| No gamification visuals or copy | resolved | Grep for points/levels/badges/streaks/confetti → zero matches |
| No Bootstrap/Material table styling | resolved | No table registry; gallery has no data table |
| Exactly one accent color | resolved | Assert the accent token list has one entry |
| No physical CSS direction properties | resolved | Grep for `margin-left`, `margin-right`, `left:`, `right:`, `text-left`, `text-right`, `rounded-tl`, `rounded-br` in `src/` → zero matches |
| No `NEXT_PUBLIC_` secret / service-role key | resolved | Grep `.next/static` for `sb_secret_`/`service_role` → zero matches |

---

## Copywriting / Voice Notes

B-image defects must never be copied (they appear in the source references and are the most likely accidental leak): the leaked prompt label "Next Action' Hero Card", typos ("Mao", "Mays", "wiked", "Connition", "kat"), duplicated patient names, the overlapping filter bar, the tablet bezel, and the outdated tab bar (B2's "Overview | Visits | Medications | Labs | Imaging | Vital Signs | Communication" — superseded by the locked order).

---

## Checker Sign-Off

- [ ] Dimension 1 Copywriting: PASS
- [ ] Dimension 2 Visuals: PASS
- [ ] Dimension 3 Color: PASS
- [ ] Dimension 4 Typography: PASS
- [ ] Dimension 5 Spacing: PASS
- [ ] Dimension 6 Registry Safety: PASS

**Approval:** pending owner review (visual approval against ref-A is a manual checkpoint; 35 token values remain OWNER DECISION)