---
phase: 2
slug: foundation-and-app-shell
status: draft
nyquist_compliant: false
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
| TBD | TBD | 1 | FOUND-01 | V14 Configuration | Dev gallery 404s under the production server | e2e | `npx playwright test --grep "gallery-hidden"` | ❌ W0 `tests/visual/surfaces.spec.ts` | ⬜ pending |
| TBD | TBD | 1 | FOUND-01 | — | Each route in the D-01 URL map renders 200 with its layout frame + `EmptyState` | e2e | `npx playwright test --project=default --grep "route"` | ❌ W0 `tests/visual/surfaces.spec.ts` | ⬜ pending |
| TBD | TBD | 1 | FOUND-01 | Information disclosure | No `Patient`-shaped literal outside `src/lib/dev/**`; no fixture module in `next build` output | unit + build | `npx vitest run tests/unit/scripts/check-design-tokens` | ❌ W0 | ⬜ pending |
| TBD | TBD | 1 | FOUND-02 | — | Every primitive renders and references ≥1 generated token utility | unit | `npx vitest run tests/unit/primitives` | ❌ W0 | ⬜ pending |
| TBD | TBD | 1 | FOUND-02 | — | Generated token-utility vocabulary is derived from `tokens.json`, never hardcoded | unit | `npx vitest run tests/unit/scripts/generate-tokens` | ❌ W0 | ⬜ pending |
| TBD | TBD | 1 | FOUND-03 | — | Only the four font sizes, two weights, six spacing and five radius steps appear in `src/` | unit | `npx vitest run tests/unit/scripts/token-vocabulary` | ❌ W0 | ⬜ pending |
| TBD | TBD | 1 | FOUND-03 | — | Generated CSS contains exactly two shadow tokens (INV-13/14) | unit | `npx vitest run tests/unit/scripts/generate-tokens` | ❌ W0 | ⬜ pending |
| TBD | TBD | 1 | FOUND-03 | — | Every surface matches its reference grammar | visual | `npm run test:visual` | ❌ W0 `tests/visual/**` | ⬜ pending |
| TBD | TBD | 1 | FOUND-04 | — | Focus trap wraps Tab/Shift+Tab; Escape closes; focus restores to trigger; background `inert` while open | unit (jsdom) | `npx vitest run tests/unit/overlays` | ❌ W0 `tests/unit/overlays/focus-trap.test.tsx` | ⬜ pending |
| TBD | TBD | 1 | FOUND-04 | V8 Data Protection | Built client bundle makes zero off-origin network requests | e2e | `npx playwright test --grep "no-egress"` | ❌ W0 | ⬜ pending |
| TBD | TBD | 1 | FOUND-05 | — | Every animation site sits in a component calling `useReducedMotion`; reduced variant is opacity-only at `duration.fast` | unit | `npx vitest run tests/unit/motion` | ❌ W0 `tests/unit/motion/reduced-motion.test.tsx` | ⬜ pending |
| TBD | TBD | 1 | FOUND-05 | — | `reduced-motion` project baseline renders the reduced state | visual | `npm run test:visual -- --project=reduced-motion` | ❌ W0 | ⬜ pending |
| TBD | TBD | 1 | UX-06 | — | Layout adapts at `390x844` and `768x1024` | visual | `npm run test:visual` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*
*Task IDs are assigned by the planner; this table fixes the requirement→verification binding so the planner cannot drop one.*

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

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 60s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending — planner assigns task IDs and wave numbers, then sets `nyquist_compliant`.
