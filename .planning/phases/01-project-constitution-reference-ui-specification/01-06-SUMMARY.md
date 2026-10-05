---
phase: 1-project-constitution-reference-ui-specification
plan: 01-06
subsystem: docs/governance (responsive + motion rules; D-08 owner design gate)
tags: [governance, responsive, motion, design-gate, tokens, accentSoft, reduced-motion]

requires:
  - plan: 01-01
    provides: "docs/governance/tokens.json provenance + review blocks and reference-manifest.json"
  - plan: 01-05
    provides: "docs/governance/ui-invariants.md and visual-qa-rules.md"
provides:
  - "docs/governance/responsive-rules.md — the three §26 bands and their adaptation contract"
  - "docs/governance/motion-rules.md — the tokenized motion values, the two-layer architecture and the mandatory reduced-motion contract"
  - "docs/governance/tokens.json — the D-08 gate outcome: gateStatus approved-with-changes and the admitted accentSoft color key"
  - "the clean-cutover vocabulary sweep: project-constitution.md, reference-ui-specification.md and ui-invariants.md now enumerate accentSoft"
affects:
  - "Phase 002 (may now build the token layer, the three machine checks, and the Playwright visual-regression harness)"
  - "every later UI phase (responsive bands, motion contract and the 15-key color vocabulary are now frozen)"

tech-stack:
  added: []
  patterns:
    - "The D-08 owner gate is the phase's terminal action: the sampled provenance is adjudicated by the product owner against the binding primaries and the outcome is written into tokens.json -> review before Phase 002 may begin"
    - "Clean cutover after a gate decision: admitting a token updates every governance document that enumerates or counts the color set in the same change, with the hex confined to tokens.json"

key-files:
  created:
    - docs/governance/responsive-rules.md
    - docs/governance/motion-rules.md
  modified:
    - docs/governance/tokens.json
    - docs/governance/project-constitution.md
    - docs/governance/reference-ui-specification.md
    - docs/governance/ui-invariants.md

key-decisions:
  - "accentSoft ADMITTED (D-02 split confirmed): exactly one new color key inserted immediately after accent, value #FFCE03 — the recorded provider-home CTA cross-check median in tokens.json -> provenance.crossChecks[0].median, corroborated by 01-01-SUMMARY.md. The 01-06 PLAN.md prose value #FFCE04 is not derivable from any recorded sampled window and was rejected."
  - "All four weak-evidence tokens confirmed as frozen unchanged: frameForeground #A9ACB0, textSecondary #C5C7CB, warning #FFC30C, critical #FFCBC8."
  - "D-01 gray reading confirmed as frozen as sampled: canvas #DDE0E5, frame #E0E3E8, surface #E0E3E8; the weak olive undertone reads as green >= red and the slight blue bias is accepted and recorded."
  - "review.gateStatus is approved-with-changes because the color key-set changed; review.notes names the reviewer (product owner), the date (2026-10-06), and every change with its derivation."

patterns-established:
  - "Raw hex remains confined to docs/governance/tokens.json; the consistency sweep cites the token NAME only in the other governance documents"

requirements-completed: [GOV-05, GOV-04]

coverage:
  - id: D1
    description: "docs/governance/responsive-rules.md records the three §26 bands (desktop >=1024px, tablet 768-1023px, mobile <768px), the per-band adaptation contract and the shrink prohibition, with no raw hex"
    requirement: GOV-05
    verification:
      - kind: manual_procedural
        ref: "grep -c -E '1024px|768px|1023px' -> present; grep -o -E '#[0-9A-Fa-f]{6}' -> zero matches"
        status: pass
    human_judgment: false
  - id: D2
    description: "docs/governance/motion-rules.md records the tokenized values copied from tokens.json, the Framer Motion / GSAP two-layer split and the mandatory reduced-motion contract, with no raw hex"
    requirement: GOV-05
    verification:
      - kind: manual_procedural
        ref: "node motion-values assertion -> MOTION-VALUES-OK; grep hex -> zero matches"
        status: pass
    human_judgment: false
  - id: D3
    description: "The D-08 owner gate outcome is written into tokens.json -> review: 15 color keys with accentSoft immediately after accent, ownerConfirmed true, gateStatus approved-with-changes, complete notes"
    requirement: GOV-04
    verification:
      - kind: manual_procedural
        ref: "node gate assertions -> GATE-CLOSED; accentSoft order OK; HEX-OK; SHADOW-INK-OK; 15 keys"
        status: pass
    human_judgment: true
    rationale: "The gate itself is a human visual adjudication by the product owner; this record transcribes the owner's verbatim decisions, so the correctness of the adjudication can only be affirmed by the owner."
  - id: D4
    description: "The full-package verification sweep (task-4): 8 files, GOV-01..GOV-06 evidence, 17 INV rows, 12 QA rows, zero stray hex, D-12 rows corrected, phase fence held, gate closed"
    verification:
      - kind: manual_procedural
        ref: "task-4 sweep commands — all criteria pass (see ## Verification below)"
        status: pass
    human_judgment: false

metrics:
  duration: ~22 min
  started: "2026-10-06T02:28:36+03:00"
  completed: "2026-10-06T02:50:36+03:00"
  tasks: 4
  files: 6
status: complete
---

# Phase 1 Plan 01-06: responsive/motion rules and the D-08 owner design gate Summary

**The last two governance documents plus the D-08 owner gate: `accentSoft` admitted as the 15th color key (`#FFCE03`, the recorded provider-home CTA median), all four weak-evidence tokens and the D-01 gray reading confirmed frozen, and every governance document swept so no stale 14-key claim survives**

## Performance

- **Duration:** ~22 min (tasks 1-2 by the prior executor; tasks 3-4 this run)
- **Started:** 2026-10-06T02:28:36+03:00
- **Completed:** 2026-10-06T02:50:36+03:00
- **Tasks:** 4
- **Files modified:** 6

## Accomplishments

- `responsive-rules.md` records the three §26 bands, the per-band adaptation expectations, the 44px touch-target minimum and the shrink prohibition with zero raw hex.
- `motion-rules.md` records the tokenized values copied from `tokens.json`, the two-layer Framer Motion / GSAP split, and the mandatory reduced-motion contract (`useReducedMotion` + `gsap.matchMedia`).
- The D-08 gate outcome is written into `tokens.json` → `review`: `gateStatus: approved-with-changes`, `accentSplit.ownerConfirmed: true`, and the one admitted key `accentSoft` (`#FFCE03`) immediately after `accent`.
- Clean cutover: `project-constitution.md`, `reference-ui-specification.md` and `ui-invariants.md` now enumerate 15 tokens — no governance document still claims a 14-key complete set or that `accentSoft` is withheld.
- Full phase verification sweep passed: 8 governance files, GOV-01..GOV-06 evidenced, 17 INV rows, 12 QA rows, zero raw hex outside `tokens.json`, the D-12 rows corrected, the phase fence held, and the gate closed.

## Task Commits

Each task was committed atomically:

1. **Task 1: write docs/governance/responsive-rules.md** - `dd81a7d` (docs)
2. **Task 2: write docs/governance/motion-rules.md** - `5a8b3d4` (docs)
3. **Task 3: run the D-08 owner design gate and record the decision** - `658e7b0` (docs — gate decision in tokens.json), `9b98c93` (docs — accentSoft vocabulary sweep across the three governance docs)
4. **Task 4: close the phase — full-package verification sweep** - `085426e` (docs, intentionally empty: read-only verification)

**Plan metadata:** `55c1af2` (docs: add plan summary)

## Files Created/Modified

- `docs/governance/responsive-rules.md` - the three §26 bands and the adaptation/prohibition contract
- `docs/governance/motion-rules.md` - tokenized motion values, two-layer architecture, reduced-motion contract
- `docs/governance/tokens.json` - added `accentSoft` after `accent`; `review` gate outcome, notes and `accentSplit.ownerConfirmed`
- `docs/governance/project-constitution.md` §4.3 - 15-token vocabulary, `accentSoft` enumerated
- `docs/governance/reference-ui-specification.md` §2.1/§3 - 15-token heading, `accentSoft` table row, §3.15 cross-check record
- `docs/governance/ui-invariants.md` §1 - token vocabulary names `accentSoft`

## Decisions Made

- **`accentSoft` value = `#FFCE03`.** The authoritative sampled median is `tokens.json` → `provenance.crossChecks[0].median` (`#FFCE03`), corroborated by `01-01-SUMMARY.md` (provider-home CTA `#FFCE03`). The 01-06 PLAN.md prose named `#FFCE04`; that value is derivable from no recorded sampled window and was rejected rather than invented.
- **Gate status `approved-with-changes`.** The color key-set changed (one key added), so per the plan the status must be `approved-with-changes` and every change must be named in `review.notes`.
- **The four weak-evidence tokens and the D-01 gray reading stand as sampled**, per the owner's verbatim decisions; no re-sampling was performed.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Plan prose value `#FFCE04` replaced by the recorded median `#FFCE03`**
- **Found during:** Task 3 (D-08 gate write-back)
- **Issue:** The plan text names the provider-home CTA median as `#FFCE04`, but `tokens.json` → `provenance.crossChecks[0].median` and `01-01-SUMMARY.md` both record `#FFCE03`; the five recorded cross-check windows read `#FFCE02`/`#FFCE03`/`#FFCF03`, whose channel-wise median is `#FFCE03`. Freezing `#FFCE04` would have shipped a value unsupported by any sampled window.
- **Fix:** Used `#FFCE03` and recorded the source and the discrepancy in `review.notes`.
- **Files modified:** `docs/governance/tokens.json`
- **Verification:** `provenance.crossChecks[0].median === "#FFCE03"`; `color.accentSoft === "#FFCE03"`.
- **Committed in:** `658e7b0`

**2. [Rule 2 - Missing critical] Consistency sweep across the governance documents**
- **Found during:** Task 3 (after admitting `accentSoft`)
- **Issue:** The plan's task-3 `files` field lists only `tokens.json`, but admitting a token makes the existing 14-key enumerations in `project-constitution.md`, `reference-ui-specification.md` and `ui-invariants.md` stale (false "14-token" claims, false "withheld" statements). Leaving them would violate the clean-cutover contract.
- **Fix:** Updated the three documents to enumerate 15 tokens and cite `accentSoft` by name (hex kept only in `tokens.json`).
- **Files modified:** `docs/governance/project-constitution.md`, `docs/governance/reference-ui-specification.md`, `docs/governance/ui-invariants.md`
- **Verification:** repo-wide governance grep for `14 semantic` / `14-token` / `withheld` returns zero matches; hex grep outside `tokens.json` returns zero.
- **Committed in:** `9b98c93`

---

**Total deviations:** 2 auto-fixed (1 blocking, 1 missing-critical).
**Impact on plan:** Both were required for correctness and the clean-cutover contract; no scope beyond the gate decision and its direct vocabulary consequences was added, and no product code was created.

## Issues Encountered

- **Plan 01-05's token-reference assertion now passes for a new reason.** The 01-05 assertion hardcodes desired color names including `accentSoft` and previously passed only because `accentSoft` was absent from the set under test; with `accentSoft` now frozen in `tokens.json`, the same assertion passes because the token genuinely exists. Re-run recorded below (`TOKEN-REFS-OK`). Not a defect — a documented change of the passing condition.
- **D-12 line numbers shifted.** The six corrected rows still contain `patient-tracking-dashboard.jpg`, but `ROADMAP.md` moved from line 44 to 47 and `STATE.md` from 67 to 74 after later STATE/ROADMAP updates. Content is correct; only the recorded line numbers are stale.
- **The literal D-12 grep scope is wider than the plan's wording.** The string `diagnostic-current-implementation.png` still appears in historical plan/summary records and the three named decision-record files (and in an unrelated `.kilo/worktrees/` checkout). No *executable* planning document (`PROJECT.md`, `ROADMAP.md`, `STATE.md`, `REQUIREMENTS.md`, `research/`, `AGENTS.md`) contains it.

## Verification (task-4 full-package sweep)

| Check | Command | Result |
|---|---|---|
| Package completeness (8 files) | `ls docs/governance` | PASS — motion-rules.md, project-constitution.md, reference-manifest.json, reference-ui-specification.md, responsive-rules.md, tokens.json, ui-invariants.md, visual-qa-rules.md |
| GOV-01 hierarchy order | node index-order assertion | PASS — `HIERARCHY-ORDER-OK` |
| GOV-01 authority sentence | grep `NEVER a higher authority than the approved design/specification` | PASS (line 59) |
| GOV-02 roles | node manifest assertion | PASS — `ROLES-OK` (3 binding + 1 diagnostic) |
| GOV-03 INV rows | `grep -c -E '^\| *INV-[0-9]{2} *\|'` | PASS — 17 rows, INV-01..INV-17, no INV-18+ |
| GOV-04 key-set | node key-set assertion with `accentSoft` allowed | PASS — `OK` (15 keys, accentSoft immediately after accent) |
| GOV-04 hex regex | node hex assertion | PASS — `HEX-OK` |
| GOV-04 hex confinement | `grep -o -E '#[0-9A-Fa-f]{6}'` on the 7 non-token files | PASS — zero matches; `tokens.json` holds the matches |
| GOV-04 provenance windows | node assertion | PASS — 14 entries, every entry >= 5 windows |
| GOV-05 QA rows | `grep -c -E '^\| *([1-9]\|1[0-2]) *\|'` | PASS — 12 |
| GOV-05 Playwright contract | grep viewports/baseline/tolerance | PASS — 1440x900, 1280x800, 768x1024, 390x844; `provider-home/1440x900/default.png`; `maxDiffPixelRatio: 0.01`, `threshold: 0.2` |
| GOV-05 responsive bands | grep `1024px\|768px\|1023px` | PASS — present |
| GOV-05 motion match | node motion-values assertion | PASS — `MOTION-VALUES-OK` |
| GOV-06 prohibition keywords | grep each of the 15 keywords | PASS — all present |
| D-12 corrected rows | grep `patient-tracking-dashboard.jpg` in the six rows | PASS — all six point at the on-disk asset (ROADMAP:47, STATE:74 shifted) |
| D-12 stale string | grep executable planning docs | PASS — none |
| Phase fence — artifacts | `ls package.json src tokens.css ... components.json tests` | PASS — none exist |
| Phase fence — git status | `git status --short` | PASS — only the pre-existing user changes remain (`.planning/config.json` modified; `docs/reference/diagnostic-current-implementation.png` deleted; `patient-tracking-dashboard.jpg` untracked) |
| Owner gate | node gateStatus assertion | PASS — `GATE-CLOSED` |
| Shadow ink unchanged | node shadow-ink assertion | PASS — `SHADOW-INK-OK` (`textPrimary` did not change) |
| 01-05 token-refs assertion | node assertion incl. hardcoded `accentSoft` | PASS — `TOKEN-REFS-OK` (passes because `accentSoft` now exists) |

## User Setup Required

None - no external service configuration required. No packages were installed and no product code was created.

## Next Phase Readiness

- The D-08 gate is closed (`tokens.json` → `review.gateStatus: approved-with-changes`), so **Phase 002 is unblocked**: it may generate the token layer from the now-15-key `color` block, implement the three named machine checks (D-17) and build the Playwright visual-regression harness (D-18).
- The responsive bands, the motion contract and the 15-key color vocabulary are frozen; later UI phases must cite them rather than restate values.
- No blockers carried forward from this plan.

---
*Phase: 1-project-constitution-reference-ui-specification*
*Completed: 2026-10-06*

## Self-Check: PASSED