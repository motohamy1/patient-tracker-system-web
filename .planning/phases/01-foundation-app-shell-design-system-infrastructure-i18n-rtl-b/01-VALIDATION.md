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
| **Config file** | `vitest.config.ts`, `playwright.config.ts` — both created in Plan 01-01 (Wave 0) |
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
| 01-01-01 | 01 | 1 | FND-01 | — | N/A (scaffold) | config | `npm run lint && npm run typecheck` | ❌ W0 | ⬜ pending |
| 01-01-02 | 01 | 1 | FND-01 | — | N/A (test harness) | config | `npm run test` | ❌ W0 | ⬜ pending |
| 01-02-01 | 02 | 2 | FND-02, FND-10 | — | N/A | unit | `npm run test -- tokens` | ❌ W0 | ⬜ pending |
| 01-02-02 | 02 | 2 | FND-06 | — | N/A | unit | `npm run test -- i18n` | ❌ W0 | ⬜ pending |
| 01-03-01 | 03 | 3 | FND-03, FND-04 | — | N/A | unit + visual | `npm run test -- ui` | ❌ W0 | ⬜ pending |
| 01-03-02 | 03 | 3 | FND-05 | — | N/A | unit | `npm run test -- motion` | ❌ W0 | ⬜ pending |
| 01-04-01 | 04 | 4 | FND-09 | T-1-01 | No privileged credential in client bundle | unit + grep | `npm run build && npm run test -- supabase` | ❌ W0 | ⬜ pending |
| 01-05-01 | 05 | 5 | FND-07 | — | N/A | visual | `npm run test:visual` | ❌ W0 | ⬜ pending |
| 01-05-02 | 05 | 5 | FND-08 | — | N/A | visual | `npm run test:visual` | ❌ W0 | ⬜ pending |
| 01-06-01 | 06 | 6 | FND-07, FND-08 | — | N/A | visual (CI) | CI job `visual-regression` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Wave 0 is Plan 01-01 (scaffold + harness). It must land these before any other plan can verify itself:

- [ ] `vitest.config.ts` + `tests/unit/setup.ts` — jsdom environment, `@/` alias resolution
- [ ] `playwright.config.ts` — 4 projects (desktop/mobile × ltr/rtl), `reducedMotion: 'reduce'`, `snapshotPathTemplate` with `{projectName}`
- [ ] `src/styles/tokens.css` exists and is imported by `src/app/globals.css` (token tests depend on it)
- [ ] `src/i18n/routing.ts` exists and exports `locales`, `defaultLocale`, `directionOf(locale)` (i18n tests depend on it)
- [ ] `npm run lint`, `npm run typecheck`, `npm run test`, `npm run test:visual` scripts all defined and independently runnable
- [ ] `.github/workflows/` job running all four scripts

*If none: "Existing infrastructure covers all phase requirements." — not applicable; this is a greenfield repo with no test infrastructure.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Gallery primitives visually match ref-A's theme (palette, olive frame, notch tab, radius language, pill controls, shadow depth, timeline visual grammar, motion feel) | FND-10, ROADMAP success criterion 3 | Only the product owner can approve design fidelity; the token layer cannot certify its own fidelity | Compare `tests/visual/__screenshots__/<projectName>/design-gallery*.png` against `docs/design/ref-A-theme.png` region by region; confirm single accent, no gradients, no neumorphism, no 3D, no gamification visuals |
| B1–B3 layout correspondence recorded for Provider Home / Patient Overview / Patient Home | ROADMAP Phase 1 prerequisite | Requires design judgment about which B layouts ref-A permits | Confirm `docs/design/reference-ui-spec.md` marks each B element as adopted, restyled, or rejected with the ref-A conflict resolution stated |
| Arabic companion typeface selection | FND-06 | Explicitly an owner decision per REQUIREMENTS.md | Owner selects and licenses the family; regenerate visual baselines afterwards because font changes invalidate every baseline |

*Note: changing the Arabic typeface invalidates all Playwright baselines — regenerate in the CI container, not on a dev machine.*

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending