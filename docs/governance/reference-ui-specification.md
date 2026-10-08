# Reference UI Specification — Patient Clinical Workspace

This is the human-facing **Reference UI Specification** for the Patient Clinical Workspace.
It is the materialized form of the approved Phase 1 UI design contract (`01-UI-SPEC.md`),
and it is the document later phases cite for their surface grammar.

It contains **no product code** and **no raw color value**. Every color resolves through
`docs/governance/tokens.json`; this document cites token names and JSON paths only.

---

## 1. Scope and how to read this document

**Structure (D-15).** This document is one **shared design-system core** (§2 — color,
spacing, typography, geometry, depth) plus **one per-surface grammar section per binding
primary**:

| Surface | Section | Binding source |
|---|---|---|
| Provider Home | §4 | `docs/reference/provider-home-primary.jpg` |
| Patient Workspace and D3 Timeline | §5 | `docs/reference/patient-workspace-timeline-primary.jpg` |
| Patient Home | §6 | `docs/reference/patient-home-primary.jpg` |

Every later phase cites the section for its surface and inherits §2 unchanged. **No phase
invents a second design language.** A surface that does not appear in the table above has no
binding grammar in this document and must be derived from its own approved feature
specification plus §2 — never from a new visual language.

**Precedence.** When two sources disagree, resolve in this order: (1)
`docs/governance/project-constitution.md` — the top of the authority hierarchy; (2) this
document and `docs/governance/ui-invariants.md`; then the approved feature specification,
the approved technical plan, the approved tasks, the existing repository implementation and
agent preference (constitution §2.1). The existing repository is never a higher authority
than the approved design or specification.

**What binds and what is never copied (D-13).** Layout, geometry, density, proportion,
interaction patterns and color **relationships** bind from the three primaries. The sample
clinical content visible in those images never binds and is never copied — see §9.

**Where the values live.** The exact frozen values live in `docs/governance/tokens.json` and
nowhere else. This document **cites** them by path and token name rather than restating
them, so documentation and code cannot drift (D-07). §3 is a **non-normative** evidence
record for those values; §2 is the normative prose contract.

**What this document specifies but does not implement.** The Playwright visual-regression
harness (§8.2) and the three machine checks (`no-raw-hex`, `no-generic-healthcare-blue`,
`token-reference-required`, named in the constitution §8) are **specified here and
implemented in Phase 002** (D-17, D-18). This phase writes no test file, no harness, no
lint rule and no CI configuration.

**Citing sections.** Later phases cite by section name. The anchors
`reference-ui-specification.md#provider-home-grammar`,
`reference-ui-specification.md#patient-workspace-and-d3-timeline-grammar` and
`reference-ui-specification.md#patient-home-grammar` are recorded in
`docs/governance/reference-manifest.json` and resolve to §4, §5 and §6 respectively.

**Reference registry.** Four assets are registered. Three are **binding** primaries:
`docs/reference/provider-home-primary.jpg`,
`docs/reference/patient-workspace-timeline-primary.jpg` and
`docs/reference/patient-home-primary.jpg`. The fourth,
`docs/reference/patient-tracking-dashboard.jpg`, carries role **diagnostic**: it is evidence
of the current implementation's failures and it is **never a design source**. It is never
sampled for a design value and never cited for grammar. The machine-readable registry —
path, role, sha256 and governing sections — is `docs/governance/reference-manifest.json`.

**No dark frame (D-01).** Across all three binding primaries the frame and navigation render
as a light warm-gray with an olive undertone — **never a dark surface**. This matches the
constitution §4.2 and is a standing prohibition: no phase may restore, correct toward, or
reintroduce a dark frame or dark navigation. The only sanctioned dark elements are the
contained overlay elements named in §2.5 and §5 (the scrubber viewport window and the MRI
event card), which render at the overlay elevation and never as a frame.

---

## 2. Design-system core

The core is shared by every surface. Surfaces vary their **density and composition**, never
the token vocabulary, the geometry scale, the type scale or the elevation model.

### 2.1 Color — the 15-token semantic contract

**60 / 30 / 10 role summary.** The visual weight of any surface splits roughly 60 / 30 / 10.

- **Dominant — 60%.** `canvas` carries the workspace field, and `frame` carries structural
  chrome (the top bar and the side rail). Both are light, and per D-01 the frame is **never
  a dark surface** — it is a light warm-gray with an olive undertone at high lightness.
- **Secondary — 30%.** `surface` carries cards, `surfaceMuted` carries inset panels (the
  scrubber track, the quick-log note field), and `surfaceRaised` carries raised cards and
  modals. The reference separates these from the field primarily by shadow and secondarily
  by fill (D-03, D-06).
- **Accent — 10%.** `accent` is the chartreuse sampled from the timeline event nodes, used
  strictly for the reserved list below.
- **Destructive / critical.** `critical` is the salmon-rose family of the Critical Alerts
  panel, used for destructive actions and critical-alert accents only. Soft fills render as
  `critical` at reduced opacity over `surface` — never as a new token.

The table below is the human-facing token contract. The `Resolves to` cell of every row is a
**citation**, not a value: the frozen value itself lives only in
`docs/governance/tokens.json` → `color`. No hex value is restated anywhere in this document.

| Token name | Role | Resolves to | Notes |
|---|---|---|---|
| `frame` | Structural chrome — top bar, side rail, navigation frame | `docs/governance/tokens.json` → `color.frame` | The measured frame tones from the three primaries. Light warm-gray with an olive undertone; never a dark surface (D-01). |
| `frameForeground` | Ink of frame icons and frame labels | `docs/governance/tokens.json` → `color.frameForeground` | The dark ink of frame icons and labels. The reference's icon strokes are 2–3px at sampling resolution, so the frozen value is the darkest window that satisfies the agreement gate — an ink/background blend flagged `visionEstimate` + `ownerConfirm` in `docs/governance/tokens.json` → `review`, adjudicated at the D-08 gate. |
| `canvas` | Workspace field — the outer page background | `docs/governance/tokens.json` → `color.canvas` | The timeline-primary outer field; D-06 names the timeline primary as the canvas/surface exemplar. |
| `surface` | Card fill | `docs/governance/tokens.json` → `color.surface` | Card fills, one step lighter and cooler than `canvas` per D-06; the reference separates cards from the field by shadow first. |
| `surfaceMuted` | Inset panel fill | `docs/governance/tokens.json` → `color.surfaceMuted` | Inset panel fill — the quick-log note field (the D-27 re-sampled anchor) and the scrubber track. Re-opened and re-sampled from the binding references by D-27 on 2026-10-06; value and provenance in `docs/governance/tokens.json` → `color.surfaceMuted` and `provenance.tokens[4]`. |
| `surfaceRaised` | Raised card and modal fill | `docs/governance/tokens.json` → `color.surfaceRaised` | The `surface` family plus `shadow.raised`, used for cards and modals (D-03). |
| `textPrimary` | Primary text and primary ink | `docs/governance/tokens.json` → `color.textPrimary` | Near-black warm gray, **never pure black** (D-06). Frozen from the large flat dark neutral of the timeline scrubber viewport window and the MRI event-card overlay; the reference's primary ink is pure black and fails every window gate, which D-06 forbids freezing. |
| `textSecondary` | Secondary text and axis labels | `docs/governance/tokens.json` → `color.textSecondary` | Muted gray for secondary text and axis labels. A thin-glyph blend flagged `visionEstimate` + `ownerConfirm` in `docs/governance/tokens.json` → `review`. |
| `borderSubtle` | Hairline dividers and axis | `docs/governance/tokens.json` → `color.borderSubtle` | Hairline weight only (D-05): true dividers, table row lines, the timeline axis and the scrubber track. Never a card outline. |
| `accent` | Chartreuse accent — see the reserved list | `docs/governance/tokens.json` → `color.accent` | Sampled from the filled circular event nodes of the timeline primary — D-02's named source. |
| `accentSoft` | CTA gold accent — the provider-home primary CTA and key interaction buttons | `docs/governance/tokens.json` → `color.accentSoft` | Admitted at the D-08 owner design gate (2026-10-06): the D-02 accent split is confirmed, so this gold is a distinct hue from the timeline `accent` chartreuse (measured separation 17.12°). Sampled from the provider-home primary CTA pill. There is no third yellow token. |
| `success` | Semantic "normal" status | `docs/governance/tokens.json` → `color.success` | The provider/patient "normal" status family. |
| `warning` | Semantic "follow-up" status | `docs/governance/tokens.json` → `color.warning` | The "follow-up" amber; the weakest-evidence token, flagged `ownerConfirm` in `docs/governance/tokens.json` → `review` and pixel-confirmed at the D-08 gate. |
| `critical` | Destructive and critical-alert accent | `docs/governance/tokens.json` → `color.critical` | The salmon-rose family measured on the Critical Alerts panel. Soft fills render at reduced opacity over `surface` — never a new token. |
| `info` | Semantic "pending" status | `docs/governance/tokens.json` → `color.info` | The "pending" soft-blue pill family. |

**Admitted fifteenth token.** `accentSoft` was admitted at the D-08 owner design gate
(2026-10-06). The D-02 accent split is confirmed: the timeline chartreuse (`accent`) carries
event nodes, milestones, active emphasis and state indicators, while the CTA gold
(`accentSoft`) carries the primary CTA and key interaction buttons. They are two distinct hues
— the measured separation is 17.12°, above the 8° threshold — and there is no third yellow
token, ever.

#### Accent reserved for

`accent` (the timeline chartreuse) is reserved for exactly this list:

- timeline event nodes and their count badges;
- timeline milestone markers;
- active/selected emphasis markers (an active chart-range toggle; a selected scrubber range
  is **not** accent — it is the dark overlay viewport window);
- key state indicator dots;
- important-interaction highlights.

`accentSoft` (the CTA gold) is reserved for exactly this list:

- the provider-home primary CTA (**not** `accent`);
- key interaction buttons.

The two reserved lists are exhaustive and mutually exclusive: every accent-family use belongs
either to `accent` or to `accentSoft`, never to both. `docs/governance/ui-invariants.md` →
`INV-05` and `docs/governance/visual-qa-rules.md` → QA row 12 enumerate the same two lists.

`accent` is **not** for: the provider-home primary CTA (that is `accentSoft`), folder cards
(status uses `success` / `info` / `warning` only), body text, borders, backgrounds,
decorative fills, or **every icon**.

#### Multi-hue restriction

Folder tab headers and status pills encode meaning with `success`, `info` and `warning`
only. The pastel mint/lavender/blue/tan quick-log chips visible in the patient-home primary
are **decorative icon tints**, rendered from the existing `canvas`, `surface` and
`borderSubtle` tokens — **no new tint family** is added. This is the concrete enforcement of
"never every folder a different saturated color" (D-04).

#### Role-based contract (D-11)

The token contract is **role-based, not literal-value-based**: a dark-mode set can be added
later without renaming any token. This package ships light-mode values only — the reference
grammar is a light-mode product, and no dark token set is authored in this phase.

### 2.2 Spacing

One six-step scale, read from `docs/governance/tokens.json` → `space`. There is no spacing
value outside this scale and no page-level 48px or 64px break — the reference keeps a compact
clinical rhythm throughout.

| Token | Value | Usage |
|---|---|---|
| `space.xs` | 4px | Icon-to-label gaps and the timeline node-to-label offset |
| `space.sm` | 8px | Compact control padding-y, chip gaps, status pill insets, stat-row gaps |
| `space.md` | 12px | Compact control padding, folder-card row spacing, timeline micro-card padding |
| `space.lg` | 16px | Dense clinical card inner padding and list row padding |
| `space.xl` | 24px | Section padding, card-to-card gaps, patient-home card padding |
| `space.2xl` | 32px | Major layout gaps and patient-home generous card padding |

**Exceptions.** Touch targets on mobile are at least 44px in both axes — that is a **target
size, not a spacing value**, and it does not extend the scale. Patient home deliberately uses
the upper end of the same scale (`space.xl` through `space.2xl`) for lower density, while the
provider and workspace surfaces use `space.xs` through `space.lg` inside cards.

### 2.3 Typography

Exactly four sizes and exactly two weights, read from `docs/governance/tokens.json` → `font`.

| Role | Size | Weight | Line height |
|---|---|---|---|
| Display / stat value | `font.size.display` (28px) | `font.weight.semibold` (600) | `font.lineHeight.tight` |
| Heading / card and section title | `font.size.heading` (16px) | `font.weight.semibold` (600) | `font.lineHeight.heading` |
| Body | `font.size.body` (14px) | `font.weight.regular` (400) | `font.lineHeight.body` |
| Label / secondary / axis | `font.size.label` (12px) | `font.weight.regular` (400) | `font.lineHeight.label` |

**Rules.**

- `tabular-nums` is mandatory on every clinical and statistical value.
- The eyebrow style (for example "MEDICATION REMINDER:") is the 12px label at weight 400
  with `text-transform: uppercase` and `letter-spacing: 0.08em`. A 500 weight is **not
  allowed**.
- Weights are exactly 400 and 600. A 700 weight is **never added**; titles the eye reads as
  "bold" are 600 at the declared sizes.
- The body minimum for any non-decorative text is 12px.
- The family is a neutral grotesque sans, provisionally Inter, flagged for owner review.
- The icon language is thin-stroke line icons at 1.5px stroke, provisionally Lucide, flagged
  for owner review.

### 2.4 Geometry

One five-step radius scale, read from `docs/governance/tokens.json` → `radius`. Strong,
rounded geometry throughout — the reference has no sharp-cornered control anywhere.

| Token | Value | Usage |
|---|---|---|
| `radius.sm` | 8px | Inner chips and small controls |
| `radius.md` | 12px | Inputs, compact controls, nested and inner cards |
| `radius.lg` | 16px | Standard cards and folder cards |
| `radius.xl` | 24px | Large cards and panels — timeline bottom cards, patient-home cards |
| `radius.pill` | 999px | Pills: buttons, tab bar controls, status pills, search input, scrubber capsule, quick-log chips |

**Uses.** Pills for compact navigation and controls; very rounded cards; soft container
corners; compact tags and banners; thin, precise visual lines.

**Avoids.** Sharp corners; arbitrary mixed radius systems (these five steps only); bulky
dashboard tiles; huge empty cards that add no information.

### 2.5 Depth and elevation

There are **exactly two elevation levels** (D-03), read from
`docs/governance/tokens.json` → `shadow`:

- `shadow.raised` — cards and modals, applied to the `surfaceRaised` family;
- `shadow.overlay` — the single overlay level, for popovers and the scrubber viewport
  window.

Components **never invent their own shadow values**.

`borderSubtle` is a **hairline** used only for true dividers, table row lines, the timeline
axis and the scrubber track (D-05). There is no outlined-card look — card edges separate by
shadow, not border.

The dark scrubber viewport window and the MRI event card render at the overlay level with a
scrim derived from `textPrimary` — never a new color token. These are the only sanctioned
dark elements in a binding primary, and they are contained overlay elements, not a frame
(D-01).

**Avoids.** Excessive glassmorphism and excessive neumorphism that makes controls
indistinguishable. The reference — a soft outer shadow plus a faint inner light edge — is
the authority, not the trend names.

---

## 3. Token provenance (non-normative record)

This section is the **non-normative** evidence record for the frozen values. The normative
values are `docs/governance/tokens.json` → `color`; nothing in this section is read by the
Phase-002 token generator. It exists so the D-08 owner gate can audit how each value was
derived without re-running sampling, and so the sampling coordinates live somewhere the owner
can read.

The record lives in `docs/governance/tokens.json` → `provenance.tokens`, an array of one
entry per sampled token in the canonical token order used below. Each entry carries its source
image, the sampling method, its windows with their re-sample reads and deltas, the frozen
median, and the `visionEstimate` / `ownerConfirm` flags. `accentSoft` was admitted at the
D-08 owner design gate and is not a `provenance.tokens` entry; its window evidence is the
D-02 cross-check recorded in `docs/governance/tokens.json` → `provenance.crossChecks[0]`, cited
in §3.15. This document copies the **window coordinates and deltas only**; every sampled value
is cited as a JSON path, because raw color values have exactly one home under
`docs/governance/` and it is not this file.

### 3.1 frame — sampling record

D-27 re-open (2026-10-06): the frame primary windows moved to the provider-home
structural chrome — the left icon rail and the top-bar band of the provider-home
primary. The previous freeze's timeline top-bar band windows are retained as the
flat-band comparison in `docs/governance/tokens.json` → `provenance.crossChecks`
("frame flat-band comparison (D-27 re-open)"), so the two structures are compared
rather than merged. Method: the Phase 001 documented fallback (a) —
`System.Drawing region-average (crop WxH+X+Y, area-average, rgb24)` — because the
workstation's ffmpeg 8.1.1 build misdecodes these assets' mjpeg light-neutral range
through its filter chain; recorded in `docs/governance/tokens.json` →
`provenance.tokens[0].method` with `visionEstimate: true`, owner adjudication at the
D-27 re-freeze gate.

| Window | Source image | x | y | w | h | Sampled RGB | Max per-channel delta on ±4px re-sample |
|---|---|---|---|---|---|---|---|
| 1 | `docs/reference/provider-home-primary.jpg` | 30 | 120 | 16 | 16 | `tokens.json → provenance.tokens[0].windows[0].rgb` | 0 |
| 2 | `docs/reference/provider-home-primary.jpg` | 24 | 460 | 16 | 16 | `tokens.json → provenance.tokens[0].windows[1].rgb` | 1 |
| 3 | `docs/reference/provider-home-primary.jpg` | 24 | 720 | 16 | 16 | `tokens.json → provenance.tokens[0].windows[2].rgb` | 0 |
| 4 | `docs/reference/provider-home-primary.jpg` | 100 | 1300 | 16 | 16 | `tokens.json → provenance.tokens[0].windows[3].rgb` | 1 |
| 5 | `docs/reference/provider-home-primary.jpg` | 400 | 18 | 16 | 16 | `tokens.json → provenance.tokens[0].windows[4].rgb` | 1 |
| 6 | `docs/reference/provider-home-primary.jpg` | 800 | 18 | 16 | 16 | `tokens.json → provenance.tokens[0].windows[5].rgb` | 0 |

Frozen value: `tokens.json → provenance.tokens[0].median`; the normative value is
`docs/governance/tokens.json` → `color.frame`. Flags: `visionEstimate: true`,
`ownerConfirm: false`.

### 3.2 frameForeground — sampling record

| Window | Source image | x | y | w | h | Sampled RGB | Max per-channel delta on ±4px re-sample |
|---|---|---|---|---|---|---|---|
| 1 | `docs/reference/patient-workspace-timeline-primary.jpg` | 1342 | 148 | 24 | 24 | `tokens.json → provenance.tokens[1].windows[0].rgb` | 1 |
| 2 | `docs/reference/patient-workspace-timeline-primary.jpg` | 2170 | 124 | 24 | 24 | `tokens.json → provenance.tokens[1].windows[1].rgb` | 2 |
| 3 | `docs/reference/patient-workspace-timeline-primary.jpg` | 828 | 142 | 24 | 24 | `tokens.json → provenance.tokens[1].windows[2].rgb` | 1 |
| 4 | `docs/reference/patient-workspace-timeline-primary.jpg` | 1572 | 144 | 24 | 24 | `tokens.json → provenance.tokens[1].windows[3].rgb` | 2 |
| 5 | `docs/reference/patient-workspace-timeline-primary.jpg` | 680 | 142 | 24 | 24 | `tokens.json → provenance.tokens[1].windows[4].rgb` | 1 |

Frozen value: `tokens.json → provenance.tokens[1].median`; the normative value is
`docs/governance/tokens.json` → `color.frameForeground`. Flags: `visionEstimate: true`,
`ownerConfirm: true`.

**Risk zone — owner confirmation required.** `frameForeground` is a thin-stroke
anti-aliasing risk zone: the reference's frame icon strokes are 2–3px wide, so no conforming
window can sit wholly inside the ink and the frozen value is an ink/background blend. It is
flagged for owner confirmation at the D-08 design gate.

### 3.3 canvas — sampling record

| Window | Source image | x | y | w | h | Sampled RGB | Max per-channel delta on ±4px re-sample |
|---|---|---|---|---|---|---|---|
| 1 | `docs/reference/patient-workspace-timeline-primary.jpg` | 20 | 780 | 24 | 24 | `tokens.json → provenance.tokens[2].windows[0].rgb` | 1 |
| 2 | `docs/reference/patient-workspace-timeline-primary.jpg` | 8 | 840 | 24 | 24 | `tokens.json → provenance.tokens[2].windows[1].rgb` | 0 |
| 3 | `docs/reference/patient-workspace-timeline-primary.jpg` | 8 | 900 | 24 | 24 | `tokens.json → provenance.tokens[2].windows[2].rgb` | 0 |
| 4 | `docs/reference/patient-workspace-timeline-primary.jpg` | 10 | 808 | 24 | 24 | `tokens.json → provenance.tokens[2].windows[3].rgb` | 0 |
| 5 | `docs/reference/patient-workspace-timeline-primary.jpg` | 38 | 840 | 24 | 24 | `tokens.json → provenance.tokens[2].windows[4].rgb` | 0 |

Frozen value: `tokens.json → provenance.tokens[2].median`; the normative value is
`docs/governance/tokens.json` → `color.canvas`. Flags: `visionEstimate: false`,
`ownerConfirm: false`.

### 3.4 surface — sampling record

| Window | Source image | x | y | w | h | Sampled RGB | Max per-channel delta on ±4px re-sample |
|---|---|---|---|---|---|---|---|
| 1 | `docs/reference/patient-workspace-timeline-primary.jpg` | 756 | 266 | 24 | 24 | `tokens.json → provenance.tokens[3].windows[0].rgb` | 1 |
| 2 | `docs/reference/patient-workspace-timeline-primary.jpg` | 836 | 268 | 24 | 24 | `tokens.json → provenance.tokens[3].windows[1].rgb` | 0 |
| 3 | `docs/reference/patient-workspace-timeline-primary.jpg` | 600 | 332 | 24 | 24 | `tokens.json → provenance.tokens[3].windows[2].rgb` | 1 |
| 4 | `docs/reference/patient-workspace-timeline-primary.jpg` | 680 | 332 | 24 | 24 | `tokens.json → provenance.tokens[3].windows[3].rgb` | 0 |
| 5 | `docs/reference/patient-workspace-timeline-primary.jpg` | 720 | 268 | 24 | 24 | `tokens.json → provenance.tokens[3].windows[4].rgb` | 0 |

Frozen value: `tokens.json → provenance.tokens[3].median`; the normative value is
`docs/governance/tokens.json` → `color.surface`. Flags: `visionEstimate: false`,
`ownerConfirm: false`.

### 3.5 surfaceMuted — sampling record

D-27 re-open (2026-10-06): the surfaceMuted primary windows moved to the quick-log
note field of the patient-home primary — the region whose inset fill genuinely
differs. The scrubber capsule track cross-check
(`docs/governance/tokens.json` → `provenance.crossChecks`,
"surfaceMuted scrubber-track cross-check (D-27 re-open)") measures the surface
family on the timeline primary (its cross-check medians are the
`provenance.crossChecks` entries cited below), so re-sampling the old shared
band would have reproduced the collapse. The previous freeze's track windows are
retained as the flat-band comparison in the same `provenance.crossChecks` block.
Method: the Phase 001 documented fallback (a) — `System.Drawing region-average
(crop WxH+X+Y, area-average, rgb24)` — recorded in `docs/governance/tokens.json` →
`provenance.tokens[4].method` with `visionEstimate: true`, owner adjudication at
the D-27 re-freeze gate.

| Window | Source image | x | y | w | h | Sampled RGB | Max per-channel delta on ±4px re-sample |
|---|---|---|---|---|---|---|---|
| 1 | `docs/reference/patient-home-primary.jpg` | 910 | 1252 | 16 | 16 | `tokens.json → provenance.tokens[4].windows[0].rgb` | 1 |
| 2 | `docs/reference/patient-home-primary.jpg` | 1030 | 1276 | 16 | 16 | `tokens.json → provenance.tokens[4].windows[1].rgb` | 1 |
| 3 | `docs/reference/patient-home-primary.jpg` | 1150 | 1252 | 16 | 16 | `tokens.json → provenance.tokens[4].windows[2].rgb` | 0 |
| 4 | `docs/reference/patient-home-primary.jpg` | 1270 | 1276 | 16 | 16 | `tokens.json → provenance.tokens[4].windows[3].rgb` | 1 |
| 5 | `docs/reference/patient-home-primary.jpg` | 1390 | 1252 | 16 | 16 | `tokens.json → provenance.tokens[4].windows[4].rgb` | 0 |

Frozen value: `tokens.json → provenance.tokens[4].median`; the normative value is
`docs/governance/tokens.json` → `color.surfaceMuted`. Flags: `visionEstimate: true`,
`ownerConfirm: false`.

### 3.6 surfaceRaised — sampling record

| Window | Source image | x | y | w | h | Sampled RGB | Max per-channel delta on ±4px re-sample |
|---|---|---|---|---|---|---|---|
| 1 | `docs/reference/patient-workspace-timeline-primary.jpg` | 670 | 170 | 12 | 12 | `tokens.json → provenance.tokens[5].windows[0].rgb` | 1 |
| 2 | `docs/reference/patient-workspace-timeline-primary.jpg` | 712 | 126 | 20 | 20 | `tokens.json → provenance.tokens[5].windows[1].rgb` | 1 |
| 3 | `docs/reference/patient-workspace-timeline-primary.jpg` | 778 | 136 | 16 | 16 | `tokens.json → provenance.tokens[5].windows[2].rgb` | 2 |
| 4 | `docs/reference/patient-workspace-timeline-primary.jpg` | 664 | 128 | 12 | 12 | `tokens.json → provenance.tokens[5].windows[3].rgb` | 1 |
| 5 | `docs/reference/patient-workspace-timeline-primary.jpg` | 716 | 170 | 12 | 12 | `tokens.json → provenance.tokens[5].windows[4].rgb` | 1 |

Frozen value: `tokens.json → provenance.tokens[5].median`; the normative value is
`docs/governance/tokens.json` → `color.surfaceRaised`. Flags: `visionEstimate: false`,
`ownerConfirm: false`.

### 3.7 textPrimary — sampling record

| Window | Source image | x | y | w | h | Sampled RGB | Max per-channel delta on ±4px re-sample |
|---|---|---|---|---|---|---|---|
| 1 | `docs/reference/patient-workspace-timeline-primary.jpg` | 2108 | 1216 | 24 | 24 | `tokens.json → provenance.tokens[6].windows[0].rgb` | 1 |
| 2 | `docs/reference/patient-workspace-timeline-primary.jpg` | 2188 | 1218 | 24 | 24 | `tokens.json → provenance.tokens[6].windows[1].rgb` | 1 |
| 3 | `docs/reference/patient-workspace-timeline-primary.jpg` | 2146 | 1250 | 24 | 24 | `tokens.json → provenance.tokens[6].windows[2].rgb` | 0 |
| 4 | `docs/reference/patient-workspace-timeline-primary.jpg` | 2138 | 1216 | 24 | 24 | `tokens.json → provenance.tokens[6].windows[3].rgb` | 0 |
| 5 | `docs/reference/patient-workspace-timeline-primary.jpg` | 2216 | 1220 | 24 | 24 | `tokens.json → provenance.tokens[6].windows[4].rgb` | 1 |

Frozen value: `tokens.json → provenance.tokens[6].median`; the normative value is
`docs/governance/tokens.json` → `color.textPrimary`. Flags: `visionEstimate: false`,
`ownerConfirm: false`.

### 3.8 textSecondary — sampling record

| Window | Source image | x | y | w | h | Sampled RGB | Max per-channel delta on ±4px re-sample |
|---|---|---|---|---|---|---|---|
| 1 | `docs/reference/patient-workspace-timeline-primary.jpg` | 2256 | 1116 | 24 | 24 | `tokens.json → provenance.tokens[7].windows[0].rgb` | 2 |
| 2 | `docs/reference/patient-workspace-timeline-primary.jpg` | 316 | 1118 | 24 | 24 | `tokens.json → provenance.tokens[7].windows[1].rgb` | 2 |
| 3 | `docs/reference/patient-workspace-timeline-primary.jpg` | 1912 | 1116 | 24 | 24 | `tokens.json → provenance.tokens[7].windows[2].rgb` | 2 |
| 4 | `docs/reference/patient-workspace-timeline-primary.jpg` | 2304 | 1112 | 24 | 24 | `tokens.json → provenance.tokens[7].windows[3].rgb` | 2 |
| 5 | `docs/reference/patient-workspace-timeline-primary.jpg` | 270 | 494 | 24 | 24 | `tokens.json → provenance.tokens[7].windows[4].rgb` | 2 |

Frozen value: `tokens.json → provenance.tokens[7].median`; the normative value is
`docs/governance/tokens.json` → `color.textSecondary`. Flags: `visionEstimate: true`,
`ownerConfirm: true`.

**Risk zone — owner confirmation required.** `textSecondary` is a thin-stroke
anti-aliasing risk zone: the reference's label and axis glyphs are 2–3px wide, so the frozen
value is an ink/background blend. It is flagged for owner confirmation at the D-08 design
gate.

### 3.9 borderSubtle — sampling record

| Window | Source image | x | y | w | h | Sampled RGB | Max per-channel delta on ±4px re-sample |
|---|---|---|---|---|---|---|---|
| 1 | `docs/reference/patient-workspace-timeline-primary.jpg` | 90 | 772 | 24 | 2 | `tokens.json → provenance.tokens[8].windows[0].rgb` | 1 |
| 2 | `docs/reference/patient-workspace-timeline-primary.jpg` | 182 | 772 | 24 | 2 | `tokens.json → provenance.tokens[8].windows[1].rgb` | 1 |
| 3 | `docs/reference/patient-workspace-timeline-primary.jpg` | 750 | 772 | 24 | 2 | `tokens.json → provenance.tokens[8].windows[2].rgb` | 1 |
| 4 | `docs/reference/patient-workspace-timeline-primary.jpg` | 806 | 772 | 24 | 2 | `tokens.json → provenance.tokens[8].windows[3].rgb` | 2 |
| 5 | `docs/reference/patient-workspace-timeline-primary.jpg` | 838 | 772 | 24 | 2 | `tokens.json → provenance.tokens[8].windows[4].rgb` | 1 |

Frozen value: `tokens.json → provenance.tokens[8].median`; the normative value is
`docs/governance/tokens.json` → `color.borderSubtle`. Flags: `visionEstimate: false`,
`ownerConfirm: false`.

### 3.10 accent — sampling record

| Window | Source image | x | y | w | h | Sampled RGB | Max per-channel delta on ±4px re-sample |
|---|---|---|---|---|---|---|---|
| 1 | `docs/reference/patient-workspace-timeline-primary.jpg` | 452 | 846 | 20 | 20 | `tokens.json → provenance.tokens[9].windows[0].rgb` | 0 |
| 2 | `docs/reference/patient-workspace-timeline-primary.jpg` | 1544 | 898 | 20 | 20 | `tokens.json → provenance.tokens[9].windows[1].rgb` | 1 |
| 3 | `docs/reference/patient-workspace-timeline-primary.jpg` | 126 | 960 | 24 | 24 | `tokens.json → provenance.tokens[9].windows[2].rgb` | 1 |
| 4 | `docs/reference/patient-workspace-timeline-primary.jpg` | 884 | 950 | 20 | 20 | `tokens.json → provenance.tokens[9].windows[3].rgb` | 0 |
| 5 | `docs/reference/patient-workspace-timeline-primary.jpg` | 1410 | 728 | 24 | 24 | `tokens.json → provenance.tokens[9].windows[4].rgb` | 1 |

Frozen value: `tokens.json → provenance.tokens[9].median`; the normative value is
`docs/governance/tokens.json` → `color.accent`. Flags: `visionEstimate: false`,
`ownerConfirm: false`.

### 3.11 success — sampling record

| Window | Source image | x | y | w | h | Sampled RGB | Max per-channel delta on ±4px re-sample |
|---|---|---|---|---|---|---|---|
| 1 | `docs/reference/patient-home-primary.jpg` | 768 | 1104 | 24 | 24 | `tokens.json → provenance.tokens[10].windows[0].rgb` | 1 |
| 2 | `docs/reference/patient-home-primary.jpg` | 602 | 1056 | 24 | 24 | `tokens.json → provenance.tokens[10].windows[1].rgb` | 1 |
| 3 | `docs/reference/patient-home-primary.jpg` | 798 | 1054 | 24 | 24 | `tokens.json → provenance.tokens[10].windows[2].rgb` | 1 |
| 4 | `docs/reference/patient-home-primary.jpg` | 668 | 1064 | 24 | 24 | `tokens.json → provenance.tokens[10].windows[3].rgb` | 0 |
| 5 | `docs/reference/patient-home-primary.jpg` | 1626 | 732 | 16 | 16 | `tokens.json → provenance.tokens[10].windows[4].rgb` | 1 |
| 6 | `docs/reference/patient-home-primary.jpg` | 1702 | 734 | 16 | 16 | `tokens.json → provenance.tokens[10].windows[5].rgb` | 1 |

Frozen value: `tokens.json → provenance.tokens[10].median`; the normative value is
`docs/governance/tokens.json` → `color.success`. Flags: `visionEstimate: false`,
`ownerConfirm: false`.

### 3.12 warning — sampling record

| Window | Source image | x | y | w | h | Sampled RGB | Max per-channel delta on ±4px re-sample |
|---|---|---|---|---|---|---|---|
| 1 | `docs/reference/provider-home-primary.jpg` | 1712 | 518 | 16 | 6 | `tokens.json → provenance.tokens[11].windows[0].rgb` | 1 |
| 2 | `docs/reference/provider-home-primary.jpg` | 1732 | 518 | 16 | 6 | `tokens.json → provenance.tokens[11].windows[1].rgb` | 1 |
| 3 | `docs/reference/provider-home-primary.jpg` | 1752 | 518 | 16 | 6 | `tokens.json → provenance.tokens[11].windows[2].rgb` | 1 |
| 4 | `docs/reference/provider-home-primary.jpg` | 1772 | 518 | 16 | 6 | `tokens.json → provenance.tokens[11].windows[3].rgb` | 1 |
| 5 | `docs/reference/provider-home-primary.jpg` | 1792 | 518 | 16 | 6 | `tokens.json → provenance.tokens[11].windows[4].rgb` | 1 |

Frozen value: `tokens.json → provenance.tokens[11].median`; the normative value is
`docs/governance/tokens.json` → `color.warning`. Flags: `visionEstimate: false`,
`ownerConfirm: true`.

**Risk zone — owner confirmation required.** `warning` is the weakest-evidence token: the
follow-up status amber is carried by a thin saturated track and a small pill, so the value is
a thin-stroke anti-aliasing risk zone. It is flagged for owner confirmation at the D-08
design gate.

### 3.13 critical — sampling record

| Window | Source image | x | y | w | h | Sampled RGB | Max per-channel delta on ±4px re-sample |
|---|---|---|---|---|---|---|---|
| 1 | `docs/reference/provider-home-primary.jpg` | 2336 | 360 | 16 | 16 | `tokens.json → provenance.tokens[12].windows[0].rgb` | 1 |
| 2 | `docs/reference/provider-home-primary.jpg` | 2274 | 406 | 16 | 16 | `tokens.json → provenance.tokens[12].windows[1].rgb` | 1 |
| 3 | `docs/reference/provider-home-primary.jpg` | 2418 | 402 | 16 | 16 | `tokens.json → provenance.tokens[12].windows[2].rgb` | 1 |
| 4 | `docs/reference/provider-home-primary.jpg` | 2398 | 406 | 16 | 16 | `tokens.json → provenance.tokens[12].windows[3].rgb` | 1 |
| 5 | `docs/reference/provider-home-primary.jpg` | 2310 | 546 | 16 | 16 | `tokens.json → provenance.tokens[12].windows[4].rgb` | 1 |
| 6 | `docs/reference/provider-home-primary.jpg` | 2306 | 318 | 16 | 16 | `tokens.json → provenance.tokens[12].windows[5].rgb` | 1 |

Frozen value: `tokens.json → provenance.tokens[12].median`; the normative value is
`docs/governance/tokens.json` → `color.critical`. Flags: `visionEstimate: false`,
`ownerConfirm: true`.

### 3.14 info — sampling record

| Window | Source image | x | y | w | h | Sampled RGB | Max per-channel delta on ±4px re-sample |
|---|---|---|---|---|---|---|---|
| 1 | `docs/reference/patient-home-primary.jpg` | 1106 | 1030 | 20 | 20 | `tokens.json → provenance.tokens[13].windows[0].rgb` | 0 |
| 2 | `docs/reference/patient-home-primary.jpg` | 1134 | 1090 | 20 | 20 | `tokens.json → provenance.tokens[13].windows[1].rgb` | 1 |
| 3 | `docs/reference/patient-home-primary.jpg` | 1130 | 1040 | 16 | 16 | `tokens.json → provenance.tokens[13].windows[2].rgb` | 1 |
| 4 | `docs/reference/patient-home-primary.jpg` | 1076 | 1094 | 16 | 16 | `tokens.json → provenance.tokens[13].windows[3].rgb` | 0 |
| 5 | `docs/reference/patient-home-primary.jpg` | 1068 | 1072 | 12 | 12 | `tokens.json → provenance.tokens[13].windows[4].rgb` | 2 |

Frozen value: `tokens.json → provenance.tokens[13].median`; the normative value is
`docs/governance/tokens.json` → `color.info`. Flags: `visionEstimate: false`,
`ownerConfirm: false`.

### 3.15 accentSoft — sampling record (D-02 cross-check)

`accentSoft` was admitted at the D-08 owner design gate. Its evidence is the provider-home
primary-CTA cross-check, not a `provenance.tokens` entry.

| Window | Source image | x | y | w | h | Sampled RGB | Max per-channel delta on ±4px re-sample |
|---|---|---|---|---|---|---|---|
| 1 | `docs/reference/provider-home-primary.jpg` | 1482 | 70 | 24 | 24 | `tokens.json → provenance.crossChecks[0].windows[0].rgb` | 0 |
| 2 | `docs/reference/provider-home-primary.jpg` | 1568 | 70 | 24 | 24 | `tokens.json → provenance.crossChecks[0].windows[1].rgb` | 0 |
| 3 | `docs/reference/provider-home-primary.jpg` | 1706 | 70 | 24 | 24 | `tokens.json → provenance.crossChecks[0].windows[2].rgb` | 0 |
| 4 | `docs/reference/provider-home-primary.jpg` | 1820 | 70 | 24 | 24 | `tokens.json → provenance.crossChecks[0].windows[3].rgb` | 0 |
| 5 | `docs/reference/provider-home-primary.jpg` | 1958 | 70 | 24 | 24 | `tokens.json → provenance.crossChecks[0].windows[4].rgb` | 0 |

Frozen value: `tokens.json → provenance.crossChecks[0].median`; the normative value is
`docs/governance/tokens.json` → `color.accentSoft`. The cross-check note records the timeline
event-node median (the `accent` chartreuse) beside the provider-home CTA median (the
`accentSoft` gold). Owner-confirmed at the D-08 gate: `review.accentSplit.ownerConfirmed` is
`true` and the measured hue separation is 17.12°.

### 3.16 Sampling method

Per token, at least five disjoint 8-to-24px windows were placed at least 12px away from any
text, icon, card edge, divider or node boundary. Each window was sub-scanned on a 4x4 grid and
rejected if its per-channel spread exceeded 4/255. Each accepted window was re-sampled shifted
plus and minus 4px horizontally and required to agree within plus/minus 2/255 per channel. The
frozen value is the channel-wise median of the accepted windows. The method is ffmpeg
region-average pixel sampling (crop, area-scale to a single pixel, rgb24). Every window and its
reads are recorded in `docs/governance/tokens.json` → `provenance.tokens` (`accentSoft`'s reads are
the D-02 cross-check in `provenance.crossChecks`).

`docs/reference/patient-tracking-dashboard.jpg` was never sampled for design values because it
is diagnostic evidence only — it is the old implementation, its role is `diagnostic`, and it is
never a design source.

## 4. Provider Home grammar

**Binding source: `docs/reference/provider-home-primary.jpg`**

- **Outer structure.** A left thin icon rail in the light `frame` carrying thin line icons
  with no labels at this density; a top bar with a pill search input, the gold primary CTA
  pill (icon plus dark text), a notification bell, and a provider profile with a chevron; a
  three-column body with the Today's Schedule rail on the left (stacked compact appointment
  cards carrying a time block, a name, an appointment type and action icons), the patient
  folder grid in the centre, and a Critical Alerts panel plus Daily Stats on the right as 2x2
  mini stat cards with sparklines.
- **Accessible names (binding).** Every icon-only control ships an accessible name — rail
  items, appointment-card action icons, the notification bell and the tab-bar icons. An
  icon-only control with no accessible name never ships in the DOM; Phase 002 implements this
  rather than guessing it.
- **Folder grid.** `3 columns` measured at desktop; each folder is a `radius.lg` card
  floating on `canvas`, with `surface` lighter than `canvas`; concise identity (name,
  minimal age/sex or MRN, a compact status label, last activity, small contextual indicators).
- **Status encoding.** Subtle semantic pills riding thin progress lines, using `success` for
  normal, `info` for pending and `warning` for follow-up (D-04); the Phase-4 owner design gate
  (R-1, option A, 2026-10-08) additionally admits the frozen `critical` family for the Critical
  folder status — still a closed set, never a new tint. Never one
  saturated color per folder.
- **Critical Alerts.** A soft salmon panel — the `critical` family at low intensity over
  `surface` — with 3 to 4 alert rows and warning icons.
- **Density.** Dense-but-scannable, with compact controls and no bulky tiles.
- **Pop-out filter panel.** The Recent / Critical / Today's Schedule toggles are reference
  interaction grammar for retrieval controls; Phase 004 owns the panel's exact form.

Binding: layout, geometry, density, proportion, interaction patterns, color relationships.
Not binding: the sample content visible in this image — see §9.

## 5. Patient Workspace and D3 Timeline grammar

**Binding source: `docs/reference/patient-workspace-timeline-primary.jpg`**

- **Top bar.** A pill search input, a pill tab bar where the active tab is a raised pill in
  the `surfaceRaised` family with an icon and the inactive tabs are flat text on the
  container, an avatar with a name, and a bell with a state dot.
- **Canonical tab set.** **Exactly** `Overview | AI Analytics | Visits | Medications | Labs | Imaging | Allergies | Genetics`. The `Vital Signs` and `Communication` tabs visible in the reference are sample content, not layout rules (D-13); vitals belong inside Overview and Communication is a provider/profile surface, not a primary clinical tab.
- **Upper rows.** A compact patient identity card on the left spanning rows, plus stat cards
  with large tabular numerals (Heart Rate, Blood Pressure with small pill chips, ECG
  sparklines). Card and canvas tones sit at near parity and are separated by `shadow.raised`
  (D-03, D-06).
- **Timeline band** — the product's centerpiece and Phase 006's scope. A horizontal axis with
  hairline month dividers and month labels below; circular event nodes with filled active
  nodes in `accent` chartreuse carrying dark line icons; inactive/past nodes light with soft
  shadows; small `accent` count badges on dense nodes; thin, calm, curved branch arcs to child
  sub-events (medication and lab nodes) that are collision-aware and never cross into
  spaghetti; event cards hanging from the line at overlay-level depth (`shadow.overlay`).
- **Bottom scrubber (TL-06).** A full-width capsule track in the `surfaceMuted` family with
  circular plus/minus zoom buttons, thin tick marks of varying heights, year labels, and a
  dark rounded viewport window whose scrim is derived from `textPrimary` marking the current
  visible range — the one sanctioned dark element, rendered at the overlay elevation (D-03).
- **Bottom row.** Three cards with grabber dashes: Vital Signs History (wide, about `55`%) with
  Month/Week range toggles as pills where the active one is emphasized, Recent Records (salmon
  `critical`-family type pill) at about `22.5`%, and Labs (compact value rows with thin semantic
  segments) at about `22.5`%.
- **Interaction grammar (binding for Phase 006).** Drag-to-pan horizontally; `semantic zoom`
  clustering individual events into micro-cards; event selection with contextual detail;
  branch reveal; scrubber-driven range navigation; keyboard and touch where practical;
  thousands of events without jank.

Binding: layout, geometry, density, proportion, interaction patterns, color relationships.
Not binding: the sample content visible in this image — see §9.

## 6. Patient Home grammar

**Binding source: `docs/reference/patient-home-primary.jpg`**

- **Structure.** No persistent sidebar; a minimal top nav with a menu control, a label plus an
  avatar with a state dot, and a bell; a 2x2 chunk layout.
- **Next Action hero.** An eyebrow plus a bold action heading plus a subline plus a white
  raised pill action. The medication object illustration is related-content illustration and is
  allowed only where the reference shows it — never as unrelated decorative 3D.
- **Health Snapshot.** Two stacked metric cards, each with a sparkline, a large tabular value,
  and last/target lines.
- **Quick Log.** One-tap entry with circular chips grouped into Symptoms and Vitals and split
  by a hairline; the chips are decorative tints rendered from `canvas`, `surface` and
  `borderSubtle` per D-04; below them sits a full-width inset note field at `surfaceMuted`.
- **My Care Plan.** Nested cards — a Daily Checklist with checkbox states, Appointments, and a
  Weight Goal.
- **Density.** Sparse and airy, using the upper end of the same spacing scale (`space.xl`
  through `space.2xl`), and the same tokens, geometry, depth and motion as the provider
  surfaces. Lower density, identical design language.
- **Never gamified.** No points, levels, streaks, fireworks or cartoon rewards.

Binding: layout, geometry, density, proportion, interaction patterns, color relationships.
Not binding: the sample content visible in this image — see §9.

---

## 7. Copywriting contract

**Binding rules.** Sentence case. No exclamation marks. Calm clinical verbs. No gamified
vocabulary — no points, levels, streaks, rewards or celebration. No fabricated urgency.
Destructive or clinically significant actions are always confirmed. Every major workspace has
deliberate loading, empty, error, retry, permission-denied and offline-sync states: no generic
"Loading…" screens (token-derived skeletons instead) and no blank panels. Permission-denied
copy explains what access is lacking without leaking the existence of data.

**Contract defaults.** These are defaults, not implemented copy — this phase ships no screens.
Each owning phase finalizes its own strings within these rules.

| Element | Contract default |
|---|---|
| Primary CTA (Provider Home — Phase 004 owns the final label) | A single verb plus noun, for example "Add New Patient". Never a vague "Get Started". |
| Empty state heading | "No {record-type} yet" |
| Empty state body | One line of what will appear here plus one next step, for example "Records will appear here as care progresses." |
| Error state | Problem plus path: "Couldn't load {surface}. Check your connection and try again." plus a "Try again" action. |
| Destructive confirmation | The explicit clinical verb as the heading, one consequence line, and a confirm button labeled with the verb itself (for example "Stop Lisinopril"). Never "OK/Cancel" for a clinical action. |

---

## 8. Acceptance gates

### 8.1 Visual QA checklist

`docs/governance/visual-qa-rules.md` is the **normative** copy of this gate; the table below
mirrors it. That file is written by plan 01-05, which owns the mirror verification that the two
tables agree — this plan neither reads nor diffs it.

| # | Check | Pass condition |
|---|---|---|
| 1 | Outer structure | Columns, rails and grid match the cited per-surface grammar section (§4, §5 or §6); no reflow is invented. |
| 2 | Color relationships | The frame renders as a light warm-gray (D-01); cards separate by shadow, not by border; accent occupies no more than 10% of the visible area (pixel-share estimate on a screenshot). |
| 3 | Spacing rhythm | Every gap and padding value is one of `space.xs` through `space.2xl`; no page-level section gap exceeds 32px. |
| 4 | Compactness | No control or card height exceeds its closest reference counterpart; no card carries one line of content or less. |
| 5 | Card proportions | The provider folder grid is 3 columns at 1024px and above; the workspace bottom row is approximately 55 / 22.5 / 22.5 within plus or minus 3% of the measured widths. |
| 6 | Pill controls | Navigation and compact controls use `radius.pill`; no control has a corner radius of 4px or less. |
| 7 | Typography hierarchy | Only `font.size` values and the weights 400 and 600 appear; `tabular-nums` is set on every clinical and statistical value. |
| 8 | Timeline proportions | Axis height, month-divider spacing, node diameter and branch stroke width are within plus or minus 10% of the reference measurements. |
| 9 | Node/branch behavior | Filled nodes use `accent`; branches are thin, smooth and collision-free, with no crossings between sibling sub-event arcs. |
| 10 | Bottom scrubber | The capsule track is in the `surfaceMuted` family, tick marks are present, year labels are present, and the dark viewport window renders at the overlay shadow level. |
| 11 | Visual density | Provider and workspace surfaces read dense-but-scannable; patient home reads sparse at the upper spacing range; both read as one visual language. |
| 12 | Accent restraint | Accent appears only on the reserved list (§2.1); status color is limited to `success` / `info` / `warning` (D-04). |

**Reject conditions (§21).** Reject the phase if the surface looks like a generic SaaS dashboard
even when the requested functionality works. Reject the phase if a new feature introduces a
different visual language. Reject the phase if anything becomes gamified.

### 8.2 Playwright visual-regression harness contract

This is a **specification only**. The harness and its baselines are **built in Phase 002**
(D-18); nothing in this phase implements, configures or runs it. No test file, no
`tests/visual/` directory and no Playwright config exists in this phase.

- **Viewports.** `1440x900` (canonical desktop), `1280x800`, `768x1024` (tablet), `390x844`
  (mobile).
- **Baseline naming.** `tests/visual/baselines/{surface}/{viewport}/{state}.png`, for example
  `provider-home/1440x900/default.png`.
- **States.** `default` and `reduced-motion`.
- **Capture.** Against a production build; CSS animations disabled during capture;
  `reduced-motion` captured via emulation.
- **Tolerance.** `maxDiffPixelRatio: 0.01` and per-pixel `threshold: 0.2`. Any diff beyond
  tolerance fails the gate.
- **Baselines.** Committed, not gitignored. Regeneration is a deliberate
  `--update-snapshots` act recorded in the phase that regenerated it.

---

## 9. Sample content — do not reuse

**Rule first.** Layout, geometry, density and interaction patterns are the binding grammar;
sample content is never copied into the product.

The following categories of sample content visible in the reference images are never rendered
by the product:

- **Patient names** — `Sarah Miller`, `Robert Garcia`, `Tiffany Woodward`,
  `Dr. Eleanor Vance`, `Dr. Smith`.
- **Numeric IDs and MRNs.**
- **Medications** — `Lisinopril 10mg`, `Metformin 500mg`.
- **The `Cardiology` specialty label** — specialty is data-driven, never hardcoded in the
  shell.
- **The `Vital Signs` and `Communication` tabs** — the canonical patient-workspace nav is the
  fixed 8-tab set in §5.
- **Vitals values** — `72 bpm`, `118/75`, `98%`, `36.8°C`.
- **Lab names** — `CBC Panel`, `Lipid Profile`, `Glucose`.
- **Appointment and sample rows.**
- **"Daily Stats" numbers.**

Layout, geometry, density and interaction patterns are the binding grammar; sample content is
not. `docs/governance/reference-manifest.json` carries the same list under `doNotReuse`:
`names`, `labels`, `medications`, `vitalsValues` and `labNames` enumerate every concrete value
above, and the category-level `ids`, `appointmentRows` and `dailyStatsNumbers` entries carry
the categories that name no single value. The two lists must agree.


