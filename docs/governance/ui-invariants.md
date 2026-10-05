# UI Invariants — the greppable anti-drift registry

This document is the **normative** registry of the visual invariants that must not drift.
Each invariant carries a stable `INV-xx` identifier that is the vocabulary later phases cite.
Every color in this document is named as a semantic token and resolves through
`docs/governance/tokens.json`; **no raw color value appears here**. The frozen values live in
`docs/governance/tokens.json` and nowhere else.

---

## 1. How to use these invariants

Each invariant has a stable `INV-xx` ID that **never changes and is never reused**. Later
phases cite the ID in their plan and in their design-gate evidence; a reviewer greps the ID and
evaluates the stated **Objective check**. The IDs are `INV-01` through `INV-17`, grouped by the
part of the visual contract they defend:

- **Visual character** — `INV-01` through `INV-06`, from `PRODUCT-MASTER-SPEC.md` §2.1;
- **Geometry** — `INV-07` through `INV-12`, from `PRODUCT-MASTER-SPEC.md` §2.3;
- **Depth and elevation** — `INV-13` through `INV-17`, from `PRODUCT-MASTER-SPEC.md` §2.4.

An invariant is **violated when its objective check fails**. A violation **blocks phase
acceptance** — a phase may not be accepted while any invariant it touches fails. An invariant is
never satisfied by intent, by a passing build, or by prose; only the stated objective check
decides.

**Machine-enforceable subset (specified here, implemented in Phase 002).** Four invariants are
mechanically checkable and are covered in Phase 002 by the three checks named in
`docs/governance/project-constitution.md` §8:

| Invariant | Phase-002 check |
|---|---|
| `INV-01` Token-only styling | `no-raw-hex`, `token-reference-required` |
| `INV-03` No generic healthcare blue | `no-generic-healthcare-blue` |
| `INV-13` Exactly two elevation levels | `token-reference-required` |
| `INV-14` No invented shadows | `token-reference-required` |

This phase **specifies** those checks; it does **not** implement them. No lint rule, no CI job
and no test exists in this phase. The remaining invariants are reviewer-evaluated against their
stated objective check and recorded in the phase's verification artifact.

**Token vocabulary.** Every color value resolves through `docs/governance/tokens.json` → `color`.
The canonical names are `frame`, `frameForeground`, `canvas`, `surface`, `surfaceMuted`,
`surfaceRaised`, `textPrimary`, `textSecondary`, `borderSubtle`, `accent`, `success`, `warning`,
`critical` and `info`, plus `accentSoft` only if the D-02 split is confirmed at the design gate.
A raw color literal is written as a hash followed by six hexadecimal digits; that construct is
**never** legal in product styling and is written in this document only as the pattern
`#` followed by `[0-9A-Fa-f]{6}`.

---

## 2. Visual character invariants (PRODUCT-MASTER-SPEC.md §2.1)

| ID | Invariant | Objective check |
|---|---|---|
| INV-01 | Token-only styling — every color resolves through a semantic token; no raw hex, no default Tailwind color utility. | Every color declaration in the changed source resolves to a semantic token. Grep the changed source for the pattern `#` followed by `[0-9A-Fa-f]{6}`, and for the default Tailwind color utilities `blue-`, `indigo-`, `violet-`, `purple-`, `slate-`, `zinc-`, `neutral-`, `stone-`, `gray-` used as a fill, text, border or ring utility. **Zero matches outside the generated token layer** — pass at zero. |
| INV-02 | No dark frame or dark navigation — D-01 light warm-gray with an olive undertone. | A pixel sample of any structural-chrome region (top bar, side rail, frame background) returns a value whose relative luminance is at or above `0.6`, i.e. a light warm gray. **No frame or navigation region reads darker than `textPrimary`.** |
| INV-03 | No generic blue, indigo, violet or purple healthcare substitution. | The same grep as `INV-01` returns **zero** matches for `blue-`, `indigo-`, `violet-` or `purple-` in any styling file, theme or config. |
| INV-04 | One accent family — status encoding is `success` / `info` / `warning` only, never a new tint family. | The set of color families used for status encoding in the changed surface is a subset of `success`, `info` and `warning`. **No new tint token** appears in `docs/governance/tokens.json`. The pastel quick-log chips render from `canvas`, `surface` or `borderSubtle`. |
| INV-05 | Accent restraint — accent appears only on the reserved list and at most 10% of visible area. | Accent appears only on the reserved list: timeline event nodes and their count badges, timeline milestone markers, the primary CTA, active or selected emphasis markers, key state indicator dots, and important-interaction highlights. A screenshot pixel-share estimate puts accent at **or below 10% of visible area**. Accent is absent from body text, borders, backgrounds, decorative fills and folder cards. |
| INV-06 | No gamification — no points, levels, streaks, fireworks, celebration or gamified animation. | A repository-wide text search of the changed surface for `points`, `level`, `streak`, `reward`, `celebrat`, `confetti`, `firework`, `trophy` and `badge earned` returns **zero UI-visible matches**, and no animation exceeds the `motion.slow` duration for a celebratory effect. |

---

## 3. Geometry invariants (PRODUCT-MASTER-SPEC.md §2.3)

| ID | Invariant | Objective check |
|---|---|---|
| INV-07 | Radius scale — only the five steps `radius.sm` (8px), `radius.md` (12px), `radius.lg` (16px), `radius.xl` (24px) and `radius.pill` (999px). | Every border-radius value in the changed source is one of the five `radius.` steps read from `docs/governance/tokens.json` → `radius`. **No other radius literal appears.** |
| INV-08 | Pill controls — compact navigation and controls use `radius.pill`. | Every compact navigation and control element — buttons, tabs, status pills, search input, scrubber capsule, quick-log chips — uses `radius.pill`. **A control whose computed radius is not the pill value fails.** |
| INV-09 | No sharp corners — no control has a corner radius at or below 4px. | No interactive element has a computed corner radius at or below 4px. |
| INV-10 | Spacing scale — every gap and padding is a `space.` step; no page-level section gap above 32px. | Every margin, padding and gap in the changed source is one of the six `space.` steps: `space.xs` 4px, `space.sm` 8px, `space.md` 12px, `space.lg` 16px, `space.xl` 24px or `space.2xl` 32px. **No page-level section gap exceeds the `space.2xl` step of 32px.** The only exception is a touch target of at least 44px in both axes on mobile, which is a target size and not a spacing value. |
| INV-11 | Hairline lines — rules and dividers are 1px; no thick rules. | Every rule, divider and axis line is 1px. **No line thicker than 1px appears** except the timeline event-node stroke defined by the timeline grammar. |
| INV-12 | Compactness — no bulky tile and no card holding one line of content or less. | No card's rendered height exceeds that of its closest reference counterpart. No card contains one line of content or fewer without a stated information purpose. No dashboard tile exceeds the density of the reference folder card. |

---

## 4. Depth and elevation invariants (PRODUCT-MASTER-SPEC.md §2.4)

| ID | Invariant | Objective check |
|---|---|---|
| INV-13 | Exactly two elevation levels — `shadow.raised` and `shadow.overlay`, no third. | The changed source references only `shadow.raised` and `shadow.overlay`. `docs/governance/tokens.json` → `shadow` contains exactly two keys. **No third elevation token exists and no ad-hoc box-shadow is introduced.** |
| INV-14 | No invented shadows — components use the two tokens, never a local shadow value. | Every box-shadow value in the changed source resolves to one of the two `shadow.` tokens. **Zero local shadow literals.** |
| INV-15 | Hairline-only borders — `borderSubtle` only on true dividers, table row lines, the timeline axis and the scrubber track. | `borderSubtle` appears only on true dividers, table row lines, the timeline axis and the scrubber track. It appears on **no card edge**. |
| INV-16 | No outlined cards — card edges separate by shadow, not by border. | No card renders a visible full-perimeter border. Card edges separate by shadow alone. |
| INV-17 | No excessive glass or neumorphism; scrims derive from `textPrimary`, never a new token. | No backdrop-blur or inner-shadow effect exceeds what the reference shows. The dark scrubber viewport window and the MRI event card render at the overlay level with a scrim derived from `textPrimary`, and **no new color token is introduced for a scrim**. |

---

## 5. Enforcement

Invariants are checked at **every phase's design gate**, alongside
`docs/governance/visual-qa-rules.md`; the two documents form one gate and are read together. The
machine-enforceable subset (`INV-01`, `INV-03`, `INV-13`, `INV-14`) is implemented in Phase 002
by the three checks named in `docs/governance/project-constitution.md` §8 — `no-raw-hex`,
`no-generic-healthcare-blue` and `token-reference-required`. The remaining invariants are
**reviewer-evaluated** against the stated objective check and recorded in the phase's
verification artifact. A phase whose invariant evaluation is missing, or whose evaluation
records a failure, is not accepted.

---

*Source of truth: `PRODUCT-MASTER-SPEC.md` §2.1, §2.3 and §2.4, materialized in
`docs/governance/reference-ui-specification.md` §2 and frozen in
`docs/governance/tokens.json`.*
