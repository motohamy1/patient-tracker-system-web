---
phase: 2-foundation-and-app-shell
plan: 02-04
subsystem: testing
tags: [design-tokens, static-analysis, lint-gate, invariants, zero-dependency, vitest, node-script, foundation]

# Dependency graph
requires:
  - phase: 02-foundation-and-app-shell/02-03 (token codegen)
    provides: `scripts/token-namespaces.mjs` — the pure derivation (`loadTokens`, `TOKENS`, `utilitiesFor`, `kebab`, `NAMESPACES`, `GROUPS`, `DURATIONS`) this check consumes so its vocabulary can never go stale (D-11)
  - phase: 02-foundation-and-app-shell/02-02 (repository scaffold)
    provides: `package.json` with `lint` and `prebuild` already pointing at `scripts/check-design-tokens.mjs` (D-13), `vitest.config.ts` with the `node` project for `tests/unit/scripts/**`, `.gitignore` for the generated token artifacts
  - phase: 01-project-constitution-reference-ui-specification
    provides: `docs/governance/project-constitution.md` §8 (the three rule texts) and `docs/governance/ui-invariants.md` §2 (INV-01, INV-03, INV-13, INV-14 objective checks)
provides:
  - "`scripts/check-design-tokens.mjs` — one zero-dependency Node gate implementing `no-raw-hex` (INV-01), `no-generic-healthcare-blue` (INV-03) and `token-reference-required` (INV-01/INV-13/INV-14), with the D-12 one-line-per-violation contract, the derived utility vocabulary (D-11), the D-10 scope, the Pitfall 6 filters, a production generated-artifact guard (Pitfall 5) and an advisory contrast-pair enumeration"
  - "`npm run lint` and `npm run build`'s `prebuild` chain now reach their real verdict — a token violation fails both instead of failing on a missing module (D-13)"
  - "`tests/unit/scripts/check-design-tokens.test.mjs` — must-fail and must-not-fail fixtures asserting on the violation array"
  - "`tests/unit/scripts/token-vocabulary.test.mjs` — proof that the presence check's vocabulary is derived from `tokens.json`, not typed"
affects: [02-05 primitives, 02-06 motion, 02-07 overlays, 02-08 app shell, 02-09 routes, 02-10 dev gallery, 02-11 visual QA, every later phase writing a component]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Single zero-dependency Node gate for all three named checks — no ESLint, no lint plugin, no dependency in the build gate (D-09)"
    - "Vocabulary derived at require-time from the token JSON through `utilitiesFor`; the check is a function of the committed source and cannot drift (D-11)"
    - "In-memory `{ path, content }` records + pure `runChecks(records)` / `resolveScope(root)` exports + an entry-point guard, so the gate is unit-testable without a real violation in the tree"
    - "Whole-token matching: `(?<![\\w-])utility(?![\\w-])` — `bg-surface` never matches inside `bg-surface-muted`, which is what makes the shortened collision forms (`text-primary`, `bg-muted`) fail"
    - "Fail-closed production guard: `NODE_ENV=production` without the generated token CSS exits 1 before any file is scanned (Pitfall 5)"

key-files:
  created:
    - scripts/check-design-tokens.mjs
    - tests/unit/scripts/check-design-tokens.test.mjs
    - tests/unit/scripts/token-vocabulary.test.mjs
  modified: []

key-decisions:
  - "`no-raw-hex`: the three Pitfall 6 filters are implemented as one delimiter test, one URL test (a preceding `/`, an enclosing token containing `://`, or a preceding `url(`) and one anchor test (`href`/`xlink:href`/`to`/`src`/`action`/`formaction` before an optional quote). The scheme literal is written as the generic `[a-z][a-z0-9+.-]*://` shape, so the script itself carries no URL string to trip the very filter it implements."
  - "`token-reference-required` fires only on a file that carries an inline styling literal (a `className`/`class`/`classList` attribute with a quoted class list, a `style={{...}}` object, or an `@apply` rule). Without that gate the current root `src/app/layout.tsx` — which only wires the Inter variable — would fail, contradicting the plan's own `npm run lint` exits 0 acceptance criterion and the constitution's wording ('component styling that does not reference the semantic token utilities'). Recorded in the script header as a residual heuristic."
  - "The auto-correct flag string appears nowhere in the script, in code or in a comment: the plan's acceptance greps require zero occurrences outside comment lines, and absence is the strongest form of D-12. No rewrite path, no bypass path."
  - "No hook-related string appears either: the plan's acceptance grep requires zero `pre-commit`/`husky`/`lint-staged` occurrences, and D-13 installs no git hook."
  - "Import safety uses `import.meta.filename` against `path.resolve(process.argv[1])` rather than `node:url`, because the plan's zero-dependency probe permits only `node:fs`, `node:path` and `./token-namespaces.mjs`."

patterns-established:
  - "Every future component and layout file is now gated: a class list that resolves to no derived token utility, a raw hex literal or an off-vocabulary default-palette utility fails `npm run lint` and `npm run build`"
  - "Residual heuristics are documented in the script header rather than hidden (Pitfall 6's requirement)"
  - "Checks assert on returned data structures, never on console text, so output formatting can change without disarming a fixture"

requirements-completed:
  - FOUND-02
  - FOUND-03

coverage:
  - id: D1
    description: "One zero-dependency Node script implements all three constitution §8 checks with the D-12 output contract, the Pitfall 6 false-positive filters, the D-10 scope with the generated token layer excluded, the derived utility vocabulary and the fail-closed production guard — and carries no ESLint, no lint plugin, no dependency and no rewrite path"
    requirement: FOUND-02
    verification:
      - kind: unit
        ref: "tests/unit/scripts/check-design-tokens.test.mjs#no-raw-hex / no-generic-healthcare-blue / token-reference-required / runChecks and the scan scope"
        status: pass
      - kind: unit
        ref: "tests/unit/scripts/token-vocabulary.test.mjs#derived utility vocabulary / whole-token matching"
        status: pass
      - kind: other
        ref: "command: ZERO-DEPENDENCY-OK (import set is node:fs, node:path, ./token-namespaces.mjs only); NO-ESLINT; GENERATED-EXCLUDED; DERIVED-VOCABULARY; PROD-GUARD-OK; INV-IDS-CITED; 0 hex literals in the script; 0 `--fix` and 0 hook-name occurrences; import probe exits 0"
        status: pass
      - kind: other
        ref: "command: env NODE_ENV=production node scripts/check-design-tokens.mjs with the generated CSS temporarily renamed → 'FATAL — src/styles/tokens.generated.css is missing in a production build', exit 1, file restored immediately"
        status: pass
    human_judgment: false
  - id: D2
    description: "The gate is wired into `npm run lint` and the `prebuild` chain, so a token violation fails both and a production build cannot ship one; the current tree lints green and prints the files-scanned summary"
    requirement: FOUND-02
    verification:
      - kind: other
        ref: "command: npm run lint → exit 0, 'check-design-tokens: 0 violations across 4 file(s)'; npm run build → exit 0 with prebuild running the generator then the check"
        status: pass
      - kind: other
        ref: "command: deliberate-violation probe — a scratch .tsx with `bg-blue-500` and one with `#3366CC` each produced the D-12 lines and exit 1; both scratch files deleted, `git status --short` clean of them"
        status: pass
    human_judgment: false
  - id: D3
    description: "Every check has a fixture that must fail (six-digit literal in a class string, eight-digit literal, `bg-blue-500`, `text-gray-300`, the full banned family, a component with no token utility, a `layout.tsx` with the same defect) and the documented false-positive cases have fixtures that must not (URL fragment of six hex characters, `url(#fade)`, scheme-qualified URL, `slate-900` in prose, `#section-2`, `a#b`, `a#bad`, a `src/lib` file, a styling-free file)"
    requirement: FOUND-03
    verification:
      - kind: unit
        ref: "npx vitest run tests/unit/scripts → 3 files, 36 tests passed (9 pre-existing generator tests + 19 check fixtures + 8 vocabulary tests)"
        status: pass
    human_judgment: false
  - id: D4
    description: "Advisory contrast-pair enumeration: the distinct `text-*` / `bg-*` token utilities per component file are printed as paired strings so the reviewer's WCAG table starts from a finite machine-derived list; the exit code never changes on it"
    requirement: FOUND-03
    verification:
      - kind: other
        ref: "command: npm run lint → 'contrast-pairs: 0 text/bg pairing(s) — advisory …' (no `src/components/**` file exists yet in this wave); output only, never affects the exit code"
        status: pass
    human_judgment: true
    rationale: "The pairing list is an input to a human WCAG computation, not an assertion — whether the emitted list is the right starting point for the reviewer's contrast job is a design-gate judgement made in plan 02-11, not something this plan's automation can pass or fail."

# Metrics
duration: 12min
completed: 2026-10-06
status: complete
---

# Phase 2 Plan 02-04: The three machine checks — `no-raw-hex`, `no-generic-healthcare-blue`, `token-reference-required` — Summary

**One zero-dependency Node gate turns the constitution's three §8 check names into build failures: it derives its token vocabulary from `tokens.json`, filters the URL/anchor false positives, excludes the generated token layer by name, fails closed in production and is proven by must-fail and must-not-fail fixtures.**

## Performance

- **Duration:** 12 min
- **Started:** 2026-10-06T19:45:00Z
- **Completed:** 2026-10-06T19:57:00Z
- **Tasks:** 2 of 2
- **Files modified:** 3 (all created; no file outside the plan's `files_modified` set was touched)

## Accomplishments

- `scripts/check-design-tokens.mjs` implements all three checks in one Node script whose entire import set is `node:fs`, `node:path` and `./token-namespaces.mjs` — no ESLint, no lint plugin, no dependency, no auto-correct flag and no bypass path (D-09, D-12).
- The presence check's vocabulary is a function of `docs/governance/tokens.json` at require-time (D-11): the JSON walk through `utilitiesFor` yields the whole utility list, and `token-vocabulary.test.mjs` proves it by comparing against an independent walk **and** by adding a token to an in-memory copy and observing the list grow by six.
- Scope is exactly D-10: `src/**` plus `postcss.config.mjs`, `next.config.ts` and any future `tailwind.config.*`, restricted to `.css .scss .ts .tsx .js .jsx .mjs`, with `node_modules`, `.next`, `test-results`, `playwright-report`, `tests/` and — explicitly — `src/styles/tokens.generated.css` / `.ts` excluded. `docs/governance/**` is never read.
- The Pitfall 6 filters are implemented, not intended: a preceding-character delimiter test, a URL test (preceding `/`, an enclosing token containing `://`, or a preceding `url(`), an anchor-attribute test (`href`/`xlink:href`/`to`/`src`/`action`/`formaction`) and the extension restriction. `href="#abcdef"`, `url(#fade)` and `a#bad` produce zero violations while `#3366CC`, `#abc`, `#abcd`, `#11223344` and `bg-[#3366CC]` are all reported.
- `no-generic-healthcare-blue` is anchored to a Tailwind utility stem, so prose never matches: `// slate-900 …` is quiet while `bg-blue-500`, `text-gray-300`, `border-violet-400`, `ring-slate-900` and `divide-zinc-200` all fail with INV-03.
- The production guard fires before any scan: with `NODE_ENV=production` and the generated CSS renamed, the script prints the `npm run build` / `prebuild` remedy and exits 1 (Pitfall 5); the file was restored immediately and is unchanged.
- `npm run lint` exits 0 with `check-design-tokens: 0 violations across 4 file(s)`, `npx vitest run tests/unit/scripts` passes 36/36 and `npm run build` exits 0 — with `next/font/google`'s Inter fetch succeeding at build time.

## Task Commits

Each task was committed atomically:

1. **Task 1: write `scripts/check-design-tokens.mjs` with all three checks and the D-12 output contract** — `ead5533` (feat)
2. **Task 2: write the check fixtures and the token-vocabulary tests, and prove the checks fire** — `df90a08` (test)
3. **Plan metadata: SUMMARY** — `docs(02-04)` (this commit)

Generated artifacts (`src/styles/tokens.generated.css`, `src/styles/tokens.generated.ts`) remain gitignored and uncommitted (D-06).

## Files Created/Modified

- `scripts/check-design-tokens.mjs` — the gate: `resolveScope`, `runChecks(records, tokens)`, `checkNoRawHex`, `checkNoGenericHealthcareBlue`, `checkTokenReferenceRequired`, `tokenUtilities`, `buildUtilityMatcher`, `isPresenceCheckTarget`, `collectContrastPairs`, the production guard and the entry-point-guarded `main()`
- `tests/unit/scripts/check-design-tokens.test.mjs` — 19 assertions over in-memory records: the must-fail fixtures, the must-not-fail fixtures and the scope resolver
- `tests/unit/scripts/token-vocabulary.test.mjs` — 8 assertions: derivation equality, in-memory mutation proof, the `motion.duration` exception, the exact required names and the absence of the shortened collision forms

## Decisions Made

- **Filter set for `no-raw-hex`.** The three Pitfall 6 filters are one delimiter test, one URL test and one anchor test, plus the extension restriction. The scheme is written as the generic `[a-z][a-z0-9+.-]*://` shape rather than the literal spelled out, so the script contains no URL string that the check's own acceptance grep would have to excuse. One residual gap is documented in the header: an ID selector whose name is pure hex (`#abc {`) is still reported, and the answer is to rename the selector.
- **`token-reference-required` scope gate.** The check fires only on a file carrying an inline styling literal (`className`/`class`/`classList` with a quoted class list, `style={{...}}`, or `@apply`). The plan's other requirement — `npm run lint` exits 0 over the current tree — would otherwise be unsatisfiable, because the single root `src/app/layout.tsx` carries `className={inter.variable}` and no token utility by design (it wires the font variable only). This is recorded in the script header as a residual heuristic; the constitution's own failure condition is "component styling that does not reference the semantic token utilities", and a file with no styling has none to judge.
- **Whole-token matching.** Utilities are matched with `(?<![\w-])…(?![\w-])`, so `bg-surface` does not satisfy a class list containing only `bg-surface-muted`, and the shortened collision forms `text-primary` / `bg-muted` do not count as token references — which is exactly the Pitfall 7 trap the vocabulary test also asserts against.
- **No `--fix` string, no hook string.** Both acceptance greps demand zero occurrences outside comment lines; the strongest way to satisfy D-12 and D-13 is total absence of the strings from the file, so neither exists in code or in a comment.
- **`import.meta.filename` for the entry guard.** `node:url` is not in the permitted import set, so the guard compares `path.resolve(process.argv[1])` with Node 22's `import.meta.filename`; under Vitest that value is absent, the comparison is false and importing the module has no side effects (verified: the import probe exits 0).

## Deviations from Plan

**1. Interpretation of `token-reference-required` for a styling-free file (documented, not silent).**
- **Found during:** Task 1 (check implementation), on the first `node scripts/check-design-tokens.mjs` run.
- **Issue:** the plan states that a component or layout file passes "when it references at least one derived utility", and that the check applies to any `layout.tsx` under `src/`. Applied literally, the existing `src/app/layout.tsx` fails, which contradicts the plan's own acceptance criterion that `npm run lint` exits 0 and its success criterion that the tree is green.
- **Resolution:** the check requires an inline styling literal to be present before the token-reference requirement applies, and this is documented as a residual heuristic in the script header plus asserted by a test (`leaves a file with no styling literal alone`). No check was weakened: any file with a class list still has to reference a derived token.
- **Files modified:** `scripts/check-design-tokens.mjs`, `tests/unit/scripts/check-design-tokens.test.mjs`.
- **Committed in:** `ead5533` and `df90a08`.

**2. Next.js build side effects reverted, not adopted.**
- **Found during:** the single mandated `npm run build`.
- **Issue:** Next 16 rewrote the committed `tsconfig.json` (`jsx: "preserve"` → `"react-jsx"`, added `.next/dev/types/**/*.ts` to `include`, reformatted arrays) and created an untracked `next-env.d.ts`.
- **Resolution:** both were reverted (`git checkout -- tsconfig.json`, `rm next-env.d.ts`) because they are outside this plan's `files_modified` set. The build itself exits 0 and will re-apply them on any future run; the owning plan for `tsconfig.json` (02-02) or the orchestrator should adopt them deliberately.
- **Files modified:** none committed.

---

**Total deviations:** 2 (1 documented interpretation forced by a self-contradictory acceptance criterion, 1 build side effect reverted).
**Impact on plan:** No check was weakened and no scope was added. The interpretation deviation is the only way both of the plan's stated requirements — strict presence checking and a green current tree — can hold at once, and it is visible in the script header and locked by a test.

## Issues Encountered

- The deliberate-violation probe created `src/components/` for the first time; both scratch files were deleted and the directory removed, and `git status --short` shows no trace of them.
- `npx vitest` prints a benign Vite `configLoader: 'native'` warning ("ESM syntax in a file loaded as CommonJS") because `package.json` has no `"type": "module"`. Pre-existing (02-02/02-03), unrelated to this plan, left untouched.
- `next/font/google`'s Inter fetch **succeeded** at build time: `npm run build` reached `✓ Compiled successfully` and `✓ Generating static pages`, exit 0. Unlike plan 02-03 — whose build stopped at the missing check module — this plan's build exercises the font stage, so the D-19/D-20 self-hosting path is now confirmed reachable in this environment.
- The current tree has no `page.tsx`, so the build emits only `/404`; routing is plan 02-08's deliverable by design.

## Verification

| Command | Result |
|---|---|
| `node scripts/check-design-tokens.mjs` | exit 0 — `0 violations across 4 file(s)` |
| scratch `bg-blue-500` file, then scratch `#3366CC` file | exit 1 each, D-12 lines emitted; both deleted |
| `npx vitest run tests/unit/scripts` | exit 0 — 3 files, 36 tests passed |
| `npm run lint` | exit 0 — summary line names 4 scanned files; no module-not-found |
| `npm run build` | exit 0 — `next/font/google` fetch succeeded; only `/404` emitted (no routes yet) |
| `env NODE_ENV=production` with generated CSS renamed | exit 1 with the FATAL guard message; file restored |
| import probe (`import('./scripts/check-design-tokens.mjs')`) | exit 0 — no side effects |
| `git config --get core.hooksPath` / `ls .husky` | no output / no such directory — no git hook exists (D-13) |

## User Setup Required

None — no external service configuration required. No dependency was added and nothing was installed.

## Next Phase Readiness

- Plans 02-05…02-10 can now write components with confidence: `npm run lint` is the real gate, and any raw hex, off-vocabulary palette utility or class list with no token reference fails immediately with a `file:line` and the invariant it broke.
- The vocabulary they must use is finite and machine-derived: `bg-canvas`, `bg-surface`, `bg-surface-muted`, `bg-surface-raised`, `text-text-primary`, `rounded-pill`, `shadow-raised`, `shadow-overlay`, `gap-lg`, `p-2xl`, `text-label`, `font-semibold`, `leading-body`, `ease-standard`, and the shortened collision forms `text-primary` / `bg-muted` are provably absent.
- Plan 02-11's reviewer gets the contrast-pair enumeration for free once components exist: `npm run lint` prints each `text-*`/`bg-*` pairing per component file for the WCAG table.
- Orchestrator notes: (a) `.planning/STATE.md`, `ROADMAP.md` and `REQUIREMENTS.md` were deliberately not written here (tracking override) — apply the position/requirement updates centrally from the coverage block above; (b) the `tsconfig.json` rewrite and `next-env.d.ts` that Next 16 produces on every `next build` are unowned as of this plan and should be adopted deliberately by the 02-02 owner.

---
*Phase: 2-foundation-and-app-shell*
*Completed: 2026-10-06*
