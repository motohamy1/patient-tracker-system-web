---
phase: 1
slug: project-constitution-reference-ui-specification
status: complete
nyquist_compliant: true
wave_0_complete: true
created: 2026-10-06
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

Reconstructed from phase artifacts on 2026-10-06 (State B — no VALIDATION.md existed at execution time). Phase 01 is a governance/docs-only phase: it ships a specification corpus (`docs/governance/`), not product code. Its automated verification is corpus validation, not unit tests, because D-17 (the named machine checks `no-raw-hex`, `no-generic-healthcare-blue`, `token-reference-required`) and D-18 (the Playwright visual-regression harness with committed baselines) are explicitly deferred to Phase 002. The three named machine checks are NOT implemented here and are NOT replaced by this suite.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | none required — zero-dependency Node ESM script using `node:fs`, `node:path`, `node:crypto`, `node:child_process` |
| **Config file** | `scripts/validate-governance.mjs` (537 lines, no install step, no package.json — the phase fence forbids one) |
| **Quick run command** | `node scripts/validate-governance.mjs --check <ID>` |
| **Full suite command** | `node scripts/validate-governance.mjs` |
| **Estimated runtime** | ~1 second (includes four `certutil -hashfile` SHA-256 recomputations) |

Machine-readable mode: `node scripts/validate-governance.mjs --json` emits `[{id, requirement, description, ok, detail}]` for CI wiring in Phase 002. Exit code is 0 only when every check passes; the final line is `VALIDATION-OK` or `VALIDATION-FAILED: <ids>`.

---

## Sampling Rate

- **After every task commit:** Run `node scripts/validate-governance.mjs --check <ID>` for the requirement that task serves
- **After every plan wave:** Run `node scripts/validate-governance.mjs`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** ~1 second

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 01-01-task1 | 01-01 | 1 | GOV-02 | — | N/A | integration | `node scripts/validate-governance.mjs --check GOV-02a` | ✅ | ✅ green |
| 01-01-task2 | 01-01 | 1 | GOV-04 | — | N/A | contract | `node scripts/validate-governance.mjs --check GOV-04d` | ✅ | ✅ green |
| 01-01-task3 | 01-01 | 1 | GOV-04 | — | N/A | contract | `node scripts/validate-governance.mjs --check GOV-04a` | ✅ | ✅ green |
| 01-01-task4 | 01-01 | 1 | GOV-02 | — | N/A | contract | `node scripts/validate-governance.mjs --check GOV-02b` | ✅ | ✅ green |
| 01-01-task5 | 01-01 | 1 | GOV-02 | — | N/A | integration | `node scripts/validate-governance.mjs --check GOV-02d` | ✅ | ✅ green |
| 01-02-task1 | 01-02 | 1 | GOV-02 | — | N/A | integration | `node scripts/validate-governance.mjs --check GOV-02c` | ✅ | ✅ green |
| 01-02-task2 | 01-02 | 1 | GOV-02 | — | N/A | integration | `node scripts/validate-governance.mjs --check GOV-02a` | ✅ | ✅ green |
| 01-03-task1 | 01-03 | 2 | GOV-01 | — | N/A | contract | `node scripts/validate-governance.mjs --check GOV-01` | ✅ | ✅ green |
| 01-03-task2 | 01-03 | 2 | GOV-06 | — | N/A | contract | `node scripts/validate-governance.mjs --check GOV-06` | ✅ | ✅ green |
| 01-03-task3 | 01-03 | 2 | GOV-01 | — | N/A | integration | `node scripts/validate-governance.mjs --check GOV-04c` | ✅ | ✅ green |
| 01-04-task1 | 01-04 | 3 | GOV-04 | — | N/A | contract | `node scripts/validate-governance.mjs --check GOV-04b` | ✅ | ✅ green |
| 01-04-task2 | 01-04 | 3 | GOV-02 | — | N/A | contract | `node scripts/validate-governance.mjs --check GOV-02b` | ✅ | ✅ green |
| 01-04-task3 | 01-04 | 3 | GOV-05 | — | N/A | integration | `node scripts/validate-governance.mjs --check GOV-05a` | ✅ | ✅ green |
| 01-05-task1 | 01-05 | 4 | GOV-03 | — | N/A | contract | `node scripts/validate-governance.mjs --check GOV-03` | ✅ | ✅ green |
| 01-05-task2 | 01-05 | 4 | GOV-05 | — | N/A | integration | `node scripts/validate-governance.mjs --check GOV-05a` | ✅ | ✅ green |
| 01-05-task3 | 01-05 | 4 | GOV-05 | — | N/A | integration | `node scripts/validate-governance.mjs --check GOV-04e` | ✅ | ✅ green |
| 01-06-task1 | 01-06 | 5 | GOV-05 | — | N/A | contract | `node scripts/validate-governance.mjs --check GOV-05b` | ✅ | ✅ green |
| 01-06-task2 | 01-06 | 5 | GOV-05 | — | N/A | contract | `node scripts/validate-governance.mjs --check GOV-05c` | ✅ | ✅ green |
| 01-06-task3 | 01-06 | 5 | GOV-04 | — | N/A | contract | `node scripts/validate-governance.mjs --check GOV-04d` | ✅ | ✅ green |
| 01-06-task4 | 01-06 | 5 | GOV-05 | — | N/A | integration | `node scripts/validate-governance.mjs --check GOV-TRACE` | ✅ | ✅ green |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

Check inventory (16 checks, all green): `GOV-04a` token schema/key set/order · `GOV-04b` shadow-ink derivation · `GOV-04c` raw-hex confinement · `GOV-04d` provenance + review block integrity (gate closed) · `GOV-02a` manifest roles + recomputed SHA-256 · `GOV-02b` do-not-reuse registry + resolvable anchors · `GOV-02c` D-12 residual confinement · `GOV-02d`/`GOV-04e` 8-artifact package + no product code · `GOV-01` 9-level hierarchy order + authority clause · `GOV-06` §27 prohibition vocabulary · `GOV-03` 17 unique INV rows · `GOV-05a` 12 QA rows + cross-document accent reserved-list agreement · `GOV-05b` responsive bands · `GOV-05c` motion values + reduced-motion hooks · `GOV-TRACE` requirement/roadmap traceability.

---

## Wave 0 Requirements

- [x] `scripts/validate-governance.mjs` — the phase's full automated suite (all six requirements); created during this validation audit because no test infrastructure existed at execution time
- [x] No framework install required — zero dependencies by design, consistent with the phase-01 fence (no `package.json`, no CI, no Tailwind/PostCSS config)
- Deferred to Phase 002 and deliberately NOT implemented here: the three named machine checks `no-raw-hex`, `no-generic-healthcare-blue`, `token-reference-required` (D-17), and the Playwright visual-regression harness with committed baselines (D-18). This suite validates the corpus; it is not a lint layer for product code.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| D-08 owner design gate — the product owner adjudicates the weak-evidence token values, the D-01 gray reading and the D-02 accent split against the three binding reference JPGs | GOV-04 (plan 01-06 task-3) | Design judgment against reference imagery; no command can decide whether a sampled gray satisfies D-01 or whether two yellows are distinct hues. **Already adjudicated and recorded 2026-10-06** (`review.gateStatus = approved-with-changes`, `accentSoft` admitted, four weak tokens confirmed as frozen, D-01 reading confirmed). | Open `docs/reference/provider-home-primary.jpg`, `docs/reference/patient-workspace-timeline-primary.jpg` and `docs/reference/patient-home-primary.jpg` side by side with the `provenance` + `review` blocks of `docs/governance/tokens.json`; confirm each flagged token as sampled or direct a re-sample; record the outcome in `review.gateStatus` and `review.notes`. The artifact assertions that follow from the decision are automated (`GOV-04d`). |

*No other phase behavior is manual-only — every requirement additionally has automated corpus verification via `scripts/validate-governance.mjs`.*

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 2s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-10-06 (reconstructed-State-B audit; 16/16 checks green, 0 escalated, 0 open gaps)
