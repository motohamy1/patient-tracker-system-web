---
phase: 02-foundation-and-app-shell
verified: 2026-10-07T00:36:43Z
status: passed
score: 15/15 must-haves verified
behavior_unverified: 0
---

# Phase 2: Foundation and App Shell — Verification Report

**Phase Goal:** Build only the Next.js application shell: route structure, layout primitives, semantic design tokens, typography, surfaces, buttons, pills, compact controls, modal/sheet primitives, accessibility baseline, and motion foundation. No fake clinical dashboard; no fake patient data beyond isolated development fixtures.
**Verified:** 2026-10-07T00:36:43Z
**Status:** passed
**Re-verification:** No — initial goal-backward verification (the phase's blocking human visual-QA gate already ran and was APPROVED on 2026-10-07; that record is preserved verbatim below and is not re-raised).

This report is the goal-backward verification of Phase 2 against ROADMAP.md success criteria 1–4 and requirement IDs FOUND-01…FOUND-05 and UX-06. It was produced read-only over the production code: no token, component, route or test was edited, and every machine result cited here was re-executed on 2026-10-07 at the commit below.

**Method note.** The SUMMARY.md files claim far more than this report restates. Every claim below was independently checked against the codebase: file existence, substantive implementation (not stubs), wiring, and — where a runtime invariant is asserted — a behavioral test that exercises it.

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Every route in the locked D-01 map renders as a typed empty shell with the correct layout frame and token styling — `/provider`, `/login`, `/patient`, `/patient/home`, the eight `/provider/patients/[patientId]/*` tabs, the bare workspace redirect, and `/` resolving to the root 404. | ✓ VERIFIED | `npm run build` route table names all routes (`○ /_not-found`, `○ /login`, `○ /patient`, `○ /patient/home`, `○ /provider`, `ƒ /provider/patients/[patientId]`, all eight tabs, `ƒ /dev/gallery`). Each `page.tsx` is substantive and renders `EmptyState`/`WorkspaceTopBar`. (FOUND-01, FOUND-03) |
| 2 | Token-driven styling derives from one frozen semantic token layer generated at build time; no raw hex and no off-vocabulary utility exists under `src/`. | ✓ VERIFIED | `src/styles/tokens.generated.css` carries a literal `@theme inline` block **and** an unconditional `:root` block (including `--duration-fast`/`--duration-slow`); `npm run lint` → exit 0, `0 violations across 45 file(s)`; recursive hex grep over `src/` → 0 hits. (FOUND-03) |
| 3 | The shared primitive set exists and is substantive — `Surface` (4 variants), `Button` (4 variants), `Icon`, `Pill`, `TabBar`/`SegmentedControl`, `CompactControl`, `EmptyState`, `Overlay`. | ✓ VERIFIED | All eight files present with real implementations (variant maps, motion branches, type-level constraints); 124 unit tests pass over them. (FOUND-02) |
| 4 | Every shell screen is composed from the shared primitives rather than bespoke per-screen components. | ✓ VERIFIED | `(provider)/layout.tsx`, `(patient)/layout.tsx`, `(auth)/layout.tsx` and every route page import `Surface`, `EmptyState`, `ProviderRail`/`ProviderTopBar`/`WorkspaceTopBar`/`PatientTopBar`/`MobileNav`, `CompactControl`. (FOUND-02) |
| 5 | The `primary` CTA fills with `accentSoft`, never `accent`; no status tint is used as ink; an `iconOnly` control cannot ship without an accessible name. | ✓ VERIFIED | `Button.tsx` → `BUTTON_VARIANTS.primary: 'bg-accent-soft text-text-primary rounded-pill'` (no `bg-accent`); `ButtonProps` is a discriminated union requiring `ariaLabel` for `iconOnly`; `Button.test.tsx` asserts "never `bg-accent`" and mandatory icon-only names. (FOUND-04) |
| 6 | The keyboard/assistive baseline is declared once (a single `:focus-visible` ring) and applied through the shell and primitives, with dialog semantics for the overlay. | ✓ VERIFIED | `globals.css` → one `:focus-visible` rule (`2px solid var(--color-text-primary)`, `outline-offset: 2px`); icon-only controls carry `aria-label`; active nav carries `aria-current="page"`; `Overlay.tsx` carries `role="dialog"`, `aria-modal`, `aria-labelledby`; `focus-trap.test.tsx` exercises focus-in, forward/backward wrap, Escape, restore and `inert`. (FOUND-04) |
| 7 | The reduced-motion preference disables or reduces all shell-level motion through one motion module. | ✓ VERIFIED | `src/lib/motion.ts` `useShellMotion()` resolves `reduce` truthily and returns opacity-only at `fastSec` under reduction; `reduced-motion.test.tsx` passes; `Button` uses `useReducedMotion` + `fastSec`; the Playwright `reduced-motion` project captures 24 baselines. (FOUND-05) |
| 8 | No fake clinical dashboard and no sample patient data exists beyond isolated development fixtures; the fixtures are typed stubs with all seven clinical collections empty. | ✓ VERIFIED | `src/lib/dev/fixtures.ts` — all seven collections are literal `[]`; `dev-fixtures.test.ts` asserts empty collections, no clinical-vocabulary export, and no dosage/record-number/date literal; clinical-term grep over `src/` → 0 hits. (FOUND-01) |
| 9 | The dev fixtures are confined to `src/lib/dev/` and reachable only from the gated gallery page — never a product route or the shipped client bundle. | ✓ VERIFIED | `dev-fixtures.test.ts` scope assertion (no `Patient`-shaped literal outside `src/lib/dev/`) and reachability assertion (only `src/app/dev/gallery/page.tsx`); `security.spec.ts` asserts `dev-placeholder` is absent from `.next/static`. (FOUND-01) |
| 10 | The dev-only gallery is gated: it 404s without the flag and renders with it; the flag is named in exactly two files and no `.env*` exists. | ✓ VERIFIED | `dev-route-gate.ts` predicate; phase page is `force-dynamic`; `grep ALLOW_DEV_ROUTES` → exactly `src/lib/dev/dev-route-gate.ts` + `playwright.config.ts`; `ls .env*` → none; `security.spec.ts` 404 test. (FOUND-01) |
| 11 | The locked route map is exact: the eight workspace tabs are exactly Overview / AI Analytics / Visits / Medications / Labs / Imaging / Allergies / Genetics — no `Vital Signs`, no `Communication`, no ninth tab or route. | ✓ VERIFIED | `tabs.ts` `WORKSPACE_TAB_ROUTES` enumerates exactly the eight; `TabBar.tsx` `WORKSPACE_TABS` matches; the eight route folders exist and match by name. (FOUND-01) |
| 12 | No access control exists and none is faked: no `middleware.ts`, no client-side gate; the Phase-003 server-side resolution slot is marked in both role layouts and `/login`. | ✓ VERIFIED | `find src -name middleware.ts` → 0; D-03 server-side-slot comments present in `(provider)/layout.tsx`, `(patient)/layout.tsx`, `(auth)/login/page.tsx`; `/login` renders no form/input/submit. (FOUND-01) |
| 13 | Mobile adaptation: ≥44px touch targets, a horizontally scrolling pill strip below 768px, a collapsed native-`<details>` search, and the `Overlay` flips modal→sheet below the 1024px band edge. | ✓ VERIFIED | `min-h-11`/`min-w-11` sizing in primitives and shell; `MobileNav.tsx` uses a native `<details>` disclosure; `Overlay.tsx` uses the stock `max-lg:items-end` flip. (UX-06) |
| 14 | One `Overlay` primitive serves both presentations with a complete hand-rolled accessibility contract and no headless-UI dependency. | ✓ VERIFIED | `Overlay.tsx` is a single component (no `variant` prop); `useFocusTrap.ts` + `useScrollLock.ts` implement the contract; headless-lib grep over `src/`/`tests/` returns only comments stating none is used. (FOUND-02, FOUND-04) |
| 15 | The visual-regression harness exists with 48 committed baselines (6 surfaces × 4 viewports × 2 motion projects) and automated security assertions. | ✓ VERIFIED | `find tests/visual/baselines -name '*.png'` → 48; `playwright.config.ts` declares the `default`/`reduced-motion` projects; `surfaces.spec.ts` builds the `{surface}/{viewport}/{state}.png` path as segments; `git check-ignore <baseline>` exits 1 (not ignored). (FOUND-05, UX-06) |

**Score:** 15/15 truths verified (0 present, behavior-unverified).

### Deferred Items

Items explicitly owned by a later milestone phase and not actionable gaps here.

| # | Item | Addressed In | Evidence |
|---|------|-------------|----------|
| 1 | Visual-QA rows 8 (timeline proportions), 9 (node/branch behaviour), 10 (bottom scrubber) | Phase 6 | ROADMAP Phase 6 goal: "Implement the actual timeline engine … bottom scrubber …". Recorded as NOT APPLICABLE in Phase 002 in the preserved record below, never as a pass. |
| 2 | Loading / error / retry / permission-denied / offline-sync states | Phase 3 | REQUIREMENTS.md UX-01/UX-02/UX-03 map to Phase 3; `EmptyState` deliberately ships the empty variant only. |

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `package.json` / `package-lock.json` | pinned scaffold, exact script set | ✓ VERIFIED | 13 packages pinned exactly; `predev`/`prebuild`/`lint` wire the token scripts; lockfile committed. |
| `scripts/token-namespaces.mjs`, `scripts/generate-tokens.mjs` | zero-dep token codegen | ✓ VERIFIED | Dual-emission CSS + Motion TS generated from `tokens.json`; generated files gitignored. |
| `scripts/check-design-tokens.mjs` | the three machine checks | ✓ VERIFIED | `no-raw-hex` / `no-generic-healthcare-blue` / `token-reference-required`; wired to `lint` + `prebuild`. |
| `src/styles/tokens.generated.{css,ts}` | generated token layer | ✓ VERIFIED | Literal `@theme inline` + `:root` (42 declarations) + `MOTION` constants; gitignored. |
| `src/app/globals.css` | token-only base + a11y/motion baseline | ✓ VERIFIED | Zero raw values; single `:focus-visible`; reduced-motion safety net. |
| `src/app/layout.tsx` | the single root layout | ✓ VERIFIED | Owns `<html>`/`<body>`, self-hosted Inter (400/600), no role chrome. |
| `src/components/primitives/{Surface,Icon,Button,Pill,TabBar,CompactControl,EmptyState}.tsx`, `index.ts` | shared primitives | ✓ VERIFIED | All present, substantive, composed from tokens. |
| `src/components/overlays/{Overlay.tsx,useFocusTrap.ts,useScrollLock.ts}` | modal/sheet primitive + a11y hooks | ✓ VERIFIED | One overlay form; full hand-rolled contract. |
| `src/lib/motion.ts` | motion vocabulary | ✓ VERIFIED | `useShellMotion()`; generated constants only. |
| `src/components/shell/{ProviderRail,ProviderTopBar,MobileNav,WorkspaceTopBar,PatientTopBar}.tsx` | role chrome | ✓ VERIFIED | Token-pure; accessible names; no accent marker; disabled CTA. |
| `src/app/(provider)/**`, `src/app/(auth)/**`, `src/app/(patient)/**`, `src/app/not-found.tsx` | locked route map | ✓ VERIFIED | 14 `page.tsx` + 4 layouts + `not-found.tsx`; each renders a typed `EmptyState`. |
| `src/app/(provider)/provider/patients/[patientId]/tabs.ts` | single tab enumeration | ✓ VERIFIED | The eight slugs/labels/icons, `DEFAULT_TAB_SLUG`, `tabHref`. |
| `src/lib/dev/{dev-route-gate.ts,fixtures.ts}`, `src/app/dev/gallery/page.tsx`, `src/components/dev/{Gallery,GallerySections}.tsx` | dev-only gate, fixtures, gallery | ✓ VERIFIED | Gate in the render path; fixtures empty-by-construction; ten-section gallery. |
| `playwright.config.ts`, `tests/visual/{surfaces,security}.spec.ts`, `tests/visual/baselines/**` (48) | visual harness + baselines | ✓ VERIFIED | Two motion projects, four viewports, pinned capture; 48 committed PNGs; three security assertions. |
| `tests/unit/**` (15 files) | unit coverage | ✓ VERIFIED | 124 tests; include the reduced-motion contract, the focus trap, the fixture scope/reachability, the gate truth table and the token checks. |
| `.planning/phases/02-foundation-and-app-shell/02-SECURITY.md` | security assessment | ✓ VERIFIED | Four live threats with dispositions and proving tests; ASVS V2–V6 non-applicability recorded. |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `src/app/globals.css` | `src/styles/tokens.generated.css` | `@import` | ✓ WIRED | The imported path does not exist until `predev`/`prebuild` runs the generator — an intentional loud failure. |
| `src/app/layout.tsx` | `(provider)`, `(patient)`, `(auth)` layouts | React tree nesting | ✓ WIRED | One root layout; role chrome lives in the nested groups, so a role switch is client navigation. |
| `tabs.ts` | `WorkspaceTopBar` | `WORKSPACE_TAB_ROUTES` import | ✓ WIRED | The eight labels exist in exactly one place; the route folders match by name. |
| `src/app/dev/gallery/page.tsx` | `dev-route-gate.ts` + `fixtures.ts` | `isDevRouteAllowed()` / `EMPTY_PATIENT_LIST` | ✓ WIRED | Gate evaluated in the render path; fixtures consumed only here. |
| `playwright.config.ts` | `dev-route-gate.ts` | `webServer.env.ALLOW_DEV_ROUTES` | ✓ WIRED | The single setter of the flag; `security.spec.ts` asserts the 404 without it. |
| `package.json` | `check-design-tokens.mjs` → `token-namespaces.mjs` | `lint` / `prebuild` scripts | ✓ WIRED | A token violation fails both `lint` and `build`. |
| `Button.tsx` | `motion/react` + `tokens.generated.ts` | `useReducedMotion` + `MOTION` constants | ✓ WIRED | No duration literal; reduced branch is opacity-only at `fastSec`. |
| `Overlay.tsx` | `useShellMotion` + `Button` + `Surface` + `useFocusTrap` + `useScrollLock` | imports | ✓ WIRED | Motion, elevation and the a11y contract are inherited, not re-implemented. |

### Data-Flow Trace (Level 4)

This is a foundation phase with no clinical data source yet; the only "data" is fixture-derived and deliberately empty. The trace confirms the visible values are intentional, not hollow stubs.

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| `EmptyState.tsx` | `title` / `body` props | static literals passed by each route | N/A — static copy is the specified content (a fact about the build) | ✓ INTENTIONAL-STATIC (not a hollow stub) |
| `Gallery.tsx` | `emptyCount` | `EMPTY_PATIENT_LIST.length` (fixtures) | Yes — a real fixture-derived `0` | ✓ FLOWING |
| `WorkspaceTopBar.tsx` | `patientId` | route param → `tabHref()` → `encodeURIComponent` → href | Yes — the param is consumed only to build relative hrefs (never rendered/queried/logged) | ✓ FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Design-token gate passes over the tree | `npm run lint` | exit 0 — `0 violations across 45 file(s)` | ✓ PASS |
| Unit suite green | `npx vitest run tests/unit` | exit 0 — 15 files / 124 tests passed | ✓ PASS |
| Production build renders all routes | `npm run build` | exit 0 — route table lists `/login`, `/patient`, `/patient/home`, `/provider`, the redirect, the eight tabs and `ƒ /dev/gallery` | ✓ PASS |
| Primitives are exported from the barrel | `node -e "…read index.ts…"` | `Surface: true`, `Button: true`, `makeIcon: true` | ✓ PASS |
| Dev-route flag is confined | `grep -rl ALLOW_DEV_ROUTES src tests scripts *.ts` | exactly `src/lib/dev/dev-route-gate.ts` + `playwright.config.ts` | ✓ PASS |
| No fake clinical content | `grep -rniE "cardiology\|lisinopril\|metformin\|MRN\|mmHg\|…" src/` | 0 hits | ✓ PASS |
| 48 baselines committed, not ignored | `find tests/visual/baselines -name '*.png' \| wc -l`; `git check-ignore …` | `48`; check-ignore exits 1 | ✓ PASS |

### Probe Execution

No probe scripts apply to this phase. `find scripts -path '*/tests/probe-*.sh'` returns nothing; the PLANs declare no probe, and Phase 2 is a foundation/build phase, not a migration or tooling-probe phase. **SKIPPED (n/a).**

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| FOUND-01 | 02-02, 02-08, 02-09, 02-10, 02-11 | Next.js shell with route structure + layout primitives, no fake clinical dashboard and no sample patient data beyond isolated dev fixtures. | ✓ SATISFIED | Truths 1, 8, 9, 10, 11, 12; `npm run build` route table; `dev-fixtures.test.ts`; clinical-term grep → 0. |
| FOUND-02 | 02-03, 02-04, 02-05, 02-06, 02-07, 02-08, 02-09, 02-10, 02-11 | Any screen composes from the shared primitive set rather than hand-rolled per-screen components. | ✓ SATISFIED | Truths 3, 4, 14; primitive files + barrel; layouts/routes import from the primitive set. |
| FOUND-03 | 02-01, 02-03, 02-04, 02-08, 02-09, 02-10, 02-11 | Typography and surface styling follow one hierarchy from the reference, not per-screen improvisation. | ✓ SATISFIED | Truths 1, 2; frozen `tokens.json`; generated dual-emission layer; four font sizes / two weights in the generated vocabulary. |
| FOUND-04 | 02-03, 02-05, 02-06, 02-07, 02-08, 02-09, 02-10, 02-11 | Keyboard/assistive baseline across shell and primitives (focus order, labels, contrast against frozen tokens). | ✓ SATISFIED | Truths 5, 6, 14; single `:focus-visible`; icon-only accessible names; `focus-trap.test.tsx`. |
| FOUND-05 | 02-06, 02-07, 02-10, 02-11 | All shell-level motion is fast/smooth/subtle/interruptible and fully disabled or reduced under reduced-motion. | ✓ SATISFIED | Truths 7, 15; `useShellMotion`; reduced-motion unit test; reduced-motion Playwright project. |
| UX-06 | 02-05, 02-07, 02-08, 02-09, 02-10, 02-11 | Mobile adapts (touch targets, compact navigation, reduced density, safe interactions) rather than shrinking the desktop. | ✓ SATISFIED | Truth 13; 44px sizing; `MobileNav` scrolling pill strip + `<details>` search; `Overlay` sheet flip. |

**Orphaned requirements:** none. All six Phase-2 IDs (FOUND-01…FOUND-05, UX-06) are claimed by at least one plan and are reachable in `REQUIREMENTS.md` Traceability (all marked Complete). REQUIREMENTS.md maps no additional ID to Phase 2.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| — | — | No `TBD`/`FIXME`/`XXX` debt markers in `src/`, `scripts/` or `tests/` | — | Debt-marker gate passes. |
| — | — | No `TODO`/`HACK`/`PLACEHOLDER` markers; no "coming soon" / "not yet implemented" prose | — | Clean. |
| `src/components/overlays/Overlay.tsx` | 70 | `if (!mounted) return null` | ℹ️ Info | An SSR/portal guard, not a stub — it prevents the server render touching `document`. |
| — | — | No `gsap` import under `src/`; no headless-UI/testing-library dependency (matches are comments stating integration is absent) | — | Confirms the deferred-layer and D-22 constraints. |

### Gaps Summary

None. Every must-have truth is VERIFIED, every required artifact exists and is substantive, every key link is wired, and no blocker anti-pattern was found. The phase goal is achieved in the codebase: the shell, the primitives, the token layer, the a11y/motion foundation and the dev-only gallery all exist, are wired, and are exercised by the unit suite and the visual harness.

No new human-verification items are raised: the blocking `checkpoint:human-verify` gate for this phase already ran and was **APPROVED on 2026-10-07** (reviewer `motohamy1`), and that record — the 12 visual-QA rows, the INV evaluations, the D-27 outcome, the focus-ring/44px/reduced-motion checks — is preserved verbatim immediately below. Rows 8, 9 and 10 remain NOT APPLICABLE in Phase 002 and are owned by Phase 006; they are not re-raised.

---

## Visual QA, Invariant & Human-Verification Record (plan 02-11)

# Phase 2 — Verification Artifact (02-VERIFICATION.md)

**Phase:** 2 — Foundation and App Shell
**Plan:** 02-11
**Written by:** task-2 (automated), 2026-10-07
**Gate owner:** task-3 (blocking human-verify) — verdicts recorded in §7 on 2026-10-07; Phase 2 close **APPROVED**.

This artifact is the phase's acceptance record. `PRODUCT-MASTER-SPEC.md` §27 makes
"declaring a feature complete solely because the build passes" a hard prohibition, so this file
records the per-row QA results and the per-ID invariant evaluations — not merely a green suite.

A green suite is **evidence**, not the gate. The gate is the twelve QA rows and every applicable
`INV-xx` evaluation, judged by a human against the reference images (§6).

---

## 1. Automated verification results (task-2)

Run as one chain from the repository root on the Windows workstation:

```
npm run lint && npx vitest run tests/unit && npm run build && npm run test:visual
```

**Exit code: 0** (the single chain).

| Command | Result | Evidence |
|---|---|---|
| `npm run lint` | **PASS** (exit 0) | `check-design-tokens: 0 violations across 45 file(s) — no-raw-hex, no-generic-healthcare-blue and token-reference-required all pass (INV-01, INV-03, INV-13, INV-14).` |
| `npx vitest run tests/unit` | **PASS** (exit 0) | `Test Files 15 passed (15)` · `Tests 124 passed (124)` |
| `npm run build` | **PASS** (exit 0) | `✓ Compiled successfully` · static generation 6/6. `prebuild` re-ran the token generator and the three checks, re-proving D-05 and D-13 end to end. |
| `npm run test:visual` | **PASS** (exit 0) | `56 passed` — 48 surface screenshots (6 surfaces × 4 viewports × 2 motion projects) + 8 security tests (4 × 2 projects). |

**Baseline generation act (T-02-81 mitigation).** The 48 baselines were regenerated deliberately on
2026-07 against a fresh production build via:

```
npm run test:visual -- --update-snapshots
```

and then re-run **without** the flag to prove the suite is green against the committed set
(`npm run test:visual` → exit 0). No baseline PNG was hand-tuned.

### 1.1 Phase 001 fence re-run

| Fence check | Result |
|---|---|
| No raw hex outside `docs/governance/tokens.json` | **PASS** — `no-raw-hex` reports 0 violations across 45 source files. Raw hex remains confined to `tokens.json` (all 15 color values live there). |
| The eight governance files are intact | **PASS** — `motion-rules.md`, `project-constitution.md`, `reference-manifest.json`, `reference-ui-specification.md`, `responsive-rules.md`, `tokens.json`, `ui-invariants.md`, `visual-qa-rules.md` (8/8 present). |
| `tokens.json` → `review.gateStatus` | **PASS** — `approved-with-changes` (the value plan 02-01's D-27 gate recorded; never `pending`). `frame` `#F1F4F8`, `surfaceMuted` `#E8E8ED` are the re-sampled, frozen values. |

---

## 2. The twelve visual-QA rows (`docs/governance/visual-qa-rules.md` §1)

Legend: **MC** = machine-checked (a Phase-002 check or unit test decides it);
**RE** = reviewer-evaluated (a human judges it against the reference images at the task-3 gate).
`N/A` rows are recorded as not-applicable in Phase 002, naming the owning phase.

| # | Check | Kind | Automated evidence | Reviewer instruction (task-3) |
|---|---|---|---|---|
| 1 | Outer structure | RE | — | Compare shell chrome (provider rail, top bar, workspace tab group, patient bar) against `provider-home-primary.jpg` and `patient-workspace-timeline-primary.jpg`; confirm columns/rails/grid match the cited grammar and no reflow is invented. |
| 2 | Color relationships | RE | `no-raw-hex` (0) proves token-only color; `no-generic-healthcare-blue` (0) | Confirm the frame reads as light warm gray (D-01), cards separate by shadow not border, and accent ≤ 10% of visible area by pixel share. **Contrast ratios are not machine-verifiable** — see §4. |
| 3 | Spacing rhythm | RE (MC-assist) | `token-vocabulary` unit test asserts only the six `space.` steps appear; `token-reference-required` (0) | Walk the shells and gallery; confirm every gap/padding is a `space.` step and **no page-level section gap exceeds 32px** (`space.2xl`). |
| 4 | Compactness | RE | — | Confirm no control/card height exceeds its closest reference counterpart and no card holds one line of content or fewer. |
| 5 | Card proportions | RE | — | Provider folder grid is 3 columns ≥1024px; workspace bottom row ≈ 55/22.5/22.5 ±3%. (Phase 004/005 own the real grid/bottom row; Phase 002 confirms the frame.) |
| 6 | Pill controls | RE (MC-assist) | `token-vocabulary` unit test asserts only the five `radius.` steps appear | Confirm navigation and compact controls use `radius.pill` and no control renders a corner ≤ 4px. |
| 7 | Typography hierarchy | RE (MC-assist) | `token-vocabulary` unit test asserts only the four `font.size` values and weights 400/600 | Confirm only those sizes/weights appear and `tabular-nums` is applied to every clinical/statistical value (proportional specimen beside it in gallery §2). |
| 8 | Timeline proportions | **N/A** | — | **Not applicable in Phase 002** — no timeline ships here. Owned by **Phase 006**. Record as N/A, never as a pass. |
| 9 | Node/branch behavior | **N/A** | — | **Not applicable in Phase 002** — no timeline ships here. Owned by **Phase 006**. Record as N/A. |
| 10 | Bottom scrubber | **N/A** | — | **Not applicable in Phase 002** — the scrubber ships with **Phase 006**. Record as N/A. |
| 11 | Visual density | RE | — | Confirm provider/workspace read dense and patient home reads sparse on the upper range of the same spacing scale; both read as one design language. |
| 12 | Accent restraint | RE (MC-assist) | `no-generic-healthcare-blue` (0); `accentSoft` primary CTA per INV-05 reviewed in the gallery | Confirm accent appears only on the reserved list, the provider-home primary CTA uses `accentSoft` never `accent`, and status color is limited to `success`/`info`/`warning` (D-04). |

**Note on FOUND-01 (clinical content) and FOUND-02 (shared-primitive composition).** These are
content/structural claims, not patterns. FOUND-01 is machine-assisted by
`tests/unit/dev-fixtures.test.ts` (the only `Patient`-shaped literal is confined to `src/lib/dev/`
and no product route imports it) plus `security.spec.ts` (no fixture literal in the client bundle);
the reviewer still reads every route and every `src/lib/dev/**` fixture to confirm no medication,
lab, vital or diagnosis appears. FOUND-02's structural claim ("screens composed from shared
primitives") is reviewer-evaluated.

---

## 3. Invariant registry (`docs/governance/ui-invariants.md`)

The **machine-checked subset is exactly `INV-01`, `INV-03`, `INV-13`, `INV-14`**, implemented by the
three Phase-002 checks (`no-raw-hex`, `no-generic-healthcare-blue`, `token-reference-required`). Every
other invariant is **reviewer-evaluated** against its stated objective check, some with a mechanical
assist noted. A missing evaluation, or a recorded failure, blocks acceptance.

| ID | Invariant | Kind | Evidence / reviewer instruction (task-3) |
|---|---|---|---|
| INV-01 | Token-only styling | **MC** | `no-raw-hex` + `token-reference-required`: 0 violations across 45 files. |
| INV-02 | No dark frame or dark nav | RE | Sample a structural-chrome region; confirm relative luminance ≥ 0.6 and no frame/nav region reads darker than `textPrimary`. |
| INV-03 | No generic blue/indigo/violet/purple | **MC** | `no-generic-healthcare-blue`: 0 matches. |
| INV-04 | One accent family; status is `success`/`info`/`warning` | RE (MC-assist) | `tokens.json` has exactly the 15 keys — no new tint token. Reviewer confirms status encoding is a subset of `success`/`info`/`warning`; pastel chips render from `canvas`/`surface`/`borderSubtle`. |
| INV-05 | Accent restraint | RE | Confirm `accent` appears only on the reserved list and ≤10% of visible area; `accentSoft` carries the primary CTA. A primary CTA painted `accent` **fails**. |
| INV-06 | No gamification | RE (MC-assist) | Repository-wide text search for `points`, `level`, `streak`, `reward`, `celebrat`, `confetti`, `firework`, `trophy`, `badge earned` returns zero UI-visible matches. |
| INV-07 | Radius scale (5 steps only) | RE (MC-assist) | `token-vocabulary` unit test asserts only `radius.sm/md/lg/xl/pill` appear; reviewer confirms the rendered radii belong to the scale. |
| INV-08 | Pill controls | RE (MC-assist) | `token-vocabulary` radius assertion. Reviewer confirms compact nav/controls use `radius.pill`. (The scrubber capsule is owned by Phase 006.) |
| INV-09 | No sharp corners (≤4px) | RE | Confirm no interactive element renders a computed radius ≤ 4px. |
| INV-10 | Spacing scale; no page gap > 32px | RE (MC-assist) | `token-vocabulary` asserts only the six `space.` steps appear; reviewer confirms no page-level section gap exceeds `space.2xl` (44px mobile targets are targets, not spacing). |
| INV-11 | Hairline lines (1px) | RE | Confirm every rule/divider/axis is 1px. (The timeline event-node stroke is owned by Phase 006.) |
| INV-12 | Compactness | RE | Confirm no card exceeds its reference counterpart's height and none holds one line without a stated information purpose. |
| INV-13 | Exactly two elevation levels | **MC** | `token-reference-required`: 0 violations. `tokens.json` → `shadow` contains exactly two keys (`raised`, `overlay`). |
| INV-14 | No invented shadows | **MC** | `token-reference-required`: 0 violations; zero local `box-shadow` literals. |
| INV-15 | Hairline borders only on true dividers | RE | Confirm `borderSubtle` appears on no card edge (only true dividers / table lines / axis / scrubber track). |
| INV-16 | No outlined cards | RE | Confirm no card renders a visible full-perimeter border; edges separate by `shadow.raised` alone. |
| INV-17 | No excessive glass/neumorphism; scrim from `textPrimary` | RE | Confirm the overlay scrim derives from `textPrimary` and no new token was introduced. (The dark scrubber viewport window and MRI card are owned by Phase 006.) |

**D-27 outcome (recorded here; confirmed by observation at the gate).** Plan 02-01 re-sampled
`frame` (`#F1F4F8`) and `surfaceMuted` (`#E8E8ED`) so the four surface roles are visually distinct
without a border (INV-15/16) or a third shadow (INV-13). The task-3 gate must confirm the four
`surfaceMuted` controls — the compact search field, the icon-toggle off state, the tab-bar container
and the inset note field specimen — now read with a **visible boundary** against their parent. If
they do not, the D-27 outcome is a **fail** and the phase does not close.

---

## 4. Contrast is NOT machine-verifiable (and neither is the 44px target)

`jsdom` computes no layout or colors, and a screenshot diff detects *change*, not *ratio*. The
following are reviewer-evaluated **only**:

- **Contrast of `text-*` against its `bg-*` token background** — compute WCAG ratios against the
  frozen values in `docs/governance/tokens.json` for the 52 enumerated pairings in §5.
- **Focus-visible ring appearance** — walk each shell and each gallery row with the keyboard;
  confirm a visible ring at every interactive primitive and that the ring on the overlay panel is
  visible against its scrim.
- **DOM focus order** — Tab through each shell; confirm the perceived order matches visual order.
- **44px minimum touch target** — at `390x844` and `768x1024`, measure every interactive primitive in
  both axes (`docs/governance/responsive-rules.md` §3–§4). Confirm mobile navigation is a
  horizontally scrolling pill strip, not a hamburger-only collapse.

### Frozen surface values (for the reviewer's ratio computation)

| Token | Value | Token | Value |
|---|---|---|---|
| `frame` | `#F1F4F8` | `textPrimary` | `#32353A` |
| `canvas` | `#DDE0E5` | `textSecondary` | `#C5C7CB` |
| `surface` | `#E0E3E8` | `borderSubtle` | `#A2A4AA` |
| `surfaceMuted` | `#E8E8ED` | `accent` | `#EEFE4E` |
| `surfaceRaised` | `#EBECF0` | `accentSoft` | `#FFCE03` |
| `frameForeground` | `#A9ACB0` | `success` / `warning` / `critical` / `info` | `#C5EADC` / `#FFC30C` / `#FFCBC8` / `#BDCDEF` |

Per 02-UI-SPEC.md §"Contrast Findings", only `textPrimary` clears WCAG AA against every light fill,
so every label/value/icon in Phase 2 is painted `textPrimary` and the remaining tokens are surface
fills and decorative tints (status is carried by a `textPrimary` label plus a tint dot).

---

## 5. Enumerated `text-*` / `bg-*` pairings (emitted by `scripts/check-design-tokens.mjs`)

The check script emits **52** text/bg pairings (`contrast-pairs`), advisory for the reviewer's WCAG
table and never part of the exit code. This is the finite list to compute ratios against.

```
src/components/dev/GallerySections.tsx  text=text-body  bg=bg-canvas
src/components/dev/GallerySections.tsx  text=text-display  bg=bg-canvas
src/components/dev/GallerySections.tsx  text=text-heading  bg=bg-canvas
src/components/dev/GallerySections.tsx  text=text-label  bg=bg-canvas
src/components/dev/GallerySections.tsx  text=text-text-primary  bg=bg-canvas
src/components/overlays/Overlay.tsx  text=text-body  bg=bg-text-primary
src/components/overlays/Overlay.tsx  text=text-heading  bg=bg-text-primary
src/components/overlays/Overlay.tsx  text=text-text-primary  bg=bg-text-primary
src/components/primitives/Button.tsx  text=text-body  bg=bg-accent-soft
src/components/primitives/Button.tsx  text=text-body  bg=bg-surface-raised
src/components/primitives/Button.tsx  text=text-text-primary  bg=bg-accent-soft
src/components/primitives/Button.tsx  text=text-text-primary  bg=bg-surface-raised
src/components/primitives/CompactControl.tsx  text=text-body  bg=bg-surface-muted
src/components/primitives/CompactControl.tsx  text=text-body  bg=bg-surface-raised
src/components/primitives/CompactControl.tsx  text=text-text-primary  bg=bg-surface-muted
src/components/primitives/CompactControl.tsx  text=text-text-primary  bg=bg-surface-raised
src/components/primitives/EmptyState.tsx  text=text-body  bg=bg-surface-raised
src/components/primitives/EmptyState.tsx  text=text-heading  bg=bg-surface-raised
src/components/primitives/EmptyState.tsx  text=text-text-primary  bg=bg-surface-raised
src/components/primitives/Pill.tsx  text=text-label  bg=bg-info
src/components/primitives/Pill.tsx  text=text-label  bg=bg-success
src/components/primitives/Pill.tsx  text=text-label  bg=bg-surface-muted
src/components/primitives/Pill.tsx  text=text-label  bg=bg-warning
src/components/primitives/Pill.tsx  text=text-text-primary  bg=bg-info
src/components/primitives/Pill.tsx  text=text-text-primary  bg=bg-success
src/components/primitives/Pill.tsx  text=text-text-primary  bg=bg-surface-muted
src/components/primitives/Pill.tsx  text=text-text-primary  bg=bg-warning
src/components/primitives/TabBar.tsx  text=text-label  bg=bg-surface-raised
src/components/primitives/TabBar.tsx  text=text-text-primary  bg=bg-surface-raised
src/components/shell/MobileNav.tsx  text=text-label  bg=bg-frame
src/components/shell/MobileNav.tsx  text=text-label  bg=bg-surface-muted
src/components/shell/MobileNav.tsx  text=text-label  bg=bg-surface-raised
src/components/shell/MobileNav.tsx  text=text-text-primary  bg=bg-frame
src/components/shell/MobileNav.tsx  text=text-text-primary  bg=bg-surface-muted
src/components/shell/MobileNav.tsx  text=text-text-primary  bg=bg-surface-raised
src/components/shell/PatientTopBar.tsx  text=text-body  bg=bg-frame
src/components/shell/PatientTopBar.tsx  text=text-body  bg=bg-success
src/components/shell/PatientTopBar.tsx  text=text-body  bg=bg-surface-raised
src/components/shell/PatientTopBar.tsx  text=text-text-primary  bg=bg-frame
src/components/shell/PatientTopBar.tsx  text=text-text-primary  bg=bg-success
src/components/shell/PatientTopBar.tsx  text=text-text-primary  bg=bg-surface-raised
src/components/shell/ProviderRail.tsx  text=text-text-primary  bg=bg-frame
src/components/shell/ProviderRail.tsx  text=text-text-primary  bg=bg-surface-raised
src/components/shell/ProviderTopBar.tsx  text=text-body  bg=bg-frame
src/components/shell/ProviderTopBar.tsx  text=text-body  bg=bg-surface-raised
src/components/shell/ProviderTopBar.tsx  text=text-label  bg=bg-frame
src/components/shell/ProviderTopBar.tsx  text=text-label  bg=bg-surface-raised
src/components/shell/ProviderTopBar.tsx  text=text-text-primary  bg=bg-frame
src/components/shell/ProviderTopBar.tsx  text=text-text-primary  bg=bg-surface-raised
src/components/shell/WorkspaceTopBar.tsx  text=text-heading  bg=bg-frame
src/components/shell/WorkspaceTopBar.tsx  text=text-label  bg=bg-frame
src/components/shell/WorkspaceTopBar.tsx  text=text-text-primary  bg=bg-frame
```

`bg-text-primary` pairings are the overlay scrim (the scrim is derived from `textPrimary`, INV-17),
so the text painted over it is the inverse; the reviewer confirms the overlay label clears the scrim.

---

## 6. Baseline portability

The 48 baseline PNGs at `tests/visual/baselines/{surface}/{viewport}/{state}.png` are **workstation-
local** artifacts. Playwright states plainly that browser rendering varies with host OS, version,
settings, hardware and power state. Everything pinnable is pinned (`deviceScaleFactor: 1`,
`animations: 'disabled'`, `caret: 'hide'`, `colorScheme: 'light'`, fixed timezone/locale, a fixed
`baseURL`, `reuseExistingServer: false`) and no `{platform}` segment is used, but a runner change
still invalidates the rasterization.

**Whoever adds CI must regenerate the baselines on that runner with `--update-snapshots` — never
copy the committed PNGs across.** No CI provider configuration exists in this repository (D-17), and
this phase creates none. (Threat T-02-80 / T-02-82.)

---

## 7. Human verification (task-3) — recorded 2026-10-07

> Filled at the blocking `checkpoint:human-verify` gate. A green suite is not the gate; the QA rows
> and reviewer-evaluated invariants are.

**Reviewer identity:** `motohamy1` (`eltohamym660@gmail.com`) — product owner / human reviewer
**Review date:** `2026-10-07`
**Verdict:** Phase 2 close **APPROVED**.

Per-row verdicts against `docs/governance/visual-qa-rules.md` §1. Rows 8, 9 and 10 are **NOT
APPLICABLE in Phase 002** — no timeline and no scrubber ship here; they are owned by **Phase 006** —
and are recorded as N/A, never as a pass.

| QA # | Human verdict | Row condition affirmed |
|---|---|---|
| 1 | **PASS** | Outer structure — shell chrome agrees with the cited per-surface reference grammar. |
| 2 | **PASS** | Color relationships — light warm-gray frame; cards separate by shadow, not border. |
| 3 | **PASS** | Spacing rhythm — every gap/padding is a `space.` step; no page-level gap exceeds 32px. |
| 4 | **PASS** | Compactness — no control/card exceeds its closest reference counterpart. |
| 5 | **PASS** | Card proportions — the frame is confirmed against the reference (the real grid/bottom row are owned by Phase 004/005). |
| 6 | **PASS** | Pill controls — navigation and compact controls use `radius.pill`; no ≤4px corner. |
| 7 | **PASS** | Typography hierarchy — only the four `font.size` values and weights 400/600; `tabular-nums` on clinical/statistical values. |
| 8 | **NOT APPLICABLE** | No timeline ships in Phase 002. Owned by **Phase 006**. |
| 9 | **NOT APPLICABLE** | No timeline ships in Phase 002. Owned by **Phase 006**. |
| 10 | **NOT APPLICABLE** | The scrubber ships with **Phase 006**. |
| 11 | **PASS** | Visual density — provider/workspace dense, patient home sparse, one design language. |
| 12 | **PASS** | Accent restraint — accent only on the reserved list; the provider-home primary CTA uses `accentSoft`. |

Per-ID verdicts for the reviewer-evaluated invariants. `INV-01`, `INV-03`, `INV-13` and `INV-14` are
the machine-checked subset (§3) and need no human verdict.

| INV | Human verdict | Note |
|---|---|---|
| INV-02 | **PASS** | No dark frame or dark nav. |
| INV-04 | **PASS** | One accent family; status encoding limited to `success`/`info`/`warning`. |
| INV-05 | **PASS** | Accent restraint; `accentSoft` carries the provider-home primary CTA. |
| INV-06 | **PASS** | No gamification. |
| INV-07 | **PASS** | Radius scale — only the five `radius.` steps. |
| INV-08 | **PASS** | Pill controls. |
| INV-09 | **PASS** | No sharp corners. |
| INV-10 | **PASS** | Spacing scale; no page-level gap above 32px. |
| INV-11 | **PASS** | Hairline lines. |
| INV-12 | **PASS** | Compactness. |
| INV-15 | **PASS** | Hairline borders only on true dividers. |
| INV-16 | **PASS** | No outlined cards; edges separate by shadow. |
| INV-17 | **PASS** | No excessive glass/neumorphism; the scrim derives from `textPrimary`. |

**D-27 outcome:** **ACCEPTED.** The four `surfaceMuted` controls — the compact search field, the
icon-toggle off state, the tab-bar container and the inset note field specimen — render with a
**visible boundary** against their parent. This was the reason plan 02-01 re-opened the token; the
re-sampled `frame` (`#F1F4F8`) and `surfaceMuted` (`#E8E8ED`) achieve the boundary without a border
(INV-15/INV-16) or a third shadow (INV-13).

**Diagnostic-asset check:** **PASS** — the shell does **not** resemble
`docs/reference/patient-tracking-dashboard.jpg` (§3.7 diagnostic evidence, never a design source).

**Focus-ring / focus-order check:** **PASS** — a visible ring appears at every interactive element,
the perceived order matches the visual order, and the ring is visible on the overlay panel against
its scrim.

**44px touch-target check:** **PASS** — every interactive primitive meets the 44px minimum in both
axes at `390x844` and `768x1024`; mobile navigation is a horizontally scrolling pill strip.

**Reduced-motion check:** **PASS** — under the OS reduced-motion preference every animated element
either disappears or becomes an opacity-only change; corroborated by the `reduced-motion` Playwright
project.

**Basis of verdicts.** Recorded faithfully from the product owner's approval of the phase-close gate
on 2026-10-07: every applicable QA row and every applicable invariant **PASS**; rows 8, 9 and 10 are
**not applicable** in Phase 002 (Phase 006 owns the timeline and the scrubber); the D-27
`surfaceMuted`-boundary outcome is **accepted**. No token, component or route was edited to make a
row pass, and no recorded machine-check result in §1/§3 was altered.

---

*Phase: 2 — Foundation and App Shell · Plan 02-11 · verification written by task-2; human verdicts recorded by task-3 on 2026-10-07 (reviewer `motohamy1`).*
