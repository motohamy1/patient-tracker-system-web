---
phase: 1-project-constitution-reference-ui-specification
plan: 01-04
subsystem: docs/governance (reference UI specification)
tags: [governance, reference-ui-spec, design-tokens, provenance, surface-grammar, visual-qa, playwright-contract, do-not-reuse]

requires:
  - plan: 01-01
    provides: "docs/governance/tokens.json (14 canonical color tokens + radius/space/font/shadow/motion + provenance/review evidence) and docs/governance/reference-manifest.json (four assets, roles, sha256, doNotReuse)"
  - plan: 01-03
    provides: "docs/governance/project-constitution.md (§2 hierarchy, §4.2 D-01 light-frame grounding, §5 registry, §6 do-not-reuse list, §8 machine-check names)"

provides:
  - "docs/governance/reference-ui-specification.md — the human-facing design contract: one shared design-system core plus three per-surface grammar sections"
  - "§2 the shared core (60/30/10 color roles, the 14-token citation table, spacing, typography, geometry, exactly two elevation levels)"
  - "§3 the non-normative token provenance record (14 tables, 5-6 windows each, coordinates + JSON citations, zero hex)"
  - "§4-§6 the Provider Home, Patient Workspace and D3 Timeline, and Patient Home grammars with their binding sources"
  - "§8.1 the 12-row visual QA gate mirror and §8.2 the Playwright visual-regression harness contract (specification only)"
  - "§9 the sample-content do-not-reuse list, consistent with the manifest and the constitution"

affects:
  - "01-05 visual-qa-rules.md (owns the normative copy of the 12-row gate this plan mirrors in §8.1)"
  - "01-06 owner design gate (reads §3 risk zones and tokens.json review.weakEvidenceTokens)"
  - "Phase 002 (implements the Playwright harness specified in §8.2; consumes tokens.json, not this document)"
  - "Phase 004/005/006 (cite §4, §5, §6 respectively by the anchors recorded in reference-manifest.json)"

tech-stack:
  added: []
  patterns:
    - "Citation-not-restatement: every frozen value is cited as a JSON path (docs/governance/tokens.json → color.<token> / provenance.tokens[n]) so raw color values have exactly one home"
    - "Non-normative evidence section: window coordinates and deltas are copied into the spec, sampled values are cited, so the owner gate can audit without re-running sampling"
    - "Per-surface grammar sections each close with a Binding / Not binding pair and name their binding source path"

key-files:
  created:
    - docs/governance/reference-ui-specification.md
  modified: []

key-decisions:
  - "The provenance citation path is written against the ACTUAL JSON shape — provenance.tokens[n] is an array of 14 per-token entries, not an object keyed by token name — so no reader follows a path that does not resolve"
  - "The §2.1 Notes cells describe each token's role and derivation intent without hex and without restating the frozen value; the three weak-evidence tokens (frameForeground, textSecondary, warning) are described as ink/background blends with visionEstimate/ownerConfirm flags, matching tokens.json review.notes rather than the UI-SPEC provisional wording"
  - "§8.1 is written as a mirror with an explicit note that docs/governance/visual-qa-rules.md is the normative copy and that plan 01-05 owns the mirror verification; this plan neither reads nor diffs that file"
  - "§8.2 is written as a specification with an explicit statement that the harness is built in Phase 002; no test file, no tests/visual/ directory and no Playwright config were created"
  - "The diagnostic asset is registered in §1 with role diagnostic and the statement that it is never a design source, and §3 records that it was never sampled for design values"

patterns-established:
  - "Raw hex lives only in docs/governance/tokens.json; every other governance artifact cites token names and JSON paths"
  - "Surface grammar sections are citable by stable anchor and carry a fixed Binding / Not binding closing pair"

requirements-completed: [GOV-02, GOV-04]

coverage:
  - id: D1
    description: "docs/governance/reference-ui-specification.md exists with the nine contracted level-2 headings in order; §2 is the shared design-system core with the 14-token citation table (every `Resolves to` cell a tokens.json path), the spacing/typography/geometry scales, exactly two elevation levels, the reserved-accent list and the multi-hue restriction — and the whole file contains zero raw hex literals"
    requirement: GOV-04
    verification:
      - kind: manual_procedural
        ref: "node -e heading-order + TOKEN-CITES-OK + reserved-list/multi-hue/space/font/radius/shadow assertions; grep -o -E '#[0-9A-Fa-f]{6}' -> 0 matches; tokens.json cited 42x"
        status: pass
    human_judgment: false
  - id: D2
    description: "§3 records the non-normative provenance evidence: 14 per-token tables with 5-6 window rows each carrying source image, x/y/w/h coordinates, a tokens.json RGB citation and the numeric ±4px delta; the three thin-stroke/anti-aliasing risk zones are named for owner confirmation; the diagnostic asset is recorded as never sampled"
    requirement: GOV-04
    verification:
      - kind: manual_procedural
        ref: "node -e 14 provenance tables, 72 window rows, >=5 per table, `tokens.json → provenance.` present, 3 risk-zone sentences, PROV-TOKENS-OK; hex grep still 0"
        status: pass
    human_judgment: false
  - id: D3
    description: "§4, §5 and §6 carry the three per-surface grammars with their `Binding source:` paths, the exact 8-tab canonical nav string, the measured 3-column folder grid and 55/22.5/22.5 bottom-row proportions, and each closes with a Binding / Not binding pair pointing at §9; the three manifest anchors resolve to §4/§5/§6"
    requirement: GOV-02
    verification:
      - kind: manual_procedural
        ref: "node -e SECTIONS-OK plus per-section required-string assertions for §4/§5/§6; Not binding lines present in all three"
        status: pass
    human_judgment: false
  - id: D4
    description: "§7 copywriting contract with its defaults table, §8.1 the 12-row objective visual QA gate mirror plus the three §21 reject conditions, and §8.2 the Playwright harness contract (4 viewports, baseline path scheme, default/reduced-motion states, both tolerance numbers) written as specification only"
    verification:
      - kind: manual_procedural
        ref: "node -e QA-NAMES-OK, 12 numbered QA rows, all §8.2 viewport/tolerance strings present, 'built in Phase 002' present; git status shows no *.spec.ts, no tests/visual/, no Playwright config, no package.json"
        status: pass
    human_judgment: false
  - id: D5
    description: "The descriptive per-surface grammar in §4-§6 faithfully records the geometry, composition and interaction grammar of the three binding primaries (derived by direct visual inspection of the three reference JPGs)"
    verification: []
    human_judgment: true
    rationale: "The grammar was derived from a vision pass over the three reference images. String-level checks prove the required descriptors are present, but only the product owner comparing the document against the images at the D-08 design gate can confirm the recorded grammar is the right grammar and that no surface was over- or under-described."

metrics:
  duration: 14min
  started: "2026-10-06T02:00:00+03:00"
  completed: "2026-10-06T02:13:30+03:00"
  tasks: 3
  files: 1
status: complete
---

# Phase 1 Plan 01-04: Reference UI Specification Summary

**`docs/governance/reference-ui-specification.md` — one shared design-system core plus the three per-surface grammars, a token table that cites `tokens.json` instead of restating it, a non-normative provenance record carrying window coordinates only, the mirrored 12-row QA gate, the Playwright harness written as specification, and zero raw hex literals across 669 lines**

## Performance

- **Duration:** ~14 min
- **Started:** 2026-10-06T02:00:00+03:00
- **Completed:** 2026-10-06T02:13:30+03:00
- **Tasks:** 3
- **Files created:** 1 (669 lines)

## Accomplishments

- Wrote the nine contracted level-2 sections in order so later phases can cite them by stable
  anchor: §1 scope, §2 the shared core, §3 provenance, §4-§6 the three surface grammars, §7
  copywriting, §8 acceptance gates, §9 do-not-reuse.
- Wrote §2 as the shared design-system core: the 60/30/10 role summary, the 14-row token table
  whose every `Resolves to` cell is the citation `docs/governance/tokens.json` → `color.<token>`,
  the reserved-accent and multi-hue restriction lists, the six-step spacing scale, the
  four-size/two-weight type scale, the five-step radius scale and exactly two elevation levels.
  The file cites `docs/governance/tokens.json` 42 times and contains no hex literal.
- Wrote §3 as a non-normative evidence record: 14 per-token tables, 72 window rows total (5-6
  each), each row carrying the source image, `x`/`y`/`w`/`h`, a `tokens.json → provenance.…rgb`
  citation and the numeric ±4px max delta. No RGB triple is restated. `frameForeground`,
  `textSecondary` and `warning` are named as thin-stroke/anti-aliasing risk zones flagged for
  owner confirmation; the diagnostic asset is recorded as never sampled.
- Inspected the three binding primaries as images and wrote §4-§6 from what they actually show:
  the provider rail/top-bar/three-column body, the folder-tab grid with status pills riding
  progress lines, the Critical Alerts salmon panel and the 2x2 Daily Stats; the workspace pill
  tab bar with its exact 8-tab set, the near-parity card/canvas tones, the timeline band with
  filled accent nodes, count badges and calm branch arcs, the scrubber with its dark viewport
  window, and the 55/22.5/22.5 bottom row; the patient-home minimal nav, Next Action hero,
  Health Snapshot, Quick Log decorative chips and nested My Care Plan.
- Wrote §7 copywriting rules and defaults, §8.1 as a 12-row objective QA gate explicitly marked
  as the mirror of `visual-qa-rules.md`, and §8.2 as the Playwright harness contract with the
  four viewports, the baseline path scheme, the two states and both tolerance numbers — stated
  as specification built in Phase 002, with nothing implemented.
- Wrote §9 as the sample-content do-not-reuse list and verified it agrees entry-for-entry with
  `docs/governance/reference-manifest.json` → `doNotReuse`.
- Held the scope fence: no product code, no `tokens.css`, no test file, no `tests/visual/`, no
  Playwright config, no package.json, no lint/CI, and no asset rename.

## Task Commits

Each task was committed atomically:

1. **Task 1: write sections 1-2 (scope + shared design-system core)** - `d305a6c` (docs)
2. **Task 2: write sections 3-6 (provenance record + three surface grammars)** - `c539cce` (docs)
3. **Task 3: write sections 7-9 (copywriting, acceptance gates, do-not-reuse) and cross-check** - `b3b0be7` (docs)

**Plan metadata:** SUMMARY commit follows this file (docs: complete plan).

## Files Created/Modified

- `docs/governance/reference-ui-specification.md` - the human-facing Reference UI Specification (669 lines): §1 scope, §2 shared core, §3 non-normative provenance, §4-§6 per-surface grammars, §7 copywriting, §8 acceptance gates, §9 do-not-reuse.

## Decisions Made

- **Provenance citation path follows the real JSON shape.** The plan described the record as
  `provenance.<token>.windows`, but `tokens.json` stores `provenance.tokens` as an **array** of
  14 per-token entries. The document cites `tokens.json → provenance.tokens[n].windows[i].rgb`
  and explains the array in §3's opening paragraph, so no reader follows a path that does not
  resolve. Window coordinates and deltas are still copied verbatim from the JSON.
- **§2.1 Notes describe roles, not provisional values.** The plan's draft Notes wording
  (for example "near-black warm charcoal ink" for `frameForeground`) was written against the
  UI-SPEC provisional values, which plan 01-01 superseded by sampling. The frozen values for
  `frameForeground` and `textSecondary` are ink/background blends flagged `visionEstimate` +
  `ownerConfirm`; the Notes cells say so and point at `tokens.json` → `review`, matching the
  artifact that actually exists instead of contradicting it.
- **§8.1 is a mirror with an explicit ownership note.** The table states that
  `docs/governance/visual-qa-rules.md` is the normative copy and that plan 01-05 owns the mirror
  verification; this plan neither reads nor diffs that file, as the plan instructed.
- **§8.2 states its own non-implementation.** The contract opens with the statement that the
  harness and baselines are built in Phase 002 and that nothing in this phase implements or runs
  it, so the "specification only" boundary survives a later re-read.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Provenance citation path corrected to the real JSON shape**
- **Found during:** Task 2 (section 3, token provenance)
- **Issue:** The plan specified the citation string `tokens.json → provenance.<token>.windows[i].rgb`,
  but `docs/governance/tokens.json` stores `provenance.tokens` as an array of 14 per-token
  entries, not an object keyed by token name. Writing the plan's literal path would have pointed
  readers at a JSON path that does not resolve.
- **Fix:** Cited `tokens.json → provenance.tokens[n].windows[i].rgb` and added an opening
  paragraph in §3 explaining that `provenance.tokens` is an array in canonical token order. The
  substring `tokens.json → provenance.` (which the acceptance criterion checks) is preserved in
  every table row.
- **Files modified:** `docs/governance/reference-ui-specification.md`
- **Verification:** 14 tables, 72 window rows, every row carries the citation; coordinates and
  deltas copied from the JSON; hex grep still returns 0 matches.
- **Committed in:** `c539cce`

**2. [Rule 1 - Bug] §2.1 Notes rewritten to match the frozen tokens instead of superseded provisionals**
- **Found during:** Task 1 (section 2.1, token table)
- **Issue:** The plan's Notes wording for `frameForeground` ("near-black warm charcoal ink") and
  `textSecondary` described the UI-SPEC provisional values, which plan 01-01 replaced by sampled
  ink/background blends (`visionEstimate` + `ownerConfirm`). Writing the plan's wording verbatim
  would have contradicted `tokens.json` → `review.notes` in the same governance package.
- **Fix:** Described each token's role and derivation intent with no hex, named the blend
  character of the two weak tokens, and pointed at `docs/governance/tokens.json` → `review` for
  the adjudication. `warning` is likewise described as the weakest-evidence token flagged for
  pixel confirmation.
- **Files modified:** `docs/governance/reference-ui-specification.md`
- **Verification:** token-cite assertion passes; the three risk tokens are flagged in both §2.1
  and §3; hex grep returns 0 matches.
- **Committed in:** `d305a6c`

---

**Total deviations:** 2 auto-fixed (2 correctness adaptations to the artifacts that actually exist)
**Impact on plan:** Both are accuracy fixes — one prevents a dangling JSON citation, the other
prevents the spec from contradicting `tokens.json`. No scope was added, no surface section was
invented, and no product code or test artifact was created.

## Issues Encountered

- None beyond the two adaptations above. The three reference JPGs were inspected directly as
  images (the read tool renders them), which is what let §4-§6 describe the folder-tab grid,
  the accent count badges, the dark scrubber viewport window and the 55/22.5/22.5 bottom row
  from observation rather than from the UI-SPEC prose alone.

## Verification

All 27 plan-level checks were re-run against the committed file and pass:

- 14 token cites, zero raw hex literals, `docs/governance/tokens.json` cited 42 times.
- §3: 14 provenance tables, 72 window rows (≥5 each), citations present, 3 risk zones, diagnostic
  never sampled.
- §4-§6: binding sources, the exact 8-tab nav string, `3 columns`, `radius.lg`, `shadow.raised`,
  `55`/`22.5`, `semantic zoom`, `Never gamified`, and a `Not binding:` line in each.
- §8.1: all 12 check names plus 12 numbered rows; §8.2: four viewports, the baseline path scheme,
  `maxDiffPixelRatio: 0.01`, `threshold: 0.2`, `default`/`reduced-motion`, "built in Phase 002".
- §9: do-not-reuse list consistent with `reference-manifest.json` → `doNotReuse`.
- No `*.spec.ts`, no `tests/visual/`, no Playwright config, no `package.json`.

## User Setup Required

None - no external service configuration required. No packages installed, no tooling added.

## Next Phase Readiness

- `reference-ui-specification.md` is complete and machine-verified against `tokens.json` and
  `reference-manifest.json`; plans 01-05 and 01-06 can cite it directly.
- Plan 01-05 owns the normative 12-row gate in `visual-qa-rules.md` and must confirm its table
  agrees with §8.1 here.
- The D-08 owner gate (plan 01-06) still adjudicates `tokens.json` → `review.weakEvidenceTokens`
  and `review.accentSplit`; §3 surfaces the same risk zones so the gate has one place to read
  them, and §2.1 carries the conditional `accentSoft` clause.
- Phase 002 builds the Playwright harness specified in §8.2 and implements the three machine
  checks named in the constitution §8 — this phase implements neither.

## Self-Check: PASSED

- `docs/governance/reference-ui-specification.md` exists on disk (669 lines).
- `git log --oneline --grep="01-04"` returns three task commits (`d305a6c`, `c539cce`, `b3b0be7`).
- All 27 plan-level acceptance checks re-run and pass; zero failures.
- `git status --short` shows this plan created only `docs/governance/reference-ui-specification.md`;
  the pre-existing dirty entries (`.planning/config.json`, the deleted diagnostic PNG and the
  untracked `patient-tracking-dashboard.jpg`) were left untouched.

---
*Phase: 1-project-constitution-reference-ui-specification*
*Completed: 2026-10-06*
