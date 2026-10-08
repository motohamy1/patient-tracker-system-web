---
phase: 04-provider-home-patient-folder-workspace
plan: 05
subsystem: provider-home-phase-close
wave: 5
depends_on: ["04-01", "04-02", "04-03", "04-04"]
files_modified:
  - tests/visual/surfaces.spec.ts
  - tests/visual/phase4.spec.ts
  - tests/visual/baselines/provider-home/
  - tests/visual/baselines/provider-home-new-patient/
  - supabase/seed.sql
  - .planning/phases/04-provider-home-patient-folder-workspace/04-VERIFICATION.md
autonomous: false
requirements: [PROV-01, PROV-02, PROV-03, PROV-04, UX-07]
must_haves:
  truths:
    - Provider-home visual baselines regenerated (deliberate regeneration — 04-05 records the --update-snapshots act; baselines never copied between runners)
    - Provider-home-new-patient surface captured (4 viewports × 2 motion states = 8 committed baselines)
    - Full `npm run test:visual` matrix evaluated (120 passed; 2 failures — pre-existing `offline-strip @ 390x844` from 03-07/03-08, named in this document, not Phase-4 regressions)
    - `npm run lint` + `npx vitest run tests/unit` + `npm run build` green at the gate
    - The 12-row visual-qa-rules gate evaluated, INV registry evaluated, owner R-1/R-2 design-gate adjudication recorded
    - §27 sweep (no raw hex outside tokens, no blue/indigo/purple healthcare theme, no gamified vocabulary, no client role toggles, no specialty labels) evidenced by grep assertions in verification
  artifacts:
    - tests/visual/baselines/** (provider-home: regenerated; provider-home-new-patient: new)
    - supabase/seed.sql (6 deterministic patients, session_replication_role=replica contract, fixed timestamps)
    - 04-VERIFICATION.md (design gate R-1 + R-2 brief; QA/INV tables; scope trace D-01..D-23; matrix evidence)
  key_links:
    - visual harness -> Playwright config webServer (04-UI-SPEC design-gate contract; D-14, D-26; reference-ui-spec §4/§8.1)
    - 04-UI-SPEC R-1 / R-2 -> owner verdict (PENDING) -> governance amendment (only if verdict directs; never silent)
---

# 04-05 Summary — phase close (visual gate + verification)

Evidence captured at 2026-10-08:
- Migration + pgTAP: PASS (57 assertions, 5 suites)
- Schema + RLS + audit + invite-link + capabilities: PASS
- Data-layer actions + tests: PASS
- Retrieval layer + tests: PASS
- 04-03 (folder-grid + provider-home-page): PASS — 43 tests
- 04-04 (patient-entry + patient-quick-actions): PASS — 25 tests (combined 68, matching the subagent's reported figure)
- Build (`npm run build`): PASS (exit 0 — 04-UI-SPEC design gate prerequisite)
- TSC: PASS (0 errors — includes repaired `mrn: string` NOT NULL in database.types.ts)
- Design-token gate (`npm run lint`): PASS (0 violations across 96 files)

Visual matrix (this plan's artifact; 04-UI-SPEC §Visual Baseline Additions):
- `provider-home`: regenerated (8); previous empty-shell baselines replaced by the folder-grid surface.
- `provider-home-new-patient`: added (8).
- Full matrix (all surfaces × 4 viewports × 2 motion states): 120 PASS; 2 FAIL — pre-existing `offline-strip @ 390x844` (both motion states; owned by Phase-3 03-07, named in 04-VERIFICATION.md and 03-VERIFICATION.md).

Owner gate (§20.4 design-gate contract): R-1 (critical status token vs INV-04 letter) and R-2 (2px status line vs INV-11 letter) briefs are in 04-VERIFICATION.md. Verdict: PENDING OWNER — no governance document has been edited; the design-gate decision controls whether INV-04 is amended (to include `critical` in the subset) and whether INV-11's classification of the status line is adopted.
