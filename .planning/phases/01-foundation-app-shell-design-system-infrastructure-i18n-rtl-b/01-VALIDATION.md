---
phase: 1
slug: foundation-app-shell-design-system-infrastructure-i18n-rtl-base-visual-regression-harness
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-10-05
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 5.0.3 (unit/component) + `@playwright/test` 1.63.0 (visual regression) |
| **Config file** | `vitest.config.ts`, `playwright.config.ts` — both created in Plan 01-01 Task 1/2/3 |
| **Quick run command** | `npm run lint && npm run typecheck && npm run test` |
| **Full suite command** | `npm run lint && npm run typecheck && npm run test && npm run test:visual` |
| **Estimated runtime** | quick ~15–25s; full suite ~2–4 min (4 Playwright projects × gallery capture) |

---

## Sampling Rate

- **After every task commit:** Run `npm run lint && npm run typecheck && npm run test`
- **After every plan wave:** Run `npm run lint && npm run typecheck && npm run test && npm run test:visual`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds (quick path must stay under this)

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 01-01-01 | 01-01 T1 | 1 | FND-01 | — | N/A (scaffold) | config | `npm run lint && npm run typecheck && npm run build` | ❌ W1 | ⬜ pending |
| 01-01-02 | 01-01 T2 | 1 | FND-01 | — | N/A (unit harness) | config | `npm run test` | ❌ W1 | ⬜ pending |
| 01-01-03 | 01-01 T3 | 1 | FND-08 | — | N/A (visual harness) | visual | `npm run test:visual` | ❌ W1 | ⬜ pending |
| 01-01-04 | 01-01 T4 | 1 | FND-01 | — | N/A (CI) | config | CI job `quality` | ❌ W1 | ⬜ pending |
| 01-02-01 | 01-02 T1 | 2 | FND-02, FND-10 | — | N/A | unit | `npm run test -- tokens` | ❌ W2 | ⬜ pending |
| 01-02-02 | 01-02 T2 | 2 | FND-02, FND-10 | — | No forbidden pattern / physical property in `src/` | unit | `npm run test -- tokens` | ❌ W2 | ⬜ pending |
| 01-02-03 | 01-02 T3 | 2 | FND-06 | — | N/A | unit | `npm run test -- i18n && npm run test -- format` | ❌ W2 | ⬜ pending |
| 01-03-01 | 01-03 T1 | 3 | FND-04 | — | N/A | unit | `npm run typecheck` | ❌ W3 | ⬜ pending |
| 01-03-02 | 01-03 T2 | 3 | FND-03, FND-04 | — | No hardcoded color / physical property in primitives | unit | `npm run test -- ui` | ❌ W3 | ⬜ pending |
| 01-03-03 | 01-03 T3 | 3 | FND-06 | — | N/A | build | `npm run build` (produces `/en`, `/ar`) | ❌ W3 | ⬜ pending |
| 01-03-04 | 01-03 T4 | 3 | FND-04 | — | N/A | unit | `npm run test -- ui` | ❌ W3 | ⬜ pending |
| 01-04-01 | 01-04 T1 | 4 | FND-05 | — | N/A | unit | `npm run typecheck` | ❌ W4 | ⬜ pending |
| 01-04-02 | 01-04 T2 | 4 | FND-05 | — | N/A | unit | `npm run typecheck` | ❌ W4 | ⬜ pending |
| 01-04-03 | 01-04 T3 | 4 | FND-05 | — | Motion layer cannot be bypassed | unit + lint | `npm run test -- motion && npm run lint` | ❌ W4 | ⬜ pending |
| 01-04-04 | 01-04 T4 | 4 | FND-09 | T-1-01 | No privileged credential in client bundle | unit + grep | `npm run build && npm run test -- supabase` | ❌ W4 | ⬜ pending |
| 01-05-01 | 01-05 T1 | 5 | FND-07 | — | No volatile content | unit | `npm run typecheck` | ❌ W5 | ⬜ pending |
| 01-05-02 | 01-05 T2 | 5 | FND-07 | — | N/A | build | `npm run build` (produces the gallery route) | ❌ W5 | ⬜ pending |
| 01-05-03 | 01-05 T3 | 5 | FND-02, FND-07, FND-08 | — | No forbidden pattern in rendered HTML | visual | `npm run test:visual` | ❌ W5 | ⬜ pending |
| 01-05-04 | 01-05 T4 | 5 | FND-10 | — | N/A | docs | `docs/design/reference-ui-spec.md` + `reconciliation.md` exist | ❌ W5 | ⬜ pending |
| 01-05-CP | 01-05 checkpoint | 5 | FND-10 | — | N/A | manual | Owner visual checkpoint (not an automated task) | ❌ W5 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

**Note on `npm run test:visual` and empty waves:** `test:visual` runs `playwright test --pass-with-no-tests`. Between 01-03 Task 3 (which deletes the Wave 1 harness spec) and 01-05 Task 3 (which creates the gallery spec), `tests/visual/` is legitimately empty and the command exits 0. The wave gate therefore cannot fail on "No tests found" for reasons unrelated to the executor's work.

**Per-wave prerequisite files** (produced by the owning plan, NOT by Wave 0):

- Wave 2 requires `src/styles/tokens.css` (Plan 01-02 Task 1) before its token tests can read it.
- Wave 3 requires `src/i18n/routing.ts` and `src/lib/format.ts` (Plan 01-02 Task 3) before the `[locale]` layout can import them.
- Wave 4 requires `src/app/[locale]/layout.tsx` (Plan 01-03 Task 3) before the motion provider can wrap it.
- Wave 5 requires every primitive in `src/components/ui/` (Plan 01-03 Task 2) before the gallery can render them.

---

## Wave 0 Requirements

Wave 0 is Plan 01-01 (scaffold + harness). It must land these before any other plan can verify itself:

- [ ] `vitest.config.ts` + `tests/unit/setup.ts` — jsdom environment, `@/` alias resolution
- [ ] `tests/unit/smoke.test.ts` — proves the unit runner
- [ ] `tests/unit/smoke-component.test.tsx` — proves the `.tsx` pipeline in Wave 1, not Wave 3
- [ ] `playwright.config.ts` — 4 projects (desktop/mobile × ltr/rtl), `reducedMotion: 'reduce'`, `snapshotPathTemplate` with `{projectName}`, `reuseExistingServer: false`
- [ ] All dev dependencies installed (`@playwright/test`, `vitest`, `jsdom`, `eslint`, `eslint-config-next`, `@types/*`) — without these, `npm run test` and `npm run test:visual` have nothing to run
- [ ] `npm run lint`, `npm run typecheck`, `npm run test`, `npm run test:visual`, `npm run start` scripts all defined
- [ ] `.github/workflows/ci.yml` with the `quality` and `visual-regression` jobs

*Note: `src/styles/tokens.css` and `src/i18n/routing.ts` are NOT Wave 0 deliverables. They land in Plan 01-02 (wave 2); see the per-wave prerequisite list above.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Gallery primitives visually match ref-A's theme (palette, olive frame, notch tab, radius language, pill controls, shadow depth, timeline visual grammar, motion feel) | FND-10, ROADMAP success criterion 3 | Only the product owner can approve design fidelity; the token layer cannot certify its own fidelity | Compare `tests/visual/__screenshots__/<projectName>/design-gallery.spec.ts/design-gallery.png` against `docs/design/ref-A-theme.png` region by region; confirm single accent, no gradients, no neumorphism, no 3D, no gamification visuals |
| Every ref-B element marked adopted / restyled / superseded / rejected, and every A-vs-B conflict resolved | ROADMAP Phase 1 prerequisite (reference-UI extraction) | Requires design judgment about which B layouts ref-A permits; cannot be inferred mechanically | Review `docs/design/reference-ui-spec.md` and `docs/design/reconciliation.md`; confirm no ref-B4 measurement was extracted and every `UNKNOWN` entry is a genuine open question |

*Note: the baseline path above includes the `{testFilePath}` segment that `snapshotPathTemplate` in Plan 01-01 actually configures — the real files live at `tests/visual/__screenshots__/<projectName>/design-gallery.spec.ts/design-gallery.png`.*

---

## Known Limitations of This Contract

- **Visual baselines are provisional until CI runs.** Baselines generated on a dev machine reflect that machine's font rasterization. They must be regenerated inside `mcr.microsoft.com/playwright:v1.63.0-noble` before they are trusted evidence for FND-08.
- **Changing the Arabic companion typeface invalidates every baseline.** That typeface is an unresolved owner decision (FND-06). Choose it before trusting the visual evidence.
- **Token values remain OWNER DECISION and cannot be validated by any automated check.** Enumerated in `src/styles/tokens.css` as: type scale (`--text-display`, `--text-heading`, `--text-body`, `--text-label` + their `--line-height` pairs), shadows (`--shadow-module`, `--shadow-node`), typefaces (`--font-latin`, `--font-arabic`), motion (`--motion-duration-fast`, `--motion-duration-base`, `--motion-ease-out`), and the status-color decision recorded in `StatusLabel.tsx` (ref-A contains no status color, so no status token is declared). The exact count is whatever carries the `OWNER DECISION` comment in that file; the Plan 01-02 provenance test enforces that every token is labelled one way or the other.

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or a documented manual checkpoint
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending — sign off before execution begins