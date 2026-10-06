# Phase 2: Foundation and App Shell - Research

**Researched:** 2026-10-06
**Domain:** Next.js 16 App Router greenfield scaffold, Tailwind v4 CSS-variable design-token layer, accessibility and motion foundations, Playwright visual-regression harness
**Confidence:** HIGH on the Tailwind v4 token mechanism, Playwright config surface, and package versions (all read from official docs + npm registry this session); MEDIUM on the hand-rolled focus-trap specifics (MDN primary, no single canonical reference implementation)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Route skeleton shape

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

#### Token layer generation

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

#### Machine-check enforcement

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

#### Visual-regression baselines

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

#### Typography and icons

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

#### Modal/sheet and primitive scope

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

#### Carried forward from Phase 001 (already decided — not re-litigated)

- 15 frozen color tokens plus the radius / spacing / font / shadow / motion scales in
  `docs/governance/tokens.json`, closed at the D-08 gate on 2026-10-06.
- Exactly two elevation levels; `borderSubtle` on true dividers only; a six-step spacing scale
  and a five-step radius scale with no other values permitted.
- Responsive band edges fixed at 1024px and 768px; mobile uses scrolling pill tabs and a 44px
  minimum touch target.
- Motion: Framer Motion for component/layout transitions, GSAP for SVG and timeline choreography,
  `never both` for one animation; only `duration.fast` (120ms) and `duration.slow` (240ms) exist.
- The visual QA gate is the 12-row `docs/governance/visual-qa-rules.md` checklist; an INV failure
  blocks phase acceptance.

### the agent's Discretion

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

### Deferred Ideas (OUT OF SCOPE)

- **CI provider configuration** — the visual suite runs locally via `npm run test:visual` and
  baselines are committed. Wiring a CI provider is out of scope for Phase 002 and belongs to a
  later hardening phase; whoever adds it must regenerate baselines on that runner.
- **Dark-mode token values** — the token contract is role-based; only light values ship now.
- **Supabase / auth / RLS / audit** — Phase 003. No `middleware.ts` placeholder (D-03).
- **Clinical capability of any kind** — no dashboard, no timeline, no patient data model, no
  encounters, no real content behind any empty state.
- **Provider folder grid and patient collection** (Phase 004), **8-tab workspace body and D3
  timeline** (Phase 005 / 006).
- **ESLint / Prettier setup** — the three machine checks (D-09) and `npm run lint` are the whole
  of the lint story for this phase. No ESLint config is in scope.
- **Storybook** — the dev-only primitives gallery (D-16) is the review surface instead.
</user_constraints>

## Project Constraints (from AGENTS.md)

Extracted verbatim-in-substance from the project instruction file. Treat these with the same
authority as the locked decisions above — no plan task may contradict them.

| # | Directive (AGENTS.md) | Consequence for Phase 002 |
|---|------------------------|---------------------------|
| 1 | **Tech stack**: Next.js application shell (§19 Ph002); D3.js mandatory for the timeline (§8.1); React owns app UI/state composition. | Scaffold Next.js App Router. D3 is a Phase 006 dependency — do **not** install D3 modules in Phase 002. |
| 2 | **Design tokens**: semantic tokens only, no scattered raw hex; exact values frozen after visual review; the 14 listed token categories. | Every color in `src/` resolves through a generated semantic token utility. Enforced by `no-raw-hex` + `token-reference-required`. |
| 3 | **Motion**: two-layer architecture — Framer Motion for component/layout/panel transitions, GSAP for complex SVG drawing and timeline choreography; all motion fast, smooth, subtle, interruptible, reduced-motion compatible. | Phase 002 installs both but uses only Framer Motion (D-22). GSAP is installed for Phase 006 and, per D-08, must read `var(--duration-fast)` rather than a literal. |
| 4 | **Security**: authorization determined server-side and enforced by database/API layer; frontend route guards supplementary only; **never trust role info from localStorage, browser state, or URL parameters**. | D-03's open routes are explicitly temporary. The Phase 003 slot comment must say *server-side role resolution*, and must not read a role from anywhere client-held. |
| 5 | **Navigation**: patient workspace primary nav is exactly the 8 tabs in §6; no Vital Signs primary tab; Communication is not a primary clinical tab. | The 8 nested routes under `/provider/patients/[patientId]` must be named from §6, not invented. |
| 6 | **Data**: relational domain model Organization → Membership → User → Patient → …; no unstructured JSON blob. | Out of scope this phase (Phase 003). The placeholder patient (D-18) is a typed stub, not a JSON blob. |
| 7 | **Provenance**: every clinically meaningful record carries source, creator, created, updater, updated, verification state, AI-extraction state. | Not applicable in Phase 002 — no records exist. Recorded so the stub types are not mistaken for a schema. |
| 8 | **Error/empty/loading**: every major workspace has deliberate loading, empty, error, retry, permission-denied, offline states; **no generic "Loading…" screens**. | `EmptyState` (D-24) must not become a generic spinner/skeleton. Phase 002 ships the empty variant; later states are Phase 003+. |
| 9 | **Performance**: explicit attention to re-renders, animation cost, large collections, mobile performance. | The primitives are the shared surface for 20 later phases — measure twice, keep them cheap. `"use client"` boundaries must be minimal (see Architecture Patterns). |
| 10 | **Responsive**: web and mobile share design language but not identical layouts; mobile adapts for touch, compact navigation, reduced density. | UX-06 lives here. The 4-viewport baseline matrix is the machine evidence. |
| 11 | **Accessibility**: baseline in **Phase 002**; visual/interaction/accessibility QA gates in Phase 022. | FOUND-04 is this phase's deliverable and cannot be deferred. |
| 12 | **Process**: planning is mandatory before implementation (§20.3); UI phases have an additional design gate with visual review against the reference (§20.4, §21); no autonomous execution for the initial rebuild (§20.9). | The 12-row `visual-qa-rules.md` §1 gate runs at the end of this phase. `ui_safety_gate: true` and `ui_phase: true` in `.planning/config.json`. |
| 13 | **Workflow enforcement** (from the GSD block in `AGENTS.md`): start work through `/gsd-quick`, `/gsd-debug`, or `/gsd-execute-phase`; do not make direct repo edits outside a GSD workflow. | Plans must be executed through `/gsd:execute-phase`. |
| 14 | **Project skills**: none found (`AGENTS.md` §Project Skills is empty; no `rules/*.md`). | No skill-derived conventions to honor in this phase. |

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| FOUND-01 | Next.js application shell with route structure and layout primitives, containing no fake clinical dashboard and no sample patient data beyond isolated development fixtures. | Route Groups and nested-layout conventions (§ Architecture Patterns, Pattern 3); `notFound()`-based dev-only exclusion (§ Q3); D-18 stub typing; the `no-raw-hex`/`token-reference-required` checks in the check script. |
| FOUND-02 | Developer can build any screen from the shared primitive set — surfaces, buttons, pills, compact controls, modal/sheet primitives — instead of hand-rolling per-screen components. | One `Surface` with four variants (D-25), one `EmptyState` (D-24), one modal/sheet with a presentation variant (D-23); the machine-derived token-utility list (§ Q9) makes the vocabulary total and non-stale. |
| FOUND-03 | Typography and surface styling follow one hierarchy derived from the reference, not per-screen improvisation. | Four font sizes / two weights / four line-heights map onto `--text-*`, `--font-weight-*`, `--leading-*`; `rounded-*` from `--radius-*`; `--shadow-raised` / `--shadow-overlay` are the only shadows (INV-13, INV-14); the 4×2 visual baseline matrix is the regression gate. |
| FOUND-04 | Shell and primitives meet the accessibility baseline (focus order, labels, contrast against frozen tokens). | § Q5 focus-trap/scroll-lock pattern; `aria-modal` + labelling; the `no-raw-hex` check makes contrast auditable because every declared color resolves to a token; Playwright `toHaveScreenshot` cannot test contrast — mark as reviewer-evaluated against `visual-qa-rules.md` row 2. |
| FOUND-05 | All shell-level motion is fast, smooth, subtle, interruptible, and fully disabled or reduced when the OS requests it. | `useReducedMotion` from `motion/react`; opacity-only degradation at `duration.fast`; the second Playwright project with `reducedMotion: 'reduce'` (v1.50+ `testOptions.reducedMotion`) captures the branch by construction (D-15). |
| UX-06 | As a mobile user, the app adapts (touch targets, compact navigation, reduced density, safe interactions) rather than being a shrunken desktop. | `390x844` and `768x1024` are two of the four mandated baselines; 44px minimum touch target from `responsive-rules.md`; the modal→bottom-sheet switch at the 1024px band edge (D-23). NOTE: `UX-06` is co-owned with Phase 022 verification — Phase 002 proves the *shell* adapts; Phase 022 verifies the finished app. |

## Summary

This phase is greenfield: there is no `package.json`, no `src/`, no `next.config`, and no
`.gitignore` in the repository today (verified by directory listing — only `.kilo/`, `.planning/`,
`AGENTS.md`, `PRODUCT-MASTER-SPEC.md`, `docs/`, `scripts/` exist). Everything the phase produces
is new, so this research is about *mechanisms*, not about adapting existing code.

The highest-risk item is the Tailwind v4 token layer, because D-05/D-07/D-08 constrain a
mechanism that most developers still think of in v3 terms. Three findings materially change how
the codegen script must be written:

1. **`@theme inline` changes what the generated utility contains, not just how the variable is
   declared.** With `inline`, a utility emits the theme variable's *value* rather than a reference
   to the variable; without it, the utility emits `var(--token)` [CITED: tailwindcss.com/docs/theme
   §"Referencing other variables"]. That is exactly what D-08 needs: utilities resolve directly,
   and the separate `:root` block remains the single readable source for raw CSS, the shadow
   tokens and GSAP.
2. **`@theme` variables are only emitted when used.** "By default only used CSS variables will be
   generated in the final CSS output"; `@theme static` forces all of them [CITED:
   tailwindcss.com/docs/theme §"Generating all CSS variables"]. Without either the `:root` block
   or `static`, a token that only GSAP reads would be tree-shaken out of the stylesheet. D-08's
   `:root` block is the fix, and it is load-bearing, not decorative.
3. **A self-referential `@theme inline` entry is a cycle.** `--color-frame: var(--color-frame)`
   inside `@theme inline` is invalid CSS resolution, not a clever trick. The generator must emit
   the literal value into `@theme inline` and separately into `:root` — same generator pass, same
   source value, so no drift (see § Q1 for the exact emission).

The second-highest-risk item is the visual-regression harness, where Playwright itself flags the
landmine: "Browser rendering can vary based on the host OS, version, settings, hardware, power
source (battery vs. power adapter), headless mode, and other factors. For consistent screenshots,
run tests in the same environment where the baseline screenshots were generated." [CITED:
playwright.dev/docs/test-snapshots]. With D-17's local-only gating this is contained — but it
means the baseline PNGs are **not portable**, and the harness config must pin everything it can
(`deviceScaleFactor`, `reducedMotion`, `animations: 'disabled'`, `caret: 'hide'`, a fixed
`baseURL`) or the gate will be flaky for reasons unrelated to the design.

A third finding is architectural rather than mechanical: the three route groups each need a
layout, and Next.js documents that navigating between routes that use *different root layouts*
"triggers a full page reload" [CITED: nextjs.org route-groups §Caveats]. A role switch between
`/provider` and `/patient` is exactly that navigation. The prescription below keeps the three
per-role layouts (honoring D-02) while nesting all three under one `src/app/layout.tsx` that owns
only `<html>`, `<body>`, the font and the token stylesheet — so no role chrome leaks into a shared
root layout (D-02's actual requirement) and no role switch costs a full document load.

**Primary recommendation:** Scaffold one root layout owning `<html>`/fonts/tokens, three nested
role layouts, generate the token layer as a gitignored CSS file plus a gitignored TS constants
module from `docs/governance/tokens.json` via `predev`/`prebuild`, implement the three checks as
one zero-dependency Node script, and build the Playwright harness with two `reducedMotion`
projects over four viewports — treating the baseline PNGs as machine-local artifacts.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Token layer generation (JSON → CSS/TS) | Build toolchain (Node script) | — | Runs at `predev`/`prebuild` in the shell before Next.js starts; pure function of a committed file. Never runs in the browser. |
| Token enforcement (3 checks) | Build toolchain (Node script) | — | Static analysis over source text; D-09 forbids ESLint. Wired to `lint` and `prebuild`. |
| Design-token → CSS variable resolution | CDN / Static (CSS) | Build toolchain | `@theme inline` compiles at build time into a static stylesheet; nothing resolves at runtime except `var()`. |
| Route map / layouts / empty shells | Frontend Server (RSC) | — | App Router `page.tsx` are Server Components by default; shells carry no client state, so they render on the server with no hydration cost. |
| Role chrome (left rail, role nav) | Frontend Server (RSC) | — | Static per-role markup. If a rail later needs active-route state, the *marker* is a client island; the rail shell stays a server layout. |
| Modal/sheet open/close + focus trap | Browser / Client | Frontend Server | Focus, `Escape`, `inert` and scroll lock are DOM-only. The dialog must be a client component mounted from a server layout. |
| Motion (enter/exit/layout) | Browser / Client | — | `useReducedMotion` and `AnimatePresence` are React-runtime; cannot run on the server. Requires `"use client"`. |
| Typography (Inter self-hosting) | Frontend Server (build-time fetch + static asset) | CDN / Static | `next/font/google` fetches at build time and self-hosts; zero runtime third-party request (D-19). |
| Dev-only gallery + fixtures | Frontend Server (guarded) | — | `notFound()` in production; never enters the product route map (D-16). |
| Visual regression | Browser / Client (headless Chromium) | CDN / Static | Playwright drives a real browser against a production build; only it can prove rasterized appearance. |
| Authentication / authorization | **Not in this phase** | — | Phase 003. Deliberately absent (D-03). Listed so the planner does not assign it here. |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `next` | `16.3.8` | App Router, RSC, file routing, `next/font`, build pipeline | Verified current stable on npm (2026-10-06). The route-group and `next/font` conventions this phase depends on are documented for v16.3.8. |
| `react` / `react-dom` | `19.3.0` | UI runtime | Verified current on npm. Next 16 targets React 19 (`.planning/research/STACK.md` §Version Compatibility). |
| `typescript` | **`7.0.2` available — pin `~5.9.x`** | Type checking, `strict: true` | **Registry truth is TS 7.0.2**, but `.planning/research/STACK.md` explicitly instructs "TS major 7 is very new; pin 5.9.x for the project unless Next/Next plugins verify TS7 support". No such verification was found this session. **Pin `typescript@~5.9`.** |
| `tailwindcss` + `@tailwindcss/postcss` | `4.3.3` / `4.3.3` | CSS-first config, `@theme` token layer, utilities | v4 is CSS-variable-native; the `@theme inline` mechanism D-07/D-08 depend on exists only in v4. `@tailwindcss/vite` is Vite-only and must **not** be used with Next.js. |
| `motion` | `14.0.0` | Framer Motion rebrand — enter/exit, layout, `AnimatePresence`, `useReducedMotion` | The rebranded package is what the motion contract names. `import { … } from "motion/react"`. |
| `gsap` | `3.15.0` | Phase 006 SVG/timeline choreography | Locked by the two-layer contract. Installed now so the shell's dependency surface is complete; **not used in Phase 002 code**. |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `lucide-react` | `1.52.0` | Line icons at `strokeWidth={1.5}` (D-21) | Every icon in the shell, always through the shared wrapper. |
| `@playwright/test` | `1.63.0` | Visual-regression harness + baselines | The `reducedMotion` project option requires v1.50+; 1.63 satisfies it. |
| `vitest` | `5.0.3` | Unit tests for primitives and the token/check scripts | Node env for the scripts, jsdom env for component tests. |
| `@vitejs/plugin-react` | `6.1.2` | JSX transform for Vitest | Required for component tests; not required for the script tests (plain `.mjs`). |
| `jsdom` | `30.1.2` | DOM environment for Vitest component tests | Preferred over happy-dom here: broader spec fidelity for `inert`, focus and `matchMedia`, which FOUND-04 depends on. |

**Not installed in this phase** (deliberate, scope discipline): D3 modules, Supabase, `zod`,
ESLint/Prettier, Storybook, any headless UI library (D-22 forbids).

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| A committed token CSS file | Gitignored generated CSS (D-06) | **Locked.** The tradeoff is accepted: a fresh clone has no CSS until `predev`/`prebuild` runs. § Q2 covers making that invisible. |
| `@theme static` | `@theme inline` + explicit `:root` (D-08) | Both work; the `:root` block is required regardless because GSAP/raw CSS must read the variables. Keeping `@theme` non-static plus an explicit `:root` makes the readable source obvious to a grepping reviewer. |
| `@theme inline` | Plain `@theme` with `var()` values | Plain `@theme` would emit `.bg-surface { background-color: var(--color-surface) }`, which also works. `inline` is chosen by D-08 and additionally insulates utilities from cascade surprises when a variable is re-declared on an ancestor. |
| A headless UI library (`@radix-ui/*`, `react-aria`) | Hand-rolled modal/sheet (D-22) | **Locked.** Higher maintenance, but keeps the primitive token-pure and keeps FOUND-04 owned here. § Q5 gives the pattern; § "Don't Hand-Roll" states the honest risk. |
| `pageExtensions` / build-tag file naming to hide the gallery | `notFound()` under `NODE_ENV` (D-16) | Both exclude it from the *product* route map; `notFound()` is one file, needs no config, and is documented. `pageExtensions` would make the file invisible in dev too. |
| `--spacing-*` named tokens for the 6-step space scale | `p-4`, `gap-8` numeric Tailwind spacing | The numeric scale is `calc(var(--spacing) * <number>)` [CITED: tailwindcss.com/docs/padding] — 4px × 4 = 16px, but that is arithmetic coincidence, not a token. Named `--spacing-*` tokens make `gap-lg` *mean* `space.lg`. See § Q1 for the `w-*`/`max-w-*` collision pitfall. |
| Playwright `devices['Desktop Chrome']` presets | Explicit `viewport` + `deviceScaleFactor: 1` | Device presets bake in a platform user-agent and their own viewport; the baseline contract names exact viewport sizes. Explicit values are the only way to hit the contract exactly. |

**Installation:**
```bash
# runtime
npm install next@16.3.8 react@19.3.0 react-dom@19.3.0 \
  tailwindcss@4.3.3 @tailwindcss/postcss@4.3.3 \
  motion@14.0.0 gsap@3.15.0 lucide-react@1.52.0

# dev
npm install -D typescript@~5.9 @types/node @types/react@19 @types/react-dom@19 \
  @playwright/test@1.63.0 vitest@5.0.3 @vitejs/plugin-react@6.1.2 jsdom@30.1.2
npx playwright install chromium
```

**Version verification:** every version above was pulled from the npm registry on 2026-10-06 via
`npm view <pkg> version` [VERIFIED: npm registry]. STACK.md's recorded versions for `next`
(16.3.8), `tailwindcss` (4.3.3), `motion` (14.0.0), `gsap` (3.15.0), `vitest` (5.0.3),
`@playwright/test` (1.63.0) and `typescript` all still match the registry — except that
**`typescript@7.0.2` is now `latest`**, which STACK.md anticipated and instructed be pinned back.

## Package Legitimacy Audit

> Run via `gsd_run query package-legitimacy check --ecosystem npm …`, cross-checked with
> `npm view <pkg> version` and `npm view <pkg> scripts.postinstall`.

| Package | Registry | Age (latest publish) | Downloads/wk | Source Repo | Verdict | Disposition |
|---------|----------|-----|-----------|-------------|---------|-------------|
| `next` | npm | 2026-09-30 | 76.9M | `github.com/vercel/next.js` | SUS (`too-new` only) | Approved — see note |
| `react` | npm | 2026-09-09 | 224.4M | `github.com/react/react` | SUS (`too-new` only) | Approved — see note |
| `react-dom` | npm | 2026-09-09 | 211.6M | `github.com/react/react` | SUS (`too-new` only) | Approved — see note |
| `tailwindcss` | npm | 2026-07-16 | 163.0M | `github.com/tailwindlabs/tailwindcss` | **OK** | Approved |
| `@tailwindcss/postcss` | npm | 2026-07-16 | 49.6M | `github.com/tailwindlabs/tailwindcss` | **OK** | Approved |
| `motion` | npm | 2026-10-02 | 28.3M | `github.com/motiondivision/motion` | SUS (`too-new` only) | Approved — see note |
| `gsap` | npm | 2026-04-13 | 7.1M | `github.com/greensock/GSAP` | **OK** | Approved |
| `lucide-react` | npm | 2026-10-04 | 134.6M | `github.com/lucide-icons/lucide` | SUS (`too-new` only) | Approved — see note |
| `@playwright/test` | npm | 2026-09-04 | 86.2M | `github.com/microsoft/playwright` | **OK** | Approved |
| `vitest` | npm | 2026-09-30 | 142.1M | `github.com/vitest-dev/vitest` | SUS (`too-new` only) | Approved — see note |
| `@vitejs/plugin-react` | npm | 2026-10-05 | 116.9M | `github.com/vitejs/vite-plugin-react` | SUS (`too-new` only) | Approved — see note |
| `jsdom` | npm | 2026-10-04 | 131.8M | `github.com/jsdom/jsdom` | SUS (`too-new` only) | Approved — see note |
| `typescript` | npm | 2026-07-08 | 365.3M | `github.com/microsoft/TypeScript` | **OK** | Approved (pin `~5.9`, not 7.x) |

**Packages removed due to [SLOP] verdict:** none.

**Packages flagged as suspicious [SUS]:** `next`, `react`, `react-dom`, `motion`, `lucide-react`,
`vitest`, `@vitejs/plugin-react`, `jsdom`.

> **Interpretation — do not add `checkpoint:human-verify` tasks for these.** Every SUS verdict here
> carries the single reason `too-new`, which is a recency threshold firing on the *latest patch*
> of a package whose *latest minor* is months old. Every one of these is (a) the package named by
> `AGENTS.md`, `PRODUCT-MASTER-SPEC.md`, `.planning/research/STACK.md` or the locked decisions,
> (b) backed by its canonical GitHub org, and (c) at 28M–365M weekly downloads — the opposite of a
> slopsquat profile, which would show low downloads and no repo. Blocking `react` on recency would
> be noise. **Pin exact versions** (above) so the resolved artifact is reproducible, and record the
> pin in the plan. The legitimacy gate has done its job: nothing here is hallucinated.

**Postinstall audit:** `npm view <pkg> scripts.postinstall` returned empty for **all thirteen**
packages [VERIFIED: npm registry]. No network-calling or out-of-tree postinstall scripts. Note
`@playwright/test` does not download browsers via postinstall — `npx playwright install chromium` is
an explicit step and must be in the plan, or the harness fails on first run.

## Architecture Patterns

### System Architecture Diagram

```
docs/governance/tokens.json  (committed, ONLY source of token values)
          │
          │  read at build time (node, zero deps)
          ▼
scripts/generate-tokens.mjs   ──predev / prebuild──►  src/styles/tokens.generated.css   [gitignored]
          │                                                   │
          │                                                   ├─► @theme inline { … }  → Tailwind emits utilities
          │                                                   └─► :root { … }           → raw CSS / GSAP read var()
          │                                                   │
          │                                                   ▼
          │                                            src/app/globals.css  (@import "tailwindcss"; @import tokens)
          │                                                   │
          │                                                   ▼
          │                                            next/font Inter (self-hosted, build-time fetch)
          │                                                   │
          ▼                                                   ▼
scripts/check-design-tokens.mjs ──lint / prebuild──►  src/app/  three route groups + three layouts
   reads the SAME tokens.json for the token-utility list        │
   reads src/** + root configs for violations                  │
   exit 1 on violation, file:line + literal + check + INV      ▼
                                                        tests/visual/**.spec.ts
                                                        project "default"        project "reduced-motion"
                                                        reducedMotion:null       reducedMotion:'reduce'
                                                        4 viewports × N surfaces
                                                                    │
                                                                    ▼
                                        tests/visual/baselines/{surface}/{viewport}/{state}.png  [committed]
```

Data flow for a single request: `src/app/(provider)/provider/page.tsx` → server-rendered layout
`(provider)/layout.tsx` → `Surface`/`EmptyState` primitives → `bg-surface` utility → resolves to the
literal emitted by `@theme inline`. No runtime token lookup, no JS theme object, no hydration cost
for the shells.

### Recommended Project Structure

```
package.json                     # scripts: dev, build, start, lint, tokens:generate, tokens:check, test, test:visual
postcss.config.mjs               # { plugins: { "@tailwindcss/postcss": {} } }
tsconfig.json                    # strict, @/* → src/*
next.config.ts
playwright.config.ts             # 2 projects, 4 viewports, snapshotPathTemplate, webServer: next start
vitest.config.ts                 # node env default + jsdom project
.gitignore                       # node_modules, .next, coverage, playwright-report, test-results,
                                 #   src/styles/tokens.generated.css, src/styles/tokens.generated.ts
scripts/
├── generate-tokens.mjs          # D-05 — tokens.json → CSS + TS constants
├── check-design-tokens.mjs      # D-09 — the three machine checks
└── validate-governance.mjs      # EXISTING (Phase 001) — do not modify
docs/governance/tokens.json      # committed source of truth (unchanged)
src/
├── app/
│   ├── layout.tsx               # ONE root layout: <html>, <body>, font, globals.css. No chrome. No / route.
│   ├── globals.css              # @import "tailwindcss"; @import "../styles/tokens.generated.css";
│   ├── not-found.tsx            # root 404 (needed: no top-level page.tsx → / must resolve in a group)
│   ├── (auth)/
│   │   ├── layout.tsx           # bare — D-02
│   │   └── login/page.tsx       # /login
│   ├── (provider)/
│   │   ├── layout.tsx           # left icon rail + provider nav
│   │   ├── provider/page.tsx    # /provider
│   │   └── provider/
│   │       └── patients/[patientId]/
│   │           ├── layout.tsx           # workspace frame (tab bar host)
│   │           ├── page.tsx             # → redirect to default tab
│   │           ├── overview/page.tsx    # 8 tabs, names from PRODUCT-MASTER-SPEC §6
│   │           └── <tab-2..8>/page.tsx
│   ├── (patient)/
│   │   ├── layout.tsx           # patient chrome
│   │   ├── patient/page.tsx     # /patient
│   │   └── patient/home/page.tsx# /patient/home
│   └── dev/
│       └── gallery/page.tsx     # D-16 — notFound() in production; D-18 fixtures behind the same gate
├── components/
│   ├── primitives/              # Surface, Button, Pill, CompactControl, EmptyState, Icon
│   └── overlays/                # Overlay (modal|Sheet), FocusTrap hook, useScrollLock hook
├── lib/
│   ├── motion.ts                # tokens.ts MOTION + variants + reduced-motion branch (client)
│   └── dev/                     # D-18 typed stubs
└── styles/
    └── tokens.generated.{css,ts}   # [gitignored] — written by predev/prebuild
tests/
├── unit/                        # Vitest: script tests (node env), primitive tests (jsdom)
└── visual/
    ├── surfaces.spec.ts
    └── baselines/{surface}/{viewport}/{state}.png   [committed]
```

### Pattern 1: The generated dual-emission token layer

**What:** one generator writes the *same* literal values twice — once into `@theme inline` (so
Tailwind generates utilities) and once into `:root` (so raw CSS, the two shadow tokens and GSAP can
read `var(--token)`). Both come from one `for` loop over the parsed JSON, so they cannot drift.

**Why `inline` and not plain `@theme`:** empirically verified on tailwindcss 4.3.3 —

| Directive | Utility output | Variable emitted to `:root`? |
|---|---|---|
| `@theme { --color-plain: #112233 }` | `.bg-plain { background-color: var(--color-plain) }` | yes (when used) |
| `@theme inline { --color-inlined: #445566 }` | `.bg-inlined { background-color: #445566 }` | **no** |
| `@theme static { --color-static: #778899 }` | `.bg-static { background-color: var(--color-static) }` | **yes, always** |

[VERIFIED: compiled tailwindcss@4.3.3 via `@tailwindcss/postcss` in a scratch project, 2026-10-06;
mechanism documented at tailwindcss.com/docs/theme §"Referencing other variables" and
§"Generating all CSS variables"]

The consequence for this phase: **`@theme inline` alone would silently drop every token that no
utility uses.** A token read only by GSAP (`--duration-fast`) would not exist in the output at all.
That is exactly why D-08 mandates the separate `:root` block, and it is why the generator must emit
`:root` unconditionally. `static` would also work, but `static` cannot express "inline this value
into the utility", and D-08 asks for both — so `inline` + explicit `:root` is the correct pair.

**When to use:** always, here. This is the only mechanism that satisfies D-05 through D-08.

```css
/* src/styles/tokens.generated.css — GENERATED, GITIGNORED. Do not edit. */
/* source: docs/governance/tokens.json v1 */
@theme inline {
  --color-frame: #E0E3E8;
  --color-frame-foreground: #A9ACB0;
  --color-surface: #E0E3E8;
  --radius-pill: 999px;
  --spacing-lg: 16px;
  --shadow-raised: 0 2px 6px rgba(50,53,58,0.07), 0 8px 24px rgba(50,53,58,0.05);
  --duration-fast: 120ms;
}

:root {
  --color-frame: #E0E3E8;
  --color-frame-foreground: #A9ACB0;
  --color-surface: #E0E3E8;
  --radius-pill: 999px;
  --spacing-lg: 16px;
  --shadow-raised: 0 2px 6px rgba(50,53,58,0.07), 0 8px 24px rgba(50,53,58,0.05);
  --duration-fast: 120ms;
  --easing-standard: cubic-bezier(0.2, 0, 0, 1);
}
```

**Anti-pattern to avoid:** `--color-surface: var(--color-surface)` inside `@theme inline`. That is a
self-referential custom property — invalid resolution, not a trick. Verified: when the theme value
is a *different* variable, `@theme inline { --color-surface: var(--palette-surface) }` correctly
emits `.bg-surface { background-color: var(--palette-surface) }`, and that indirection is the right
design **only if** you use two different names. D-07 names one kebab form, so use the literal value
in `@theme inline` and let the identically-named `:root` declaration be the readable one.

### Pattern 2: Namespace mapping table (generated, not hand-written)

**What:** each JSON group maps to a fixed Tailwind namespace so the kebab name determines the
utility. This table belongs in the generator as data, and the check script must import the *same*
mapping so the token-utility list never goes stale.

| JSON path | Namespace | Emitted property | Utilities that appear |
|---|---|---|---|
| `color.*` | `--color-*` | `--color-frame-foreground` | `bg-*`, `text-*`, `border-*`, `ring-*`, `fill-*`, `stroke-*` |
| `radius.*` | `--radius-*` | `--radius-pill` | `rounded-pill` |
| `space.*` | `--spacing-*` | `--spacing-lg` | `p-lg`, `gap-lg`, `w-lg`, `max-w-lg`, `h-lg` |
| `font.size.*` | `--text-*` | `--text-label` | `text-label` (font-size) |
| `font.weight.*` | `--font-weight-*` | `--font-weight-semibold` | `font-semibold` |
| `font.lineHeight.*` | `--leading-*` | `--leading-tight` | `leading-tight` |
| `shadow.*` | `--shadow-*` | `--shadow-raised` | `shadow-raised`, `shadow-overlay` |
| `motion.easing.*` | `--ease-*` | `--ease-standard` | `ease-standard` |
| `motion.duration.*` | **(none)** | `--duration-fast` | *no utility — `:root` + JS only* |

[VERIFIED: compiled tailwindcss@4.3.3 — every row above generated the named utility:
`.gap-2xl{gap:32px}`, `.rounded-pill{border-radius:999px}`, `.bg-surface{background-color:#E0E3E8}`,
`.text-label{font-size:12px}`, `.leading-tight{line-height:1.1}`, `.shadow-raised{…}`,
`.ease-standard{transition-timing-function:cubic-bezier(0.2,0,0,1)}`, `.text-text-primary{color:#32353A}`,
`.border-border-subtle{border-color:#A2A4AA}`. Namespaces per tailwindcss.com/docs/theme
§"Theme variable namespaces".]

Two consequences the planner must act on:

1. **`--duration-*` has no Tailwind namespace.** There is no `duration-fast` utility. `duration.*`
   therefore belongs **only** in the `:root` block, and JS-side code must read it. See § Q4.
2. **`text-*` is overloaded.** `--color-text-primary` produces the *color* utility
   `text-text-primary`; `--text-label` produces the *font-size* utility `text-label`. Both compile
   correctly and coexist, but the vocabulary is easy to misread. D-07's `text-text-primary` is
   correct; do not "simplify" it to `text-primary`.

**A namespace collision to know about (verified):** with `--spacing-sm` and `--spacing-lg` defined,
Tailwind resolves `.w-sm` to `8px` and `.max-w-lg` to `16px` — i.e. the **spacing** namespace, not
the default `--container-*` values (`w-sm` is documented as `var(--container-sm) /* 24rem */`
[CITED: tailwindcss.com/docs/width]). Defining `--spacing-*` therefore *repoints* `w-*`, `h-*`,
`max-w-*` and `min-w-*` for those names away from the container scale. That is desirable here
(`w-lg` should mean 16px, not 32rem) but it must be a deliberate choice: it also means `max-w-md`
is 12px, not 28rem. **Rule for the generator's consumers: use `--spacing-*` names only for padding,
margin, gap and size utilities; never assume a `max-w-*`/`w-*` name means the container scale.**

### Pattern 3: One root layout, three nested role layouts

**What:** `src/app/layout.tsx` owns only `<html>`, `<body>`, the Inter font variable and
`globals.css`. The three role layouts are nested inside it.

**Why:** Next.js documents that "if you navigate between routes that use different root layouts,
it'll trigger a full page reload" [CITED: nextjs.org/docs/app/api-reference/file-conventions/route-groups
§Caveats]. Three *root* layouts would make `/provider` → `/patient` a full document reload — a real
cost for the primary role-switching navigation, and a visible flash. Nesting them under one root
layout satisfies D-02's actual requirement ("Role-specific chrome must not leak into a shared root
layout" — a root layout with no chrome cannot leak chrome) while avoiding the reload.

**Second consequence:** "If you use multiple root layouts without a top-level `layout.js`, make sure
your home route (`/`) is defined within one of the route groups" [same source]. With one root
layout, `/` is simply undefined — Next renders the root `not-found.tsx` for it. Add a root
`not-found.tsx` and a `page.tsx` that redirects `/` to `/login` if the planner wants `/` reachable;
otherwise the root not-found is correct and no `/` route enters the locked URL map (D-01).

### Pattern 4: Dev-only gallery exclusion

**What:** `src/app/dev/gallery/page.tsx` calls `notFound()` when `NODE_ENV === 'production'`.

```tsx
import { notFound } from 'next/navigation';

export default function DevGalleryPage() {
  // D-16: the gallery is a review/baseline surface, never a product route.
  // In a production build this route 404s and leaves the product route map.
  if (process.env.NODE_ENV === 'production') notFound();
  return <Gallery />;
}
```

`notFound()` "throws an error that renders a Next.js 404 page… and Next.js also injects a
`<meta name="robots" content="noindex" />` tag" [CITED: nextjs.org/docs/app/api-reference/functions/not-found].
It must be called in the render path (a component, or an awaited function) or nothing catches the
throw — a bare `notFound()` in module scope is a bug.

**Conflict the planner must resolve:** D-14 requires baselines for the gallery, and
`visual-qa-rules.md` §2 requires capture "against a production build". A production build sets
`NODE_ENV=production`, so a pure `NODE_ENV` gate makes the gallery 404 under `next start` and its
baselines uncapturable. Resolution that keeps D-16 intact: gate on a **dedicated** flag rather than
`NODE_ENV` alone, e.g. `if (process.env.NODE_ENV === 'production' && process.env.ALLOW_DEV_ROUTES !== '1') notFound();`,
and set `ALLOW_ROUTES=1` **only** in `playwright.config.ts` → `webServer.env`. The route still never
renders for a real production deployment (nothing sets that variable there), it stays out of the
product route map, and the harness can capture it. Recorded as Open Question #1 — it needs the
owner's confirmation because it is a weakening of "gated by `NODE_ENV`" as literally worded.

### Anti-Patterns to Avoid

- **A committed token CSS file next to the generated one.** Two files that both claim to be "the
  tokens". D-06 forbids it; the check script would then have to arbitrate.
- **A JS/TS theme object (`tokens.ts` as the only source).** Tailwind v4 has no JS config; the
  utilities come from CSS. A TS object would be a second source with no enforcement.
- **`tailwind.config.js`.** v4 is CSS-first; "Instead of a `tailwind.config.js` file, you configure
  all of your customizations directly in the CSS file" [CITED: tailwindcss.com/blog/tailwindcss-v4
  §"CSS-first configuration"]. A v4-style JS config would be silently ignored.
- **Importing `docs/governance/tokens.json` directly from a component.** Server Components *can*
  import JSON, and it would work — and then the value would land in the client bundle and bypass the
  CSS token layer entirely, making `no-raw-hex` blind to it. Import only from the two scripts.
- **Using numeric Tailwind spacing (`p-4`) as a proxy for `space.md`.** `p-4` is
  `calc(var(--spacing) * 4)` [CITED: tailwindcss.com/docs/padding]; it happens to equal 16px but it
  cites no token. `visual-qa-rules.md` row 3 requires the gap be "one of `space.xs` through
  `space.2xl`" — a reviewer grepping for `space.` needs the named utility to find it.
- **Wrapping every shell in `"use client"`.** The shells are static Server Components. `"use client"`
  belongs on exactly three things: the modal/sheet, the focus/scroll-lock hooks' consumer, and the
  icon wrapper if it needs interactivity. Anything more is an unnecessary hydration cost across
  every route in the product.
- **Reading the role from the URL or a client store to pick a layout.** Violates `AGENTS.md` §Security
  and pre-empts Phase 003. Route groups are chosen by the filesystem, never by a value.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| CSS custom-property → utility mapping | A utility generator or `@apply` pyramid | `@theme inline` + namespace prefixes | v4 already compiles namespaces into utilities; a hand-rolled layer would drift from Tailwind's own resolution rules. |
| Modal/sheet **dismissal plumbing** | A bespoke overlay system | `motion`'s `AnimatePresence` + the `Overlay` primitive | `AnimatePresence` "makes exit animations easy… gain access to the `exit` animation prop", and requires "Direct children must each have a unique `key` prop" [CITED: motion.dev/docs/react-animate-presence]. Exit animation without it is genuinely hard. |
| Reduced-motion detection | A `matchMedia` listener per component | `useReducedMotion()` from `motion/react` | One hook, one subscription. `[ASSUMED]` on SSR initial value — treat *truthy* as "reduce" and never assume `false` on first render. |
| Font self-hosting + preload + fallback metric adjustment | A CDN `<link>` to Google Fonts | `next/font/google` `Inter({ … })` | Builds with no runtime CDN call (D-19) and handles `adjustFontFallback` to reduce CLS [CITED: nextjs.org/docs/app/api-reference/components/font]. |
| Icon stroke consistency | `strokeWidth={1.5}` on every call site | One shared `Icon` wrapper | D-21's explicit rationale. Lucide exposes `strokeWidth` as a prop on every icon [CITED: lucide.dev/guide/packages/lucide-react §Customizable], which is exactly why it will drift. |
| Scroll-lock-without-layout-shift arithmetic | `padding-right: <measured scrollbarWidth>` compensation at runtime | `scrollbar-gutter: stable` on the scroll container | "With classic scrollbars, the gutter will be present if `overflow` is `auto`, `scroll`, or `hidden` even if the box is not overflowing" [CITED: developer.mozilla.org/en-US/docs/Web/CSS/scrollbar-gutter]. One declaration, no JS measurement, no shift. |
| Making background content non-interactive | A manual "collect all tabbables, wrap them" loop | `inert` attribute | An inert element "cannot receive focus", "gets removed from the tab order and accessibility tree", "cannot have otherwise-editable content edited… such as the contents of textual `<input>` fields" [CITED: MDN `inert`]. The manual version misses `contenteditable`, find-in-page and AT exposure. |
| Unit-test runner | Jest | Vitest 5 | `.planning/research/STACK.md` §"What NOT to Use": Jest has "friction with Next.js 15+/Turbopack build-time ESM". |
| Colour-scale diffing for visual regression | A bespoke pixel-diff script | `toHaveScreenshot()` + pixelmatch | Built-in, configurable, with `maxDiffPixelRatio` / `threshold` settable in `expect` [CITED: playwright.dev]. |

**Key insight:** the one place this phase genuinely hand-rolls is the focus trap — and the reason is
governance, not novelty (D-22: keep primitives token-pure and own FOUND-04 here). The trap itself is
*not* novel: `inert` does most of the work (§ Pattern 5). The hand-rolled surface is deliberately
small — `Overlay` (presentation), `useFocusTrap` (Tab cycling + restore), `useScrollLock` (`inert` +
`scrollbar-gutter`) — one concern per file, so a later audit has somewhere to look.

### Pattern 5: Hand-rolled focus trap + scroll lock (the modal's a11y core)

**Algorithm, in order.** On open:
1. Capture `document.activeElement` **before** anything moves focus. This is the restore target.
2. Mark every sibling of the overlay's portal container `inert`. If the overlay is portalled to
   `document.body`, its siblings are `#<next-root>` and the script/style tags — inerting
   `#<next-root>` removes the entire page behind the dialog from the tab order and the accessibility
   tree in one attribute [CITED: MDN `inert`]. This is the single biggest correctness win over a
   manual "collect tabbables" loop, which always misses something.
3. Move focus to the first focusable inside the dialog (or the dialog container with `tabIndex={-1}`
   if there is none).
4. Apply `overflow: hidden` to the scroll container **and** `scrollbar-gutter: stable` so locking
   does not shift the layout by the scrollbar width.

While open: a single `keydown` listener on the dialog for `Tab` / `Shift+Tab` that queries
`dialog.querySelectorAll<HTMLElement>(FOCUSABLE)` where
`FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'`,
filters to elements with a non-zero `getClientRects().length` (so `display:none` children are
skipped), and wraps `focus()` to `first` / `last`. `Escape` dismisses.

On close: remove the `keydown` listener, un-`inert` the siblings, restore `overflow`/
`scrollbar-gutter`, and **restore focus to the captured element if it is still in the document**
(`trigger.isConnected`) — otherwise focus silently falls to `<body>` and a keyboard user loses their
place. `[ASSUMED]` on the `isConnected` guard specifically; it is defensive, and the failure mode it
prevents (a trigger unmounted while the dialog was open) is real in a route-changing app.

**Labeling:** the dialog element carries `role="dialog"`, `aria-modal="true"` and
`aria-labelledby` pointing at its own heading element. `inert` is what enforces modality; `aria-modal`
is what tells AT. Ship both.

**Portal:** render the overlay through `createPortal(…, document.body)` in a `useEffect`-guarded
client component so the dialog is not a descendant of any transformed/`overflow:hidden` ancestor
(which would clip a centered overlay and break `position: fixed`).

### Pattern 6: The modal/sheet Framer Motion wiring

```tsx
'use client';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { MOTION } from '@/styles/tokens.generated';

export function Overlay({ open, onClose, titleId, children }: Props) {
  const reduce = useReducedMotion();
  // Reduced motion: opacity-only at duration.fast (motion-rules.md §3).
  // Normal: opacity + a short translate over duration.slow, ease.standard in, ease.exit out.
  const variants = reduce
    ? { hidden: { opacity: 0 }, visible: { opacity: 1 } }
    : { hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0 } };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          initial="hidden"
          animate="visible"
          exit="hidden"
          variants={variants}
          transition={{
            duration: reduce ? MOTION.duration.fastSec : MOTION.duration.slowSec,
            ease: reduce ? 'linear' : [0.2, 0, 0, 1],
          }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

`AnimatePresence` detects removal of its **direct** children and fires their `exit` prop
[CITED: motion.dev/docs/react-animate-presence], which is why the single keyed child is required.
The presentation variant (centered overlay ≥1024px vs. bottom sheet below) is a Tailwind
responsiveness decision on the *same* component — `max-lg:` classes — not a second component (D-23).

**Why `tokens.generated.ts` exists alongside the CSS:** there is no `--duration-*` Tailwind
namespace, and Motion's `transition.duration` is a **number in seconds**, not a CSS string — it
cannot consume `var(--duration-fast)`. So the generator writes a small TS module exporting the same
values (`duration: { fastSec: 0.12, slowSec: 0.24 }`, `easing: { standard: [0.2,0,0,1] }`) from the
same JSON walk. This is not a second source of truth: both artifacts are generated from one JSON
file in one script run, and neither is committed (D-06). Both are gitignored.

## Common Pitfalls

### Pitfall 1: `@theme inline` without a `:root` block silently deletes unused tokens
**What goes wrong:** tokens that no utility consumes (`--duration-fast`, `--easing-standard`) never
appear in the compiled stylesheet. GSAP timelines then read `var(--duration-fast)` and get an empty
string; durations collapse to 0 and animations snap.
**Why it happens:** "By default only used CSS variables will be generated in the final CSS output.
If you want to always generate all CSS variables, you can use the `static` theme option"
[CITED: tailwindcss.com/docs/theme §"Generating all CSS variables"] — and `@theme inline` inverts
the utility side of that trade. Verified empirically: `@theme inline { --color-inlined: #445566 }`
produced `.bg-inlined{background-color:#445566}` and **zero** occurrences of `--color-inlined` in
the output.
**How to avoid:** emit the `:root` block unconditionally in the generator (D-08). Never rely on
Tailwind to carry a token that only JS or GSAP reads.
**Warning signs:** a GSAP tween that fires instantly; `getComputedStyle(el).getPropertyValue('--duration-fast')`
returning `""`.

### Pitfall 2: self-referential `@theme inline` declarations
**What goes wrong:** `--color-surface: var(--color-surface)` produces a custom property that depends
on itself. Browsers treat it as guaranteed-invalid; the utility resolves to nothing and the element
falls back to transparent/inherited.
**Why it happens:** D-07 uses one kebab name (`--color-frame-foreground`) for both the theme entry
and the readable property, which invites `var(--color-frame-foreground)` inside its own definition.
**How to avoid:** put the **literal value** in `@theme inline` and the identical literal in `:root`.
The generator writes both from the same parsed string. Verified alternative that also works: two
distinct names (`--palette-surface` in `:root`, `--color-surface: var(--palette-surface)` in
`@theme inline`) — but then the kebab vocabulary differs between the two, which D-07 does not want.
**Warning signs:** a color utility that produces no rule at all in the compiled CSS.

### Pitfall 3: visual baselines captured on one machine fail on another
**What goes wrong:** the committed PNGs pass locally and fail (or vice versa) on a different
machine, OS, or power state, with no code change.
**Why it happens:** Playwright states it plainly: "Browser rendering can vary based on the host OS,
version, settings, hardware, power source (battery vs. power adapter), headless mode, and other
factors. For consistent screenshots, run tests in the same environment where the baseline
screenshots were generated." [CITED: playwright.dev/docs/test-snapshots]. Snapshot filenames even
encode the platform by default (`…-chromium-darwin.png`) precisely because of this.
**How to avoid (given D-17's local-only gating):** (a) pin everything pinable — `deviceScaleFactor: 1`,
`reducedMotion` per project, `animations: 'disabled'` and `caret: 'hide'` on the screenshot call,
a fixed `baseURL`; (b) never set `snapshotPathTemplate` to include `{platform}` while also
committing baselines, because that makes the baseline set look valid on a platform that was never
verified; (c) document in the phase artifact that the baselines are **workstation-local** and must be
regenerated (never copied) when the runner changes.
**Warning signs:** diffs concentrated in text glyph edges and 1px lines; a diff that changes with
battery state.

### Pitfall 4: `npm run lint` that only runs the token checks surprises later phases
**What goes wrong:** Phase 003+ assumes `npm run lint` is a general lint and is confused when it
passes a file with obvious problems, or (worse) someone adds ESLint and the token checks stop running.
**Why it happens:** D-13 wires the checks to `lint` because there is no ESLint yet; Phase 002 is
"the phase creating the tooling" (D-13), so the name is chosen before the tool behind it exists.
**How to avoid:** make `lint` an explicit composition —
`"lint": "node scripts/check-design-tokens.mjs"` today, and add ESLint as a *second* command later
(`"lint": "node scripts/check-design-tokens.mjs && eslint ."`), never a replacement. Put that intent
in a one-line comment in `package.json`.
**Warning signs:** an ESLint config appearing without the token check in the same script.

### Pitfall 5: Turbopack does not run your `predev` hook's absence quietly — but a direct `next build` bypasses it
**What goes wrong:** `node scripts/generate-tokens.mjs && next build` (typed by hand, or run by an
editor task) skips `prebuild`, and the build succeeds with **zero** token utilities because
`tokens.generated.css` does not exist — the `@import` fails or resolves to nothing, and every
`bg-surface` class silently renders unstyled.
**Why it happens:** npm runs `pre<script>` automatically for `npm run <script>` [CITED:
docs.npmjs.com/cli/v11/using-npm/scripts], but nothing enforces that when `next build` is invoked
directly. Turbopack is irrelevant here — the hook is an npm-shell concern that fires *before* Next
starts.
**How to avoid:** (a) make `globals.css` import the generated file **by a path that does not exist
until generated**, so a missing file is a loud build error, not a silent one; (b) have the check
script fail fast with a clear message if the generated file is missing when `NODE_ENV=production`;
 (c) never invoke `next build` bare in any script or docs snippet — always `npm run build`.
**Warning signs:** a production build that is smaller than dev, or `bg-surface` producing no rule.

### Pitfall 6: false positives in `no-raw-hex` from URLs and anchors
**What goes wrong:** `href="#abcdef"` or a documentation comment containing a hex-looking string
fails the build.
**Why it happens:** a naive `/#([0-9a-fA-F]{6})/` matches any `#` + 6 hex-ish characters. Verified:
`// see https://example.com/#abcdef` **matches** `/#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{4}|[0-9a-fA-F]{3})\b/`,
while `href="#section-2"`, `const id = "a#b"` and `href="#route"` correctly do **not**.
**How to avoid:** three cheap, high-precision filters — (1) require the `#` to be preceded by
whitespace, `:`, `=`, `(` or a quote-adjacent CSS delimiter context rather than `/`; (2) skip lines
whose match is inside a URL (preceded by `https://`, `http://` or `url(`); (3) restrict the scan to
the extensions that can actually carry a color — `.css`, `.scss`, `.ts`, `.tsx`, `.js`, `.jsx`,
`.mjs` — which is already D-10's scope. Document any residual heuristic in the script header.
**Warning signs:** violations reported on lines containing only a link or an anchor id.

### Pitfall 7: `text-*` namespace collision between color and font-size
**What goes wrong:** `text-primary` (a plausible-looking shortcut) either does not exist or resolves
to a font-size, and the developer "fixes" it by adding a hex literal.
**Why it happens:** `--color-text-primary` yields `text-text-primary`; `--text-label` yields
`text-label`. The `text-` prefix carries two meanings.
**How to avoid:** never shorten. Use exactly the names the generator produces, and let the
token-utility list in the check script be the single vocabulary source. Verified working names:
`text-text-primary`, `text-label`, `text-body`, `text-heading`, `text-display`.
**Warning signs:** a `text-` utility that produces no color rule.

### Pitfall 8: three *root* layouts cause a full page reload on every role switch
**What goes wrong:** navigating `/provider` → `/patient` reloads the whole document — visible
flash, lost client state, and a much slower perceived navigation.
**Why it happens:** "if you navigate between routes that use different root layouts, it'll trigger a
full page reload" [CITED: nextjs.org route-groups §Caveats]. Three route groups each with a
`layout.tsx` *at the top level of `app/`* means three root layouts.
**How to avoid:** keep `src/app/layout.tsx` as the single root layout; nest the three role layouts
inside it. See Pattern 3.
**Warning signs:** a white flash on role switch; `document` navigation events in devtools.

### Pitfall 9: Playwright `snapshotPathTemplate` and the `2xl` / `3xl` tokens
**What goes wrong:** `space.2xl` kebab-cases to `2xl`, producing `p-2xl` — fine — but a
naive `{arg}`-driven snapshot path containing a slash, or a viewport token with `x` in it, collides
with Playwright's own path handling.
**Why it happens:** `toHaveScreenshot` "also accepts an array of path segments… this path must stay
within the snapshots directory for each test file" [CITED: playwright.dev/docs/test-snapshots], and
`snapshotPathTemplate` resolves relative paths against `configDir` [CITED: playwright.dev
class-testconfig §snapshotPathTemplate].
**How to avoid:** construct the path yourself and pass it as an array —
`await expect(page).toHaveScreenshot([surface, viewport, `${projectName}.png`])` — and point
`snapshotPathTemplate` at `{testDir}/baselines/{arg}{ext}`. The mandated contract path
`{surface}/{viewport}/{state}.png` is then produced by the **test**, not by a template that has to
guess the state from the project name.
**Warning signs:** a `test-results/` folder full of `*-actual.png` instead of `test-results/` diffs
against a committed baseline.

## Code Examples

Verified patterns from official sources.

### Build-time codegen script shape (D-05)

```js
// scripts/generate-tokens.mjs — zero dependency, run by predev and prebuild.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rel = (p) => path.join(ROOT, p);
const tokens = JSON.parse(readFileSync(rel('docs/governance/tokens.json'), 'utf8'));

// tokens.json → { namespace, name, value }[]
export const TOKENS = [
  ...Object.entries(tokens.color).map(([k, v]) => ({ ns: 'color', k, v })),
  ...Object.entries(tokens.radius).map(([k, v]) => ({ ns: 'radius', k, v })),
  ...Object.entries(tokens.space).map(([k, v]) => ({ ns: 'spacing', k, v })),
  ...Object.entries(tokens.font.size).map(([k, v]) => ({ ns: 'text', k, v })),
  ...Object.entries(tokens.font.weight).map(([k, v]) => ({ ns: 'font-weight', k, v })),
  ...Object.entries(tokens.font.lineHeight).map(([k, v]) => ({ ns: 'leading', k, v })),
  ...Object.entries(tokens.shadow).map(([k, v]) => ({ ns: 'shadow', k, v })),
  ...Object.entries(tokens.motion.easing).map(([k, v]) => ({ ns: 'ease', k, v })),
];

// motion.duration has NO Tailwind namespace — :root + TS only.
export const DURATIONS = Object.entries(tokens.motion.duration);

const kebab = (s) => s.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
const cssName = ({ ns, k }) => `--${ns}-${kebab(k)}`;

const themeBody = TOKENS.map((t) => `  ${cssName(t)}: ${t.v};`).join('\n');
const rootBody = [...TOKENS, ...DURATIONS.map(([k, v]) => ({ ns: 'duration', k, v }))]
  .map((t) => `  ${cssName(t)}: ${t.v};`).join('\n');

const css =
  `/* GENERATED from docs/governance/tokens.json v${tokens.version} — do not edit. */\n` +
  `@theme inline {\n${themeBody}\n}\n\n:root {\n${rootBody}\n}\n`;

mkdirSync(rel('src/styles'), { recursive: true });
writeFileSync(rel('src/styles/tokens.generated.css'), css, 'utf8');
```

Two properties of this shape matter: it emits `:root` **unconditionally** (Pitfall 1), and the
`TOKENS` array is exported so `scripts/check-design-tokens.mjs` imports it rather than re-deriving the
vocabulary (Q9).

### Reading the generated token list in the check script (D-11, never stale)

```js
// scripts/check-design-tokens.mjs
import { TOKENS, DURATIONS } from './generate-tokens.mjs';   // one source, no duplication

// The color namespace is what produces utility *names*; radius/space/shadow/etc. produce
// differently-prefixed utilities, so derive a class for every token in a shape a file could use.
const UTILITIES = [
  ...TOKENS.map(({ ns, k }) => {
    const n = kebab(k);
    return {
      color:     [`bg-${n}`, `text-${n}`, `border-${n}`, `ring-${n}`, `fill-${n}`, `stroke-${n}`],
      radius:    [`rounded-${n}`],
      spacing:   [`p-${n}`, `px-${n}`, `py-${n}`, `m-${n}`, `mx-${n}`, `gap-${n}`, `space-x-${n}`, `space-y-${n}`],
      text:      [`text-${n}`],
      'font-weight': [`font-${n}`],
      leading:   [`leading-${n}`],
      shadow:    [`shadow-${n}`],
      ease:      [`ease-${n}`],
    }[ns] ?? [];
  }),
].flat();

const TOKEN_REFERENCE_RE = new RegExp(`\\b(?:${[...new Set(UTILITIES)].join('|')})\\b`);
```

Because `TOKENS` is derived from `tokens.json` at require-time, adding a token to the JSON
automatically adds its utility to the presence check. The check can never go stale — which is D-11's
intent and the reason the vocabulary is derived rather than hard-coded.

### The three checks (D-09, D-10, D-12)

```js
// no-raw-hex — INV-01. 6 hex digits after '#', 3/4/8 accepted too.
const HEX_RE = /#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{4}|[0-9a-fA-F]{3})\b/g;
// no-generic-healthcare-blue — INV-03. Anchored to a Tailwind utility stem so prose never matches.
const GENERIC_RE =
  /\b(?:bg|text|border|ring|fill|stroke|from|via|to|shadow|outline|decoration|accent|caret|divide|placeholder)-(?:blue|indigo|violet|purple|slate|zinc|neutral|stone|gray)-\d/;
// token-reference-required — INV-01/INV-13/INV-14. Built from tokens.json (above).

// D-12 output contract — one line per violation.
console.error(`${file}:${line}  ${literal}  ${check}  (${inv})`);
process.exit(1);
```

Verified against realistic lines: `bg-blue-500` matches `GENERIC_RE`; `href="#route"`,
`href="#section-2"`, `const id = "a#b"` and `className="bg-surface text-text-primary"` match
neither regex. `// see https://example.com/#abcdef` matches `HEX_RE` — see Pitfall 6 for the three
filters that suppress it. `slate-900` inside prose (`// slate-900 note`) does **not** match,
because the regex requires a Tailwind utility stem before the color name; INV-01's grep vocabulary
is satisfied because the violation mode it exists to catch is a utility, not a word.

Note the scan-scope exclusions (D-10): the generated `src/styles/tokens.generated.{css,ts}` must be
excluded (it contains the hex values by definition), and `docs/governance/**` is outside the `src/`
scope anyway. `no-generic-healthcare-blue` additionally covers the root configs
(`postcss.config.mjs`, `tailwind` config if any, `next.config.ts`) per constitution §8.

### `next/font/google` Inter (D-19, D-20)

```tsx
// src/app/layout.tsx
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '600'],       // only the two frozen weights (font.weight)
  display: 'swap',              // documented default
  variable: '--font-inter',     // consumed as font-family: var(--font-inter)
  fallback: ['system-ui', 'sans-serif'],
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body>{children}</body>
    </html>
  );
}
```

`subsets` is an array of strings; fonts listed there get a preload tag when `preload` is true (the
default), and omitting `subsets` while `preload` is true produces a warning [CITED: nextjs.org
`font` API §`subsets`]. `weight` accepts an array [CITED: same page, weight examples].

**Tabular numerals:** Inter ships `tnum` as an OpenType feature; apply it in CSS, not via `next/font` —
`font-feature-settings: 'tnum' 1;` or Tailwind's `tabular-nums` utility — on clinical and statistical
values only (visual-qa-rules.md row 7, reference-ui-specification §2.3). Do **not** put it on
`body`: it changes the advance width of every glyph on every page, which will shift the whole shell's
layout and therefore every baseline. `[ASSUMED]` that `next/font/google` has no dedicated
`featureSettings` option — the documented options are `style`, `subsets`, `axes`, `display`,
`preload`, `fallback`, `adjustFontFallback`, `variable`, `declarations` [CITED: nextjs.org font API
options table]; `declarations` could inject extra `@font-face` descriptors but is for local fonts.

### Lucide at 1.5px stroke, set once (D-21)

```tsx
// src/components/primitives/Icon.tsx
import type { LucideIcon, LucideProps } from 'lucide-react';

// `strokeWidth` is omitted from the public props so no call site can pass it (D-21).
type Props = Omit<LucideProps, 'strokeWidth'>;

export function makeIcon(Icon: LucideIcon) {
  return function TokenIcon({ size = 16, 'aria-label': ariaLabel, ...rest }: Props) {
    // Decorative by default: hidden from AT unless a label is supplied.
    return (
      <Icon
        {...rest}
        size={size}
        strokeWidth={1.5}
        aria-hidden={ariaLabel ? undefined : true}
        aria-label={ariaLabel}
      />
    );
  };
}
```

Three deliberate choices: `strokeWidth` is **omitted from `Props`** so no call site can pass it
(a compile error, not a code-review comment); it is placed **after** the `{...rest}` spread in the
JSX so it wins even if someone re-adds it to the type later; and `aria-hidden` is the default with an
explicit `aria-label` opt-out, because a decorative line icon in a nav rail should never be announced
twice. Lucide icons are tree-shakable and "Adjust size, color, stroke width, and other properties via
props" [CITED: lucide.dev/guide/packages/lucide-react §Customizable] — which is precisely why the
value will drift if each call site owns it. `[ASSUMED]` on the `@ts-expect-error` note from the first
draft: whether `LucideIcon` composes into a typed wrapper without a suppression is A4; the runtime
contract above is what enforces D-21 either way.

### Playwright config — two projects, four viewports, mandated baseline path (D-14, D-15)

```ts
// playwright.config.ts
import { defineConfig } from '@playwright/test';

const VIEWPORTS = [
  { name: '1440x900', width: 1440, height: 900 },
  { name: '1280x800', width: 1280, height: 800 },
  { name: '768x1024', width: 768, height: 1024 },
  { name: '390x844',  width: 390,  height: 844 },
] as const;

export default defineConfig({
  testDir: './tests/visual',
  snapshotPathTemplate: '{testDir}/baselines/{arg}{ext}',
  expect: {
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.01,   // visual-qa-rules.md §2
      threshold: 0.2,            // per-pixel YIQ tolerance, Playwright default
      animations: 'disabled',    // visual-qa-rules.md §2 "CSS animations disabled during capture"
      caret: 'hide',
      scale: 'css',
    },
  },
  use: {
    baseURL: 'http://127.0.0.1:3100',
    deviceScaleFactor: 1,        // pin it — see Pitfall 3
    colorScheme: 'light',        // tokens.json is "mode": "light" only; no dark mode in scope
    timezoneId: 'UTC',
    locale: 'en-US',
  },
  projects: [
    { name: 'default',        use: { browserName: 'chromium', reducedMotion: null } },
    { name: 'reduced-motion', use: { browserName: 'chromium', reducedMotion: 'reduce' } },
  ],
  webServer: {
    command: 'npm run build && npm run start -- --port 3100',
    url: 'http://127.0.0.1:3100/login',
    reuseExistingServer: false,  // local-only gating (D-17): always a fresh production build
    timeout: 180_000,
    env: { ALLOW_DEV_ROUTES: '1' },  // see Pattern 4 — gallery must render for baselines
  },
});
```

```ts
// tests/visual/surfaces.spec.ts
import { test, expect } from '@playwright/test';

const VIEWPORTS = ['1440x900', '1280x800', '768x1024', '390x844'];
const SURFACES = [
  { surface: 'dev-gallery',        path: '/dev/gallery' },
  { surface: 'login',              path: '/login' },
  { surface: 'provider-home',      path: '/provider' },
  { surface: 'patient-workspace',  path: '/provider/patients/placeholder' },
  { surface: 'patient-home',       path: '/patient/home' },
];

for (const { surface, path } of SURFACES) {
  for (const viewport of VIEWPORTS) {
    test(`${surface} @ ${viewport}`, async ({ page }, testInfo) => {
      await page.setViewportSize({
        width: Number(viewport.split('x')[0]),
        height: Number(viewport.split('x')[1]),
      });
      await page.goto(path);
      await page.waitForLoadState('networkidle');
      const state = testInfo.project.name === 'reduced-motion' ? 'reduced-motion' : 'default';
      // Path is built by the test → exactly tests/visual/baselines/{surface}/{viewport}/{state}.png
      await expect(page).toHaveScreenshot([surface, viewport, `${state}.png`]);
    });
  }
}
```

Config-surface facts used above, all verified: `maxDiffPixelRatio` is "an acceptable ratio of pixels
that are different to the total amount of pixels, between `0` and `1`"; `threshold` is "an acceptable
perceived color difference in the YIQ color space… default `0.2`"; `animations` defaults to
`"disabled"` and "stops CSS animations, CSS transitions and Web Animations"
[CITED: playwright.dev class-pageassertions `toHaveScreenshot` options]. `reducedMotion` "Emulates
`'prefers-reduced-motion'` media feature, supported values are `'reduce'`, `'no-preference'`.
Passing `null` resets emulation to system defaults. Defaults to `'no-preference'`" and was "Added in:
v1.50" [CITED: playwright.dev class-testoptions §reducedMotion] — which is why `@playwright/test`
1.63 is fine and an older pin would not work. `snapshotPathTemplate` supports `{arg}`, `{ext}`,
`{projectName}`, `{testDir}`, `{testFilePath}`, `{platform}` and more, and "Since
`snapshotPathTemplate` resolves to relative path, it will be resolved relative to `configDir`"
[CITED: playwright.dev class-testconfig §snapshotPathTemplate]. `webServer.command` "Shell command to
start the local dev server of your app" and `webServer.env` "Environment variables for the command"
[CITED: playwright.dev docs/test-webserver].

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `tailwind.config.js` with `theme.extend.colors` | CSS-first `@theme` / `@theme inline` in the stylesheet | Tailwind v4.0, 2025-01-22 | The whole token layer moves out of JS. Every plan that assumes a JS config is wrong. |
| `@tailwind base/components/utilities` directives | `@import "tailwindcss"` | Tailwind v4.0 | One import line; PostCSS plugin is `@tailwindcss/postcss`, not `tailwindcss` (using the latter throws: "It looks like you're trying to use `tailwindcss` directly as a PostCSS plugin" — reproduced this session). |
| Theme variable referenced through `var()` in utilities | `@theme inline` inlines the value | Tailwind v4.0 | Utilities stop resolving through the variable; you must still emit `:root` for anything JS/GSAP reads. |
| `framer-motion` package | `motion` package, imports from `motion/react` | Framer Motion rebrand (v11+ / `motion` 12+ line) | The registry package for this stack is `motion@14.0.0`. |
| `--duration-*` mapped into a Tailwind namespace | no namespace exists; read the value in JS | Tailwind v4 (namespaces list has no duration entry) | Motion `transition.duration` is a number in seconds — the generator must emit a TS constant. |
| npm lifecycle `prepublish` for codegen | `pre<script>` hooks (`predev`, `prebuild`) plus `prepare` | npm 4.0.0 (`prepare` introduced); `prepublish` deprecated | `predev`/`prebuild` are the current, supported mechanism. |
| Committing a hand-maintained `tokens.css` | Generate from JSON at build time, gitignore the output | This project's D-05/D-06 | Drift becomes structurally impossible; the cost is a fresh clone having no CSS until a script runs. |
| Jest as the Next.js test runner | Vitest | Ongoing | ESM/Turbopack friction, per STACK.md. |
| Cypress for visual regression | Playwright `toHaveScreenshot` | Playwright ≥1.x | `toHaveScreenshot` is native; Cypress lacks it. |

**Deprecated/outdated:**
- `tailwindcss` as a direct PostCSS plugin in v4 — throws at build time; use `@tailwindcss/postcss`.
- `tailwind.config.js` in v4 — not read at all.
- `next lint` / the `next lint` command for a custom rule — D-09 forbids ESLint rules entirely; the
  checks are a standalone Node script.
- `@tailwindcss/vite` with Next.js — Vite-only; the STACK.md version table says so explicitly.
- `jest` + `next/jest` for this project — see above.

## Assumptions Log

> Claims tagged `[ASSUMED]` in this research. The planner and discuss-phase should confirm these
> before they become locked decisions.

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `useReducedMotion()` returns a falsy/`null`-ish value on the first (server) render, so components must test it truthily rather than assuming `false`. | Don't Hand-Roll, Pattern 6 | A component written as `reduce ? A : B` is correct either way; one written as `reduce === false ? …` would flash the full motion on hydration. Low impact, easy to write defensively. |
| A2 | Motion's `transition.duration` cannot consume a CSS `var()` — it must be a number. | Pattern 6 | If it *could* consume `var(--duration-fast)`, the generated TS module would be unnecessary. The module is harmless if so, so the risk is a small amount of unnecessary generated code — **but** the assertion that the TS module is *required* would be wrong in the plan's reasoning. |
| A3 | The `isConnected` guard before restoring focus is needed because a trigger can unmount while a dialog is open. | Pattern 5 | Without it, focus restoration throws / silently lands on `<body>`. If dialogs in this product never outlive their trigger, the guard is dead code — harmless, and cheap insurance for 20 later phases. |
| A4 | `lucide-react`'s `LucideIcon` component type is not directly usable to build a typed wrapper without a `@ts-expect-error`. | Code Examples (Icon) | If the type composes cleanly, drop the directive. Purely cosmetic — the runtime contract (`strokeWidth` after the spread, `Omit<…, 'strokeWidth'>`) is what enforces D-21. |
| A5 | TypeScript 7.x is not yet verified as supported by Next 16's plugin/type-generation, so `~5.9` should be pinned. | Standard Stack | If TS 7 works cleanly with Next 16, pinning 5.9 is a mild conservatism, not a defect. STACK.md already instructed this pin. |
| A6 | `next/font/google` has no `featureSettings` option, so tabular numerals must be applied in CSS. | Code Examples (Inter) | If an option exists, it would still be better to apply `tabular-nums` per-value rather than globally, so the CSS route is correct regardless. |
| A7 | The 8 workspace tab route segment names come from `PRODUCT-MASTER-SPEC.md` §6 and are not yet enumerated in this research (that document was not read in full this session). | Phase Requirements, Project Structure | The planner must read §6 before naming the 8 nested routes. Getting a tab name wrong here is cheap to fix but is exactly the kind of path invention D-01 exists to prevent. |

## Open Questions

1. **The dev-only gallery cannot both be `NODE_ENV`-gated and captured against a production build.**
   - **What we know:** D-16 says the gallery is "gated by `NODE_ENV`" and "excluded from the
     production build"; D-14 requires baselines for it; `visual-qa-rules.md` §2 requires capture
     "against a production build". `next start` runs with `NODE_ENV=production`
     [ASSUMED — standard Next.js behavior, not re-verified this session].
   - **What's unclear:** a literal `NODE_ENV` gate makes the gallery 404 under `next start`, so the
     gallery baselines cannot be captured at all.
   - **Recommendation:** gate on a dedicated flag
     (`NODE_ENV === 'production' && !process.env.ALLOW_DEV_ROUTES`) set **only** in
     `playwright.config.ts` → `webServer.env`. The route is still absent from any real production
     deployment and still out of the product route map; only the harness can reach it. Needs owner
     confirmation because it is a deliberate narrowing of D-16's wording.

2. **Does `/` need to exist, and if so where does it redirect?**
   - **What we know:** the route-groups caveat requires `/` to be defined inside a group only when
     using multiple root layouts *without* a top-level layout. Pattern 3 recommends a single root
     layout, in which case `/` is simply undefined and the root `not-found.tsx` renders
     [CITED: nextjs.org route-groups §Caveats].
   - **What's unclear:** D-01's URL map does not include `/`. Whether an unlisted `/` → `/login`
     redirect counts as adding to the locked route map.
   - **Recommendation:** do **not** add a `/` route. Let `/` hit the root `not-found.tsx`. If the
     owner wants a root redirect, it must be an explicit decision recorded against D-01.

3. **Should the token layer include the responsive band edges as `--breakpoint-*`?**
   - **What we know:** `responsive-rules.md` fixes band edges at 1024px and 768px; `tokens.json`
     contains **no** breakpoint values — only color/radius/space/font/shadow/motion. The
     generator's mandate is to read only the normative blocks.
   - **What's unclear:** writing `--breakpoint-*` would require hardcoding 1024/768 in the
     generator, which is a value outside `tokens.json` and therefore arguably a raw value outside
     the token layer.
   - **Recommendation:** do **not** emit `--breakpoint-*`. Tailwind's defaults `lg = 64rem`
     (1024px) [CITED: tailwindcss.com/docs/theme default theme reference: `--breakpoint-lg: 64rem`]
     already match the 1024px edge exactly, and the 768px tablet edge is expressed with a `max-lg:`
     variant rather than a new breakpoint. Verify 64rem = 1024px at implementation time (root
     font-size 16px) and record the confirmation. `1023px` from `responsive-rules.md` is a *max*
     edge and is expressed as `max-lg:` — no new variable needed.

4. **What exact `max-lg:` / `min-[1024px]:` syntax carries the D-23 overlay split?**
   - **What we know:** Tailwind's default `lg` breakpoint is 64rem = 1024px, so `max-lg:` covers
     "below 1024px → bottom sheet, at or above → centered overlay" [VERIFIED: default theme
     reference, tailwindcss.com/docs/theme].
   - **What's unclear:** nothing material — this is answerable at implementation. Recorded so the
     planner does not introduce a custom `@custom-variant` for it.
   - **Recommendation:** use stock `max-lg:`. Do not add a `@custom-variant`.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| `node` | codegen, checks, Next build, Vitest, Playwright | ✓ | v22.22.3 | — |
| `npm` | install + `pre*` lifecycle hooks | ✓ | 12.0.2 | — |
| `git` | baseline commits, `.gitignore` | ✓ | 2.54.0.windows.1 | — |
| npm registry reachability | install + `npm view` | ✓ | verified this session | — |
| Chromium for Playwright | visual baselines | ✗ not yet installed | — | `npx playwright install chromium` (required step; `@playwright/test` does **not** fetch browsers via postinstall — verified empty postinstall) |
| Git hooks (`core.hooksPath`) | — | n/a | — | D-13 forbids a pre-commit hook; nothing needed |
| `sd` (semgrep/sed-alike) | — | ✗ | — | **Never rely on it** (recorded in STATE.md). All scanning is in the Node script. |

**Missing dependencies with no fallback:** none — Chromium is a one-command install.

**Missing dependencies with fallback:** none.

**Platform notes that matter here:** Windows workstation. (a) Playwright's `webServer.gracefulShutdown`
  "doesn't support `SIGTERM` and `SIGINT` signals, so this option is ignored on Windows"
  [CITED: playwright.dev docs/test-webserver] — rely on the default forceful kill. (b) `snapshotPathTemplate`
  accepts forward slashes on any platform [CITED: playwright.dev class-testconfig §snapshotPathTemplate],
  so use `/` in the mandated `{surface}/{viewport}/{state}.png` contract. (c) Baseline PNGs are
  workstation-local (Pitfall 3).

## Validation Architecture

> `.planning/config.json` → `workflow.nyquist_validation: true`. This section is required.

### Test Framework

| Property | Value |
|----------|-------|
| Framework | **Vitest 5.0.3** (unit/integration) + **Playwright 1.63.0** (visual). Two configs, never merged — `STACK.md` §Version Compatibility: "Keep unit (Vitest, node/jsdom env) and E2E (Playwright) as separate configs". |
| Config file | `vitest.config.ts` (❌ does not exist — Wave 0) and `playwright.config.ts` (❌ does not exist — Wave 0) |
| Quick run command | `npm run lint && npx vitest run tests/unit` |
| Full suite command | `npm run lint && npx vitest run && npm run test:visual` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| FOUND-01 | Every URL in D-01 renders 200 with its correct layout frame and an `EmptyState` body | e2e (smoke, route existence + status) | `npx playwright test --project=default --grep "route" ` — or a Vitest-side static check that each `page.tsx` path exists | ❌ Wave 0 — `tests/visual/surfaces.spec.ts` covers the URLs incidentally; a dedicated route-status assertion is cheap to add to the same spec |
| FOUND-01 | The dev gallery is absent from a production build | integration (build artifact) | `npx playwright test --grep "gallery-hidden"` against `next start` | ❌ Wave 0 — add one test asserting `/dev/gallery` returns 404 under `webServer` |
| FOUND-01 | No sample clinical data in `src/` | **reviewer-evaluated** (grep-assisted) | `node scripts/check-design-tokens.mjs` covers color only; the clinical-content check is `AGENTS.md`-level, not machine-specified in constitution §8 | Manual — record in the phase artifact |
| FOUND-02 | Every screen is buildable from the shared primitive set, not per-screen components | **reviewer-evaluated** + partial unit | `npx vitest run tests/unit/primitives` proves each primitive renders and carries a token utility; it cannot prove a later screen *used* one | ❌ Wave 0 — `tests/unit/primitives/*.test.tsx` |
| FOUND-02 | The token-utility vocabulary is total and derived from `tokens.json` | unit | `npx vitest run tests/unit/scripts/generate-tokens` | ❌ Wave 0 |
| FOUND-03 | One typography hierarchy: only the four sizes, two weights, and named spacing/radius utilities appear | unit (regex over `src/`) | `npx vitest run tests/unit/scripts/token-vocabulary` — extend `check-design-tokens.mjs`'s exported matchers, or assert in its own test | ❌ Wave 0 |
| FOUND-03 | Surfaces separate by shadow, not border (INV-16); only two elevations exist (INV-13/14) | **reviewer-evaluated** + visual | `npx vitest run` covers "only two shadow tokens exist in the generated CSS" (machine-checkable); "no card has a border" is reviewer + the 12-row gate | Partially ❌ Wave 0 |
| FOUND-03 | Every surface matches its reference grammar | visual (Playwright baselines) | `npm run test:visual` | ❌ Wave 0 — `tests/visual/**` |
| FOUND-04 | Focus order, labels, `aria-modal` labelling, Escape-to-dismiss, focus restore, scroll lock | unit (jsdom) + **reviewer-evaluated** for contrast | `npx vitest run tests/unit/overlays` — Tab-cycling, Escape, and focus-restore are assertable in jsdom; **contrast against the frozen tokens is not** (jsdom computes no layout/colors) | ❌ Wave 0 — `tests/unit/overlays/focus-trap.test.tsx` |
| FOUND-04 | Contrast of text against its token background | **reviewer-evaluated only** | none | Manual — `visual-qa-rules.md` row 2 at the design gate; record per-row results |
| FOUND-04 | Focus-visible ring styling and DOM focus order | **reviewer-evaluated** | partial: a unit test can assert `tabIndex` order in the DOM; it cannot assert the *visual* ring | Manual + partial unit |
| FOUND-05 | Every shell animation has a reduced-motion branch | unit + visual | (a) unit: a source scan asserting every `transition={{...}}` site is inside a component that calls `useReducedMotion`; (b) visual: the `reduced-motion` project baseline | ❌ Wave 0 — both |
| FOUND-05 | Reduced motion is opacity-only at ≤ `duration.fast` | unit (assert the variants object) | `npx vitest run tests/unit/motion` | ❌ Wave 0 |
| UX-06 | Touch targets ≥44px, compact nav, reduced density, safe interactions at `390x844` and `768x1024` | visual (baselines) + **reviewer-evaluated** | `npm run test:visual` proves the layout *changed*; it does not measure a 44px hit area | ❌ Wave 0 — baselines at both mobile viewports are the machine evidence; the 44px rule is a reviewer check against `responsive-rules.md` |

### Honest automatability assessment

Of the six requirements, only part of each is machine-checkable, and the split is dictated by
`ui-invariants.md`, which is explicit that "The machine-enforceable subset (`INV-01`, `INV-03`,
`INV-13`, `INV-14`) is implemented in Phase 002 by the three checks… The remaining invariants are
**reviewer-evaluated**" [CITED: docs/governance/ui-invariants.md].

- **Fully automatable:** FOUND-01's route map and the gallery's production absence; FOUND-02's
  primitive render + token reference; FOUND-03's token-vocabulary purity and shadow-count; FOUND-04's
  focus-trap/Escape/restore mechanics; FOUND-05's reduced-motion branch and duration bounds; UX-06's
  layout adaptation at the two mobile viewports.
- **Not automatable, and should not be pretended otherwise:** **contrast against the frozen tokens**
  (part of FOUND-04) — no layout engine in jsdom, and a screenshot diff detects *change*, not
  *ratio*; **focus-visible ring appearance and DOM focus order** (rest of FOUND-04) — a unit test can
  assert `tabIndex` sequence but not the rendered ring; **"44px touch target"** (UX-06); **"no fake
  clinical data"** (FOUND-01) — a judgment about content, not a pattern; **"built from the primitive
  set rather than hand-rolled"** (FOUND-02) — a structural claim about 20 future phases.

Each of these has a *machine-adjacent* assist the planner should still build, because it shrinks the
reviewer's job: for contrast, the check script can *enumerate* every `text-*`/`bg-*` pairing a
primitive uses so the reviewer computes ratios for a known finite list; for touch targets, the
primitives can expose their min-height as a token-pure class the reviewer greps; for fake data, the
check script can assert `src/lib/dev/**` is the only directory allowed to contain a `Patient`-shaped
literal.

### Sampling Rate
- **Per task commit:** `npm run lint && npx vitest run tests/unit`
- **Per wave merge:** `npm run lint && npx vitest run`
- **Phase gate:** full suite green (`npm run lint && npx vitest run && npm run test:visual`) before
  `/gsd:verify-work`, **plus** the 12-row `visual-qa-rules.md` §1 checklist and the applicable INV
  evaluations recorded in the phase artifact. A green suite is not the gate — `PRODUCT-MASTER-SPEC.md`
  §27 makes "declaring a feature complete solely because the build passes" a hard prohibition.

### Wave 0 Gaps
- [ ] `vitest.config.ts` — two environments: `node` for `tests/unit/scripts/**` and `jsdom` for
  `tests/unit/{primitives,overlays,motion}/**`; `@vitejs/plugin-react`; `resolve.alias` for `@/*`.
- [ ] `playwright.config.ts` — two projects, four viewports, `snapshotPathTemplate`, `expect.toHaveScreenshot`
  tolerance, `webServer` running a production build.
- [ ] `tests/unit/scripts/generate-tokens.test.mjs` — the emitted `@theme inline` and `:root` blocks
  contain every token, kebab-cased, with no `var()` self-reference; `:root` is emitted even for a
  token no utility uses.
- [ ] `tests/unit/scripts/check-design-tokens.test.mjs` — a fixture file per check that must fail,
  plus the false-positive fixtures from Pitfall 6 (`href="#abcdef"` in a URL must **not** fail).
- [ ] `tests/unit/scripts/token-vocabulary.test.mjs` — the derived utility list matches
  `tokens.json`; adding a token to a fixture JSON changes the list.
- [ ] `tests/unit/primitives/*.test.tsx` — `Surface` renders all four variants and only the two
  shadow tokens; `EmptyState` renders with and without action; `Icon` renders with `stroke-width`
  `1.5`.
- [ ] `tests/unit/overlays/focus-trap.test.tsx` — Tab wraps, Shift+Tab wraps, Escape calls `onClose`,
  focus restores to the trigger, background is `inert` while open and not after close.
- [ ] `tests/unit/motion/reduced-motion.test.tsx` — with `useReducedMotion` mocked true, the variants
  object is opacity-only and its duration is `duration.fast`.
- [ ] `tests/visual/surfaces.spec.ts` — the 5 surfaces × 4 viewports × 2 projects loop.
- [ ] Framework install: `npm i -D vitest @vitejs/plugin-react jsdom @playwright/test && npx playwright install chromium`

## Security Domain

> `.planning/config.json` → `security_enforcement: true`, `security_asvs_level: 1`,
> `security_block_on: "high"`. This section is required.

### Applicable ASVS Categories

This phase delivers a **static UI shell with no authentication, no session, no database, no network
calls, and no user-supplied data**. Most of ASVS does not yet apply. Padding this section with
categories that belong to Phase 003 would create false assurance, so each row states *why* it is out.

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | **No** | Phase 003. D-03 forbids even a placeholder `middleware.ts`. The obligation this phase carries is a **comment** marking exactly where server-side role resolution slots in. |
| V3 Session Management | **No** | Phase 003. No cookies, tokens or session state are created or read. |
| V4 Access Control | **No — but with one hard rule** | Phase 003 (`AGENTS.md`: "authorization determined server-side and enforced by database/API layer… never trust role info from localStorage, browser state, or URL parameters"). This phase's rule is negative and absolute: **do not create a client-side gate of any kind**, and do not read a role from anywhere client-held. A fake gate that looks real is worse than none (D-03). |
| V5 Input Validation | **No** | No user input is accepted. `/provider/patients/[patientId]` takes a route param that is *rendered into an empty state*, never used in a query, a filesystem path, or a shell. The one discipline worth stating: the param must not be passed to anything that interprets it. |
| V6 Cryptography | **No** | Nothing is encrypted, signed or hashed. Note the *negative* rule that matters here: **no secrets in the repo** — no API keys, no service-role key, no `.env` with a real value. `next/font` is a build-time fetch, not a runtime credential. |
| V8 Data Protection | **Partially — yes** | The one ASVS concern that genuinely bites a UI shell in a PHI product: **third-party egress**. D-19 self-hosts Inter specifically so no runtime request leaves the browser. The audit obligation for this phase is that the built client bundle makes **zero** third-party network requests. Verifiable with Playwright: assert no request URL is off-origin. |
| V10 Malicious Code | **Yes — supply chain** | The 13 packages audited above, all on the npm registry with canonical GitHub repos and **no postinstall scripts** [VERIFIED: npm registry]. Pin exact versions; commit the lockfile; do not add a package whose legitimacy was not checked. |
| V12 Files and Resources | **Yes — minimal** | Static assets only: self-hosted font files emitted by `next/font`, Lucide SVG inlined as React components. No uploads, no user-supplied paths, no `public/` content that could be executed. |
| V14 Configuration | **Yes** | `NODE_ENV` handling for the dev gallery (D-16) is a *security-relevant* configuration switch: the flag that opens the gallery in the visual harness (`ALLOW_DEV_ROUTES`) must be set only in `playwright.config.ts` and must never appear in `.env`, `.env.production`, or a deployment config. A dev-only route that leaks to production is a real finding, not a nitpick. |

### Known Threat Patterns for Next.js 16 + Tailwind v4 + this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| **Client-side-only authorization** — a route that "checks" the role in a client component, a `useEffect` redirect, or a `localStorage` read | Elevation of privilege | Do not implement it at all in this phase (D-03, `AGENTS.md` §Security). The shell renders openly and says so in a comment. Phase 003 adds server-side resolution. |
| **Dev-only route leaking to production** — a `NODE_ENV` check that is wrong, tree-shaken, or bypassed by an env var that ships in `.env` | Information disclosure | Single explicit gate in the gallery page (Pattern 4), the harness-only env var set in `playwright.config.ts` `webServer.env`, plus a Playwright test asserting `/dev/gallery` 404s under the production server. |
| **PHI in the client bundle or a committed fixture** — importing `tokens.json`-style data, or a dev fixture with realistic clinical values, leaking into the shipped bundle or the repo | Information disclosure | D-18's fixtures are typed stubs with no clinical values and live behind the dev gate. **Add a build-output check**: `next build` output must contain no fixture module. Cheap, and it is the only way to catch an accidental client-side import of a dev stub. |
| **Third-party resource at runtime** — a font or icon pulled from a CDN, leaking page visits to a third party for a PHI product | Information disclosure | `next/font` self-hosting (D-19), Lucide as inlined components (not an icon CDN), and an assertion that the Playwright run records zero off-origin requests. |
| **Malicious/typosquatted npm package** | Tampering / Elevation of privilege | The Package Legitimacy Audit above; exact version pins; commit `package-lock.json`. |
| **`dangerouslySetInnerHTML` in a shell primitive** | Tampering | None needed — do not introduce it. `PRODUCT-MASTER-SPEC.md` §27's prohibition on showing unverified content applies from Phase 011 onward. |
| **XSS via `href` in nav links** | Tampering | React escapes by default. The rule for later phases: clinical/AI-extracted content is never passed to `dangerouslySetInnerHTML`, and URLs are validated server-side before rendering. |
| **Timing/replay of visual-baseline approval** | Repudiation | Baselines are committed and regeneration is "a deliberate `--update-snapshots` act recorded in the phase that regenerated it" [CITED: docs/governance/visual-qa-rules.md §2]. Record it. |

**Explicitly out of scope for this phase, and why:** CSRF, XSS payloads in stored data, SQL/RLS
bypass, file-upload validation, rate limiting, and audit logging all presuppose a server, a session
and a database — Phase 003. Listing them here would imply controls this phase does not have.

**Block-on-high conclusion:** with the scope as locked, this phase has **no `high`-severity finding
available to it**. The three live risks are all configuration/supply-chain and are addressed above:
dev-route leakage, fixture leakage into the bundle, and package legitimacy. The security reviewer
should verify those three and explicitly record that ASVS V2–V6 were assessed and found not-yet-
applicable rather than silently skipped.

## Sources

### Primary (HIGH confidence)
- **tailwindcss.com/docs/theme** — read in full. `@theme` vs `@theme inline` vs `@theme static`;
  the 22-namespace table (`--color-*`, `--font-*`, `--text-*`, `--font-weight-*`, `--leading-*`,
  `--breakpoint-*`, `--spacing-*`, `--radius-*`, `--shadow-*`, `--ease-*`, `--animate-*`); §"Why
  `@theme` instead of `:root`"; §"Referencing other variables" (the `inline` semantics and the
  resolution-failure example); §"Generating all CSS variables" (the `static` option and the
  default tree-shaking of unused variables); §"Overriding the default theme" (`--color-*: initial`);
  §"Using a custom theme" (`--*: initial`); the default theme reference (used for the `lg: 64rem`
  breakpoint fact in Open Questions #3).
- **Empirical compilation, tailwindcss@4.3.3 + @tailwindcss/postcss@4.3.3, scratch project, deleted
  after use** — seven probe builds. Established: `@theme inline` inlines the value into the utility
  and emits **no** `:root` variable; plain `@theme` emits `var(--name)` and the variable when used;
  `@theme static` always emits the variable; `--spacing-*` names repoint `w-*`/`max-w-*` away from
  `--container-*`; `text-text-primary` and `border-border-subtle` compile as written; the `no-raw-hex`
  and `no-generic-healthcare-blue` regexes behave as documented in the Code Examples section.
- **playwright.dev/docs/test-snapshots** — `toHaveScreenshot`, the OS/hardware/power-source warning,
  `--update-snapshots`, `maxDiffPixels`, `stylePath`, the array-path form and its "must stay within
  the snapshots directory" constraint.
- **playwright.dev/docs/api/class-pageassertions** — `maxDiffPixelRatio`, `maxDiffPixels`,
  `threshold` (YIQ, default 0.2), `animations: 'disabled'` (default; "stops CSS animations, CSS
  transitions and Web Animations"), `caret`.
- **playwright.dev/docs/api/class-testoptions §reducedMotion** — "Emulates `'prefers-reduced-motion'`
  media feature… Passing `null` resets emulation to system defaults"; **Added in: v1.50** (the reason
  for the 1.63 pin).
- **playwright.dev/docs/api/class-testconfig §snapshotPathTemplate** — the full token list
  (`{arg}`, `{ext}`, `{projectName}`, `{testDir}`, `{platform}`, …), the single-character
  conditional prefix (`{/projectName}`), and "resolved relative to `configDir`".
- **playwright.dev/docs/test-webserver** — `command`, `url`, `reuseExistingServer`, `timeout`,
  `env`, and the Windows note that `gracefulShutdown` signals are ignored on Windows.
- **nextjs.org/docs/app/api-reference/file-conventions/route-groups** (v16.3.8) — the full-page-reload
  caveat for multiple root layouts, and the top-level-home-route caveat.
- **nextjs.org/docs/app/api-reference/functions/not-found** (v16.3.8) — `notFound()` throws
  `NEXT_HTTP_ERROR_FALLBACK;404`, injects `<meta name="robots" content="noindex" />`, must be called
  in the render path, `await`ed correctly.
- **nextjs.org/docs/app/api-reference/components/font** — the options table (`style`, `subsets`,
  `axes`, `display`, `preload`, `fallback`, `adjustFontFallback`, `variable`, `declarations`), the
  preload warning when `subsets` is omitted, and the multi-value `weight` examples.
- **nextjs.org/docs/app/api-reference/config/next-config-js/turbopack** (v16.3.8) — Turbopack has
  built-in CSS support and "there's no need for `css-loader`, `postcss-loader`"; confirmed the
  `pre*` npm hook is not a Turbopack concern at all.
- **motion.dev/docs/react-animate-presence** — direct-children detection, the `key` requirement,
  `exit`, variants, `useIsPresent`/`usePresence`, `initial={false}`, `propagate`.
- **motion.dev/docs/react-use-reduced-motion** — `useReducedMotion()` and `import … from "motion/react"`.
- **developer.mozilla.org — `inert`** — the full behavioral contract (no focus, removed from tab
  order and accessibility tree, no click events, not find-in-page, not editable, hidden from AT).
- **developer.mozilla.org — `scrollbar-gutter`** — `stable` semantics and the classic-vs-overlay
  scrollbar distinction.
- **tailwindcss.com/docs/upgrade-guide / docs/padding / docs/width / docs/max-width** — `p-<number>`
  is `calc(var(--spacing) * <number>)`; `w-sm` is `var(--container-sm) /* 24rem */` (the source of
  the namespace-collision finding).
- **docs.npmjs.com/cli/v11/using-npm/scripts** — `pre<script>` lifecycle hooks, the `prepare`
  replacement for `prepublish`, and `npm_lifecycle_event`.
- **npm registry**, 2026-10-06 — `npm view <pkg> version` for all 13 packages;
  `npm view <pkg> scripts.postinstall` (all empty).
- **In-repo normative sources**, read directly: `docs/governance/tokens.json` (normative blocks
  color/radius/space/font/shadow/motion, and the `provenance.disclaimer` confirming those six are
  what Phase 002 may read), `docs/governance/ui-invariants.md` (the machine-enforceable subset),
  `docs/governance/project-constitution.md` §8 (the three checks verbatim),
  `docs/governance/visual-qa-rules.md` §2 (the harness contract), `docs/governance/motion-rules.md`
  (two durations, two curves, the split, the reduced-motion contract),
  `docs/governance/reference-ui-specification.md` §2.3 (the "provisionally Inter/Lucide" wording D-19
  and D-21 resolve), `scripts/validate-governance.mjs` (the existing zero-dependency script
  conventions the new scripts should match), `.planning/config.json`, `.planning/REQUIREMENTS.md`.

### Secondary (MEDIUM confidence)
- **lucide.dev/guide/packages/lucide-react** — confirms `strokeWidth` is a prop on every icon and
  that icons are tree-shakable and fully typed. It does **not** document the `strokeWidth` *default*
  value or a theme-level stroke config; the wrapper approach (D-21) is the right answer regardless.
- **GSD package-legitimacy seam** (`gsd_run query package-legitimacy check --ecosystem npm …`) —
  verdicts and signals (publish date, weekly downloads, repo URL, deprecation, postinstall) for all
  13 packages. Verdicts were cross-checked against the registry and against each package's official
  documentation before being recorded as approved; see the interpretation note in the audit table.
- **`.planning/research/STACK.md`** — pinned versions and the "What NOT to Use" list. Verified
  against the registry; one instruction (pin TypeScript below 7.x) is now load-bearing.

### Tertiary (LOW confidence — flagged in the Assumptions Log)
- WebSearch results for Tailwind v4 multi-value `--spacing-*` semantics and for dev-only Next.js
  route exclusion were used only to locate the primary sources above; **no claim in this document
  rests on a WebSearch result alone.**
- Claims tagged `[ASSUMED]` in the body — enumerated as A1–A7 in the Assumptions Log.

## Metadata

**Confidence breakdown:**
- Standard stack — **HIGH**. Every version was pulled from the npm registry on 2026-10-06, every
  package was legitimacy-checked, and postinstall scripts were audited. One deliberate deviation from
  the registry (`typescript` pinned to `~5.9`) is inherited from STACK.md's explicit instruction.
- Architecture — **HIGH**. The Tailwind token mechanism, the route-group caveat, the `notFound()`
  contract, the Playwright config surface and the `inert`/`scrollbar-gutter` behaviors are all cited
  to primary documentation or verified by compilation. The only MEDIUM area is the hand-rolled focus
  trap's *ordering* advice, which is assembled from MDN primitives rather than a single canonical
  reference implementation — it is correct, but it is synthesis.
- Pitfalls — **HIGH** for Pitfalls 1, 2, 6, 7 and 8 (each verified by compilation or by direct
  citation). **MEDIUM** for Pitfalls 3, 4, 5, 9 (documented behavior plus reasoning, not reproduced
  end-to-end this session).
- Validation architecture — **HIGH** on the framework surface (Vitest/Playwright docs) and on the
  automatability split (which is dictated by `ui-invariants.md`, not by judgment). MEDIUM on the
  specific test-file inventory, which is a recommendation rather than a discovered fact.
- Security domain — **HIGH** on scope (ASVS applicability follows directly from "no auth, no data,
  no network") and on the supply-chain rows (registry-verified). MEDIUM on the dev-route-leakage
  mitigation, which is a recommendation that needs owner sign-off (Open Questions #1).

**Research date:** 2026-10-06
**Valid until:** 2026-11-05 (30 days) for the architecture and Tailwind/Next mechanisms — these move
slowly. **Re-verify before planning if more than 7 days have passed**, specifically: `npm view` for
all 13 package versions, and whether Playwright has changed `snapshotPathTemplate` or the
`reducedMotion` option. The Playwright and Tailwind surfaces are the fast-moving parts of this
document.

**What might I have missed?** — the honest list, for discuss-phase:
1. The **8 workspace tab route names** were not enumerated (§6 of the product spec was not read in
   full). A7.
2. **`responsive-rules.md` was not read in full** — the 1023px edge and the 44px touch target are
   taken from the CONTEXT.md summary. The planner should read it before the UX-06 task.
3. **The scrim derivation** (`color-mix(in oklab, var(--color-text-primary) 45%, transparent)` or an
   explicit rgba) is not settled here. INV-17 forbids a *new token*, not a derived value, and v4's
   `color-mix()` support makes a token-derived scrim trivial — but the exact expression belongs to the
   plan, not this research.
4. **Whether `reference-ui-specification.md` §2.3's "provisionally Inter / provisionally Lucide"
     wording should be edited in this phase.** CONTEXT.md lists it as an integration point; D-19 and
     D-21 confirm the decisions, so the doc edit is a small governance task that this research flags
     but does not scope.
