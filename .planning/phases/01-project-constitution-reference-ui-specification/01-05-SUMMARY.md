---
phase: 1-project-constitution-reference-ui-specification
plan: 01-05
subsystem: docs/governance (UI invariants + visual QA rules)
tags: [governance, ui-invariants, visual-qa, playwright-contract, token-citations, anti-drift, inv-registry]

requires:
  - plan: 01-01
    provides: "docs/governance/tokens.json (14 canonical color tokens + radius/space/font/shadow/motion, provenance/review evidence) and docs/governance/reference-manifest.json"
  - plan: 01-03
    provides: "docs/governance/project-constitution.md (§2 hierarchy, §4.2 D-01 light-frame grounding, §7 rejections, §8 the three named machine checks)"
  - plan: 01-04
    provides: "docs/governance/reference-ui-specification.md (§2 shared core, §8.1 the 12-row QA mirror, §8.2 the Playwright contract, §9 do-not-reuse)"

provides:
  - "docs/governance/ui-invariants.md — the greppable INV-01…INV-17 registry across visual character (§2.1), geometry (§2.3) and depth and elevation (§2.4), each with an objectively checkable condition"
  - "docs/governance/visual-qa-rules.md — the normative 12-row §21 pass/fail gate, the Playwright visual-regression harness contract as specification only, and the §21 rejection conditions"

affects:
  - "01-06 owner design gate (reads both files as the design-gate checklist)"
  - "Phase 002 (implements the three machine checks the invariants name and the Playwright harness the QA rules specify)"
  - "every later UI phase (grep INV-xx IDs and evaluate the 12 QA rows at its design gate)"

tech-stack:
  added: []
  patterns:
    - "Greppable invariant registry: stable INV-xx IDs, each row carrying an objectively checkable condition (grep, pixel sample or screenshot test) so a reviewer can decide pass or fail without interpretation"
    - "Normative + mirror split: visual-qa-rules.md is the normative 12-row gate; reference-ui-specification.md §8.1 mirrors its row numbers and names so any divergence is a defect"
    - "Specification-not-implementation: the three machine checks and the Playwright harness are named and specified with exact numbers, but no lint rule, no CI config, no test file and no harness exists"

key-files:
  created:
    - docs/governance/ui-invariants.md
    - docs/governance/visual-qa-rules.md
  modified: []

key-decisions:
  - "The file is free of any matchable raw hex literal: the only place a hex-shaped pattern is needed (INV-01/INV-03) writes it as the safe fragment `#` followed by `[0-9A-Fa-f]{6}`, which cannot match the `#[0-9A-Fa-f]{6}` grep"
  - "Token citations use exact JSON paths — `radius.sm`…`radius.pill`, `space.xs`…`space.2xl`, `shadow.raised`/`shadow.overlay`, `font.size`, and `motion.duration.slow` — never a shorthand that does not resolve"
  - "The conditional fifteenth token `accentSoft` is not enumerated in ui-invariants.md because it is withheld from tokens.json pending the D-02 gate; the vocabulary lists the frozen 14 only and states no additional token may be invented"
  - "visual-qa-rules.md §1 stars the exact §21 pass conditions from the plan action wording while the 12 row numbers and check names agree row-for-row with reference-ui-specification.md §8.1; the mirror's pass-condition text is a semantic paraphrase, and per the executor scope fence reference-ui-specification.md was not modified"
  - "The Playwright contract is written as explicit non-implementation in its own opening sentence so the Phase-002 boundary survives a later re-read"

patterns-established:
  - "Every invariant is a tri-column row (ID | Invariant | Objective check) whose objective check is evaluable by grep, pixel sample or screenshot — never by intent"
  - "The machine-enforceable subset is mapped to the Phase-002 check names it is covered by, so the invariant registry and the constitution §8 contract stay in lockstep"

requirements-completed: [GOV-03, GOV-05]

coverage:
  - id: D1
    description: "docs/governance/ui-invariants.md exists with the five contracted level-2 headings in order; exactly 17 non-skipped, non-reused INV IDs (INV-01…INV-06 visual character, INV-07…INV-12 geometry, INV-13…INV-17 depth); every ID sits in a greppable row with a non-empty objective check; the machine-enforceable subset is mapped to the three Phase-002 checks; and the file holds zero raw hex literals"
    requirement: GOV-03
    verification:
      - kind: manual_procedural
        ref: "node -e INV-IDS-OK assertion; grep -c -E '^\\| *INV-[0-9]{2} *\\|' -> 17; 5 level-2 headings; names for radius/space/shadow/borderSubtle/success/info/warning/textPrimary present; grep -o -E '#[0-9A-Fa-f]{6}' -> 0"
        status: pass
    human_judgment: false
  - id: D2
    description: "docs/governance/visual-qa-rules.md exists with the three contracted level-2 headings in order; exactly 12 numbered rows whose check names match reference-ui-specification.md §8.1 row-for-row, with row 5 carrying 55/22.5/22.5, rows 2 and 8 carrying 10%, and row 12 carrying success/info/warning; §2 carries the four viewports, the baseline path scheme, both tolerance numbers, both states and Phase 002; §3 carries the three §21 rejections and the build passes prohibition; and the file holds zero raw hex literals"
    requirement: GOV-05
    verification:
      - kind: manual_procedural
        ref: "node -e QA-MIRROR-OK assertion; grep -c -E '^\\| *([1-9]|1[0-2]) *\\|' -> 12 and 0 rows >= 13; all §2 viewport/path/tolerance/state strings present; grep -o -E '#[0-9A-Fa-f]{6}' -> 0; find for playwright.config.*/*.spec.ts/package.json -> none; no tests/ directory"
        status: pass
    human_judgment: false
  - id: D3
    description: "Cross-document consistency: every radius/space/shadow token reference in both files resolves to a key that exists in docs/governance/tokens.json; the five radius steps, six space steps and two shadow keys cited match the frozen JSON (including the 4/8/12/16/24/32px spacing values and 44px as a target size, not a spacing step); the 12 QA rows agree row-for-row with reference-ui-specification.md §8.1; and neither file implies an existing harness, lint rule or CI job"
    verification:
      - kind: manual_procedural
        ref: "node -e TOKEN-REFERENCES-OK (UNKNOWN set empty); node -e QA-MIRROR-OK; grep hex -> 0 in both files; no Playwright config, tests/visual/ or baseline .png present"
        status: pass
    human_judgment: false
  - id: D4
    description: "The objective-check phrasing in each invariant and each QA row is the right, sufficient test for the visual property it defends (e.g. relative-luminance threshold for the light frame, collision-free sibling branches, the reserved-accent list)"
    verification: []
    human_judgment: true
    rationale: "The checks are written to be evaluable, but whether each threshold and phrasing is the right gate for the reference grammar is a design-gate judgment the product owner makes at the D-08 review — string checks cannot confirm a check is the correct check."

metrics:
  duration: ~12min
  started: "2026-10-05T23:11:00Z"
  completed: "2026-10-05T23:23:27Z"
  tasks: 3
  files: 2
status: complete
---

# Phase 1 Plan 01-05: UI Invariants and Visual QA Rules Summary

**`docs/governance/ui-invariants.md` — a greppable 17-ID registry across visual character, geometry and depth, every row objectively checkable and free of raw hex — and `docs/governance/visual-qa-rules.md` — the normative 12-row §21 gate mirrored row-for-row with reference-ui-specification.md §8.1 plus the Playwright harness contract written as specification only**

## Performance

- **Duration:** ~12 min
- **Started:** 2026-10-05T23:11:00Z
- **Completed:** 2026-10-05T23:23:27Z
- **Tasks:** 3
- **Files created:** 2

## Accomplishments

- Wrote `docs/governance/ui-invariants.md` with the five contracted level-2 sections in order and
  exactly 17 invariant IDs across the three groupings: `INV-01`–`INV-06` visual character (§2.1),
  `INV-07`–`INV-12` geometry (§2.3), `INV-13`–`INV-17` depth and elevation (§2.4). Every ID sits
  in a greppable `| INV-xx | … |` row with a non-empty objective check, nothing is skipped or
  reused, and a node assertion prints `INV-IDS-OK`.
- Made every objective check objectively evaluable: a hex/utility grep for INV-01/INV-03, a
  relative-luminance sample for INV-02, a pixel-share estimate for INV-05, a text search plus a
  motion-duration bound for INV-06, a radius-literal check for INV-07, the six-step spacing scale
  for INV-10, the two-shadow-key check for INV-13, and so on.
- Named the machine-enforceable subset (`INV-01`, `INV-03`, `INV-13`, `INV-14`) and mapped it to
  the three Phase-002 checks from the constitution §8 — `no-raw-hex`,
  `no-generic-healthcare-blue` and `token-reference-required` — with an explicit statement that
  this phase specifies and does not implement them.
- Wrote `docs/governance/visual-qa-rules.md` with the normative 12-row §21 pass/fail gate. All 12
  check names match `reference-ui-specification.md` §8.1 (node assertion prints `QA-MIRROR-OK`);
  row 5 carries `55/22.5/22.5`, rows 2 and 8 carry `10%`, and row 12 carries `success` / `info` /
  `warning`.
- Wrote §2 of `visual-qa-rules.md` as a **written contract only** with all four viewports
  (`1440x900`, `1280x800`, `768x1024`, `390x844`), the baseline scheme
  `tests/visual/baselines/{surface}/{viewport}/{state}.png`, the `default`/`reduced-motion`
  states, `maxDiffPixelRatio: 0.01` and `threshold: 0.2`, and a committed-baselines statement
  naming Phase 002.
- Wrote §3 with the three §21 rejection conditions and the §27 "build passes is not done"
  prohibition, stating they override a passing functional run and a passing build.
- Held the fences: no product code, no `package.json`, no `tests/`, no Playwright config, no
  baseline image, no lint/CI rule, and zero raw hex literals in either file.

## Task Commits

Each task was committed atomically:

1. **Task 1: write docs/governance/ui-invariants.md with INV-01 through INV-17** - `748b6b3` (docs)
2. **Task 2: write docs/governance/visual-qa-rules.md with the 12-row gate and the Playwright contract** - `7557453` (docs)
3. **Task 3: cross-check the invariants and QA rules against tokens.json and the reference spec** - `9374de1` (docs, token-citation fix) + `56ad2e0` (docs, vocabulary fix)

**Plan metadata:** SUMMARY commit follows this file (docs: complete plan).

## Files Created/Modified

- `docs/governance/ui-invariants.md` — the INV-01…INV-17 registry across three groupings, each invariant with an objective check; the machine-enforceable subset mapped to the Phase-002 checks; zero hex.
- `docs/governance/visual-qa-rules.md` — the normative 12-row §21 gate, the Playwright harness contract as specification only, and the §21 rejection conditions; zero hex.

## Decisions Made

- **No matchable hex literal, even as a pattern example.** INV-01/INV-03 need to describe the
  illegal construct. Writing it as the plan suggested — the fragment `#` followed by
  `[0-9A-Fa-f]{6}` — keeps the file safe from its own `#[0-9A-Fa-f]{6}` grep, which returns 0.
- **Exact token paths, not shorthand.** The token cross-check surfaced `motion.slow` as a
  shorthand that does not exist as a key (`tokens.json` stores `motion.duration.slow`); the
  citation was corrected, and the assertion now reports an empty UNKNOWN set.
- **The frozen 14 only in the invariant vocabulary.** Because `accentSoft` is withheld from
  `tokens.json` pending the D-02 gate, enumerating it as a canonical name would have referenced a
  key that does not resolve; the vocabulary lists the frozen 14 and states no additional token may
  be invented. The conditional-token note already lives in `project-constitution.md` §4.3 and
  `reference-ui-specification.md` §2.1.
- **Scope fence honored over a cosmetic mirror edit.** Task 3's action allows correcting
  `reference-ui-specification.md` §8.1 if the two tables differ. The row numbers and check names
  agree row-for-row (the contract the executor received), and the pass-condition text is
  semantically identical; because the executor's scope fence said this plan writes exactly two
  files and task 3's own criterion requires `git status` to show only those two, the mirror file
  was left unmodified rather than pulled into this plan's diff.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Corrected a token citation to the exact JSON path**
- **Found during:** Task 3 (token cross-check against `tokens.json`)
- **Issue:** INV-06 cited the `motion.slow` duration, but `docs/governance/tokens.json` stores the
  scale under `motion.duration` (`fast`/`slow`), so `motion.slow` is not a resolvable token path.
- **Fix:** Cited `motion.duration.slow` in INV-06.
- **Files modified:** `docs/governance/ui-invariants.md`
- **Verification:** The token-reference assertion over both files reports an empty UNKNOWN set.
- **Committed in:** `9374de1`

**2. [Rule 1 - Bug] Removed the withheld `accentSoft` from the invariant token vocabulary**
- **Found during:** Task 3 (token cross-check against `tokens.json`)
- **Issue:** The vocabulary paragraph enumerated the conditional fifteenth token `accentSoft`,
  which is deliberately withheld from `tokens.json` → `color` pending the D-02 design gate
  (`01-01`, D-02). Citing it as a canonical name referenced a key that does not resolve.
- **Fix:** Listed only the frozen 14 canonical names and stated that no additional color token may
  be invented.
- **Files modified:** `docs/governance/ui-invariants.md`
- **Verification:** The token-reference and canonical-color assertion over both files reports an
  empty bad-name set (the plan's own sample command still flags `accentSoft` because it hardcodes
  the conditional token in its required set while the JSON withholds it — a false positive of the
  command, not a document defect; see Issues Encountered).
- **Committed in:** `56ad2e0`

---

**Total deviations:** 2 auto-fixed (2 accuracy fixes to token citations)
**Impact on plan:** Both fixes are correctness repairs that keep every token citation resolvable
against the artifact that actually exists. No scope was added, no harness or lint rule was
created, and `reference-ui-specification.md` was deliberately left untouched.

## Issues Encountered

- **The plan's task-3 color assertion has a false positive.** Its command hardcodes the 15 names
  including `accentSoft` and reports `badColors: ["accentSoft"]` because `tokens.json` withholds
  that conditional token pending the D-02 gate. The assertion's intent — every name the documents
  reference resolves in the JSON — is satisfied: the documents reference only the frozen 14 plus
  valid `radius.`/`space.`/`shadow.`/`font.`/`motion.` paths, and the `UNKNOWN` set is empty.
  Adding `accentSoft` to `tokens.json` is out of this plan's scope (it is D-02's decision and
  `01-01`'s artifact).
- **The §8.1 mirror is a semantic paraphrase, not byte-identical.** The 12 row numbers and check
  names agree row-for-row; the pass-condition prose differs in wording (e.g. §8.1's "cards
  separate by shadow, not by border" versus the normative "cards separate by shadow and not by
  border") and §8.1's row 5 writes `55 / 22.5 / 22.5` where the normative row must carry the
  compact `55/22.5/22.5`. Per the executor scope fence the mirror was not edited; the normative
  file is authoritative and the two tables carry identical conditions.

## User Setup Required

None - no external service configuration required. No packages installed, no tooling added.

## Verification

All plan-level and task-level checks were re-run after the final edit and pass:

- `ui-invariants.md`: `INV-IDS-OK`, 17 `| INV-xx |` rows, 5 level-2 headings in the contracted
  order, all required token names present, and `grep -o -E '#[0-9A-Fa-f]{6}'` returns 0.
- `visual-qa-rules.md`: 12 numbered rows, 0 rows numbered 13+, `QA-MIRROR-OK`, all §2 viewport and
  tolerance strings present, §3 carries the three rejections and `build passes`, hex grep returns 0.
- Cross-check: `TOKEN-REFERENCES-OK` (UNKNOWN empty) across both files; the five radius steps, six
  space steps and two shadow keys match the frozen JSON; no Playwright config, no `*.spec.ts`, no
  `package.json`, no `tests/` directory and no baseline `.png` exists.

## Self-Check: PASSED

- `docs/governance/ui-invariants.md` and `docs/governance/visual-qa-rules.md` exist on disk.
- `git log --oneline --grep="01-05"` returns four commits (`748b6b3`, `7557453`, `9374de1`,
  `56ad2e0`).
- All task acceptance criteria re-run and pass; the one plan-command false positive
  (`accentSoft`) is documented above and is not a document defect.
- `git status --short` shows this plan created only the two governance files; the pre-existing
  dirty entries (`.planning/config.json`, the deleted diagnostic PNG and the untracked
  `patient-tracking-dashboard.jpg`) were left untouched.

---
*Phase: 1-project-constitution-reference-ui-specification*
*Completed: 2026-10-05*
