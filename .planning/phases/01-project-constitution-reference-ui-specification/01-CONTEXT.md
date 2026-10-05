# Phase 1: Project Constitution + Reference UI Specification - Context

**Gathered:** 2026-10-05
**Status:** Ready for planning

<domain>
## Phase Boundary

This phase creates the permanent governance layer that every later phase is checked against — and nothing else. No product feature implementation.

In scope:
- Project constitution recording the source-of-truth hierarchy (§1) and the anti-generic-SaaS / anti-gamification constraints.
- Reference UI Specification (UI design contract): shared design-system core plus a per-surface grammar section for each of the three binding primary references.
- UI invariants that must not drift (visual character §2.1, geometry §2.3, depth §2.4).
- Frozen semantic token set: machine-readable `tokens.json` + human-facing table.
- Visual QA rules (pass/fail checklist), responsive design rules (§26), motion rules (§9).
- Reference registry (human-readable table + machine-readable manifest with sha256).

Out of scope:
- Any product component, page, route, or application code.
- The Next.js app shell, Tailwind setup, or `tokens.css` materialization — that is Phase 002.
- Playwright visual-regression baselines — the harness contract is specified here, built in Phase 002.
- Lint/CI implementation of the machine checks — specified here, implemented in Phase 002.

</domain>

<decisions>
## Implementation Decisions

### Frame and palette grounding

- **D-01:** `frame` / `frameForeground` resolve to a **light warm-gray with an olive undertone** across the entire product. Spec §2.2's "dark olive / khaki structural framing and navigation areas" is interpreted as an olive-tinted structural gray, not a dark surface. The only dark surface in the reference asset set is the old implementation's charcoal bezel in `patient-tracking-dashboard.jpg`, which is diagnostic evidence of the §3.7 color failure — never design intent. The constitution must state this interpretation explicitly so no later phase "restores" a dark frame.
- **D-02:** `accent` is the **chartreuse / lemon yellow** sampled from the timeline event nodes in `patient-workspace-timeline-primary.jpg`. That same yellow family carries important interactions, timeline milestones, active emphasis, and the primary CTA. Do **not** split into `accent` + `accentSoft` unless pixel sampling during execution proves the timeline yellow and the provider-home CTA yellow are two distinct hues.
- **D-03:** Exactly **two elevation levels**: `surfaceRaised` (cards, modals) and one overlay level (popovers, scrubber viewport window). Shadows carry surface separation; components never invent their own shadow values.
- **D-04:** Multi-hue is restricted. Provider folder tab headers and status pills encode meaning with `success` / `info` / `warning` **only**. The pastel mint/lavender/blue/tan quick-log chips in `patient-home-primary.jpg` are decorative icon tints and **must** be rendered from existing `canvas` / `surface` / `borderSubtle` tokens — no new tint family is added. This enforces §2.2's "never every folder a different saturated color".
- **D-05:** Shadows do the work of separating card edges from canvas. `borderSubtle` is a very light warm gray **hairline** used only for true dividers, table row lines, the timeline axis, and the scrubber track. No outlined-card look.
- **D-06:** `canvas` is a neutral-warm light gray field; surfaces are slightly cooler and closer to white so cards float distinctly, as in the timeline primary. Text is near-black warm gray, never `#000`. `surfaceMuted` sits a half-step between `canvas` and `surface` for inset panels.

### Token freeze depth

- **D-07:** The frozen token set has two artifacts: **`tokens.json`** (canonical, machine-readable, `name → value`) plus a human-facing table inside the reference UI spec that cites it. Phase 002 generates the CSS token layer *from the JSON* so documentation and code cannot drift. No `tokens.css` is written in this phase.
- **D-08:** Exact hex values are derived by sampling pixels from the three binding primaries during execution. The product owner then **visually reviews the sampled values against the reference images at this phase's design gate**, before Phase 002 begins. Values are not invented from taste and not deferred indefinitely.
- **D-09:** Token scope is the **full scale**, not colors only: the 14 semantic color tokens (`frame`, `frameForeground`, `canvas`, `surface`, `surfaceMuted`, `surfaceRaised`, `textPrimary`, `textSecondary`, `borderSubtle`, `accent`, `success`, `warning`, `critical`, `info`) **plus** the radius scale (§2.3 pills, very rounded cards, soft corners), the spacing rhythm (§3.8 compact clinical density), the typography hierarchy, and the two shadow strengths.
- **D-10:** Canonical token names stay **exactly as the spec lists them in camelCase** inside `tokens.json`. The Phase 002 CSS layer maps them to kebab-case custom properties and Tailwind utilities. Docs, tokens, and code all cite the same vocabulary.
- **D-11:** The token contract is **role-based, not literal-value-based**, so a dark-mode set could be added later without renaming tokens. Ship light-only values now — the reference grammar is a light-mode product.

### Reference registry

- **D-12:** The diagnostic asset **keeps its filename**: `docs/reference/patient-tracking-dashboard.jpg`. No `git mv`. Correct the references in `PROJECT.md`, `REQUIREMENTS.md`, `ROADMAP.md`, and `AGENTS.md` to point at the existing filename instead of `diagnostic-current-implementation.png`.
- **D-13:** The reference UI spec carries an **explicit do-not-reuse list** naming the sample content visible in the references: patient names (`Sarah Miller`, `Robert Garcia`, `Tiffany Woodward`, …), numeric IDs, medications (`Lisinopril 10mg`, `Metformin 500mg`, …), the `Cardiology` label, and the `Vital Signs` / `Communication` tabs. Layout, geometry, density, and interaction patterns are the binding grammar; sample content is never copied.
- **D-14:** The registry exists twice: a human-readable table in the constitution, and a **machine-readable manifest** recording for each asset its path, its role (`binding` | `diagnostic`), a **sha256**, and the governing spec sections — so later phases can verify the assets are unmodified and no one swaps in a different screenshot.
- **D-15:** The UI spec is structured as **one shared design-system core** (tokens, geometry, typography, depth, motion) **plus a per-surface grammar section** for each primary: Provider (dense folder grid, Today's Schedule, Critical Alerts), Patient Workspace (timeline, bottom scrubber, tab bar), Patient Home (sparse hero, quick log, care plan). Later phases cite the section for their surface.

### Documentation location and drift enforcement

- **D-16:** The governance package lives in **`docs/governance/`** — constitution, reference UI spec, UI invariants, visual QA rules, responsive rules, motion rules, plus `tokens.json` and the reference manifest. It sits next to the images it describes, survives `.planning/` pruning, and is discoverable by any engineer without GSD tooling.
- **D-17:** Anti-drift is enforced in **two layers**: prose rules in the constitution, **and** explicitly named machine checks the constitution specifies by name so Phase 002 implements exactly what this phase wrote. The checks are: no raw hex outside the token layer, no generic blue/indigo/purple healthcare substitution, and token-reference-required for component styling.
- **D-18:** Visual QA rules are a **pass/fail checklist table** derived from the §21 reference-UI acceptance gate (outer structure, color relationships, spacing rhythm, compactness, card proportions, pill controls, typography hierarchy, timeline proportions, node/branch behavior, bottom scrubber, visual density, accent restraint). The constitution additionally **specifies the Playwright visual-regression harness contract** (viewport list, baseline naming, tolerance) so Phase 002 builds against a written target instead of inventing one.
- **D-19:** Motion rules are **tokenized, not merely qualitative**: a duration scale (fast / slow), a single easing curve set, per-surface usage notes (panel transitions via Framer Motion vs. timeline choreography via GSAP), and the mandatory `prefers-reduced-motion` fallback.

### Carried forward from initialization (already decided — not re-litigated)

- Source-of-truth hierarchy (§1): constitution → primary reference image → reference UI spec + UI invariants → phase spec → technical plan → tasks → existing repository → agent preference. The repository is **never** higher authority than approved design/specification.
- Per-surface primaries bind **design grammar only**; the old screenshot is diagnostic evidence only.
- Patient workspace primary nav is **exactly** the 8 tabs in §6. The `Vital Signs` / `Communication` tabs visible in the timeline reference are sample content, not a layout rule (see D-13).
- Two-layer motion: Framer Motion for component/layout/panel transitions, GSAP for complex SVG drawing and timeline choreography. All motion fast, smooth, subtle, interruptible, reduced-motion compatible (§9).
- Semantic tokens only, no scattered raw hex anywhere in the product.

### Claude's Discretion

- Exact hex values, radius step values, spacing step values, and type scale ratios — derived by sampling the reference images and measuring the reference density, then surfaced for the owner's visual review.
- Naming of individual files inside the `docs/governance/` package beyond the artifacts named in D-07 / D-14 / D-16.
- The precise wording of invariants and QA checklist rows, provided each remains objectively checkable.
- Playwright harness contract details (viewport list, baseline naming scheme, tolerance thresholds).
- Token file schema shape, provided `name → value` remains machine-readable and the 14 spec names are the canonical keys.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Product control pack
- `PRODUCT-MASTER-SPEC.md` — the authoritative control pack. Sections that govern this phase: §1 (source-of-truth hierarchy), §2 / §2.1–§2.4 (visual source of truth, character, color language, geometry, depth), §3.7 (current colors incorrect), §9 (motion system), §19 Phase 001 (this phase's mandate), §20.9 (no autonomous execution for the initial rebuild), §21 (reference-UI acceptance gate), §26 (responsive requirements), §27 (hard prohibitions), §29 Step 4 (human review stop before Phase 001).
- `PRODUCT-MASTER-SPEC.md` §2.2 — the 14 semantic token category names and the "frozen after visual review" rule; interpreted per D-01.
- `PRODUCT-MASTER-SPEC.md` §21 — the visual QA checklist rows captured in D-18.

### Binding visual references (design grammar)
- `docs/reference/provider-home-primary.jpg` — Provider Home primary: folder grid with status-tabbed folders, Today's Schedule rail, yellow primary CTA, Critical Alerts panel, Daily Stats.
- `docs/reference/patient-workspace-timeline-primary.jpg` — Patient Workspace primary: D3 timeline, circular accent event nodes, branch arcs, bottom scrubber with year ticks and dark viewport window, pill tab bar.
- `docs/reference/patient-home-primary.jpg` — Patient Home primary: Next Action hero, Health Snapshot, Quick Log chips, My Care Plan; lower density, identical design language.

### Diagnostic evidence only (never a design source)
- `docs/reference/patient-tracking-dashboard.jpg` — the old implementation. Evidence for §3.3 hardcoded "Cardiology", §3.4 duplicate filter row, §3.5 static timeline, §3.7 color drift. Registered as diagnostic per D-12/D-14.

### Planning artifacts
- `.planning/PROJECT.md` — vision, constraints, key decisions, out-of-scope prohibitions.
- `.planning/REQUIREMENTS.md` — GOV-01 … GOV-06, the six requirements this phase must satisfy.
- `.planning/ROADMAP.md` — Phase 1 goal and success criteria.
- `.planning/STATE.md` — project memory and session continuity.
- `.planning/config.json` — workflow configuration (`ui_phase`, `ui_safety_gate`, `security_enforcement`, token/QA-related settings).
- `.planning/research/STACK.md` — stack decision and Tailwind v4 `@theme` token architecture notes that inform D-07 / D-10.

### Project instructions
- `AGENTS.md` — project constraints, design-token rule, motion architecture, security and process rules the plans must honor. Also contains the `diagnostic-current-implementation.png` reference corrected by D-12.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- None. This is a **greenfield repository**: no `package.json`, no `src/`, no app scaffold, no component library. The only assets are the four reference images and the `PRODUCT-MASTER-SPEC.md` control pack.
- The three binding reference JPGs are the sole source of sampled color, geometry, density, and type values (D-08).

### Established Patterns
- None yet — this phase establishes the pattern. Every later phase will read `docs/governance/` and `tokens.json`, so naming and structure decided here are load-bearing.

### Integration Points
- `docs/governance/` — new package created by this phase; holds constitution, reference UI spec, UI invariants, visual QA / responsive / motion rules, `tokens.json`, and the reference manifest.
- `docs/reference/` — read-only asset set referenced by the registry and manifest.
- Phase 002 consumes `tokens.json` to generate the CSS token layer and implements the machine checks specified in D-17.
- `AGENTS.md` / `PROJECT.md` / `REQUIREMENTS.md` / `ROADMAP.md` — reference-path corrections required by D-12.

</code_context>

<specifics>
## Specific Ideas

- The frame/canvas decision was made by looking at the actual images: all three binding primaries render frame and navigation in light warm-gray. The constitution must explain *why* the spec text and the images disagree, so the resolution survives future re-reads.
- The chartreuse accent is sampled from the timeline's circular event nodes — that same yellow is the provider-home CTA, so one accent serves interaction, emphasis, and milestone marking.
- The patient-home pastel chips were explicitly judged decorative, not semantic: they render from canvas/surface/border tokens. This is the concrete enforcement of "never every folder a different saturated color".
- The diagnostic screenshot is registered by role (`diagnostic`) with a sha256, so no later phase can mistake the charcoal-bezel old implementation for a design source.

</specifics>

<deferred>
## Deferred Ideas

- **Dark-mode token values** — the token contract is role-based so a dark set can be added later without renaming tokens, but no dark values are authored in this phase.
- **Playwright visual-regression baseline harness** — contract specified here (D-18); implementation and committed baselines belong to Phase 002.
- **Lint / CI enforcement implementation** — checks named and specified here (D-17); implementation belongs to Phase 002.
- **`tokens.css` materialization** — Phase 002 generates the CSS token layer from `tokens.json` (D-07).

</deferred>

---

*Phase: 1-project-constitution-reference-ui-specification*
*Context gathered: 2026-10-05*