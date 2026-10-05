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

### 2.1 Color — the 14-token semantic contract

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
| `surfaceMuted` | Inset panel fill | `docs/governance/tokens.json` → `color.surfaceMuted` | The half-step between `canvas` and `surface`, used for inset panels — the scrubber track and the quick-log note field. |
| `surfaceRaised` | Raised card and modal fill | `docs/governance/tokens.json` → `color.surfaceRaised` | The `surface` family plus `shadow.raised`, used for cards and modals (D-03). |
| `textPrimary` | Primary text and primary ink | `docs/governance/tokens.json` → `color.textPrimary` | Near-black warm gray, **never pure black** (D-06). Frozen from the large flat dark neutral of the timeline scrubber viewport window and the MRI event-card overlay; the reference's primary ink is pure black and fails every window gate, which D-06 forbids freezing. |
| `textSecondary` | Secondary text and axis labels | `docs/governance/tokens.json` → `color.textSecondary` | Muted gray for secondary text and axis labels. A thin-glyph blend flagged `visionEstimate` + `ownerConfirm` in `docs/governance/tokens.json` → `review`. |
| `borderSubtle` | Hairline dividers and axis | `docs/governance/tokens.json` → `color.borderSubtle` | Hairline weight only (D-05): true dividers, table row lines, the timeline axis and the scrubber track. Never a card outline. |
| `accent` | Chartreuse accent — see the reserved list | `docs/governance/tokens.json` → `color.accent` | Sampled from the filled circular event nodes of the timeline primary — D-02's named source. |
| `success` | Semantic "normal" status | `docs/governance/tokens.json` → `color.success` | The provider/patient "normal" status family. |
| `warning` | Semantic "follow-up" status | `docs/governance/tokens.json` → `color.warning` | The "follow-up" amber; the weakest-evidence token, flagged `ownerConfirm` in `docs/governance/tokens.json` → `review` and pixel-confirmed at the D-08 gate. |
| `critical` | Destructive and critical-alert accent | `docs/governance/tokens.json` → `color.critical` | The salmon-rose family measured on the Critical Alerts panel. Soft fills render at reduced opacity over `surface` — never a new token. |
| `info` | Semantic "pending" status | `docs/governance/tokens.json` → `color.info` | The "pending" soft-blue pill family. |

**Conditional fifteenth token.** `accentSoft` appears in `docs/governance/tokens.json` only if
the D-02 split is confirmed at the design gate — timeline chartreuse for event nodes,
milestones, active emphasis and state indicators; CTA gold for the primary CTA and key
interaction buttons. No third yellow token, ever. Until the gate confirms the split, the
single `accent` family carries both duties.

#### Accent reserved for

`accent` is reserved for exactly this list:

- timeline event nodes and their count badges;
- timeline milestone markers;
- the primary CTA;
- active/selected emphasis markers (an active chart-range toggle; a selected scrubber range
  is **not** accent — it is the dark overlay viewport window);
- key state indicator dots;
- important-interaction highlights.

`accent` is **not** for: folder cards (status uses `success` / `info` / `warning` only),
body text, borders, backgrounds, decorative fills, or **every icon**.

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

_Sections 3 through 9 follow._
