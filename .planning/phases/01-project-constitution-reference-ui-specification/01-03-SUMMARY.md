---
phase: 1-project-constitution-reference-ui-specification
plan: 01-03
subsystem: docs/governance (project constitution)
tags: [governance, constitution, source-of-truth, color-language, reference-registry, anti-generic, machine-checks]

requires:
  - plan: 01-01
    provides: "docs/governance/tokens.json (14 canonical color tokens) and docs/governance/reference-manifest.json (four assets, roles, sha256)"
  - plan: 01-02
    provides: "the six corrected .planning/ reference paths (D-12)"

provides:
  - "docs/governance/project-constitution.md — the top of the source-of-truth hierarchy it defines"
  - "GOV-01: the 9-level (8-numbered) hierarchy with the NEVER-higher-authority clause"
  - "GOV-06: the anti-generic / anti-gamification reject-at-review-time criteria (§21 + §27)"
  - "The human-readable reference registry table (four assets, roles, governing sections, sha256)"
  - "The D-13 sample-content do-not-reuse list with the canonical 8-tab patient-workspace nav"
  - "The named Phase-002 machine-check contract (no-raw-hex, no-generic-healthcare-blue, token-reference-required)"

affects:
  - "01-04..01-06 (governance package siblings cite the constitution)"
  - "01-06 owner design gate"
  - "Phase 002 (implements the three named machine checks; generates the CSS token layer from tokens.json)"

tech-stack:
  added: []
  patterns:
    - "Raw hex lives only in docs/governance/tokens.json; the constitution cites token names and resolves every color through the JSON"
    - "The constitution reproduces source spec text as reject-at-review-time rules with written evidence statements, not aspirations"

key-files:
  created:
    - docs/governance/project-constitution.md
  modified: []

key-decisions:
  - "The D-01 light-frame interpretation is recorded with its reason (the §2.2 text names the hue neighborhood; the primaries render that family at high lightness) and a standing prohibition against restoring a dark frame"
  - "The constitution carries all nine fixed level-2 headings; bodies of §5-§9 landed in the task-2 commit after the task-1 commit introduced the heading contract"
  - "wording of the §7 reject list uses lowercase 'saturated multi-color' so the acceptance grep matches the spec's keyword exactly"

patterns-established:
  - "The constitution is the only governance file besides tokens.json that enumerates token names; it deliberately restates no value"

requirements-completed: [GOV-01, GOV-06]

coverage:
  - id: D1
    description: "docs/governance/project-constitution.md exists with the nine fixed level-2 headings in order, the 9-level (8-numbered) source-of-truth hierarchy, the NEVER-a-higher-authority clause, the diagnostic-evidence-only rule, the must-feel/must-not-feel character lists, and the D-01 light-frame grounding"
    requirement: GOV-01
    verification:
      - kind: manual_procedural
        ref: "node -e hierarchy-order assertion -> HIERARCHY-ORDER-OK; NINE-HEADINGS-OK; required-string grep -> TASK1-STRINGS-OK"
        status: pass
    human_judgment: false
  - id: D2
    description: "The human-readable reference registry records the four assets and their sha256 values, with the diagnostic asset marked 'diagnostic only' and 'never a design source'; the §6 do-not-reuse list and the §7 reject list are present; the three named Phase-002 machine checks are specified with written rule text"
    requirement: GOV-06
    verification:
      - kind: manual_procedural
        ref: "node -e REGISTRY-HASHES-OK; keyword grep -> TASK2-STRINGS-OK; machine-check names present; §8 heading contains 'Phase 002'"
        status: pass
    human_judgment: false
  - id: D3
    description: "Cross-check: the registry table agrees with reference-manifest.json asset-for-asset; the §4.3 token names agree with tokens.json's color key set; no docs/governance/*.md other than tokens.json contains a raw hex literal; no lint/CI config or check implementation exists"
    requirement: GOV-06
    verification:
      - kind: manual_procedural
        ref: "node -e REGISTRY-AGREES; TOKENS-AGREE; NO-RAW-HEX-OUTSIDE-TOKENS; NO-CHECK-IMPL; glob for eslint/biome/stylelint/CI -> none"
        status: pass
    human_judgment: false

metrics:
  duration: ~25min
  started: "2026-10-06T00:00:00Z"
  completed: "2026-10-06"
  tasks: 3
  files: 1
status: complete
---

# Phase 1 Plan 01-03: Project Constitution Summary

**The permanent `docs/governance/project-constitution.md` — the 9-level source-of-truth hierarchy, the D-01 light-frame color grounding, the human-readable reference registry with four sha256-verified assets, the D-13 do-not-reuse list, the §21/§27 reject-at-review criteria, and the three named Phase-002 machine checks — with zero raw hex literals**

## Performance

- **Duration:** ~25 min
- **Started:** 2026-10-06T00:00:00Z
- **Completed:** 2026-10-06
- **Tasks:** 3
- **Files modified:** 1 (created)

## Accomplishments

- Created `docs/governance/project-constitution.md` with exactly the nine contracted level-2 headings, in order, so later greps and citations are stable.
- Reproduced the §1 authority hierarchy as 8 numbered levels carrying 9 named artifacts, with the load-bearing clause: the existing repository is NEVER a higher authority than the approved design/specification, and the current-implementation screenshots are diagnostic evidence only.
- Recorded the D-01 light-frame interpretation explicitly (olive-tinted structural gray at high lightness / light warm-gray with an olive undertone), its reason (hue neighborhood vs. rendered lightness), the charcoal-bezel diagnostic note, and a standing prohibition against restoring a dark frame.
- Wrote the human-readable reference registry (four assets, roles, governing sections, sha256) as the twin of `reference-manifest.json`, and the D-13 sample-content do-not-reuse list including the canonical 8-tab patient-workspace nav.
- Named the three Phase-002 machine checks (`no-raw-hex`, `no-generic-healthcare-blue`, `token-reference-required`) with written rule text, scope and failure statements, marked specified-now / implemented-in-Phase-002.
- Held the invariants: zero raw hex literals in the file, no product code, and no lint/CI implementation.

## Task Commits

Each task was committed atomically:

1. **Task 1: write sections 1-4** - `37bf6aa` (docs)
2. **Task 2: write sections 5-9** - `91bddea` (docs)
3. **Task 3: cross-check against manifest and GOV coverage map** - `a34921d` (docs, intentionally empty: read-only verification)

_Plan metadata commit follows this SUMMARY._

## Files Created/Modified

- `docs/governance/project-constitution.md` - the permanent project constitution (nine sections, 294 lines), cited by every later phase.

## Decisions Made

- **Eight-numbered / nine-artifact framing.** §1 numbers eight levels but its level-3 entry names two artifacts; the constitution presents 8 numbered levels carrying 9 named artifacts, matching the plan's contract.
- **Heading contract first.** The task-1 commit introduced all nine fixed level-2 headings (bodies of §5-§9 landed in task-2) so the task-1 acceptance criterion "contains all nine level-2 headings" holds at the task boundary.
- **Keyword casing.** The §7 reject bullet uses lowercase `saturated multi-color` so the acceptance grep matches the spec keyword exactly.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- One acceptance-grep false start: the required phrase `light warm-gray with an olive undertone` and the keyword `saturated multi-color` initially straddled a line wrap / capitalized form. Both were reworded in place (still one commit for task-1, one for task-2) — no scope change.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- `project-constitution.md` is complete and machine-verified against `tokens.json` and `reference-manifest.json`.
- Plans 01-04 through 01-06 can cite the constitution's §5 registry, §6 do-not-reuse list, and §8 machine-check names directly.
- The D-08 owner design gate (plan 01-06) still adjudicates `review.weakEvidenceTokens` and `review.accentSplit` in `tokens.json`; the constitution's §4.3 carries the conditional `accentSoft` clause so the gate's decision edits one enumeration.
- Phase 002 implements exactly the three machine checks named in §8 — no more, no fewer.

---
*Phase: 1-project-constitution-reference-ui-specification*
*Completed: 2026-10-06*
