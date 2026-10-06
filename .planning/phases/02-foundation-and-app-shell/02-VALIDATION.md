---
phase: 2
slug: foundation-and-app-shell
status: active
nyquist_compliant: true
waves: 10
wave_0_complete: false
created: 2026-10-06
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Derived from `02-RESEARCH.md` § Validation Architecture.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 5.0.3 (unit/integration) + Playwright 1.63.0 (visual). Two configs, never merged — `STACK.md` §Version Compatibility requires separate configs. |
| **Config file** | `vitest.config.ts` (❌ does not exist — Wave 0), `playwright.config.ts` (❌ does not exist — Wave 0) |
| **Quick run command** | `npm run lint && npx vitest run tests/unit` |
| **Full suite command** | `npm run lint && npx vitest run && npm run test:visual` |
| **Estimated runtime** | ~45s unit · +~3 min visual suite (production build + Chromium) |

---

## Sampling Rate

- **After every task commit:** Run `npm run lint && npx vitest run tests/unit`
- **After every plan wave:** Run `npm run lint && npx vitest run`
- **Before `/gsd:verify-work`:** Full suite green, **plus** the 12-row `docs/governance/visual-qa-rules.md` §1 checklist and every applicable `INV-xx` evaluation recorded in the phase artifact. A green suite is **not** the gate — `PRODUCT-MASTER-SPEC.md` §27 makes "declaring a feature complete solely because the build passes" a hard prohibition.
- **Max feedback latency:** 60 seconds (unit path)

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| T-02-01-1 | 02-01 task-1 | 1 | FOUND-03 | — | Both token re-samples produced ≥5 disjoint windows, each `maxDelta ≤ 2` and `subScanSpread ≤ 4`, with all three pairwise contrast ratios > 1 | measurement | `ffmpeg -version && ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=p=0 docs/reference/patient-workspace-timeline-primary.jpg` | ❌ created in-task | ⬜ pending |
| T-02-01-2 | 02-01 task-2 | 1 | FOUND-03 | — | The 13 other color tokens, and every radius/space/font/shadow/motion value, are byte-identical after the re-open (D-27, INV-01); no token key added or removed | unit | `node -e "const t=require('./docs/governance/tokens.json');const f=t.color.frame,m=t.color.surfaceMuted,s=t.color.surface;console.log(f!==s&&m!==s&&f!==m&&Object.keys(t.color).length===15?'TOKENS-REOPEN-OK':'TOKENS-REOPEN-BAD')"` | ❌ W1 `docs/governance/tokens.json` | ⬜ pending |
| T-02-01-3 | 02-01 task-3 | 1 | FOUND-03 | — | `review.gateStatus` is `approved-with-changes` or `reopened-rejected`, never `pending`; the downstream `resume:02-03` signal is recorded | human + file | `node -e "const t=require('./docs/governance/tokens.json');console.log(t.review.gateStatus)"` | ❌ W1 | ⬜ pending |
| T-02-02-1 | 02-02 task-1 | 1 | FOUND-01 | V10 Supply chain | Thirteen pinned packages, no forbidden dependency, lockfile committed, Chromium installed | build + install | `node -e "const p=require('./package.json');const need=['predev','dev','prebuild','build','start','lint','tokens:generate','tokens:check','test','test:visual'];console.log(need.every(k=>k in p.scripts)?'SCRIPTS-OK':'SCRIPTS-BAD')" && npx playwright install --dry-run chromium` | ❌ W1 `package.json` | ⬜ pending |
| T-02-02-2 | 02-02 task-2 | 1 | FOUND-01 | V14 Configuration | Generated token CSS/TS are uncommittable (D-06); `predev`/`prebuild` fail loudly until 02-03 lands | config | `node -e "const t=require('./tsconfig.json');console.log(t.compilerOptions.strict===true&&t.compilerOptions.paths['@/*'][0]==='./src/*'?'TSCONFIG-OK':'TSCONFIG-BAD')" && grep -q "src/styles/tokens.generated.css" .gitignore` | ❌ W1 `tsconfig.json` | ⬜ pending |
| T-02-03-1 | 02-03 task-1 | 2 | FOUND-02 | — | Generated token-utility vocabulary is derived from `tokens.json`, never hardcoded; no `var()` self-reference; `:root` emitted even for an unused token (D-05, D-08) | unit | `npm run tokens:generate && npx vitest run tests/unit/scripts/generate-tokens.test.mjs` | ❌ W2 `tests/unit/scripts/generate-tokens.test.mjs` | ⬜ pending |
| T-02-03-2 | 02-03 task-2 | 2 | FOUND-04 | — | One root layout, self-hosted Inter at exactly two weights (D-19/D-20), and the `:focus-visible` baseline declared once in `globals.css` | build | `npm run tokens:generate && npx vitest run tests/unit/scripts/generate-tokens.test.mjs` | ❌ W2 `src/app/layout.tsx` | ⬜ pending |
| T-02-04-1 | 02-04 task-1 | 3 | FOUND-03 | — | One zero-dependency Node script enforces all three checks (D-09); no ESLint; no `--fix` (D-12); the URL-anchor false-positive filter is implemented, not merely intended | lint | `npm run lint && node -e "const s=require('fs').readFileSync('scripts/check-design-tokens.mjs','utf8');console.log(s.includes('token-namespaces')&&s.includes('no-raw-hex')&&s.includes('token-reference-required')?'CHECKS-OK':'CHECKS-BAD')"` | ❌ W3 `scripts/check-design-tokens.mjs` | ⬜ pending |
| T-02-04-2 | 02-04 task-2 | 3 | FOUND-03 | — | Only the four font sizes, two weights, six spacing and five radius steps appear in `src/`; the derived utility list matches `tokens.json` and changes when a token is added | unit | `npx vitest run tests/unit/scripts/check-design-tokens.test.mjs tests/unit/scripts/token-vocabulary.test.mjs` | ❌ W3 | ⬜ pending |
| T-02-05-1 | 02-05 task-1 | 4 | FOUND-02 | — | `Surface` renders all four variants with only the two frozen shadows; `Icon` sets `strokeWidth` 1.5 on the wrapper and omits it from props (D-21, INV-13/16) | unit | `npx vitest run tests/unit/primitives` | ❌ W4 `tests/unit/primitives/Surface.test.tsx` | ⬜ pending |
| T-02-05-2 | 02-05 task-2 | 4 | UX-06 | — | `Button` has four variants, `primary` filled with `accentSoft` (INV-05), a required accessible name on `iconOnly` (D-19), and 44px below the 768px edge | unit + build | `npm run build` | ❌ W4 `src/components/primitives/Button.tsx` | ⬜ pending |
| T-02-05-3 | 02-05 task-3 | 4 | FOUND-02 | Information disclosure | Every primitive renders and references ≥1 generated token utility, asserted against parsed DOM via `react-dom/server`; **no `@testing-library/*` dependency is introduced** | unit + build | `npx vitest run tests/unit/primitives && grep -rn "@testing-library" tests/ package.json \| wc -l` returns 0 | ❌ W4 | ⬜ pending |
| T-02-06-1 | 02-06 task-1 | 5 | FOUND-05 | — | Every animation site reads its duration and curve from `src/lib/motion.ts`; the reduced branch is opacity-only at the fastest tokenized duration | unit | `npx vitest run tests/unit/motion && npm run lint` | ❌ W5 `tests/unit/motion/reduced-motion.test.tsx` | ⬜ pending |
| T-02-06-2 | 02-06 task-2 | 5 | FOUND-02 | — | The inset fill is gate-selected: `bg-surface-muted` per UI-SPEC §5.3/§5.4 on the approved path, `INSET_FILL` (`surfaceRaised` + `shadow-raised`) on `reopened-rejected` (D-27) | lint + file | `npm run lint && node -p "require('./docs/governance/tokens.json').review.gateStatus"` selects the asserted branch | ❌ W5 | ⬜ pending |
| T-02-06-3 | 02-06 task-3 | 5 | FOUND-04 | — | Status is never hue alone; active and inactive tabs carry the same ink; no compact control renders a border (INV-15) | unit | `npx vitest run tests/unit/primitives && npm run lint` | ❌ W5 | ⬜ pending |
| T-02-07-1 | 02-07 task-1 | 6 | FOUND-02 | — | One shared `EmptyState` with three slots; no shell route renders an action (D-04, D-24) | unit | `npx vitest run tests/unit/primitives` | ❌ W6 `tests/unit/primitives/EmptyState.test.tsx` | ⬜ pending |
| T-02-07-2 | 02-07 task-2 | 6 | FOUND-04 | — | Focus trap wraps Tab/Shift+Tab; scroll lock is applied and released; restoration is guarded by a connectedness check | unit (jsdom) | `npx vitest run tests/unit/overlays` | ❌ W6 `tests/unit/overlays/focus-trap.test.tsx` | ⬜ pending |
| T-02-07-3 | 02-07 task-3 | 6 | FOUND-04 | — | `Overlay` is one primitive with two presentations; Escape closes, focus restores to trigger, background is `inert` while open (D-22/D-23) | unit | `npx vitest run tests/unit/overlays` | ❌ W6 | ⬜ pending |
| T-02-08-1 | 02-08 task-1 | 7 | FOUND-02 | — | Provider rail, top bar and mobile nav compose existing primitives and introduce no new token | lint | `npm run lint && node -e "…"` hex-literal sweep over `src/components/shell/*.ts` | ❌ W7 `src/components/shell/ProviderRail.tsx` | ⬜ pending |
| T-02-08-2 | 02-08 task-2 | 7 | FOUND-01 | ASVS V5 | Exactly 10 provider `page.tsx` files (1 home + 1 redirect + 8 tabs); each D-01 URL renders 200 with its layout frame and a typed empty state; `[patientId]` is never passed to a query, path, template or log; no `middleware.ts` | build + e2e | `npm run build && npm run lint` | ❌ W7 `src/app/(provider)/**` | ⬜ pending |
| T-02-09-1 | 02-09 task-1 | 8 | FOUND-01 | — | `/login`, `/patient` and `/patient/home` render typed empty states with no action; the `(auth)` group is bare; `/` resolves to the root `not-found.tsx` (D-02, D-04) | build | `npm run build && npm run lint` | ❌ W8 `src/app/(patient)/**` | ⬜ pending |
| T-02-09-2 | 02-09 task-2 | 8 | FOUND-01 | Information disclosure | `src/lib/dev/**` is the only directory permitted a `Patient`-shaped literal, and no fixture module is reachable from a product route (D-18, ASVS V8) | unit | `npx vitest run tests/unit/dev-fixtures.test.ts && npm run build` | ❌ W8 `tests/unit/dev-fixtures.test.ts` | ⬜ pending |
| T-02-10-1 | 02-10 task-1 | 9 | FOUND-01 | V14 Configuration | The dev gallery 404s under a production server started without `ALLOW_DEV_ROUTES`; the gate is called in the render path and the variable is confined to one file under `src/` (D-26) | unit | `npx vitest run tests/unit/dev-route-gate.test.ts && ls .env .env.production` | ❌ W9 `tests/unit/dev-route-gate.test.ts` | ⬜ pending |
| T-02-10-2 | 02-10 task-2 | 9 | FOUND-02 | Information disclosure | The gallery carries no patient name, identifier, medication, vital, lab name or specialty; no multi-hue chart colour; the enabled `EmptyState` action exists only here | lint | `npm run lint` (plus the ten-section order and zero-match content greps) | ❌ W9 `src/components/dev/GallerySections.tsx` | ⬜ pending |
| T-02-11-1 | 02-11 task-1 | 10 | FOUND-03 | V14 Configuration / V8 Data Protection | Dev gallery 404s under the production server; built client bundle makes zero off-origin requests; no fixture literal reaches the bundle; all 48 baselines exist at `{surface}/{viewport}/{state}.png` and every surface path is a D-01 locked URL | e2e | `npm run test:visual && find tests/visual/baselines -name "*.png" \| wc -l` returns 48 | ❌ W10 `tests/visual/**` | ⬜ pending |
| T-02-11-2 | 02-11 task-2 | 10 | FOUND-01…FOUND-05, UX-06 | — | Full phase gate: lint, unit suite, production build and visual suite all green together | full suite | `npm run lint && npx vitest run && npm run build && npm run test:visual` | ❌ W10 | ⬜ pending |
| T-02-11-3 | 02-11 task-3 | 10 | UX-06, FOUND-03, FOUND-04 | — | Twelve QA rows and every applicable `INV-xx` reviewed by a human against the reference images; rows 8–10 marked not-applicable with Phase 006 as owner | **human checkpoint (blocking)** | *none by design — `PRODUCT-MASTER-SPEC.md` §27 forbids closing on a green suite alone* | n/a | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*
*Task IDs are assigned by the planner; this table fixes the requirement→verification binding so the planner cannot drop one.*
*`nyquist_compliant: true` because every `type="auto"` task carries a runnable `<verify><automated>` command and no task defers to a missing test. The single exception is `T-02-11-3`, which is a `checkpoint:human-verify` gate by design: §27 makes the human rows the acceptance criterion, so claiming an automated verify for it would be the false claim this document exists to prevent.*
*Wave numbering (10 waves): 1 = `02-01`, `02-02`; 2 = `02-03`; 3 = `02-04`; 4 = `02-05`; 5 = `02-06`; 6 = `02-07`; 7 = `02-08`; 8 = `02-09`; 9 = `02-10`; 10 = `02-11`. Each wave is `max(depends_on) + 1`. **Exactly one plan per wave runs `npm run build`** — 02-08 and 02-09 were split precisely so concurrent production builds cannot fight over `.next/`.*

---

## Wave 0 Requirements

- [ ] `vitest.config.ts` — two environments: `node` for `tests/unit/scripts/**`, `jsdom` for `tests/unit/{primitives,overlays,motion}/**`; `@vitejs/plugin-react`; `resolve.alias` for `@/*`
- [ ] `playwright.config.ts` — two projects (`default`, `reducedMotion: 'reduce'`), four viewports, `snapshotPathTemplate`, `expect.toHaveScreenshot` tolerance (`maxDiffPixelRatio: 0.01`, `threshold: 0.2`), `webServer` running a production build
- [ ] `tests/unit/scripts/generate-tokens.test.mjs` — emitted `@theme inline` and `:root` blocks contain every token, kebab-cased, with no `var()` self-reference; `:root` emitted even for a token no utility uses
- [ ] `tests/unit/scripts/check-design-tokens.test.mjs` — one fixture per check that must fail, plus false-positive fixtures (`href="#abcdef"` must **not** fail)
- [ ] `tests/unit/scripts/token-vocabulary.test.mjs` — derived utility list matches `tokens.json`; adding a token to a fixture JSON changes the list
- [ ] `tests/unit/primitives/*.test.tsx` — `Surface` renders all four variants and only the two shadow tokens; `EmptyState` with and without action; `Icon` renders `stroke-width="1.5"`
- [ ] `tests/unit/overlays/focus-trap.test.tsx` — Tab wraps, Shift+Tab wraps, Escape calls `onClose`, focus restores to trigger, background `inert` while open and not after close
- [ ] `tests/unit/motion/reduced-motion.test.tsx` — with `useReducedMotion` mocked true, the variants object is opacity-only and its duration is `duration.fast`
- [ ] `tests/visual/surfaces.spec.ts` — the surfaces × 4 viewports × 2 projects loop, plus `gallery-hidden` and `no-egress` assertions
- [ ] Framework install: `npm i -D vitest @vitejs/plugin-react jsdom @playwright/test && npx playwright install chromium`

*`@playwright/test` does not fetch browsers via postinstall (verified empty postinstall) — `npx playwright install chromium` is a required explicit step.*

---

## Manual-Only Verifications

These are **not** automatable and must not be pretended otherwise. `docs/governance/ui-invariants.md` states the machine-enforceable subset is only `INV-01`, `INV-03`, `INV-13`, `INV-14`; everything else is reviewer-evaluated.

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Contrast of `text-*` against its `bg-*` token background | FOUND-04 | jsdom computes no layout or colors; a screenshot diff detects *change*, not *ratio* | Enumerate every `text-*`/`bg-*` pairing a primitive uses, compute WCAG ratios against `docs/governance/tokens.json`, record per-pair. Assist: the check script can enumerate the pairings so the reviewer works from a finite list. |
| Focus-visible ring appearance | FOUND-04 | A unit test can assert `tabIndex` sequence but not the rendered ring | Walk the shell with keyboard only; confirm a visible ring at every interactive primitive and that it meets contrast against its token background. |
| DOM focus order | FOUND-04 | Order is assertable in the DOM; the *perceived* order is not | Tab through each empty shell; confirm order matches visual order. |
| 44px minimum touch target | UX-06 | Requires measuring rendered geometry at mobile viewports | At `390x844` and `768x1024`, measure every interactive primitive in both axes per `docs/governance/responsive-rules.md` §3–§4. |
| "No fake clinical dashboard or sample patient data" | FOUND-01 | A judgment about content, not a pattern | Read every route and every `src/lib/dev/**` fixture; confirm no medications, labs, vitals or diagnoses appear. Assist: assert `src/lib/dev/**` is the only directory permitted a `Patient`-shaped literal. |
| "Screens composed from shared primitives, not bespoke components" | FOUND-02 | A structural claim about 20 future phases | Review each shell's composition against the primitive set; flag any per-screen component that should have been a primitive. |
| Surfaces separate by shadow, not border | FOUND-03 | "No card renders a visible full-perimeter border" is a rendered-appearance claim (INV-16) | Inspect the gallery at all four viewports; confirm card edges separate by `shadow.raised` alone. |
| 12-row visual QA checklist | `PRODUCT-MASTER-SPEC.md` §21 | Requires human visual judgment against the reference images | Run `docs/governance/visual-qa-rules.md` §1 row by row at the design gate; record pass/fail per row. |
| INV evaluation | `ui-invariants.md` §5 | Four invariants are machine-checked; `INV-02`, `INV-04`–`INV-12`, `INV-15`–`INV-17` are reviewer-evaluated | Evaluate every applicable INV against its stated objective check; record the result in the verification artifact. A missing evaluation blocks acceptance. |

---

## Validation Sign-Off

- [x] All `type="auto"` tasks have a runnable `<verify><automated>` command or a Wave 0 dependency. The one exception is `T-02-11-3`, a `checkpoint:human-verify` whose `<verify>` is a `<human-check>` by design (§27) — recorded in the map, not hidden.
- [x] Sampling continuity: no 3 consecutive tasks without automated verify. Every wave from 1 to 10 has at least one runnable command.
- [x] Wave 0 covers all MISSING references — every test file the map names is either created by its owning plan or listed in §Wave 0 Requirements below.
- [x] No watch-mode flags anywhere in the plan set.
- [x] Feedback latency < 60s on the unit path (`npm run lint && npx vitest run tests/unit`); the ~3 min visual suite runs once per wave at most, in wave 10.
- [x] `nyquist_compliant: true` set in frontmatter, with the single human-gate exception stated above.
- [x] Wave graph is acyclic and every `wave` equals `max(depends_on) + 1`: 02-01 → 02-03 → 02-04 → 02-05 → 02-06 → 02-07 → 02-08 → 02-09 → 02-10 → 02-11, with 02-02 in wave 1 alongside 02-01 and 02-03 also depending on 02-01.

**Approval:** granted by the planner at revision. Task IDs and wave numbers are final and no longer `TBD`; `nyquist_compliant` is set.
