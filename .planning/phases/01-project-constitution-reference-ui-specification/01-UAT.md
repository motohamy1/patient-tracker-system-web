---
status: complete
phase: 01-project-constitution-reference-ui-specification
source: [01-01-SUMMARY.md, 01-02-SUMMARY.md, 01-03-SUMMARY.md, 01-04-SUMMARY.md, 01-05-SUMMARY.md, 01-06-SUMMARY.md]
started: 2026-10-06T00:40:00Z
updated: 2026-10-06T00:40:00Z
---

## Current Test
<!-- OVERWRITE each test - shows where we are -->

[testing complete]

## Tests

### 1. Weak-evidence token adjudication (01-01 D4)
expected: Weak-evidence token values (frameForeground, textSecondary, warning, critical) adjudicated against the reference images at the D-08 owner gate
result: pass

### 2. accentSoft admission decision (01-01 D5)
expected: accentSoft admission decision (D-02 split) — measured 17.12 deg hue separation between the timeline accent and the provider-home CTA
result: pass

### 3. Scope fence held (01-02 D3)
expected: Scope fence held: no reference asset renamed/moved, no product code, no docs/governance/ file created by this plan, decision records untouched
result: pass

### 4. Constitution deliverables confirmation (01-03 D1-D3, all auto-covered)
expected: |
  Confirm the three 01-03 constitution deliverables are auto-covered:
  (D1) project-constitution.md with the nine fixed headings in order, the 9-level hierarchy, the NEVER-a-higher-authority clause, the diagnostic-evidence-only rule, the must-feel/must-not-feel lists and the D-01 light-frame grounding;
  (D2) the human-readable reference registry recording the four assets + sha256, the diagnostic asset marked 'diagnostic only' / 'never a design source', the §6 do-not-reuse and §7 reject lists, and the three named Phase-002 machine checks with written rule text;
  (D3) cross-check that the registry agrees with reference-manifest.json asset-for-asset, §4.3 token names agree with tokens.json, no docs/governance/*.md other than tokens.json holds a raw hex literal, and no lint/CI config exists.
  All three are verified green by `node scripts/validate-governance.mjs` (checks GOV-01, GOV-02a, GOV-02d, GOV-04c, GOV-06).
result: pass

### 5. Per-surface grammar fidelity (01-04 D5)
expected: The descriptive per-surface grammar in §4-§6 faithfully records the geometry, composition and interaction grammar of the three binding primaries (derived by direct visual inspection of the three reference JPGs)
result: pass

### 6. Objective-check sufficiency (01-05 D4)
expected: The objective-check phrasing in each invariant and each QA row is the right, sufficient test for the visual property it defends (e.g. relative-luminance threshold for the light frame, collision-free sibling branches, the reserved-accent list)
result: pass

### 7. D-08 gate outcome recorded (01-06 D3)
expected: The D-08 owner gate outcome is written into tokens.json -> review: 15 color keys with accentSoft immediately after accent, ownerConfirmed true, gateStatus approved-with-changes, complete notes
result: pass

### 8. tokens.json schema (01-01 D1)
expected: docs/governance/tokens.json exists, parses, and holds exactly the 14 canonical camelCase color keys in order plus the radius/space/font/shadow/motion blocks, with shadow ink derived from the sampled textPrimary
result: pass
source: automated
coverage_id: "01-01 D1"

### 9. Reference manifest registry (01-01 D2)
expected: docs/governance/reference-manifest.json registers exactly four assets (3 binding + 1 diagnostic) with path/role/sha256/governs and the do-not-reuse list; all four hashes recomputed with certutil and matched
result: pass
source: automated
coverage_id: "01-01 D2"

### 10. Provenance evidence completeness (01-01 D3)
expected: Provenance evidence: 14 entries, each >=5 windows with rgb/+4/-4 shift reads and maxDelta <=2, plus the rejected windows that failed the gates
result: pass
source: automated
coverage_id: "01-01 D3"

### 11. Six stale path corrections (01-02 D1)
expected: Six stale path references in four planning documents corrected to patient-tracking-dashboard.jpg (PROJECT.md:86,112; ROADMAP.md:47; STATE.md:67; PITFALLS.md:7,144)
result: pass
source: automated
coverage_id: "01-02 D1"

### 12. Corrected paths resolve (01-02 D2)
expected: Every corrected path resolves to a real, registry-agreed asset: docs/reference/patient-tracking-dashboard.jpg with role: diagnostic
result: pass
source: automated
coverage_id: "01-02 D2"

### 13. Project constitution (01-03 D1)
expected: docs/governance/project-constitution.md exists with the nine fixed level-2 headings in order, the 9-level (8-numbered) source-of-truth hierarchy, the NEVER-a-higher-authority clause, the diagnostic-evidence-only rule, the must-feel/must-not-feel character lists, and the D-01 light-frame grounding
result: pass
source: automated
coverage_id: "01-03 D1"

### 14. Registry and rejection contract (01-03 D2)
expected: The human-readable reference registry records the four assets and their sha256 values, with the diagnostic asset marked 'diagnostic only' and 'never a design source'; the §6 do-not-reuse list and the §7 reject list are present; the three named Phase-002 machine checks are specified with written rule text
result: pass
source: automated
coverage_id: "01-03 D2"

### 15. Cross-document agreement (01-03 D3)
expected: Cross-check: the registry table agrees with reference-manifest.json asset-for-asset; the §4.3 token names agree with tokens.json's color key set; no docs/governance/*.md other than tokens.json contains a raw hex literal; no lint/CI config or check implementation exists
result: pass
source: automated
coverage_id: "01-03 D3"

### 16. Reference UI specification structure (01-04 D1)
expected: docs/governance/reference-ui-specification.md exists with the nine contracted level-2 headings in order; §2 is the shared design-system core with the 14-token citation table (every `Resolves to` cell a tokens.json path), the spacing/typography/geometry scales, exactly two elevation levels, the reserved-accent list and the multi-hue restriction — and the whole file contains zero raw hex literals
result: pass
source: automated
coverage_id: "01-04 D1"

### 17. Provenance section in the spec (01-04 D2)
expected: §3 records the non-normative provenance evidence: 14 per-token tables with 5-6 window rows each carrying source image, x/y/w/h coordinates, a tokens.json RGB citation and the numeric ±4px delta; the three thin-stroke/anti-aliasing risk zones are named for owner confirmation; the diagnostic asset is recorded as never sampled
result: pass
source: automated
coverage_id: "01-04 D2"

### 18. Per-surface grammar sections (01-04 D3)
expected: §4, §5 and §6 carry the three per-surface grammars with their `Binding source:` paths, the exact 8-tab canonical nav string, the measured 3-column folder grid and 55/22.5/22.5 bottom-row proportions, and each closes with a Binding / Not binding pair pointing at §9; the three manifest anchors resolve to §4/§5/§6
result: pass
source: automated
coverage_id: "01-04 D3"

### 19. Copywriting, QA mirror and harness contract (01-04 D4)
expected: §7 copywriting contract with its defaults table, §8.1 the 12-row objective visual QA gate mirror plus the three §21 reject conditions, and §8.2 the Playwright harness contract (4 viewports, baseline path scheme, default/reduced-motion states, both tolerance numbers) written as specification only
result: pass
source: automated
coverage_id: "01-04 D4"

### 20. UI invariants (01-05 D1)
expected: docs/governance/ui-invariants.md exists with the five contracted level-2 headings in order; exactly 17 non-skipped, non-reused INV IDs (INV-01…INV-06 visual character, INV-07…INV-12 geometry, INV-13…INV-17 depth); every ID sits in a greppable row with a non-empty objective check; the machine-enforceable subset is mapped to the three Phase-002 checks; and the file holds zero raw hex literals
result: pass
source: automated
coverage_id: "01-05 D1"

### 21. Visual QA rules (01-05 D2)
expected: docs/governance/visual-qa-rules.md exists with the three contracted level-2 headings in order; exactly 12 numbered rows whose check names match reference-ui-specification.md §8.1 row-for-row, with row 5 carrying 55/22.5/22.5, rows 2 and 8 carrying 10%, and row 12 carrying success/info/warning; §2 carries the four viewports, the baseline path scheme, both tolerance numbers, both states and Phase 002; §3 carries the three §21 rejections and the build passes prohibition; and the file holds zero raw hex literals
result: pass
source: automated
coverage_id: "01-05 D2"

### 22. Cross-document token consistency (01-05 D3)
expected: Cross-document consistency: every radius/space/shadow token reference in both files resolves to a key that exists in docs/governance/tokens.json; the five radius steps, six space steps and two shadow keys cited match the frozen JSON (including the 4/8/12/16/24/32px spacing values and 44px as a target size, not a spacing step); the 12 QA rows agree row-for-row with reference-ui-specification.md §8.1; and neither file implies an existing harness, lint rule or CI job
result: pass
source: automated
coverage_id: "01-05 D3"

### 23. Responsive rules (01-06 D1)
expected: docs/governance/responsive-rules.md records the three §26 bands (desktop >=1024px, tablet 768-1023px, mobile <768px), the per-band adaptation contract and the shrink prohibition, with no raw hex
result: pass
source: automated
coverage_id: "01-06 D1"

### 24. Motion rules (01-06 D2)
expected: docs/governance/motion-rules.md records the tokenized values copied from tokens.json, the Framer Motion / GSAP two-layer split and the mandatory reduced-motion contract, with no raw hex
result: pass
source: automated
coverage_id: "01-06 D2"

### 25. Full-package sweep (01-06 D4)
expected: The full-package verification sweep (task-4): 8 files, GOV-01..GOV-06 evidence, 17 INV rows, 12 QA rows, zero stray hex, D-12 rows corrected, phase fence held, gate closed
result: pass
source: automated
coverage_id: "01-06 D4"

## Summary

total: 25
passed: 25
issues: 0
pending: 0
skipped: 0

## Gaps

[none yet]
