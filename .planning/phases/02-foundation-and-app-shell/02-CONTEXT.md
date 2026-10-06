# Phase 2: Foundation and App Shell - Context

**Gathered:** 2026-10-06
**Status:** Ready for planning

<domain>
## Phase Boundary

This phase builds the empty-but-real application skeleton. It delivers the Next.js shell, the
route map as empty shells, the layout primitives, the CSS token layer generated from
`docs/governance/tokens.json`, typography, the shared primitive set (surfaces, buttons, pills,
compact controls, modal/sheet, empty state), the accessibility baseline, the motion foundation,
and the three machine checks plus the Playwright visual-regression harness that Phase 001
specified but deliberately did not build.

In scope:
- Next.js App Router scaffold and the route map as empty shells with correct layout frame.
- The generated CSS token layer (`tokens.json` → `:root` custom properties + Tailwind v4 `@theme inline`).
- Typography foundation (self-hosted Inter via `next/font`) and the four-size / two-weight scale.
- The shared primitive set, built from tokens with no bespoke per-screen components.
- Accessibility baseline: focus order, labels, contrast against the frozen tokens.
- Motion foundation: Framer Motion shell-level transitions with the mandatory reduced-motion branch.
- The three machine checks (`no-raw-hex`, `no-generic-healthcare-blue`, `token-reference-required`).
- The Playwright visual-regression harness and its committed baselines.

Out of scope:
- Any clinical capability: no dashboard, no timeline, no patient data model, no encounters.
- Authentication, sessions, role resolution, organizations, RLS, audit — Phase 003.
- The provider folder grid and patient collection — Phase 004.
- The 8-tab patient workspace body and the D3 timeline — Phase 005 / Phase 006.
- Real content behind any empty state.
- CI provider configuration (see D-24).
- Dark-mode token values (the token contract is role-based; only light values ship now).

</domain>

<decisions>
## Implementation Decisions

### Route skeleton shape

- **D-01:** Phase 002 scaffolds the **full URL map as empty shells**: `/login`,
  `/provider`, `/provider/patients/[patientId]` (with the 8 workspace tabs as nested routes),
  `/patient`, `/patient/home`. Each route renders the correct layout frame plus a typed empty
  state body. The URL contract is locked here so Phases 003–005 fill bodies instead of inventing
  paths. Acceptance criterion 1 ("navigate the empty application shell on every defined route")
  means these routes.
- **D-02:** Structure is **three route groups with three layouts** — `(provider)`, `(patient)`
  and `(auth)`. Each role group owns its own layout carrying the persistent left icon rail and
  that role's nav; `(auth)` is bare. `/provider/patients/[patientId]` nests inside the provider
  layout. Role-specific chrome must not leak into a shared root layout.
- **D-03:** **No access control in this phase.** All routes render openly because auth does not
  exist yet. A short comment marks exactly where Phase 003's server-side role resolution slots
  in, so no later reader mistakes the open route for a design choice. No placeholder `middleware.ts`
  — a fake gate that looks real is worse than none.
- **D-04:** Empty shells render **typed empty states, not structural placeholders** — real
  typography and surface tokens with copy like "No patients yet". This satisfies criterion 1
  literally, gives the visual baselines real content to capture, and introduces no clinical data.

### Token layer generation

- **D-05:** The CSS token layer is produced by a **build-time codegen script**
  (`scripts/generate-tokens.mjs`) that reads `docs/governance/tokens.json` and writes the CSS.
  It runs via `predev` and `prebuild`. This honors Phase 001 D-07 ("generated from the JSON")
  literally and makes doc/code drift structurally impossible.
- **D-06:** The **generated file is gitignored** — `docs/governance/tokens.json` is the only
  committed source of token values. There is no committed CSS mirror, so there is no second
  place a token can live and no drift-check step to maintain.
- **D-07:** `tokens.json` keeps its **camelCase names** (Phase 001 D-10) and the generator
  emits **kebab-case custom properties** — `--color-frame-foreground`, `--radius-pill`,
  `--duration-fast` — mapped into Tailwind v4 `@theme inline`. Code writes `bg-surface`,
  `text-text-primary`, `rounded-pill`. Docs and code cite the same vocabulary; only the CSS
  identifier form is transformed.
- **D-08:** The generator emits **both** a `@theme inline` block (so Tailwind produces the
  utilities) **and** a `:root` block of plain custom properties. The `:root` block is required:
  raw CSS, the two shadow tokens, and GSAP timelines must be able to read `var(--duration-fast)`
  directly rather than hardcoding a value, which `docs/governance/motion-rules.md` §1 forbids.

### Machine-check enforcement

- **D-09:** All three checks are enforced by **one Node script**
  (`scripts/check-design-tokens.mjs`) that exits non-zero on violation. No ESLint custom rules,
  no dependency. The script mirrors the INV-01 / INV-03 objective checks literally, which are
  themselves written as greps.
- **D-10:** Scan scope is **the source tree under `src/` plus the root configs**, explicitly
  excluding the generated token CSS and the governance JSON. This matches the constitution §8
  scope ("every source file") while honoring "no raw hex outside the generated token layer".
- **D-11:** `token-reference-required` is a **presence check scoped to component and layout
  files**, matching the constitution's stated scope. A component file passes if it references at
  least one generated token utility. Utilities, hooks and scripts are out of scope — requiring a
  token reference there would false-positive on pure composition.
- **D-12:** On violation the script prints **one line per violation as `file:line` + the matched
  literal + the check and INV it violates**, and exits 1. No `--fix`, no auto-rewriting: a tool
  that silently edits design tokens is the wrong tool.
- **D-13:** The checks run on **`npm run lint` and `prebuild`**, so a production build cannot
  ship a token violation. **No git pre-commit hook** — a hook would fire on generated and vendor
  files before the allowlists are understood, and Phase 002 is the phase creating the tooling.

### Visual-regression baselines

- **D-14:** Baselines cover the **dev-only primitives gallery and every empty shell**, across the
  full contract matrix — 4 viewports (`1440x900`, `1280x800`, `768x1024`, `390x844`) × 2 states
  (`default`, `reduced-motion`). Path shape is the Phase 001 contract:
  `tests/visual/baselines/{surface}/{viewport}/{state}.png`.
- **D-15:** The two motion states are captured as **two Playwright projects**, using Playwright's
  `reducedMotion: 'reduce'` emulation. This exercises the real CSS/media-query branch rather than
  a test-side flag that could be forgotten, and keeps the two states symmetric by construction.
- **D-16:** The gallery is a **dev-only route, guarded and excluded from the production build**
  (gated by `NODE_ENV`). It exists so primitives can be reviewed and baselined; it must not ship
  as a public product route or enter the product route map.
- **D-17:** **No CI in this phase.** The harness runs locally via `npm run test:visual` and the
  baselines are committed per the Phase 001 contract. No CI provider exists in this repo and
  choosing one is out of scope.
- **D-18:** Dev fixtures are **typed stubs with no clinical values** — an empty patient list and
  a placeholder patient carrying no medications, labs, vitals or diagnoses. FOUND-01 bans fake
  *clinical* data, not all fixtures. Fixtures live behind the same dev-only gate as the gallery.

### Typography and icons

- **D-19:** **Inter is confirmed** as the frozen family, resolving Phase 001's
  "provisionally Inter, flagged for owner review". Self-hosted through **`next/font/google`**,
  which builds with no runtime CDN call — material for a PHI product where every third-party
  request is a review item.
- **D-20:** Load Inter with **latin + latin-ext subsets and tabular numerals available**.
  Tabular figures matter for the timeline axis and value columns (aligned digits in a dense
  clinical grid); latin-ext covers accented patient names. Only weights `400` and `600` are
  loaded, matching the frozen two-weight scale.
- **D-21:** **Lucide is confirmed** at **1.5px stroke**, resolving the provisional icon note in
  `docs/governance/reference-ui-specification.md` §2.3. The stroke width is set once on a shared
  icon wrapper so no call site can drift to the library default.

### Modal/sheet and primitive scope

- **D-22:** Modal and sheet ship the **full accessibility contract, hand-rolled** — focus trap,
  Escape to dismiss, focus restore to the trigger, `aria-modal` labelling, scroll lock, and a
  scrim whose color **derives from `textPrimary`** (INV-17 forbids a new scrim token). Built on
  Framer Motion with `useReducedMotion`. No headless UI dependency: the primitives must stay
  token-pure and FOUND-04 is this phase's a11y baseline, not a later phase's debt.
- **D-23:** Modal and sheet are **one primitive with a presentation variant** — centered overlay
  on desktop (≥1024px), bottom sheet on tablet and mobile. This is the responsive band contract
  expressed in one component, and it prevents a third ad-hoc overlay from appearing in a feature
  phase.
- **D-24:** **One shared `EmptyState` primitive** (title, optional body line, optional action)
  composed from surface and typography tokens. Every shell uses it, so empty states are
  consistent by construction rather than re-invented per phase.
- **D-25:** Surfaces are **one `Surface` component with four variants** over the frozen fills —
  `canvas` (page field), `surface` (default card), `surfaceMuted` (inset panel),
  `surfaceRaised` (elevated card). Separation is by the two frozen shadows only; **no card
  renders a visible full-perimeter border** (INV-16).

### Carried forward from Phase 001 (already decided — not re-litigated)

- 15 frozen color tokens plus the radius / spacing / font / shadow / motion scales in
  `docs/governance/tokens.json`, closed at the D-08 gate on 2026-10-06.
- Exactly two elevation levels; `borderSubtle` on true dividers only; a six-step spacing scale and
  a five-step radius scale with no other values permitted.
- Responsive band edges fixed at 1024px and 768px; mobile uses scrolling pill tabs and a 44px
  minimum touch target.
- Motion: Framer Motion for component/layout transitions, GSAP for SVG and timeline choreography,
  `never both` for one animation; only `duration.fast` (120ms) and `duration.slow` (240ms) exist.
- The visual QA gate is the 12-row `docs/governance/visual-qa-rules.md` checklist; an INV failure
  blocks phase acceptance.

### Claude's Discretion

- The internal file layout of the codegen script and the machine-check script, and their exact
  output formatting beyond the `file:line` + literal + rule contract in D-12.
- Component file naming and directory structure under `src/`, provided the route-group layout in
  D-02 is respected.
- The precise composition of the dev-only gallery sections and their ordering.
- Exact focus-visible ring styling and focus-order implementation, provided the accessibility
  baseline in FOUND-04 is met and colors resolve through tokens.
- Whether reduced-motion surfaces appear in the gallery as one section or several.
- The specific empty-state copy per shell, provided it follows
  `docs/governance/reference-ui-specification.md` §7 (sentence case, no exclamation marks, calm
  clinical verbs, no fabricated urgency).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Governance package — normative, outranks any implementation preference
- `docs/governance/tokens.json` — the frozen value source. This phase generates the CSS layer from
  it; never hand-write a token value. `review.gateStatus` is `approved-with-changes` and the gate
  is closed.
- `docs/governance/project-constitution.md` §4.3 (15-key token vocabulary), §7 (anti-generic and
  anti-gamification rejections), §8 (the three machine checks this phase implements, verbatim rule
  text and scope) — highest authority in the repo per §1.
- `docs/governance/ui-invariants.md` — the 17-ID `INV-xx` registry with objectively checkable
  conditions. `INV-01`, `INV-03`, `INV-13`, `INV-14` map to the three machine checks; `INV-16`
  and `INV-17` govern the Surface and modal/sheet decisions (D-22, D-25).
- `docs/governance/visual-qa-rules.md` §1 (the 12-row pass/fail gate) and §2 (the Playwright
  harness contract this phase builds: viewports, baseline path, states, tolerance, committed
  baselines).
- `docs/governance/responsive-rules.md` — the three band edges (1024 / 768 / 1023), the
  44px touch-target minimum, and the prohibition on introducing any spacing or radius value
  outside the frozen scales.
- `docs/governance/motion-rules.md` — the two durations, two easing curves, the Framer Motion /
  GSAP split, and the mandatory reduced-motion contract (`useReducedMotion`,
  `gsap.matchMedia`). Backs D-08 and D-22.
- `docs/governance/reference-ui-specification.md` §2 (design-system core: color, spacing,
  typography, geometry, depth) and §7 (copywriting contract — governs empty-state copy).
- `docs/reference-manifest.json` at `docs/governance/reference-manifest.json` — sha256 registry for
  the reference assets, including the do-not-reuse sample-content list.

### Product control pack
- `PRODUCT-MASTER-SPEC.md` §2.1–§2.4 (visual character, color language, geometry, depth),
  §9 (motion system), §12 (authorization — why D-03 defers guards to Phase 003), §19 Phase 002
  (this phase's mandate), §21 (reference-UI acceptance gate), §26 (responsive requirements),
  §27 (hard prohibitions).

### Binding visual references — design grammar only
- `docs/reference/provider-home-primary.jpg` — provider folder grid, left rail, CTA in `accentSoft`.
- `docs/reference/patient-workspace-timeline-primary.jpg` — timeline, pill tab bar, bottom
  scrubber with dark viewport window; the source of the frozen `textPrimary`.
- `docs/reference/patient-home-primary.jpg` — sparse patient home, quick-log chips.
- `docs/reference/patient-tracking-dashboard.jpg` — **diagnostic evidence only, never a design
  source and never sampled**.

### Planning artifacts
- `.planning/phases/01-project-constitution-reference-ui-specification/01-CONTEXT.md` — Phase 001
  decisions D-01 through D-19, several of which this phase implements directly.
- `.planning/REQUIREMENTS.md` — `FOUND-01` … `FOUND-05`, `UX-06` (this phase's requirements).
- `.planning/ROADMAP.md` §Phase 2 — goal, mode, dependencies, the four success criteria.
- `.planning/research/STACK.md` — stack decision; Tailwind v4 `@theme` token architecture, and the
  pinned dependency versions.
- `.planning/config.json` — `ui_phase: true`, `ui_safety_gate: true`, `security_enforcement: true`.
- `.planning/STATE.md` — Phase 001 closed on every gate; carry the recorded workstation
  constraints (no `sd` binary; `gsd-*` agent types not registered in this runtime).

### Project instructions
- `AGENTS.md` — project constraints, the semantic-token-only rule, the two-layer motion
  architecture, the server-side authorization rule, and the process rules the plans must honor.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **None in application code.** This is still a greenfield repository — no `package.json`, no
  `src/`, no app scaffold, no component library. This phase creates the entire application tree.
- `docs/governance/tokens.json` — the only machine-readable design input, and the input to the
  codegen script (D-05).
- The three binding reference JPGs — the source for verifying primitives against the grammar at
  the design gate.

### Established Patterns
- None yet in code; this phase establishes them. Every later phase builds on the primitive set,
  the route-group layout, and the token-utility vocabulary created here, so these choices are
  load-bearing for Phases 003–022.
- The governance package's own convention is already set and must be carried into code: **cite a
  token name, never a value**; every invariant cites its `INV-xx` ID.

### Integration Points
- `scripts/generate-tokens.mjs` — new; reads `docs/governance/tokens.json`, writes the gitignored
  CSS layer consumed by `src/app/globals.css` and Tailwind v4.
- `scripts/check-design-tokens.mjs` — new; implements the three checks specified in
  `docs/governance/project-constitution.md` §8; wired to `lint` and `prebuild`.
- `tests/visual/` — new; Playwright config with two projects (default / reduced-motion) and
  committed baselines under `tests/visual/baselines/{surface}/{viewport}/{state}.png`.
- `src/app/(provider)`, `src/app/(patient)`, `src/app/(auth)` — new route groups per D-02.
- `src/app/dev/gallery` — new dev-only gallery route per D-16.
- `docs/governance/reference-ui-specification.md` §2.3 — the "provisionally Inter" / "provisionally
  Lucide" wording should be updated to confirmed (D-19, D-21) so governance and code agree.

</code_context>

<specifics>
## Specific Ideas

- The route map is locked **now** specifically so Phases 003–005 never argue about paths. The 8
  workspace tabs from spec §6 are nested routes under `/provider/patients/[patientId]`, and the
  "Vital Signs" / "Communication" tabs visible in the timeline reference are sample content, not
  layout rules (Phase 001 D-13).
- Choosing a **gitignored generated token file** rather than a committed mirror was deliberate:
  the owner accepted no second source of truth rather than accepting a drift check that must be
  maintained.
- **Fonts drive pixel baselines.** The owner chose `next/font` self-hosting *and* local-only
  baseline gating with no CI. That combination is deliberate — self-hosting removes the network
  variable from screenshots, and no CI provider exists in this repo to choose. The landmine to
  design around: baselines captured on this Windows workstation will differ from a Linux CI runner
  on font rasterization. Whoever adds CI must regenerate baselines on that runner rather than
  assuming the committed PNGs transfer.
- The modal/sheet decision to go **hand-rolled rather than adopting a headless library** keeps the
  primitive set token-pure and keeps FOUND-04 (the a11y baseline) owned by this phase instead of
  deferred. The scrim deriving from `textPrimary` is the concrete INV-17 enforcement.
- One `EmptyState` primitive rather than per-shell markup was chosen specifically to stop the
  drift the phase would otherwise invite into every later phase.

</specifics>

<deferred>
## Deferred Ideas

- **CI provider configuration** — the visual suite runs locally via `npm run test:visual` and
  baselines are committed. Wiring a CI provider is out of scope for Phase 002 and belongs to a
  later hardening phase; whoever adds it must regenerate baselines on that runner.
- **ESLint configuration beyond the token script** — Phase 002 creates the check script; a general
  ESLint / Biome / Prettier setup is repo tooling that can be added with the first feature phase.
- **Dark-mode token values** — carried forward from Phase 001. The token contract is role-based so
  a dark set can be added without renaming, but only light values ship now.
- **Real content behind any empty state** — patients, timelines, folders and schedules arrive with
  their owning phases (004, 005, 006).

</deferred>

---

*Phase: 2-foundation-and-app-shell*
*Context gathered: 2026-10-06*
