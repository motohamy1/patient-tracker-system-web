---
phase: 1-project-constitution-reference-ui-specification
plan: 01-01
subsystem: docs/governance (design tokens + reference registry)
tags: [design-tokens, pixel-sampling, ffmpeg, sha256, governance, provenance]

requires: []
provides:
  - "docs/governance/tokens.json — the canonical machine-readable token layer (14 color tokens + radius, space, font, shadow, motion) plus the non-normative provenance and review evidence blocks"
  - "docs/governance/reference-manifest.json — machine-readable reference registry (path, role, sha256, governs) for the four reference assets, with the do-not-reuse list"
affects:
  - "01-03 project-constitution (registry table cites the manifest; constitution names the token file)"
  - "01-04 reference-ui-specification (human token table must cite tokens.json, never restate hex)"
  - "01-06 owner design gate (reads review.gateStatus and review.weakEvidenceTokens)"
  - "Phase 002 (generates tokens.css/@theme from tokens.json; implements the three machine checks)"

tech-stack:
  added: []
  patterns:
    - "ffmpeg region-average sampling: crop WxH+X+Y -> scale=1:1:flags=area -> rgb24, verified by a 4x4 sub-scan (scale=4:4) spread gate and a +/-4px re-sample agreement gate, token value = channel-wise median"
    - "non-normative evidence blocks (provenance, review) colocated inside the token file so raw hex has exactly one home under docs/governance/"

key-files:
  created:
    - docs/governance/tokens.json
    - docs/governance/reference-manifest.json
  modified: []

key-decisions:
  - "textPrimary frozen from the large flat dark neutral of the timeline scrubber viewport window / MRI card overlay (#32353A); the reference's primary ink is #000000 with 3px glyph strokes, fails every window gate, and D-06 forbids freezing #000000"
  - "frameForeground (#A9ACB0) and textSecondary (#C5C7CB) frozen as ink/background blends because the reference's strokes are 2-3px at this resolution and no 8-24px window can sit wholly inside the ink; flagged visionEstimate + ownerConfirm with the measured ink cores recorded for the gate"
  - "critical frozen as #FFCBC8, the panel's most saturated salmon tone that satisfies the window gates; the Critical Alerts panel's saturated members (alert-icon #ED4D41, row-1 avatar tint #FEB0AF) are below the minimum window size and are recorded as rejected evidence"
  - "warning frozen from the saturated amber of the follow-up status track (#FFC30C); the Follow-up pill fill itself is a pale cream (#FEEDC5)"
  - "borderSubtle frozen from the horizontal timeline axis hairline (#A2A4AA); the lighter month-divider hairlines measure #D9DBE1/#C6C8CE and are surfaced to the owner"
  - "accentSoft NOT written: hue separation measured 17.12 deg (>= 8) but review.accentSplit.ownerConfirmed is false until the design gate"
  - "success and info sampled from the patient-home primary per the plan's region binding, even though the reference's semantic Normal status green lives in the provider-home folder status bars"

patterns-established:
  - "Raw hex lives only in docs/governance/tokens.json; every other governance artifact cites token names"
  - "Every frozen value carries its window-level evidence inside the token file so the owner gate can audit it without re-running sampling"

requirements-completed: [GOV-04, GOV-02]

coverage:
  - id: D1
    description: "docs/governance/tokens.json exists, parses, and holds exactly the 14 canonical camelCase color keys in order plus the radius/space/font/shadow/motion blocks, with shadow ink derived from the sampled textPrimary"
    requirement: GOV-04
    verification:
      - kind: manual_procedural
        ref: "node -e JSON.parse + key-set assertion -> OK; hex regex -> HEX-OK; shadow-ink assertion -> SHADOW-INK-OK"
        status: pass
    human_judgment: false
  - id: D2
    description: "docs/governance/reference-manifest.json registers exactly four assets (3 binding + 1 diagnostic) with path/role/sha256/governs and the do-not-reuse list; all four hashes recomputed with certutil and matched"
    requirement: GOV-02
    verification:
      - kind: manual_procedural
        ref: "node manifest assertion -> MANIFEST-OK; DONOTREUSE-OK; certutil -hashfile x4 matched 01-RESEARCH.md"
        status: pass
    human_judgment: false
  - id: D3
    description: "Provenance evidence: 14 entries, each >=5 windows with rgb/+4/-4 shift reads and maxDelta <=2, plus the rejected windows that failed the gates"
    requirement: GOV-04
    verification:
      - kind: manual_procedural
        ref: "node provenance assertion -> 14 entries complete, 0 window problems"
        status: pass
    human_judgment: false
  - id: D4
    description: "Weak-evidence token values (frameForeground, textSecondary, warning, critical) adjudicated against the reference images at the D-08 owner gate"
    requirement: GOV-04
    verification: []
    human_judgment: true
    rationale: "Three of these values are ink/background blends forced by a 2-3px stroke width, and critical could not preserve the plan's 'do not freeze a soft fill' instruction inside the window discipline. Only the product owner, comparing swatches against the three binding primaries, can decide the final values."
  - id: D5
    description: "accentSoft admission decision (D-02 split) — measured 17.12 deg hue separation between the timeline accent and the provider-home CTA"
    requirement: GOV-02
    verification: []
    human_judgment: true
    rationale: "The plan requires the product owner to confirm the split at the design gate; the measured separation is above the 8 deg threshold but the token is deliberately withheld until that confirmation."

metrics:
  duration: 2h 10m
  started: "2026-10-06T00:00:00Z"
  completed: "2026-10-06"
  tasks: 5
  files: 2
status: complete
---

# Phase 1 Plan 01-01: Pixel sampling, frozen tokens.json, and the reference manifest Summary

**All 14 canonical color tokens sampled from the three binding primaries by ffmpeg region-average (5+ disjoint windows each, 4x4 sub-scan and +/-4px agreement gates), frozen into `tokens.json` with window-level provenance, alongside a sha256-verified four-asset reference manifest**

## Performance

- **Duration:** ~2h 10m
- **Started:** 2026-10-06T00:00:00Z
- **Completed:** 2026-10-06
- **Tasks:** 5
- **Files created:** 2

## Accomplishments

- Created `docs/governance/` and froze `docs/governance/tokens.json` with exactly the 14 canonical camelCase color tokens in the specified order, plus radius, space, typography, exactly two shadows and the motion block. Shadow ink is machine-provably derived from the sampled `textPrimary` (`rgba(50,53,58,...)`).
- Embedded the non-normative `provenance` block: one entry per token with the source image, the exact method string, 5-6 windows each carrying `rgb`, `rgbShiftPlus4`, `rgbShiftMinus4`, `maxDelta` and `subScanSpread`, the median, and the `visionEstimate` / `ownerConfirm` flags — plus the rejected windows and the cross-checks (provider CTA for D-02, provider rail for `frame`).
- Embedded the non-normative `review` block: gate, `gateStatus: pending`, `weakEvidenceTokens`, the measured D-02 hue separation (17.12 deg) and ten measured caveats for the D-08 owner gate.
- Wrote `docs/governance/reference-manifest.json` with exactly three `binding` and one `diagnostic` asset; all four sha256 values were recomputed with `certutil` during this plan and matched `01-RESEARCH.md` exactly. The diagnostic asset keeps its filename and is listed as never a design source.
- Held the phase fence: no `package.json`, `src/`, `tokens.css`, Tailwind/PostCSS config, component or route was created, and no sampling script was committed.

## Task Commits

Each task was committed atomically:

1. **Task 1: verify toolchain and reference asset hashes** - `1f58825` (docs, intentionally empty: verification-only)
2. **Task 2: sample the 14 color tokens** - `316fd56` (docs, intentionally empty: working record, no repo file)
3. **Task 3: freeze docs/governance/tokens.json** - `85302ca` (feat)
4. **Task 4: add docs/governance/reference-manifest.json** - `87061a5` (feat)
5. **Task 5: confirm no product code and the raw-hex invariant** - `ceef807` (docs, intentionally empty: read-only verification)

## Files Created/Modified

- `docs/governance/tokens.json` - canonical token layer + non-normative provenance/review evidence
- `docs/governance/reference-manifest.json` - machine-readable reference registry (path, role, sha256, governs) + do-not-reuse list

## Frozen values

| Token | Value | Windows | Evidence |
|---|---|---|---|
| `frame` | `#E0E3E8` | 5 | timeline top-bar band |
| `frameForeground` | `#A9ACB0` | 5 | top-bar icon strokes — **visionEstimate + ownerConfirm** |
| `canvas` | `#DDE0E5` | 5 | outer page field at the node band |
| `surface` | `#E0E3E8` | 5 | Heart Rate card interior |
| `surfaceMuted` | `#E0E3E8` | 5 | scrubber track between ticks |
| `surfaceRaised` | `#EBECF0` | 5 | active tab pill fill |
| `textPrimary` | `#32353A` | 5 | dark viewport window / MRI card overlay scrim |
| `textSecondary` | `#C5C7CB` | 5 | muted axis labels — **visionEstimate + ownerConfirm** |
| `borderSubtle` | `#A2A4AA` | 5 | horizontal timeline axis hairline |
| `accent` | `#EEFE4E` | 5 | filled timeline event nodes |
| `success` | `#C5EADC` | 6 | patient-home mint chips + glucose normal-range band |
| `warning` | `#FFC30C` | 5 | follow-up status track (provider home) — **ownerConfirm** |
| `critical` | `#FFCBC8` | 6 | Critical Alerts panel salmon — **ownerConfirm** |
| `info` | `#BDCDEF` | 5 | patient-home lavender-blue chip |

Cross-check: provider-home CTA `#FFCE03`; provider-home left rail `#E9EBF1`; accent hue separation 17.12 deg.

## Decisions Made

- **textPrimary source.** The plan's "widest flat stroke interior of the 72 numeral" is not physically achievable: the numeral's strokes are 3px at this resolution, its ink core is `#000000` (which D-06 forbids freezing), and every numeral window fails the 4x4 sub-scan and the +/-4px agreement gates. The token is therefore frozen from the large flat dark neutral of the timeline scrubber's viewport window and the MRI card overlay — the two documented `textPrimary` scrims in the reference. The numeral windows are retained as rejected-evidence in `provenance.rejectedWindows`.
- **Weak tokens are flagged, not silently accepted.** `frameForeground`, `textSecondary`, `warning` and `critical` carry `ownerConfirm: true`; the first two also carry `visionEstimate: true`. `review.weakEvidenceTokens` is derived from those flags.
- **accentSoft withheld.** The D-02 split is measurable (17.12 deg) but the token is only admissible with owner confirmation, so `accentSoft` is absent and `review.accentSplit.ownerConfirmed` is `false`.
- **surface parity recorded.** `frame`, `surface` and `surfaceMuted` all measure `#E0E3E8`; the reference separates cards from the field by shadow, not by fill. This is recorded in `review.notes` for the owner rather than papered over with invented differentiation.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] textPrimary could not be sampled from the "72" numeral**
- **Found during:** Task 2 (token sampling)
- **Issue:** The plan binds `textPrimary` to the widest flat stroke interior of the "72" numeral, but the numeral's strokes are 3px wide at this resolution. No 8-24px window can be placed inside the ink: every candidate fails the 4x4 sub-scan (spread 223-231) and the +/-4px agreement gate (delta 78-141), and the ink core reads `#000000`, which D-06 forbids freezing.
- **Fix:** Sampled the timeline primary's large flat dark neutral instead — the scrubber viewport window and the MRI card overlay, both documented `textPrimary` scrims (UI-SPEC section 6 / 10.2) — with five conforming 24x24 windows across a #313439-#33363B range. The numeral windows are recorded as rejected evidence so the owner can audit the decision.
- **Files modified:** `docs/governance/tokens.json`
- **Verification:** five accepted windows, each maxDelta <= 2 and sub-scan spread <= 4; the rejected numeral windows carry their measured spreads/deltas.
- **Committed in:** `85302ca`

**2. [Rule 3 - Blocking] frameForeground and textSecondary cannot take an ink-interior window**
- **Found during:** Task 2 (token sampling)
- **Issue:** The reference's icon strokes and label glyphs are 2-3px wide. Every ink-bearing window fails the +/-4px agreement gate (deltas 3-35), and every window that passes the gate is a heavy ink/background blend.
- **Fix:** Applied the plan's own weak-evidence escape clause: froze the darkest windows that satisfy the agreement gate, flagged them `visionEstimate: true` + `ownerConfirm: true`, and recorded the directionally-correct ink cores (frameForeground ~#828385-#858787; textSecondary ~#848689-#8A8B8E; muted axis labels ~#A1A3A7) plus the UI-SPEC provisional values in `review.notes` so the owner can adjudicate at the gate.
- **Files modified:** `docs/governance/tokens.json`
- **Verification:** five accepted windows each, maxDelta <= 2; flags present; rejected ink windows recorded with their spreads.
- **Committed in:** `85302ca`

**3. [Rule 3 - Blocking] critical cannot satisfy both "not a soft fill" and the window gates**
- **Found during:** Task 2 (token sampling)
- **Issue:** The Critical Alerts panel's only saturated salmon members are below the minimum 8px square window — the alert-triangle icon cores (`#ED4D41`) fail the sub-scan gate, and the single row-1 alert avatar tint (`#FEB0AF`) yields only four disjoint windows and fails the agreement gate. Every window that satisfies both gates is a panel salmon tone close to the soft fill, which the plan explicitly forbids freezing.
- **Fix:** Satisfied the machine-checkable gates and surfaced the conflict instead of silently choosing: froze the panel's most saturated conforming tone (`#FFCBC8`), recorded every saturated candidate as rejected evidence with its spread/delta, and escalated the decision in `review.notes` and via `ownerConfirm: true`.
- **Files modified:** `docs/governance/tokens.json`
- **Verification:** six accepted windows, each maxDelta <= 2 and sub-scan spread <= 4; seven saturated candidates recorded as rejected with their measured spreads.
- **Committed in:** `85302ca`

---

**Total deviations:** 3 auto-fixed (3 blocking adaptations inside the sampling discipline)
**Impact on plan:** All three are method adaptations forced by the reference's actual glyph/icon scale; no scope was added, no product code was created, and every affected token is explicitly flagged for the D-08 owner gate.

## Issues Encountered

- The plan's 8-24px square window floor is incompatible with thin-stroke text and small saturated pills in this reference. This was resolved per-token with the plan's own weak-evidence escape rather than by relaxing the gates silently; the affected tokens are all flagged and documented.
- `warning` measures `#FFC30C`, close to the provider-home CTA gold `#FFCE03`; the reference itself renders the follow-up status amber close to the accent gold. Recorded in `review.notes` for the owner (D-04 separation).

## User Setup Required

None - no external service configuration required. No packages were installed and no tooling was added.

## Next Phase Readiness

- `tokens.json` and `reference-manifest.json` are frozen and machine-verified; plans 01-03 to 01-06 can cite them directly.
- The D-08 owner gate (plan 01-06) must adjudicate `review.weakEvidenceTokens` and `review.accentSplit` before Phase 002 generates the CSS token layer; `review.gateStatus` stays `pending` until then.
- Plan 01-02 still owns the six `.planning/` stale-path corrections; plan 01-01 deliberately performed none of them.

---
*Phase: 1-project-constitution-reference-ui-specification*
*Completed: 2026-10-06*
