# Phase 1: Project Constitution + Reference UI Specification - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-10-05
**Phase:** 1-project-constitution-reference-ui-specification
**Areas discussed:** Frame family (dark olive vs light warm-gray), Token freeze depth (file vs spec table), Reference registry + diagnostic filename, Doc location + drift enforcement

---

## Frame family: dark olive vs light warm-gray

**Trigger:** Spec §2.2 requires "dark olive / khaki structural framing and navigation areas", but all three binding primary references render frame and navigation in light warm-gray. The only dark surface in the asset set is the old implementation's charcoal bezel — diagnostic evidence of the §3.7 color failure, not design intent.

| Question | Option | Description | Selected |
|----------|--------|-------------|----------|
| `frame` / `frameForeground` value | Light warm-gray, olive undertone | Follows all three primaries; constitution records that §2.2's "dark olive/khaki" means an olive-tinted structural gray | ✓ |
| | Dark olive/khaki frame as written in §2.2 | Follows spec text literally; deliberately departs from the images | |
| | Split: light frame, dark olive nav rail only | Keeps §2.2's dark structural mass on the provider surface only | |
| Accent / status pinning | Chartreuse from timeline + amber CTA | One yellow family for interactions, milestones, active emphasis, CTA | ✓ |
| | Two yellows: accent + accentMuted | Split if CTA amber and timeline chartreuse read as distinct hues | |
| | Review sampled values before freezing | Decide hue after pixel sampling | |
| Elevation levels | Two levels: surfaceRaised + overlay | Cards/modals, then popovers + scrubber viewport | ✓ |
| | Three levels + named shadow scale | Adds surfaceOverlay + shadow-sm/md/lg scale | |
| | Two levels, shadows component-scoped | Shadow values chosen per component in Phase 002 | |
| Multi-hue handling | Status = success/info/warning only; chips canvas-tinted | Folder tabs and pills encode meaning; pastel chips render from existing tokens | ✓ |
| | Add a small categorical tint scale | Permits mint/lavender/sky/tan chips as their own token family | |
| | Reference is grammar, spec governs palette | Any hue outside olive/ivory/yellow+status is rejected | |
| Borders | Shadows do the work; hairline only where needed | borderSubtle for dividers, row lines, timeline axis, scrubber track | ✓ |
| | Two border weights | Add a stronger border for inputs and segmented controls | |
| | No borders at all | Depth carries all separation | |
| Canvas | Neutral-warm canvas, slightly cooler surface | Cards float distinctly as in the timeline primary | ✓ |
| | Warm gray canvas, off-white surface | Near-white (not pure) surfaces, warmer canvas | |
| | Pure white canvas, tinted surfaces | Brighter, flatter, more generic-SaaS | |

**Notes:** Six questions asked. The governing rationale — recorded in CONTEXT.md D-01 — is that the constitution must explain *why* spec text and images disagree, so no later phase "restores" a dark frame.

---

## Token freeze depth: file vs spec table

**Trigger:** ROADMAP requires tokens "frozen in a permanent token file", but Phase 1 writes no product code and Phase 002 is tasked with building tokens.

| Question | Option | Description | Selected |
|----------|--------|-------------|----------|
| Token artifact | Real tokens.css now, no components | Emits a consumable CSS `@theme` layer in Phase 1 | |
| | Spec table in the UI spec doc | Prose table; Phase 002 materializes | |
| | Both: machine-readable tokens.json + spec table | JSON is canonical; table cites it; Phase 002 generates CSS from the JSON | ✓ |
| Hex value provenance | I derive them; you visually review | Claude samples pixels from the primaries; owner reviews at the design gate | ✓ |
| | You supply the exact hex values | Owner provides ~14 values up front | |
| | Structural tokens frozen now, palette deferred | Colors now, accent/status pending review | |
| Token breadth | Full scale: color + radius + spacing + type + shadow | 14 colors plus radius, spacing rhythm, typography hierarchy, two shadows | ✓ |
| | Colors only; geometry in Phase 002 | Narrowest reading of GOV-04 | |
| | Colors + radius + spacing | Typography and shadows deferred to Phase 002 | |
| Naming | Spec camelCase canonical; kebab in CSS | Spec names in `tokens.json`; CSS layer maps to kebab custom properties | ✓ |
| | Semantic kebab-case end to end | Conventional CSS names; renames the spec vocabulary | |
| Dark mode | Light only for v1 | Explicitly out of scope | |
| | Structure supports dark mode later | Role-based token entries so a dark set can be added without renaming | ✓ |

**Notes:** "Both" was chosen over a bare token file specifically to prevent doc/code drift — the table cites the JSON, and Phase 002 generates CSS *from* the JSON rather than retyping values.

---

## Reference registry + diagnostic filename

**Trigger:** All four planning/instruction artifacts name `diagnostic-current-implementation.png`, but the file on disk is `patient-tracking-dashboard.jpg`. Content confirms it is the old implementation ("Cardiology" header, duplicate filter row, static timeline).

| Question | Option | Description | Selected |
|----------|--------|-------------|----------|
| Diagnostic filename | Rename file to match the documented contract | `git mv` to `diagnostic-current-implementation.png` | |
| | Keep the filename, fix the four docs | Correct PROJECT.md, REQUIREMENTS.md, ROADMAP.md, AGENTS.md; no `git mv` | ✓ |
| | Rename to a clearer name | e.g. `diagnostic-old-implementation-cardiology-failures.jpg` | |
| Sample content marking | Explicit do-not-reuse list | Enumerates names, IDs, medications, "Cardiology", Vital Signs / Communication tabs | ✓ |
| | One general statement | Prose rule without enumeration | |
| | Do-not-reuse list + replacement guidance | Adds what to use instead for each item | |
| Registry form | Registry table + sha256 manifest | Human table + machine manifest (path, role, sha256, governing sections) | ✓ |
| | Human-readable registry table only | Markdown table, no hashes | |
| Grammar structure | Per-surface grammar + shared core | Core design system plus a grammar section per primary reference | ✓ |
| | Single global grammar, images as illustrations | One grammar doc; images cited illustratively | |

**Notes:** The owner chose to preserve the existing asset rather than rename it, so Phase 1's plan must include reference-path corrections in four existing files.

---

## Doc location + drift enforcement

**Trigger:** GOV-06 requires drift to be "rejected at review time"; GOV-04 forbids scattered raw hex. Neither had an enforcement mechanism, and this phase writes no product code.

| Question | Option | Description | Selected |
|----------|--------|-------------|----------|
| Doc location | docs/governance/ package + tokens.json | Governance package beside the images it describes; survives `.planning/` pruning | ✓ |
| | docs/design/ naming | Signals visual nature but hides that these are binding governance docs | |
| | .planning/governance/ | All durable state in one tree; engineers won't look there for design rules | |
| Enforcement | Prose rules + specified machine checks | Rules in prose plus named checks (no-raw-hex, no-generic-blue-indigo-purple, token-reference-required) for Phase 002 to implement | ✓ |
| | Prose rules + review checklist only | Human review only, no automated lint | |
| | Prose + checks + hard CI gate | Additionally mandates red check blocks merge | |
| Visual QA form | Checklist now, Playwright baselines in Phase 2 | Pass/fail table from §21 + harness contract specified for Phase 002 | ✓ |
| | Playwright visual-regression baselines now | Not possible — no app to screenshot until Phase 002 | |
| | Checklist now only | No harness contract | |
| Motion rules | Durations + easing + reduced-motion | Tokenized scale, single easing set, per-surface usage notes | ✓ |
| | Qualitative motion principles | Prose only, no numbers | |

**Notes:** The owner deliberately stopped short of a hard CI mandate — checks are specified and must exist, but blocking merges is not mandated by the constitution.

---

## Claude's Discretion

- Exact hex values, radius steps, spacing steps, and type scale ratios (derived by sampling the references, then surfaced for the owner's visual review).
- File naming inside `docs/governance/` beyond the artifacts named in the decisions.
- Wording of invariants and QA checklist rows, provided each stays objectively checkable.
- Playwright harness contract details (viewport list, baseline naming, tolerance).
- `tokens.json` schema shape, provided `name → value` stays machine-readable and the 14 spec names remain canonical keys.

## Deferred Ideas

- Dark-mode token values — role-based structure only; values are a future concern.
- Playwright visual-regression baseline harness implementation and committed baselines → Phase 002.
- Lint/CI implementation of the named checks → Phase 002.
- `tokens.css` materialization → Phase 002, generated from `tokens.json`.