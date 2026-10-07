---
phase: 02-foundation-and-app-shell
reviewed: 2026-10-07T00:45:37Z
depth: deep
files_reviewed: 75
files_reviewed_list:
  - next.config.ts
  - postcss.config.mjs
  - playwright.config.ts
  - tsconfig.json
  - vitest.config.ts
  - scripts/check-design-tokens.mjs
  - scripts/generate-tokens.mjs
  - scripts/token-namespaces.mjs
  - src/app/globals.css
  - src/app/layout.tsx
  - src/app/not-found.tsx
  - src/app/(auth)/layout.tsx
  - src/app/(auth)/login/page.tsx
  - src/app/(patient)/layout.tsx
  - src/app/(patient)/patient/page.tsx
  - src/app/(patient)/patient/home/page.tsx
  - src/app/(provider)/layout.tsx
  - src/app/(provider)/provider/page.tsx
  - src/app/(provider)/provider/patients/[patientId]/layout.tsx
  - src/app/(provider)/provider/patients/[patientId]/page.tsx
  - src/app/(provider)/provider/patients/[patientId]/tabs.ts
  - src/app/(provider)/provider/patients/[patientId]/ai-analytics/page.tsx
  - src/app/(provider)/provider/patients/[patientId]/allergies/page.tsx
  - src/app/(provider)/provider/patients/[patientId]/genetics/page.tsx
  - src/app/(provider)/provider/patients/[patientId]/imaging/page.tsx
  - src/app/(provider)/provider/patients/[patientId]/labs/page.tsx
  - src/app/(provider)/provider/patients/[patientId]/medications/page.tsx
  - src/app/(provider)/provider/patients/[patientId]/overview/page.tsx
  - src/app/(provider)/provider/patients/[patientId]/visits/page.tsx
  - src/app/dev/gallery/page.tsx
  - src/components/dev/Gallery.tsx
  - src/components/dev/GallerySections.tsx
  - src/components/overlays/Overlay.tsx
  - src/components/overlays/useFocusTrap.ts
  - src/components/overlays/useScrollLock.ts
  - src/components/primitives/index.ts
  - src/components/primitives/Button.tsx
  - src/components/primitives/CompactControl.tsx
  - src/components/primitives/EmptyState.tsx
  - src/components/primitives/Icon.tsx
  - src/components/primitives/Pill.tsx
  - src/components/primitives/Surface.tsx
  - src/components/primitives/TabBar.tsx
  - src/components/shell/MobileNav.tsx
  - src/components/shell/PatientTopBar.tsx
  - src/components/shell/ProviderRail.tsx
  - src/components/shell/ProviderTopBar.tsx
  - src/components/shell/WorkspaceTopBar.tsx
  - src/lib/dev/dev-route-gate.ts
  - src/lib/dev/fixtures.ts
  - src/lib/motion.ts
  - tests/unit/dev-fixtures.test.ts
  - tests/unit/dev-route-gate.test.ts
  - tests/unit/motion/reduced-motion.test.tsx
  - tests/unit/overlays/focus-trap.test.tsx
  - tests/unit/overlays/scroll-lock.test.tsx
  - tests/unit/primitives/Button.test.tsx
  - tests/unit/primitives/CompactControl.test.tsx
  - tests/unit/primitives/EmptyState.test.tsx
  - tests/unit/primitives/Icon.test.tsx
  - tests/unit/primitives/Pill.test.tsx
  - tests/unit/primitives/Surface.test.tsx
  - tests/unit/primitives/TabBar.test.tsx
  - tests/unit/scripts/check-design-tokens.test.mjs
  - tests/unit/scripts/generate-tokens.test.mjs
  - tests/unit/scripts/token-vocabulary.test.mjs
  - tests/visual/security.spec.ts
  - tests/visual/surfaces.spec.ts
  - .planning/phases/02-foundation-and-app-shell/02-VERIFICATION.md
  - .planning/phases/02-foundation-and-app-shell/02-SECURITY.md
findings:
  critical: 0
  warning: 9
  info: 6
  total: 15
status: issues
---

# Phase 2: Foundation and App Shell — Code Review Report

**Reviewed:** 2026-10-07T00:45:37Z
**Depth:** deep
**Files Reviewed:** 75
**Status:** issues_found

## Summary

Phase 002 is a genuinely well-built foundation. The locked route map is complete and each of the eight `[patientId]` tab pages wires the correct `activeSlug`; `[patientId]` is consumed only through `tabHref` with `encodeURIComponent` and is never rendered, queried, logged or interpreted; the token pipeline (single JSON source → CSS + TS, zero-dep checks) is coherent and `npm run lint` passes clean (`0 violations across 45 file(s)`); the 124-test unit suite is green; there is no raw hex, no third-party runtime URL, no `console.*`, no border on any card, no `bg-accent` (only `bg-accent-soft`), and the dev fixture shape is contained to `src/lib/dev/` plus the gated gallery. No PHI, no client-bundle leakage and no runtime off-origin request was found. **No Critical finding was provable.**

The findings below are correctness-hardening and accessibility defects, not no-op nitpicks. The two most material are: (1) the visual-regression harness's 24 `reduced-motion` baselines are **byte-identical to their `default` counterparts** for all six surfaces × four viewports, so half the committed baseline corpus cannot detect a reduced-motion regression and the verification's use of them as FOUND-05 evidence is overstated; and (2) `CompactControl`/`TabBar` read `docs/governance/tokens.json` through `node:fs` at module load, and the `reopened-rejected` fallback branch it selects produces **indistinguishable pressed/unpressed (and active/inactive) states** by construction.

### What was verified clean

- Route map: 8 tab slugs, 8 folders, 8 correct `activeSlug` values, no 9th tab, no `Vital Signs`/`Communication` route.
- `tabHref` percent-encodes the route param; no query/path/template/log/interpreter use (`src/app/.../tabs.ts:67-69`).
- No raw hex, no generic palette utility, no `box-shadow`/`style={{}}` literal, no `console.*` under `src/`.
- Dev fixtures: all seven collections are literal `[]`; only `src/app/dev/gallery/page.tsx` imports the module.
- `ALLOW_DEV_ROUTES` literal is confined to `src/lib/dev/dev-route-gate.ts` and `playwright.config.ts` (71 source/config files scanned).
- Generated token artifacts are untracked/gitignored; the gate refuses `/dev/gallery` in a production build without the flag (asserted by `security.spec.ts`).

---

## Warnings

### WR-01: Dev-route gate fails *open* for every `NODE_ENV` other than the exact string `production`

**File:** `src/lib/dev/dev-route-gate.ts:49-53`
**Severity:** Warning (security hardening)
**Issue:** `return !(isProduction && !flagSet)` allows the dev-only gallery whenever `NODE_ENV !== 'production'`. The four-row truth table and its unit test only cover `production`/`development`/`test`. Any non-production environment — `staging`, `preview`, a container that forgets to set `NODE_ENV`, a custom server — serves `/dev/gallery` publicly. The comment (lines 19-21) presents "NODE_ENV != production -> allowed (local development)" as intended, but that is an allow-by-default posture: the safe default for a dev-only surface is *absent unless explicitly opted in*. The `ALLOW_DEV_ROUTES` confinement test and the production 404 test do not cover these environments.
**Fix:** Make the flag the sole opt-in and scope development explicitly:
```ts
export function isDevRouteAllowed(): boolean {
  const flagSet = Boolean(process.env.ALLOW_DEV_ROUTES);
  if (flagSet) return true;
  return process.env.NODE_ENV === 'development';
}
```
Extend the truth table test with a `staging` (and undefined `NODE_ENV`) row asserting `false`.

### WR-02: 24 of 48 committed visual baselines are byte-identical duplicates — the `reduced-motion` project proves nothing

**File:** `playwright.config.ts:70-76` (projects) and `tests/visual/baselines/**` (24 `reduced-motion.png`)
**Severity:** Warning (test integrity / false assurance)
**Issue:** Every `reduced-motion/*.png` is byte-identical to its sibling `default/*.png` (verified by MD5 across all six surfaces × four viewports; e.g. `tests/visual/baselines/patient-workspace/1440x900/{default,reduced-motion}.png` are both 47964 bytes). This is expected once `toHaveScreenshot.animations: 'disabled'` is set — there is no animated resting state to differ — which means the `reduced-motion` project can never catch a reduced-motion regression. `02-VERIFICATION.md` Truth 7 and the artifact table cite "the Playwright `reduced-motion` project captures 24 baselines" as FOUND-05 machine evidence; that evidence is inert. (The `reduced-motion.test.tsx` unit test is the real evidence and does cover the branch.)
**Fix:** Either (a) drive an *open overlay* under the reduced-motion project so the panel's reduced vs. lifted presentation is captured (a real pixel difference), or (b) drop the duplicate `reduced-motion` project and correct the verification claim to rely on the unit test plus one hand-checked reduced-motion render. Do not keep 24 identical PNGs presented as coverage.

### WR-03: `npm test` depends on a gitignored generated artifact with no `pretest` hook

**File:** `package.json:8-20`
**Severity:** Warning (reproducibility)
**Issue:** `test`/`test:unit` invoke `vitest`, and the suite imports `@/styles/tokens.generated` (e.g. `tests/unit/motion/reduced-motion.test.tsx:9`, `tests/unit/primitives/Button.test.tsx:11`, `tests/unit/scripts/generate-tokens.test.mjs:6`). That file is gitignored and produced only by `predev`/`prebuild`. A fresh clone that runs `npm install && npm test` fails before any test executes. Only local habit (`predev`) hides this; there is no `pretest` and no CI (D-17).
**Fix:** Add `"pretest": "node scripts/generate-tokens.mjs"` (and `"pretest:unit"`/`"pretest:visual"` if the `pre*` convention must cover each), so the generated layer exists before Vitest runs.

### WR-04: `CompactControl`/`TabBar` read tokens from disk at module load; the documented fallback branch makes active/pressed states indistinguishable

**File:** `src/components/primitives/CompactControl.tsx:34-58` (read + `INSET_FILL`), `:119-123` (icon toggle), `src/components/primitives/TabBar.tsx:58-62, 79-82`
**Severity:** Warning (correctness in the fallback path + robustness)
**Issue:** Two problems in one mechanism.
1. **The fallback is semantically broken.** If `tokens.json` `review.gateStatus === 'reopened-rejected'`, `INSET_FILL = 'bg-surface-raised shadow-raised'`. But `IconToggle`'s pressed state is also `bg-surface-raised` + `shadow-raised` (`:121-122`), and `TabBar`'s active item is also `bg-surface-raised` + `shadow-raised` (`:80-81`). Pressed vs. unpressed and active vs. inactive then render **identically** under that gate status. The code path cannot be exercised today (`gateStatus` is `approved-with-changes`) but it is a latent correctness bug in a branch the code deliberately keeps alive.
2. **`node:fs` at module scope** couples a UI primitive to the repository layout: `process.cwd()/docs/governance/tokens.json` is not statically traceable, so Next's output file-tracing will not bundle it; in any deployment without `docs/`, the `readFileSync` throws, is swallowed (`catch { return '' }`), and the indirection silently degrades — the `reopened-rejected` behaviour can never actually take effect in production. It is also the reason `GallerySections.tsx` had to become a slot-passing client/server dance (`Gallery.tsx:10-18`).
**Fix:** Move the gate decision to build time (bake it into the generated token module, or emit a `--inset-fill` class there) so no component touches the filesystem at runtime, and give the fallback a visually distinct token (e.g. add `shadow-overlay` or a `borderSubtle` hairline in the fallback only, which INV-15 permits for a *control boundary*, or simply never offer a fallback that equals the active-state fill).

### WR-05: Orphaned `<label>` (and three duplicate "Search patients" controls) when the top-bar search is hidden

**File:** `src/components/primitives/CompactControl.tsx:99-117`, `src/components/shell/ProviderTopBar.tsx:30-36`, `src/components/shell/WorkspaceTopBar.tsx:53-59`
**Severity:** Warning (accessibility)
**Issue:** `SearchControl` renders `<label htmlFor={inputId} className="sr-only">` as a **sibling** of the wrapper `<div>`, and only the wrapper carries the caller's `max-md:hidden`. Below 768px the input is `display:none` (removed from the accessibility tree) while its `<label>` remains in the tree, orphaned and pointing at a non-rendered control — a WCAG 1.3.1/4.1.2 defect. Additionally, a workspace page renders `ProviderTopBar` (`provider-search`), `MobileNav` (`mobile-search`) and `WorkspaceTopBar` (`workspace-search`) simultaneously, all labelled "Search patients"; two are only CSS-hidden at any given breakpoint, so an assistive-tech user encounters three search fields with the same name.
**Fix:** Put the visibility class on the fragment's outer element (wrap label+control, or pass the responsive class to the label as well), and give each search field a role-specific accessible name (e.g. "Search patients" in the provider bar, "Search this patient's record" in the workspace bar).

### WR-06: No `<h1>` exists anywhere; the page's main heading is an `<h2>`

**File:** `src/components/primitives/EmptyState.tsx:66`; all route pages (`src/app/(provider)/provider/page.tsx:17`, `src/app/(auth)/login/page.tsx:30`, etc.)
**Severity:** Warning (accessibility / document semantics)
**Issue:** A repository scan finds `<h2>` only (`EmptyState.tsx:66`, `GallerySections.tsx:68`, `Overlay.tsx:113`) and zero `<h1>`. Every route's primary content is an `EmptyState` whose title is an `<h2>`, so each page begins its heading outline at level 2 (WCAG 1.3.1 / 2.4.6). The `WorkspaceTopBar` "Patient record" text is a `<span>`, not a heading.
**Fix:** Render the `EmptyState` title as a configurable level (`as="h1"` on route-level empties, `h2` inside panels), or add a visually-hidden `<h1>` per route. At minimum, ensure exactly one `<h1>` per page.

### WR-07: Interactive `TabBar` advertises a WAI-ARIA tabs pattern it does not implement

**File:** `src/components/primitives/TabBar.tsx:103-114, 126`
**Severity:** Warning (accessibility)
**Issue:** The non-href form renders `<div role="tablist">` with `<button role="tab" aria-selected>`, but there is no `role="tabpanel"`, no `aria-controls` on the tabs, no roving `tabindex`, and no Left/Right/Home/End key handling. Under the ARIA Authoring Practices a tabs widget must implement all of these; as shipped, a screen-reader user hears "tab" but arrow keys do nothing and every tab remains in the page tab order. (In the product the nav form is used instead — `WorkspaceTopBar` passes `href` — so this only bites future consumers and the gallery, but the primitive offers a broken pattern.)
**Fix:** Either implement the tabs keyboard contract (roving tabindex on the active tab, `aria-controls` + a rendered `tabpanel`, arrow-key handling), or stop emitting `role="tab"`/`role="tablist"` and use a plain toggle-button group with `aria-pressed` until a real tabs consumer exists.

### WR-08: The gallery ships dead / faux-interactive controls, contradicting the phase's "no dead control" rule

**File:** `src/components/dev/Gallery.tsx:58, 106` (`TabBar` with no `onValueChange`), `src/components/dev/GallerySections.tsx:325-329` (`EmptyState` action `onClick: () => undefined`)
**Severity:** Warning (quality / self-contradiction)
**Issue:** `Overlay.tsx` and `EmptyState.tsx` document a deliberate rule — "a fake gate that looks real is worse than none"; `EmptyState.tsx:13-15` states "a dead enabled button never ships". Yet the gallery renders (a) two `TabBar`/`SegmentedControl` specimens as `role="tab"` buttons with `onClick === undefined`, and (b) an `EmptyState` action whose handler is a no-op `() => undefined`. These are exactly the "dead controls and fake interactivity" the product spec (`PRODUCT-MASTER-SPEC.md` §27) and the anti-slop register prohibit; a pointer user clicks the tab and nothing happens.
**Fix:** Give the gallery tabs local `useState` + `onValueChange` (they are already inside client `GallerySections`), and either wire the `EmptyState` action to open an overlay or render the action slot as a clearly non-interactive visual specimen. A static specimen should not carry an interactive role.

### WR-09: `vitest.config.ts` is ESM loaded as CommonJS — flagged as a future hard failure by Vite

**File:** `vitest.config.ts:1`
**Severity:** Warning (maintainability / future breakage)
**Issue:** `npx vitest run` emits: *"Your Vite config uses features that are unsupported by `configLoader: 'native'`, which is planned to become the default in a future major version of Vite: ESM syntax in a file loaded as CommonJS (vitest.config.ts:1:1)."* `package.json` has no `"type": "module"`, so the `.ts` config is transpiled as CJS. The warning appears twice per run today and will become an error on the next Vite major.
**Fix:** Rename to `vitest.config.mts`, or add `"type": "module"` to `package.json` after confirming `next.config.ts`/`postcss.config.mjs`/Playwright still resolve. Do not leave a config that Vite documents as about to break.

---

## Info

### IN-01: Dead exports in the primitives/motion surface

**File:** `src/components/primitives/TabBar.tsx:133-136` (`SegmentedControl`), `src/lib/motion.ts:48-49, 53-54` (`EASING_STANDARD`, `EASING_EXIT`, `DURATION_FAST_MS`, `DURATION_SLOW_MS`)
**Issue:** `SegmentedControl` has no consumer (only comments reference it). The four motion constants are exported but used only inside `motion.ts` itself; `EASING_STANDARD`/`EASING_EXIT` are used by `ease()`, but the `*_MS` pair has no consumer. `Pill`'s `stateChange`/`fade` are exercised only by unit tests.
**Fix:** Either delete `SegmentedControl` (and the `allowIcons` prop with it) and the unused `*_MS` exports, or leave a one-line comment naming the owning future phase. Removing dead exports keeps the primitive surface honest.

### IN-02: ProviderRail's five destinations all resolve to `/provider`

**File:** `src/components/shell/ProviderRail.tsx:36-42`
**Issue:** Home, Patients, Schedule, Records and Analytics all use `href: '/provider'` while presenting five distinct accessible names and `aria-current` on "Home". A user clicking "Patients" silently lands on provider home — a misleading (though intentionally unwired) nav item.
**Fix:** Until destinations exist, either render the four unowned items as visibly disabled non-links, or document the shared href as a Phase-004 placeholder in the file header.

### IN-03: `next/font/google` is a build-time third-party fetch

**File:** `src/app/layout.tsx:7-16`
**Issue:** Runtime egress is genuinely zero (confirmed: no `http(s)://` literal under `src/`, and `security.spec.ts` records zero off-origin requests), but `Inter` is fetched from Google Fonts at build time. `02-SECURITY.md` §3.2 frames V12 as "self-hosted fonts only (next/font)"; that is true of the served output, not of the build. A build-tooling egress from a PHI product's pipeline is worth naming in the threat register (it is not covered by T-02-79, which is runtime-only).
**Fix:** Note the build-time fetch explicitly in the security register, or self-host the two Inter weights under `src/app/fonts/` via `next/font/local` to remove the build-time third-party dependency entirely.

### IN-04: Stale comment in `EmptyState`

**File:** `src/components/primitives/EmptyState.tsx:47-53`
**Issue:** The comment says "`max-w-lg`/`max-w-sm` resolve through the `--spacing-*` namespace", but the code uses `max-w-[32rem]` and `max-w-[24rem]` (and Tailwind's `max-w-lg` does not resolve through `--spacing-*` at all). The comment describes a different implementation than the one shipped.
**Fix:** Update the comment to describe the arbitrary rem values actually used (as the code comment's own lead-in already says).

### IN-05: Verification/security docs overstate the dev-gallery containment

**File:** `.planning/phases/02-foundation-and-app-shell/02-SECURITY.md:35`, `02-VERIFICATION.md:26`
**Issue:** Both state the gallery is "absent from every real deployment". In fact the route is compiled into the production build (`ƒ /dev/gallery` in the build route table) and is refused at request time by `notFound()`. The security *property* (a 404 without the flag) holds and is tested; the *claim of absence* does not. This matters because a reader may believe the route cannot ship when it does.
**Fix:** Restate as "present in the build but unreachable: it 404s unless `ALLOW_DEV_ROUTES` is explicitly set" in both documents.

### IN-06: `PLACEHOLDER_PATIENT` is exported but has no production consumer

**File:** `src/lib/dev/fixtures.ts:74-84`
**Issue:** The placeholder is referenced only by `tests/unit/dev-fixtures.test.ts`; it never reaches a render. It is a legitimate test fixture, but as an unexported-from-gallery stub it is dead weight in the module that is the least safe place to carry dead weight.
**Fix:** Either consume it in the gallery (as a genuinely-empty specimen) or mark it test-only and move it beside the test. Keeping it here is not a security issue (the client-bundle assertion covers `dev-placeholder`), but it is unnecessary surface.

---

## Notes on verifications that were checked and hold

- `npm run lint` → exit 0, `0 violations across 45 file(s)` (re-run during this review).
- `npx vitest run tests/unit` → 15 files / 124 tests passed (re-run during this review). The focus-trap tests stub `getClientRects`, so the wrap logic — not just the empty-list branch — is genuinely exercised.
- `tabHref` + `encodeURIComponent` is the only `[patientId]` sink; no traversal or open-redirect vector found.
- No `bg-accent`, no `text-text-secondary`/`text-frame-foreground` as ink, no card border, no third elevation, no local `box-shadow`, single 1.5px `strokeWidth` in `Icon.tsx:47` only.

---

_Reviewed: 2026-10-07T00:45:37Z_
_Reviewer: the agent (gsd-code-reviewer)_
_Depth: deep_
_Advisory only — no source file was modified and no `--fix` was run._
