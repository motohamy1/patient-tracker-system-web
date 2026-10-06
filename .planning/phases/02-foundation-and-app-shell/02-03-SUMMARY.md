---
phase: 2-foundation-and-app-shell
plan: 02-03
subsystem: ui
tags: [design-tokens, tailwind-v4, css-codegen, next-font, vitest, accessibility, foundation]

# Dependency graph
requires:
  - phase: 02-foundation-and-app-shell/02-02 (repository scaffold)
    provides: pinned package.json with the full script set (predev/prebuild/tokens:generate), tsconfig `@/*` → `./src/*`, `.gitignore` entries for the generated token artifacts, postcss `@tailwindcss/postcss`
  - phase: 01-project-constitution-reference-ui-specification
    provides: `docs/governance/tokens.json` — the only committed source of token values (D-05/D-06), F-15 frozen color set closed at the D-27 owner gate
provides:
  - `scripts/token-namespaces.mjs` — pure shared derivation of NAMESPACES, GROUPS, `loadTokens`, `kebab`, `cssName`, `utilitiesFor`, `TOKENS`, `DURATIONS`, `MOTION` (consumed by plan 02-04's check script so the utility list can never go stale, D-11)
  - `scripts/generate-tokens.mjs` — zero-dependency writer emitting `src/styles/tokens.generated.css` (literal-valued `@theme inline` + unconditional `:root`) and `src/styles/tokens.generated.ts` (numeric MOTION constants), entry-point-guarded
  - `src/app/globals.css` — token-only base layer: Inter font stack, token-resolved body colors, single `:focus-visible` baseline (2px `textPrimary` ring, 2px offset, `accentSoft` CTA offset), `scrollbar-gutter: stable`, reduced-motion CSS safety net, tabular-nums-per-value rule
  - `src/app/layout.tsx` — the single root layout: self-hosted Inter (`latin` + `latin-ext`, weights 400/600, `--font-inter` variable), no role chrome (D-02, D-19, D-20)
  - `vitest.config.ts` — node project for `tests/unit/scripts/**`, jsdom project with `@vitejs/plugin-react` for `tests/unit/{primitives,overlays,motion}/**`, `@/` alias matching tsconfig, `tests/visual/**` excluded
  - `tests/unit/scripts/generate-tokens.test.mjs` — 9 assertions against the real generated artifacts (dual emission, `:root` completeness, no self-reference, Motion numerics, utility vocabulary)
affects: [02-04 token check script, 02-05 primitives, 02-06-02-07 primitives, 02-08 app shell, 02-11 visual QA, phase 003+ every screen]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Generated dual-emission token layer: one JSON walk writes literal values into BOTH `@theme inline` and `:root` (D-08; Pitfall 1/2 structurally absent)"
    - "camelCase in docs → kebab-case CSS custom properties (D-07): `textPrimary` → `--color-text-primary` → `text-text-primary`"
    - "Entry-point-guarded Node script (`import.meta.url === pathToFileURL(process.argv[1]).href`) so importers never trigger writes"
    - "CSS-first Tailwind v4 theming — `@theme inline` + `:root`, no tailwind.config.js"

key-files:
  created:
    - scripts/token-namespaces.mjs
    - scripts/generate-tokens.mjs
    - src/app/globals.css
    - src/app/layout.tsx
    - vitest.config.ts
    - tests/unit/scripts/generate-tokens.test.mjs
  modified:
    - .gitignore (added `*.tsbuildinfo`)

key-decisions:
  - "`--check` semantics for `tokens:generate`/`tokens:check` (flag set by committed package.json): a `--check` run regenerates any missing or drifted artifact and exits 0 — the artifacts are gitignored build outputs derived entirely from a committed source, so regenerating is the correct action for any inconsistency; plain (no-flag) runs used by predev/prebuild always rewrite."
  - "REQUIREMENTS.md flagging of FOUND-02/FOUND-03/FOUND-04 deferred to the orchestrator: those IDs are claimed by sibling plans 02-04…02-11, so per-plan marking would be premature and would race the concurrently-owned `.planning/` writes this wave (tracking override). The plan contribution is recorded in `requirements-completed` here."
  - "Import/side-effect split: derivation lives in `scripts/token-namespaces.mjs` (pure) while `scripts/generate-tokens.mjs` keeps the writer role, satisfying the plan's IMPORT-SAFE/mtime-unchanged criterion and giving 02-04 a no-writes import path for both."

patterns-established:
  - "Every value in `src/app/globals.css` and `src/app/layout.tsx` is a token or font-config reference — zero raw values, enforced by acceptance greps and plan 02-04's repo-wide check from here on"
  - "`:focus-visible` only; the outline is never removed (FOUND-04 baseline)"
  - "Per-task atomic `feat(02-03): …` commits before the SUMMARY commit"

requirements-completed:
  - FOUND-02
  - FOUND-03
  - FOUND-04

coverage:
  - id: D1
    description: "Zero-dependency token codegen reads docs/governance/tokens.json and writes both the literal-valued `@theme inline` block and the unconditional `:root` block (including `--duration-fast`/`--duration-slow` which no utility consumes), plus the numeric MOTION TypeScript module; artifacts gitignored, import-safe, no hand-written value anywhere"
    requirement: FOUND-02
    verification:
      - kind: unit
        ref: "tests/unit/scripts/generate-tokens.test.mjs#generated token CSS — dual emission / motion module / utility vocabulary"
        status: pass
      - kind: other
        ref: "command: npm run tokens:generate && node -e '<TOKENS-EMITTED probe>' → TOKENS-EMITTED; IMPORT-SAFE probe with unchanged mtime; NO-SELF-REFERENCE; ALL-TOKEN-NAMES-EMITTED:42"
        status: pass
    human_judgment: false
  - id: D2
    description: "Token-only base stylesheet declares the accessibility and motion baseline once: `:focus-visible` 2px textPrimary ring with 2px offset (accentSoft CTA offset at low specificity), scrollbar-gutter: stable for scroll lock, reduced-motion safety net to the shortest tokenized step, tabular-nums-per-value rule — and the load-bearing missing-generator import fails loudly"
    requirement: FOUND-04
    verification:
      - kind: other
        ref: "command: acceptance greps (IMPORTS-OK, 0 raw hex, no bare :focus, no outline:none, prefers-reduced-motion ≥1, prefers-color-scheme 0)"
        status: pass
    human_judgment: true
    rationale: "The rendered ring/gutter behavior in a real browser and its visual adequacy against the reference are verified by plan 02-11's Playwright suite, not by this plan's static assertions."
  - id: D3
    description: "Single root layout self-hosts Inter through next/font/google (latin + latin-ext subsets, exactly weights 400 and 600, swap, --font-inter variable) owning <html>/<body>/globals.css with no role chrome"
    requirement: FOUND-03
    verification:
      - kind: other
        ref: "command: INTER-OK / WEIGHTS-EXACT-2:'400', '600' / <html count 1 / no font-sans|bg-blue|text-blue / src/app = globals.css + layout.tsx only; npx tsc --noEmit clean"
        status: pass
    human_judgment: true
    rationale: "Font rendering and the absence of role chrome are visual properties asserted statically here; plan 02-11's production-build visual suite is the definitive check."
  - id: D4
    description: "Two-environment Vitest config: node for tests/unit/scripts/**, jsdom with @vitejs/plugin-react for primitives/overlays/motion, `@/` alias matching tsconfig.json, tests/visual excluded (Playwright keeps its own config)"
    requirement: FOUND-02
    verification:
      - kind: unit
        ref: "npx vitest run — 1 file, 9 tests passed under the node project"
        status: pass
      - kind: other
        ref: "command: npx tsc --noEmit → clean (vitest.config.ts included)"
        status: pass
    human_judgment: false

# Metrics
duration: 11min
completed: 2026-10-06
status: complete
---

# Phase 2 Plan 02-03: Token codegen, generated dual-emission CSS layer, base stylesheet and single root layout — Summary

**One zero-dependency script turns `docs/governance/tokens.json` into a gitignored dual-emission Tailwind v4 CSS layer plus numeric Motion constants, under a token-only base stylesheet and a chrome-free root layout self-hosting Inter.**

## Performance

- **Duration:** 11 min
- **Started:** 2026-10-06T19:13:11Z
- **Completed:** 2026-10-06T19:23:49Z
- **Tasks:** 2 of 2
- **Files modified:** 7 (6 created, 1 modified)

## Accomplishments

- Token pipeline landed: `scripts/token-namespaces.mjs` (pure derivation shared with plan 02-04's check script, D-11) and `scripts/generate-tokens.mjs` (writer, entry-point-guarded, zero dependencies) — `npm run tokens:generate` exits 0 and produces both artifacts (D-05, D-06).
- Generated CSS carries a literal-valued `@theme inline` block (40 normative tokens) AND an unconditional `:root` block (42 declarations — same literals plus `--duration-fast`/`--duration-slow`), so a token no utility consumes still exists (D-08, Pitfall 1); probe shows `NO-SELF-REFERENCE` (Pitfall 2). 42/42 token names from the frozen JSON emitted.
- `src/styles/tokens.generated.ts` exports `MOTION.duration.{fastSec: 0.12, slowSec: 0.24}` and `MOTION.easing.{standard: [0.2,0,0,1], exit: [0.4,0,1,1]}` from the same JSON walk — no component ever hardcodes a duration.
- `src/app/globals.css` references only generated custom properties: Inter + fallback stack, token-resolved body colors, one `:focus-visible` baseline (2px `textPrimary` outline, 2px offset, plus low-specificity `accentSoft` CTA offset — FOUND-04), `scrollbar-gutter: stable`, reduced-motion safety net to `--duration-fast`, tabular-nums-per-value rule documented; no dark-mode block ships.
- `src/app/layout.tsx` is the only root layout: Inter via `next/font/google` (`latin`+`latin-ext`, weights exactly `['400','600']`, `display: 'swap'`, `variable: '--font-inter'`, documented fallbacks), no role chrome, comment recording the D-02/Pitfall-8 reload rationale (D-19, D-20).
- `vitest.config.ts` with node + jsdom projects (`@vitejs/plugin-react` in jsdom), `@/` alias matching `tsconfig.json`, `tests/visual/**` excluded; `tests/unit/scripts/generate-tokens.test.mjs` passes 9/9 against the real generated artifacts.

## Task Commits

Each task was committed atomically:

1. **Task 1: scripts/token-namespaces.mjs + scripts/generate-tokens.mjs** — `5da153d` (feat)
2. **Task 2: globals.css + layout.tsx + vitest.config.ts + generator test** — `bd0c9ec` (feat)

Generated artifacts (`src/styles/tokens.generated.css`, `src/styles/tokens.generated.ts`) are gitignored and uncommitted (D-06): `git status --short` shows no entry for them.

## Files Created/Modified

- `scripts/token-namespaces.mjs` — pure shared derivation: `NAMESPACES`, `GROUPS`, `loadTokens`, `TOKENS`, `DURATIONS`, `kebab`, `cssName`, `utilitiesFor`, `MOTION` (D-07, D-11)
- `scripts/generate-tokens.mjs` — zero-dependency writer: dual-emission CSS + Motion TS module, `--check` self-heal mode, writes only when entry point
- `src/styles/tokens.generated.css` — GENERATED, gitignored: header, `@theme inline`, unconditional `:root`
- `src/styles/tokens.generated.ts` — GENERATED, gitignored: `MOTION` constants
- `src/app/globals.css` — token-only base layer + accessibility/motion baseline
- `src/app/layout.tsx` — single root layout with self-hosted Inter
- `vitest.config.ts` — two-project Vitest config with `@/` alias
- `tests/unit/scripts/generate-tokens.test.mjs` — 9 assertions against real artifacts
- `.gitignore` — added `*.tsbuildinfo` (generated by `tsc --noEmit`, `incremental: true`)

## Decisions Made

- **`tokens:generate`/`tokens:check` `--check` semantics:** the committed `package.json` runs both scripts with `--check`. Implemented as self-heal: a `--check` invocation regenerates any missing or drifted artifact and exits 0 (first run must *create* both files per the plan's own acceptance criteria); no-flag runs (predev/prebuild) always rewrite. Drift is impossible by construction — every byte derives from the committed JSON in one walk.
- **Derivation/writer split across the two scripts:** pure derivation in `token-namespaces.mjs`, writes only in `generate-tokens.mjs` behind the `import.meta === argv[1]` guard — satisfies the plan's IMPORT-SAFE + mtime-unchanged criteria and gives plan 02-04 a clean import target.
- **REQUIREMENTS.md deferred:** FOUND-02/03/04 are also claimed by plans 02-04…02-11 and `.planning/` is centrally owned this wave (tracking override), so per-plan requirement flagging is left to the orchestrator; the contribution is recorded in frontmatter `requirements-completed` above.
- **No dark-mode set, no `middleware.ts`, no `page.tsx`, no Tailwind config, no new dependency** — prohibitions honored; `/` intentionally resolves to the root not-found render.

## Deviations from Plan

None — plan executed exactly as written. (The `.gitignore` `*.tsbuildinfo` line is untracked-file hygiene mandated by the task commit protocol, not a scope change.)

## Issues Encountered

- `npx tsc --noEmit` initially failed inside `vitest.config.ts` (`plugins` declared inside the `test` block of an inline project); Vitest 5 expects `plugins` at project level next to `test`. Fixed and re-verified clean.
- Vite prints a benign `configLoader: 'native'` warning ("ESM syntax in a file loaded as CommonJS") because `package.json` has no `"type": "module"`; the config loads correctly. Not addressed — changing package module type is outside this plan's files and unproven against Next's casing of `scripts/*.mjs` consumers.
- `npm run build` remains non-zero exactly because `scripts/check-design-tokens.mjs` does not exist yet (plan 02-04): `prebuild` runs the generator successfully, then fails with `Cannot find module ... scripts\check-design-tokens.mjs`. This is the planned state (plan Verification item 5).
- `next/font/google` build-time font fetch was NOT exercised in this plan (no build reached the font stage — see prior bullet). Plan 02-11's production-build verification covers it.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- Ready for plan 02-04: `scripts/token-namespaces.mjs` provides `TOKENS`, `DURATIONS`, `utilitiesFor` so the `no-raw-hex` / `token-reference-required` checks can never go stale (D-11); the `lint` and `prebuild` scripts are wired to `scripts/check-design-tokens.mjs`, which only 02-04 has to create.
- Ready for plans 02-05…02-08: the frozen utility vocabulary (`bg-canvas`, `text-text-primary`, `rounded-pill`, `gap-lg`, `p-2xl`, `text-label`, `font-semibold`, `leading-tight`, `shadow-raised`, `shadow-overlay`, `ease-standard`) is generated and asserted; components import `MOTION` from `src/styles/tokens.generated.ts` (gitignored, regenerated by predev/prebuild) instead of hardcoding durations.
- Orchestrator note: STATE.md position/progress/requirements updates for this plan are intentionally not written here (tracking override) — apply centrally from the coverage block above.

---
*Phase: 2-foundation-and-app-shell*
*Completed: 2026-10-06*
