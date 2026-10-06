# Phase 2: Foundation and App Shell - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-10-06
**Phase:** 2-foundation-and-app-shell
**Areas discussed:** Route skeleton shape, Token layer (generated vs authored CSS), Machine-check enforcement, Visual-regression baselines, Typography family and icon set, Modal/sheet and primitive scope

---

## Route skeleton shape

| Option | Description | Selected |
|--------|-------------|----------|
| Full URL map, empty shells | Scaffold the real URL map as empty shells (`/login`, `/provider`, `/provider/patients/[id]` with the 8 tabs nested, `/patient`, `/patient/home`). Locks the URL contract now. | ✓ |
| Shell frame + primitives gallery only | Only the layout frame plus a `/gallery` route; real routes created by their owning phases. | |
| Single catch-all shell + gallery | One `/[...path]` shell rendering the frame for any path; no per-role routes yet. | |

**User's choice:** Full URL map, empty shells
**Notes:** Acceptance criterion 1 says "every defined route" — the routes had to be defined
somewhere, and defining them here means Phases 003–005 fill bodies instead of inventing paths.

---

### Layout nesting

| Option | Description | Selected |
|--------|-------------|----------|
| Three route groups, three layouts | `(provider)` and `(patient)` each own a layout with the left icon rail and role nav; `(auth)` is bare; `/provider/patients/[id]` nests inside the provider layout. | ✓ |
| One shared layout, role nav injected | Single root layout with a shared AppShell; rail and nav passed per segment. | |
| Shared AppShell, thin per-group wrappers | Route groups for URL grouping, all sharing one AppShell that picks its nav set. | |

**User's choice:** Three route groups, three layouts
**Notes:** Prevents role-specific chrome leaking into a shared root layout.

---

### Access control seam

| Option | Description | Selected |
|--------|-------------|----------|
| No guards, reserved seam | Routes render openly; a comment marks exactly where Phase 003's server-side role resolution slots in. | ✓ |
| Placeholder middleware stub | A no-op `middleware.ts` with the guard call site stubbed. | |

**User's choice:** No guards, reserved seam
**Notes:** Auth does not exist yet. A fake gate that looks real is worse than none.

---

### Shell content

| Option | Description | Selected |
|--------|-------------|----------|
| Typed empty states, no data | Real layout frame plus an explicit empty state ("No patients yet") in real typography and surface tokens. | ✓ |
| Structural placeholder only | Neutral placeholder block, no copy. | |

**User's choice:** Typed empty states, no data
**Notes:** Satisfies criterion 1 literally and gives the visual baselines something real to capture,
while introducing no clinical data (FOUND-01).

---

## Token layer: generated vs authored CSS

| Option | Description | Selected |
|--------|-------------|----------|
| Build-time codegen script | `scripts/generate-tokens.mjs` reads `tokens.json` and writes the CSS layer; runs via `predev` + `prebuild`; output gitignored. | ✓ |
| One-shot generate + drift check | Generate once, commit the CSS, fail CI when it diverges from the JSON. | |
| CSS-first, JSON generated from CSS | Write `tokens.css` by hand; JSON kept as the design record. | |

**User's choice:** Build-time codegen script
**Notes:** Phase 001 D-07 already said "generated from the JSON so documentation and code cannot
drift" — the mechanism was the open question. The committed-JSON-only variant removes the
maintenance burden of a drift check.

---

### CSS naming

| Option | Description | Selected |
|--------|-------------|----------|
| Kebab-case vars, tailwind names match | JSON keeps camelCase; generator emits `--color-frame-foreground`, `--radius-pill`; code writes `bg-surface`, `rounded-pill`. | ✓ |
| Preserve camelCase in CSS vars | Emit `--frameForeground` verbatim; zero transformation but diverges from CSS convention. | |
| Kebab vars + category-prefixed Tailwind names | `bg-color-surface`, `rounded-radius-pill`; unambiguous but noisier. | |

**User's choice:** Kebab-case vars, tailwind names match
**Notes:** Honors Phase 001 D-10 (canonical camelCase in `tokens.json`) while keeping the CSS
identifier form conventional and the Tailwind class names readable.

---

### CSS layers

| Option | Description | Selected |
|--------|-------------|----------|
| Custom properties + `@theme inline` | Both a `@theme inline` block for Tailwind utilities and a `:root` block of plain custom properties. | ✓ |
| `@theme inline` only | Only the Tailwind block; raw CSS and GSAP would hardcode the four motion values. | |

**User's choice:** Custom properties + `@theme inline`
**Notes:** The `:root` block is required because `docs/governance/motion-rules.md` §1 forbids a
component declaring a motion value locally — GSAP timelines and raw CSS need
`var(--duration-fast)` directly.

---

## How the three machine checks are enforced

| Option | Description | Selected |
|--------|-------------|----------|
| Node script for all three | `scripts/check-design-tokens.mjs` runs all three, exits non-zero; wired to lint and prebuild. | ✓ |
| ESLint custom rules | Real-time editor feedback, but `token-reference-required` needs AST work to avoid false positives. | |
| Script + ESLint | Script authoritative in CI, thin ESLint wrapper for the editor; two surfaces to keep in sync. | |

**User's choice:** Node script for all three
**Notes:** INV-01 and INV-03 state their objective checks as literal greps, so a script mirrors
them exactly with no extra dependency in a greenfield repo.

---

### Check scope

| Option | Description | Selected |
|--------|-------------|----------|
| Source tree, generated files excluded | Every source file under `src/` plus root configs; exclude the generated CSS and governance JSON. | ✓ |
| Everything, allowlisted | Whole repo including `docs/` and `.planning/` with an allowlist. | |
| Component files only | Only `src/components/**` and `src/app/**`. | |

**User's choice:** Source tree, generated files excluded
**Notes:** Matches the constitution §8 scope ("every source file") while honoring "no raw hex
outside the generated token layer". Component-files-only was rejected because the constitution
explicitly includes theme and config.

---

### Check timing

| Option | Description | Selected |
|--------|-------------|----------|
| `lint` + `prebuild` only | No git hook; a hook would fire on generated and vendor files before the allowlists are understood. | ✓ |
| `lint` + `prebuild` + pre-commit | Also wire lint-staged or husky. | |
| CI job only | Nothing would actually enforce the contract until a later phase adds CI. | |

**User's choice:** `lint` + `prebuild` only

---

### token-reference-required strictness

| Option | Description | Selected |
|--------|-------------|----------|
| Presence check, warning-tolerant | A component passes if it references at least one generated token utility; scoped to component and layout files per the constitution. | ✓ |
| Presence check repo-wide | Every `.tsx` under `src/`; fails legitimate wrapper files that only compose primitives. | |
| Presence + forbid default color utilities | Also flags `bg-white` / `text-gray-500`; stronger INV-01 but false-positives on reset/globals code. | |

**User's choice:** Presence check, warning-tolerant
**Notes:** The constitution scoped this check to component and layout files; broadening it was
declined.

---

### Failure reporting

| Option | Description | Selected |
|--------|-------------|----------|
| Fail with file:line and fix hint | One line per violation with `file:line`, the matched literal and the violated check/INV; exit 1. | ✓ |
| Warnings only, exit 0 | Advisory only. | |

**User's choice:** Fail with file:line and fix hint
**Notes:** No `--fix` — a tool that silently edits design tokens is the wrong tool. Warnings-only
would weaken the enforcement Phase 001 specified, since INV violations are supposed to block
phase acceptance.

---

## Which surfaces get visual-regression baselines now

| Option | Description | Selected |
|--------|-------------|----------|
| Gallery + empty shells, full matrix | 4 viewports × 2 motion states for both the primitives gallery and every empty shell. | ✓ |
| Primitives gallery only | Empty shells are near-blank and mostly re-test frame chrome. | |
| Empty shells only | Primitives stay unbaselined until a feature phase uses them. | |
| Minimal smoke baseline | One shell at one viewport; harness largely unexercised until Phase 004. | |

**User's choice:** Gallery + empty shells, full matrix
**Notes:** Directly exercises FOUND-02, FOUND-03 and FOUND-05 and gives later phases a named
pattern for adding new surfaces.

---

### Motion-state capture

| Option | Description | Selected |
|--------|-------------|----------|
| Two Playwright projects | `reducedMotion: 'reduce'` emulation gives the reduced-motion state natively and proves the media-query branch fires. | ✓ |
| Emulate media + animation freeze | Single project, per-test media emulation. | |

**User's choice:** Two Playwright projects

---

### Gallery route placement

| Option | Description | Selected |
|--------|-------------|----------|
| Dev-only route, guarded | Excluded from the production build via `NODE_ENV`; cannot ship as a public route. | ✓ |
| Public `/gallery` route | Permanent product route; would need an auth guard in Phase 003. | |

**User's choice:** Dev-only route, guarded

---

### Baseline gating

| Option | Description | Selected |
|--------|-------------|----------|
| Local script + npm test, no CI yet | `npm run test:visual`; baselines committed; CI left for a later phase. | ✓ |
| Configure CI too | Add a GitHub Actions workflow on push. | |

**User's choice:** Local script + npm test, no CI yet
**Notes:** No CI provider exists in this repo and choosing one is out of scope. **Landmine
recorded in CONTEXT.md:** the committed baselines were captured on Windows; whoever adds CI must
regenerate them on that runner rather than assuming the PNGs transfer across font rasterization.

---

### Dev fixture boundary

| Option | Description | Selected |
|--------|-------------|----------|
| Typed fixture stubs, no clinical values | Empty list and a placeholder patient carrying no medications, labs, vitals or diagnoses. | ✓ |
| No fixtures at all in Phase 2 | Genuinely empty shells; gallery uses neutral placeholder content. | |

**User's choice:** Typed fixture stubs, no clinical values
**Notes:** FOUND-01 bans fake *clinical* data, not all fixtures.

---

## Typography family and icon set

| Option | Description | Selected |
|--------|-------------|----------|
| Confirm Inter | Neutral grotesque matching the reference density; self-hosted via `next/font`. | ✓ |
| System font stack | Zero font bytes, but rendering differs per OS — undermines pixel-stable baselines. | |
| Geist | Modern neutral grotesque, self-hostable; a departure from the reference. | |
| Keep provisional, re-review at gate | Defer the call to Phase 002's design gate. | |

**User's choice:** Confirm Inter
**Notes:** Resolves the "provisionally Inter, flagged for owner review" note in
`docs/governance/reference-ui-specification.md` §2.3, which the D-08 gate left unadjudicated.

---

### Icon set

| Option | Description | Selected |
|--------|-------------|----------|
| Confirm Lucide at 1.5px | Stroke width forced once on a shared icon wrapper so no call site drifts. | ✓ |
| Lucide default 2px | No per-call-site config, but heavier than the reference's thin-stroke language. | |
| Hand-authored icon set | Total control, no dependency; every new icon becomes a design decision. | |

**User's choice:** Confirm Lucide at 1.5px

---

### Font delivery

| Option | Description | Selected |
|--------|-------------|----------|
| `next/font`, self-hosted | Build-time self-host with size-adjust fallbacks; no runtime CDN call. | ✓ |
| Self-hosted files in repo | Explicit and offline-capable; adds binary assets and a hand-maintained preload strategy. | |

**User's choice:** `next/font`, self-hosted
**Notes:** Material for a PHI product where every third-party request is a review item.

---

### Font features and coverage

| Option | Description | Selected |
|--------|-------------|----------|
| Include both | Latin + latin-ext subsets, tabular numerals available; only weights 400 and 600. | ✓ |
| Latin subset only | Smallest payload; digit columns jitter, accented names fall back mid-surface. | |
| Full weight range | Load 400–700 for headroom, including weights the frozen scale forbids. | |

**User's choice:** Include both
**Notes:** Tabular figures matter for the timeline axis and value columns in a dense clinical grid;
latin-ext covers accented patient names.

---

## Modal/sheet and primitive scope

> Explored after the initial five areas, at the owner's request.

| Option | Description | Selected |
|--------|-------------|----------|
| Full a11y contract, hand-rolled | Focus trap, Escape, focus restore, `aria-modal`, scroll lock, scrim derived from `textPrimary`. | ✓ |
| Add a headless primitive library | Radix Dialog / React Aria for focus trap and labelling; adds a dependency whose styling must stay token-pure. | |
| Visual-only skeleton | Visual surface and enter/exit motion now; focus trap lands with the first real modal. | |

**User's choice:** Full a11y contract, hand-rolled
**Notes:** FOUND-04 is this phase's accessibility baseline, not a later phase's debt. INV-17
forbids a new scrim token, so the scrim derives from `textPrimary`.

---

### Modal vs sheet presentation

| Option | Description | Selected |
|--------|-------------|----------|
| One primitive, two presentations | Centered overlay on desktop (≥1024px), bottom sheet on tablet/mobile. | ✓ |
| Two separate primitives | Centered modal and bottom sheet as independent components. | |

**User's choice:** One primitive, two presentations
**Notes:** This is the responsive band contract expressed in one component, and it prevents a
third ad-hoc overlay from appearing in a feature phase.

---

### Empty state

| Option | Description | Selected |
|--------|-------------|----------|
| One shared `EmptyState` primitive | Title, optional body line, optional action; composed from surface and typography tokens. | ✓ |
| Layout-local per shell | Each shell writes its own empty-state markup inline. | |

**User's choice:** One shared `EmptyState` primitive
**Notes:** Consistent by construction rather than re-invented in every later phase.

---

### Surface primitives

| Option | Description | Selected |
|--------|-------------|----------|
| Four surface variants, one shadow rule | One `Surface` with `canvas` / `surface` / `surfaceMuted` / `surfaceRaised`; separation by the two frozen shadows only. | ✓ |
| Separate Card and Panel components | Two components with fixed semantics. | |

**User's choice:** Four surface variants, one shadow rule
**Notes:** INV-16 — no card renders a visible full-perimeter border.

---

## Claude's Discretion

- Internal file layout and output formatting of the codegen and check scripts (beyond the
  `file:line` + literal + rule contract).
- Component file naming and directory structure under `src/`, provided the route-group layout holds.
- Gallery section composition and ordering.
- Exact focus-visible ring styling and focus-order implementation.
- Whether reduced-motion surfaces appear in the gallery as one section or several.
- Specific empty-state copy per shell, following the §7 copywriting contract.

## Deferred Ideas

- **CI provider configuration** — visual suite runs locally; whoever adds CI must regenerate
  baselines on that runner (font rasterization differs by OS).
- **General ESLint / Biome / Prettier setup** — Phase 002 creates only the token-check script.
- **Dark-mode token values** — carried forward from Phase 001; contract is role-based, values are light-only.
- **Real content behind empty states** — arrives with Phases 004, 005, 006.
