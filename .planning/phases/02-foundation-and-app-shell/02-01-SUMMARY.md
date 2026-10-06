---
phase: 02-foundation-and-app-shell
plan: 02-01
subsystem: docs
tags: [tokens, design-tokens, governance, color-sampling, d-27, provenance]

# Dependency graph
requires:
  - phase: 01-project-constitution-reference-ui-specification
    provides: docs/governance/tokens.json frozen 15-token set, reference-ui-specification.md sections 2.1/3.1/3.5/3.16 sampling method, Phase 001 documented sampling fallback order, docs/governance/reference-manifest.json sha256 registry
provides:
  - color.frame #F1F4F8 re-sampled from provider-home structural chrome (provenance.tokens[0], 6 gate-passing windows)
  - color.surfaceMuted #E8E8ED re-sampled from the patient-home quick-log note field (provenance.tokens[4], 5 gate-passing windows)
  - Four surface roles measurably distinct: frame/surface 1.1662:1, surfaceMuted/surface 1.0536:1, frame/surfaceMuted 1.1070:1, frame/canvas 1.1996:1
  - D-27 re-freeze gate CLOSED: review.gateStatus = approved-with-changes, ownerConfirm true on both re-sampled entries, resume signal `resume:02-03` recorded in review.notes
  - Governance prose swept; flat-band re-reads recorded as crossChecks, not token values
affects: [02-03 token codegen (bg-surface-muted ordinary utility), 02-06 shell/INSET_FILL (plain muted inset fill, no raised fallback), every baseline plan that renders surfaceMuted controls]

# Tech tracking
tech-stack:
  added: []
  patterns: [Phase 001 sampling fallback order (ffmpeg -> PowerShell System.Drawing region-average -> eyedropper), four-gate window discipline (8-24px, 4x4 sub-scan spread <= 4/255, +/-4px agreement <= 2/255, channel-wise median), gate status as the single downstream source of truth]

key-files:
  created: [.planning/phases/02-foundation-and-app-shell/02-01-SUMMARY.md]
  modified: [docs/governance/tokens.json, docs/governance/reference-ui-specification.md]

key-decisions:
  - "D-27 re-freeze gate closed approved-with-changes: the owner approved BOTH re-sampled values exactly as sampled (#F1F4F8 frame, #E8E8ED surfaceMuted) with no adjustment and no rejection; gateStatus records approved-with-changes because the re-sample is itself a change to the previously frozen byte-identical values - the field's meaning, not an adjustment outcome"
  - "ownerConfirm set true on provenance.tokens[0] and provenance.tokens[4]: the field means the owner confirmed the value, and the D-27 gate is exactly that confirmation (noted deviation, below)"
  - "visionEstimate stays true on both records: the values came from the documented Phase 001 fallback (a) PowerShell System.Drawing region-average because ffmpeg 8.1.1 misdecodes the yuvj420p assets through the crop/scale chain; owner approval at the gate is what makes a fallback value admissible"
  - "No token value was edited after the gate; the other 13 color tokens and every radius/space/font/shadow/motion value are provably unchanged (OTHERS-FROZEN-OK, SCALES-OK)"

patterns-established:
  - "D-27 window discipline: primary windows move to the region that owns the role (frame -> provider-home rail/top-bar; surfaceMuted -> quick-log note field); old shared-band coordinates are recorded only as crossChecks, never re-frozen"
  - "Gate outcome routing for downstream plans: review.gateStatus is read at module load; nothing hardcodes today's outcome"

requirements-completed: [FOUND-03]

coverage:
  - id: D1
    description: "color.frame and color.surfaceMuted re-sampled with full four-gate window provenance at their original provenance.tokens indices (0 and 4), distinct from surface and from each other"
    requirement: FOUND-03
    verification:
      - kind: other
        ref: "node -e KEYS-OK:15 / DISTINCT-OK / OTHERS-FROZEN-OK / SCALES-OK / POSITIONS-OK:0,4 / window-gate sweep (all printed OK)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Owner visual re-freeze of the two re-sampled values against the binding reference JPGs (the D-27 gate, analogue of the D-08 gate)"
    requirement: FOUND-03
    verification:
      - kind: manual_procedural
        ref: "Owner side-by-side review of provider-home-primary.jpg vs patient-workspace-timeline-primary.jpg; owner call recorded in review.notes (2026-10-06)"
        status: pass
    human_judgment: true
    rationale: "The gate is by definition a human visual adjudication of sampled colors against rendered reference images; executor judgement alone cannot approve a value, and the values carry a documented fallback method that only owner approval makes admissible."

# Metrics
duration: 1h26min
completed: 2026-10-06
status: complete

---

# Phase 02 Plan 02-01: D-27 Re-sampling and Owner Re-freeze Summary

**`color.frame` #F1F4F8 and `color.surfaceMuted` #E8E8ED re-sampled from their role-owning reference regions with full four-gate provenance, and the D-27 owner re-freeze gate closed approved-with-changes — the four surface roles are measurably distinct for the first time.**

## Performance

- **Duration:** 1h 26min (committed span 18:05Z–19:04Z; task-1 measurement work preceded the first commit)
- **Started:** 2026-10-06T17:38:00Z
- **Completed:** 2026-10-06T19:04:00Z
- **Tasks:** 3/3 (task-1 + task-2 in the prior run; task-3 gate + close-out in this resume run)
- **Files modified:** 2 (+ this summary)

## Accomplishments
- Re-sampled `color.frame` = `#F1F4F8` (channel-wise median of 6 gate-passing windows, provider-home left icon rail / top-bar band) and `color.surfaceMuted` = `#E8E8ED` (median of 5 gate-passing windows, patient-home quick-log note field); both records sit at their original `provenance.tokens` positions (0 and 4) with the recorded method string and `visionEstimate: true`.
- Measured contrast on the record: frame▸surface 1.1662:1, surfaceMuted▸surface 1.0536:1, frame▸surfaceMuted 1.1070:1, frame▸canvas 1.1996:1 — versus 1.00:1 at the pre-D-27 freeze.
- Governance prose swept: `reference-ui-specification.md` sections 2.1, 3.1 and 3.5 re-pointed at the new provenance; every historical "the three tokens are identical" statement now explicitly describes the pre-D-27 state; no raw hex exists outside `tokens.json`.
- D-27 owner re-freeze gate (task-3) executed: the owner approved BOTH values as sampled, and the decision, reviewer and date are recorded in `review.notes`, with the downstream resume signal `resume:02-03`.

## Task Commits

Each task was committed atomically:

1. **Task 1: confirm sampling toolchain and re-sample `frame`/`surfaceMuted`** — no commit (measurement only; by plan design no file is written)
2. **Task 2: write re-sampled values into tokens.json + sweep governance prose** - `b3997e2` (docs)
3. **Task 3: owner visual review of the re-sampled values (D-27 re-freeze gate)** - `07398f4` (docs)

## Files Created/Modified
- `docs/governance/tokens.json` - `color.frame`, `color.surfaceMuted`, `provenance.tokens[0]`, `provenance.tokens[4]`, `provenance.crossChecks` (flat-band re-reads + scrubber-track cross-check), `review.notes` (D-27 rationale chain + gate adjudication + resume signal), `review.gateStatus` = `approved-with-changes`, `ownerConfirm: true` on tokens 0 and 4
- `docs/governance/reference-ui-specification.md` - sections 2.1, 3.1, 3.5 re-pointed at the re-sampled provenance (JSON-path citations, no restated values)

## Decisions Made
- **`review.gateStatus` = `approved-with-changes`.** The plan's task-3 acceptance allows exactly `approved-with-changes` or `reopened-rejected`; the owner approved both values without adjustment, and the re-sample is itself a change to the previously frozen values, which is what the field records. No third value was invented.
- **Resume signal is the approved variant:** `resume:02-03` (not `resume:02-03,02-06`, which is reserved for the rejected path).
- **Fallback values adjudicated at the gate:** ffmpeg 8.1.1 misdecodes these yuvj420p JPEGs through the crop/scale chain, so the values carry the documented `System.Drawing region-average` method and `visionEstimate: true`; the owner's explicit approval at the D-27 gate is what makes them admissible under the plan's tooling precondition — executor judgement alone never could.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Orchestrator-authorised extension] Set `ownerConfirm: true` on `provenance.tokens[0]` and `provenance.tokens[4]`**
- **Found during:** Task 3 (D-27 re-freeze gate)
- **Issue:** The plan scoped task-3's writes to `review.gateStatus` and `review.notes` only, leaving the two `ownerConfirm` fields at `false` even after the owner explicitly approved both values at exactly the gate the field exists to record.
- **Fix:** Set `ownerConfirm: true` on both re-sampled entries (the orchestrator authorised this in the assignment brief); kept the recorded `visionEstimate: true` unchanged on both.
- **Files modified:** `docs/governance/tokens.json` (2 lines)
- **Verification:** `provenance.tokens[0].ownerConfirm === true`, `provenance.tokens[4].ownerConfirm === true`, `visionEstimate === true` on both — confirmed in the post-gate assertion run.
- **Committed in:** `07398f4` (part of the task-3 commit)

---

**Total deviations:** 1 auto-fixed (1 orchestrator-authorised extension, Rule 3)
**Impact on plan:** Corrects a misrepresentation the gate would otherwise leave frozen (owner-approved values recorded as unconfirmed). No scope creep: no token value, key, scale or prose was touched beyond the gate record.

## Issues Encountered
- `ffmpeg` 8.1.1 is installed but misdecodes the baseline yuvj420p JPEGs through the crop/scale chain (a 223,226,231 window decodes 253,253,253), so task-1 ran the Phase 001 documented fallback (a): PowerShell `System.Drawing` region-average. Resolved per plan: fallback method string recorded in both provenance entries, `visionEstimate: true`, and the values presented to and approved by the owner at the task-3 gate.

## User Setup Required
None - no external service configuration required.

## Downstream plan routing (recorded per task-3's final acceptance criterion)

Gate outcome on the record: **`approved-with-changes`** (the approving, non-rejected outcome). What each downstream plan must do:

- **`approved*` outcome (today's):** `color.surfaceMuted` #E8E8ED is frozen and **distinct** from `color.surface` #E0E3E8.
  - **Plan 02-03 (token codegen):** generates `bg-surface-muted` as an **ordinary utility** and asserts it like any other background utility.
  - **Plan 02-06 (shell):** `INSET_FILL` resolves to the **plain muted inset fill**, never the `surfaceRaised` + `shadow-raised` fallback.
- **(For the record only — not today's path) `reopened-rejected`:** plan 02-03 would still generate `bg-surface-muted` (keys can never be added or removed, INV-01) but must not treat that fill as a visible edge, and plan 02-06 would take the `surfaceRaised` + `shadow-raised` rejected branch per 02-UI-SPEC Reviewer item C.
- **In both cases:** `review.gateStatus` stays the single source of truth read by plan 02-06 at module load; nothing downstream hardcodes today's outcome.

## Next Phase Readiness
- Plan 02-01 is unblocked-and-complete; the frozen token file is the sole committed source for the token codegen in plan 02-03 (`src/styles/tokens.generated.css` is gitignored, D-06).
- The 02-02 scaffold (committed `b3997e2`'s sibling commits `a69156a`, `3c33ecf`, `1583221`) already wires `predev`/`prebuild`/`lint` to the token scripts; once plan 02-04 lands `scripts/generate-tokens.mjs`, the D-27 values flow into every generated utility.
- No blockers open from this plan. The weak-evidence tokens flagged for the owner (frameForeground, textSecondary, warning, critical) were confirmed as frozen at the D-08 gate and are not re-opened by D-27.

---
*Phase: 02-foundation-and-app-shell*
*Completed: 2026-10-06*
