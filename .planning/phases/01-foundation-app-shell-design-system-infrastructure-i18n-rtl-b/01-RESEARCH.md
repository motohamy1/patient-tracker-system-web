# Phase 1: Foundation, app shell, design-system infrastructure, i18n/RTL base, visual-regression harness - Research

**Researched:** 2026-10-05
**Domain:** Next.js App Router design-system foundation (tokens, i18n/RTL, motion, visual regression, Supabase client wiring)
**Confidence:** HIGH for stack versions and vendor APIs (read from the npm registry and vendor docs on 2026-10-05); MEDIUM for the two explicitly flagged planning choices (TypeScript major, i18n library)

<user_constraints>
## User Constraints (from PROJECT.md — no CONTEXT.md; user chose "Continue without context")

### Locked Decisions
- Approved stack: Next.js App Router, React, TypeScript, Tailwind CSS driven by design tokens, Supabase (Postgres/Auth/Storage/RLS/Edge Functions), TanStack Query, D3 for timeline geometry, Framer Motion for UI motion, GSAP only with a documented advantage. No library swaps or dependency additions without a written reason.
- D1 approved: Arabic and English from the first component; RTL via CSS logical properties; Western digits for clinical values; Egypt units (kg, °C, mmHg, mg/dL).
- Reference authority: `docs/design/ref-A-theme.png` is the theme authority; B1–B3 are layout/content-structure references restyled with A's tokens; B4 is folder FORM only and must never be used for measurements.
- Synthetic data only until the owner signs the Phase 025 compliance gate. No service-role key reachable from client code. No PHI in logs/analytics.
- Phase non-goals: no auth, no clinical data, no patient screens, no charts, no timeline.
- Visual prohibitions unless the owner approves: gradients, wavy dividers, glassmorphism, heavy neumorphism, 3D illustration/icons, multicolor chart palettes, pastel alert blocks, cartoon healthcare imagery, generic SaaS dashboards, Bootstrap/Material tables, gamification visuals. One accent color.

### Claude's Discretion
- Exact file/directory layout inside `src/`, component composition of each primitive, Playwright project matrix shape, unit-test coverage depth, CI provider details.
- Whether to add an i18n library (not in the approved stack) versus hand-rolled locale routing — needs a written reason either way.

### Deferred Ideas (OUT OF SCOPE for Phase 1)
- Everything in Phase 2+ (identity/RLS/audit, clinical data model, timeline).
- D2–D11 unresolved owner decisions (OCR provider, drug catalog, hosting/legal, notch specialty lens, B1 icon rail, Provider Home stats, WebRTC provider, Egypt payment providers, WhatsApp templates, folder colors). Phase 1 must build no code that presumes these answers.
</user_constraints>

<architectural_responsibility_map>
## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Project scaffold, routing, build | Frontend Server (Next.js App Router) | — | Next 16 owns routing, RSC/server-client boundaries, and build |
| Design tokens | Frontend Server (CSS/`@theme`) | CDN/Static | Tokens compile into CSS custom properties consumed by both Tailwind utilities and raw CSS |
| Primitive component library | Browser/Client | Frontend Server | Interactive primitives need client components; server-rendered shells wrap them |
| i18n routing + `dir`/`lang` on `<html>` | Frontend Server | — | Must be server-resolved so first paint is correct in both directions |
| Arabic/Latin font loading | CDN/Static (self-hosted via `next/font`) | — | Build-time download removes runtime font flakiness from visual baselines |
| Motion primitives | Browser/Client | — | Motion drives inline styles/WAAPI; reduced-motion policy is app-wide client state |
| Visual regression harness | CI/CD Static analysis | Browser/Client (headless) | Baselines are environment artifacts generated in the CI image |
| Supabase client wiring | Browser/Client (browser client) | Frontend Server (server client, deferred to Phase 2) | FND-09 is client wiring only; no privileged credentials in the browser |
</architectural_responsibility_map>

<research_summary>
## Summary

Phase 1 has no existing code. The research question is therefore "what is the correct, currently-supported foundation", not "what pattern does this repo already use". Three independent research passes were run on 2026-10-05: stack versions and setup, design tokens + Playwright visual regression, and motion/reduced-motion + Supabase browser wiring. One pass (i18n/RTL depth) failed on a provider API-key error; i18n findings below come from the two successful passes that covered it, so RTL specifics are HIGH for framework/CSS behavior and MEDIUM where marked.

The dominant findings are structural, not cosmetic:

1. **Next.js 16 renamed `middleware.ts` to `proxy.ts`.** A file named `middleware.ts` is silently never called. This matters in Phase 1 even though session refresh is Phase 2 work, because the scaffold should not bake in a `middleware.ts` habit that Phase 2 must delete.
2. **`next lint` was removed in Next 16 and `next build` no longer lints.** FND-01 requires lint/type-check/test in CI, so these must be explicit npm scripts rather than assumed build side effects.
3. **Tailwind v4 is CSS-first and removes `tailwind.config.js`.** `@theme` emits BOTH the utility class and a real CSS custom property, which satisfies FND-02 with a single declaration — no second token store.
4. **Motion's `MotionConfig reducedMotion` defaults to `"never"`.** Without one provider at the root layout set to `"user"`, every primitive silently ignores the OS setting, which would fail FND-05 and later PROV-10/TLN-11.
5. **Visual baselines are environment-bound**, and Arabic font availability is the acute risk on a Linux CI runner. Baselines must be generated in the CI container, not on a dev laptop.
6. **`@supabase/supabase-js` now requires Node >= 22** while Next requires >= 20.9, so the Node floor is set by Supabase, not Next.

**Primary recommendation:** Scaffold with `create-next-app` (App Router, TypeScript, Tailwind v4, `--src-dir`, `@/*` alias), pin Node >= 24.21.0, define all tokens in one `src/styles/tokens.css` `@theme static` block with a per-token ref-A provenance comment, put locale routing in `src/app/[locale]/` with server-resolved `<html lang dir>`, wrap the root layout in a single `"use client"` `MotionConfig reducedMotion="user"` provider, and configure Playwright with `{desktop, mobile} x {ltr, rtl}` projects, `reducedMotion: 'reduce'` globally, `{projectName}` in `snapshotPathTemplate`, and baselines generated inside `mcr.microsoft.com/playwright` in CI.
</research_summary>

<standard_stack>
## Standard Stack

All versions below were read from the npm registry `latest`/`dist-tags` endpoint or the vendor's own docs on 2026-10-05. Confidence is per row.

### Core

| Library | Version (verified 2026-10-05) | Purpose | Why Standard | Confidence |
|---------|-------------------------------|---------|--------------|------------|
| `next` | 16.3.8 | Framework, App Router, build | Project-approved; engines `>=20.9.0` | HIGH |
| `react` / `react-dom` | 19.3.0 | UI runtime | Required peer of Next 16 | HIGH |
| `tailwindcss` | 4.3.3 | Token-driven utility CSS | Project-approved; `@theme` satisfies FND-02 directly | HIGH |
| `@tailwindcss/postcss` | 4.3.3 | PostCSS adapter for Tailwind v4 | v4 split the plugin out of `tailwindcss` | HIGH |
| `typescript` | 7.0.2 is `latest`; Next documents `>=5.1.0` | Type checking | See Open Question 1 — pin deliberately | HIGH (version) / MEDIUM (adoption) |
| `@types/react`, `@types/react-dom` | 19.3.0 | Types | Match React 19 | HIGH |
| `eslint` | 10.12.0 | Lint | `next lint` is gone in Next 16, so ESLint runs from the CLI | HIGH |
| `eslint-config-next` | 16.3.8 | Next lint rules | Peer `eslint >=9.0.0` | HIGH |
| `vitest` | 5.0.3 | Unit tests | Fast, TS-native, works with jsdom | HIGH |
| `jsdom` | 30.1.2 | DOM env for Vitest | Peer floors: `^22.22.2 \|\| ^24.15.0 \|\| >=26` | HIGH |
| `@playwright/test` | 1.63.0 | Visual regression harness (FND-08) | `toHaveScreenshot` is built in; no plugin needed | HIGH |
| `motion` | 14.0.0 | UI motion (formerly Framer Motion) | Project-approved "Framer Motion"; vendor renamed the package | HIGH |
| `@supabase/supabase-js` | 2.117.2 | Supabase client | Project-approved; engines `node >=22` | HIGH |
| `@supabase/ssr` | 0.12.7 | SSR-safe client factories | Peer `@supabase/supabase-js ^2.114.0` (2.117.2 satisfies); supersedes `@supabase/auth-helpers-nextjs` | HIGH |
| `@tanstack/react-query` | 5.104.1 | Server state (later phases) | Project-approved; peer `react ^18 \|\| ^19` | HIGH |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `next-intl` | 4.14.9 | Locale routing for App Router | Candidate ONLY — NOT in the approved stack; adopting it requires a written reason (see Open Question 2) |
| `d3` | 7.9.0 | Timeline geometry | Do not install in Phase 1 (Phase 5) |
| `gsap` | 3.15.0 | SVG choreography | Do not install in Phase 1; requires a documented advantage |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Hand-rolled `src/app/[locale]/` routing | `next-intl@4.14.9` (peer `next ^16`, `react >=19`) | Gives locale detection, `dir` handling, and typed navigation, but adds an unapproved dependency and a second proxy-composition concern (with Supabase in Phase 2) |
| Hand-rolled message catalogs | `next-intl` | Same trade; message catalogs are not needed until Phase 4 has real strings |
| `motion` package | `framer-motion@14.0.0` (still published, not deprecated; `motion@14.0.0` depends on it internally) | Same code, older import specifier. Do not install both as direct dependencies |
| CSS-only `@theme` tokens | Plain `:root` custom properties | `:root` does NOT generate utilities; use it only for runtime/JS-only values. FND-02 needs both, so `@theme` wins |
| CSS keyframes for all motion | Motion for enter/exit/layout, CSS for hover/focus | `prefers-reduced-motion` CSS and Motion are independent mechanisms; both must be configured |

### Installation

```bash
# Scaffold (repo already has .git — do not re-init)
npx create-next-app@latest . --ts --eslint --tailwind --app --src-dir --import-alias "@/*" --turbopack --yes

# Runtime dependencies
npm i motion@^14.0.0 @supabase/supabase-js@^2.117.2 @supabase/ssr@^0.12.7 @tanstack/react-query@^5.104.1

# Dev dependencies
npm i -D @playwright/test@^1.63.0 vitest@^5.0.3 jsdom@^30.1.2 eslint@^10.12.0 eslint-config-next@^16.3.8 \
  @types/react@^19.3.0 @types/react-dom@^19.3.0 @types/node@^24

npx playwright install --with-deps chromium
```

**Node floor: `>=24.21.0`.** This is the only line satisfying every engine constraint in the stack (`@supabase/supabase-js >=22`, `vitest ^22.12.0 || ^24 || >=26`, `jsdom ^22.22.2 || ^24.15.0 || >=26`, `eslint ^20.19 || ^22.13 || >=24`). Set `"engines": { "node": ">=24.21.0" }` in `package.json`.
</standard_stack>

<architecture_patterns>
## Architecture Patterns

### System Architecture Diagram

```
                      build time
  docs/design/ref-*.png ──(manual inspection, owner approval)──▶ docs/design/tokens.md
                                                                      │
                     ┌────────────────────────────────────────────────┘
                     ▼
        src/styles/tokens.css  ──@theme static──▶  CSS custom properties (--color-*, --radius-*, …)
                     │                                      │            │
                     │                        generates utilities│           │ var(--color-accent)
                     ▼                                      ▼            ▼
            src/app/globals.css ──▶ src/components/ui/*  (Tailwind utilities + raw var())
                     │                     │
                     │                     └──▶ src/components/motion/*  (MotionConfig reducedMotion="user")
                     │
   src/app/[locale]/layout.tsx ──server-resolved──▶ <html lang={locale} dir={rtl|ltr}>
                     │                                     │
        locale param ┴─▶ src/i18n/routing.ts ──────────────┘
                     │
                     ▼
        src/app/[locale]/design-gallery/page.tsx ──▶ renders every primitive × {ltr,rtl} × {desktop,mobile}
                     │
                     ▼
        tests/visual/design-gallery.spec.ts ──▶ Playwright projects (desktop|mobile)×(ltr|rtl)
                     │                                    toHaveScreenshot() → baselines
                     ▼
            .github/workflows/  (lint · typecheck · test · visual, baselines from CI container)
```

### Recommended Project Structure

```
docs/design/                      # supplied reference images (already committed)
docs/design/tokens.md             # Phase 1 output: sampled tokens + ref-A provenance + sampling method
docs/design/reference-ui-spec.md  # Phase 1 output: primitive-level spec from ref-A
src/styles/tokens.css             # THE single @theme source of truth
src/styles/tokens.dark.css        # reserved: dark-mode value overrides (not wired in Phase 1)
src/app/globals.css               # @import "tailwindcss" + @import tokens + base rules
src/app/[locale]/layout.tsx       # server: <html lang dir>, fonts, MotionProvider
src/app/[locale]/design-gallery/page.tsx
src/components/ui/                # pill tabs, pill row + filter toggle, icon button, chip,
                                  # module surface, status label, dark scrubber, accent node, notch header
src/components/motion/            # motion-provider.tsx, motion-primitives.tsx, variants.ts
src/lib/supabase/client.ts        # createBrowserClient (FND-09)
src/lib/supabase/server.ts        # createServerClient shape only; no route protection until Phase 2
src/i18n/routing.ts               # locales ['en','ar'], defaultLocale 'en', locale→dir map
tests/unit/                       # Vitest (token map, locale map, direction resolution)
tests/visual/design-gallery.spec.ts
playwright.config.ts
postcss.config.mjs                # {"@tailwindcss/postcss": {}}
```

### Pattern 1: Tailwind v4 `@theme static` as the token single source of truth

**What:** Declare every design token once inside a top-level `@theme static { … }` block. `static` guarantees every token is emitted as a CSS custom property even when unused, so `getComputedStyle(el).getPropertyValue('--shadow-raised')` never returns empty — a real hazard for a design-system layer that other phases read programmatically.
**Why `inline`:** when a token references another variable (e.g. a `next/font` variable), `@theme inline` makes the utility emit the resolved value instead of double indirection.
**Provenance:** every token carries a comment naming its ref-A source or `OWNER DECISION — pending`, which is how FND-10 becomes checkable rather than aspirational.

```css
/* src/styles/tokens.css */
@import "tailwindcss";

@theme static {
  /* Drop Tailwind's default palette so "one accent from ref-A" is enforced by construction. */
  --color-*: initial;

  /* ref-A olive outer frame — sampled, see docs/design/tokens.md */
  --color-frame-olive: #4C4C28;
  /* ref-A accent lime (single accent; B1's #FCCC00 is NOT adopted) */
  --color-accent: #F2FE46;
  --color-canvas: #DCDCD4;

  /* OWNER DECISION — pending: Arabic companion typeface */
  --font-sans: var(--font-latin), system-ui, sans-serif;

  --radius-pill: 9999px;
  --radius-module: 1.25rem;
}
```

`[INFERENCE, HIGH]` — the concrete hex values above are transcribed from the pack's recorded measurements of ref-A and MUST be re-verified and re-recorded in `docs/design/tokens.md` with a stated sampling method during Phase 1 execution, not copied blindly.

### Pattern 2: Server-resolved `dir`/`lang` on `<html>`

**What:** Keep `src/app/[locale]/layout.tsx` a Server Component; read the locale on the server and emit `<html lang={locale} dir={locale === 'ar' ? 'rtl' : 'ltr'}>`. Direction is a plain string passed down as a prop.
**Why:** computing `dir` from a client hook makes the first paint wrong; the whole document's bidi layout depends on it.
**RTL mechanics:** use logical properties everywhere — `padding-inline-start/end`, `margin-block`, `inset-inline`, `border-start-start-radius`. Tailwind v4 ships these as first-class utilities (`ps-*`, `pe-*`, `ms-*`, `me-*`, `start-*`, `end-*`, `text-start`, `text-end`, `rounded-s`). Avoid the physical forms `margin-left/right`, `left/right`, `text-align: left/right`.
**Locked exception:** the D3 timeline axis (Phase 5) stays chronological left→right even inside an RTL page — force it with an explicit `ltr:` direction variant on the axis container, never by weakening global RTL.
**Western digits for clinical values:** format clinical numbers with `Intl.NumberFormat('ar-EG', { numberingSystem: 'latn' })` so Arabic locale does not silently switch digits in vitals/labs. `[MEDIUM]` — the `numberingSystem` option was not independently verified in this pass; verify at implementation.

### Pattern 3: Single app-wide reduced-motion provider

**What:** One `"use client"` component exporting `<MotionConfig reducedMotion="user">` wraps the root layout. Every primitive absorbs the policy internally, so callers never call `useReducedMotion()`.
**Critical detail:** `reducedMotion` defaults to `"never"`, so without this provider the OS setting is ignored entirely.
**Server/client split:** `MotionConfig` and `useReducedMotion` are client-only; Server Components that need animated elements import from `motion/react-client` (element namespace only). Keep the client boundary at the provider, not per usage.
**CSS vs JS:** `prefers-reduced-motion` media queries affect only CSS animation; Motion drives styles imperatively and ignores them. Configure both — CSS for hover/focus affordances (Tailwind `motion-safe`/`motion-reduce` variants), Motion for enter/exit/layout.

### Pattern 4: Direction/format-agnostic visual regression matrix

**What:** Drive locale and direction by URL (`/{locale}/design-gallery`), not a UI toggle, so each direction is its own deterministic page. Playwright `projects` cover `{desktop, mobile} x {ltr, rtl}`.
**Determinism rules:** set `reducedMotion: 'reduce'` globally (default is `'no-preference'`, which lets the CI OS leak into baselines); keep `animations: 'disabled'` (already the default) so infinite animations capture at their initial frame — design gallery resting states accordingly; await `document.fonts.ready` before asserting; avoid rendering `new Date()` anywhere in the gallery.
**Baselines:** include `{projectName}` in `snapshotPathTemplate` so Windows dev runs cannot overwrite Linux CI baselines. Generate baselines inside `mcr.microsoft.com/playwright:v1.63.0-noble` in CI, never on a dev machine.

### Anti-Patterns to Avoid
- **v3-era Tailwind config** — `tailwind.config.js` with `content: [...]`, `theme.extend`, `safelist`, or a bare `tailwindcss` PostCSS plugin does not scan anything in v4. Use `@source` / `@source inline()`.
- **`@theme` nested in a selector or media query** — silently does nothing. Dark-mode value overrides go in `:root` inside a media query, never inside `@theme`.
- **Physical CSS properties in RTL paths** — `ml-4`, `left-0`, `text-left`, `rounded-tl-lg` silently mean the wrong side in Arabic.
- **Two root proxy files** — Next 16 allows one `proxy.ts`; both locale routing and Supabase session refresh need it, so composition must be designed now (Phase 2 consumes the seam).
- **Regenerating visual baselines on a dev laptop** — the single largest source of CI flake; baselines are environment artifacts.
- **A second token store** — e.g. a TS object duplicating colors alongside `tokens.css`. Two sources of truth defeats FND-02 and FND-10.
</architecture_patterns>

<dont_hand_roll>
## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Screenshot comparison / baselines | A pixel-diff script | `@playwright/test` `toHaveScreenshot` | Font/animation determinism, two-consecutive-match stability, per-project baseline paths |
| Motion orchestration | rAF/tween code | `motion` (Framer Motion) | Interruptible animations, reduced-motion policy, layout animations |
| Locale detection from `Accept-Language` | Custom header parsing | `next-intl` `createMiddleware`, or Next's own routing if hand-rolled | Edge cases and matcher correctness |
| RTL layout | Per-component `isRtl` conditionals | CSS logical properties | Correct by construction in both directions, no branch |
| Number/date formatting | Manual digit mapping | `Intl.NumberFormat` with `numberingSystem` | Locale data correctness, maintained by the engine |
| Font self-hosting + subsetting | CDN `<link>` to Google Fonts | `next/font` | Build-time download, no runtime third-party request, stable metrics for baselines |
| Auth cookie handling | Custom cookie parsing | `@supabase/ssr` factories | Correct cookie naming/refresh semantics |

**Key insight:** every one of these has a maintained implementation whose hard parts are determinism and cross-platform behavior — exactly the properties Phase 1 must get right before 25 more phases depend on them.
</dont_hand_roll>

<common_pitfalls>
## Common Pitfalls

### Pitfall 1: `middleware.ts` is never called on Next 16
**What goes wrong:** A file named `middleware.ts` is silently ignored; Supabase session refresh never runs and users get signed out in production while working fine locally.
**Why it happens:** Next 16 renamed the convention to `proxy.ts` (exporting `proxy` or a default export).
**How to avoid:** Use `proxy.ts` from the first commit. Phase 1 creates no proxy (locale routing in `src/app/[locale]/` needs none), but must not leave a `middleware.ts` habit behind.
**Warning signs:** Auth works locally, fails after deploy; no proxy log lines.

### Pitfall 2: Assuming lint runs during `next build`
**What goes wrong:** FND-01's "lint, type-check, tests, CI" silently has no lint step because `next lint` was removed in Next 16 and `next build` no longer lints.
**Why it happens:** Next 15 and earlier linted during build by default.
**How to avoid:** Explicit npm scripts: `lint` → `eslint .`, `typecheck` → `tsc --noEmit`, `test` → `vitest run`, `test:visual` → `playwright test`. CI calls the scripts, not the build.
**Warning signs:** CI green with zero ESLint output.

### Pitfall 3: `MotionConfig reducedMotion` defaults to `"never"`
**What goes wrong:** Every primitive ignores the user's OS reduced-motion setting; FND-05, PROV-10, TLN-11 all fail.
**Why it happens:** The library default is `"never"` and nothing in a fresh scaffold sets it.
**How to avoid:** One root provider with `reducedMotion="user"`. Design reduced states deliberately — `layout` animations (tab indicators, folder peek, node expansion) become instant jumps under reduced motion, which is correct but must be designed for.
**Warning signs:** Animation still runs with "Animation Effects" off in Windows.

### Pitfall 4: Visual baselines drift between dev and CI
**What goes wrong:** Baselines generated on Windows never match the Linux CI container; the suite is either permanently red or permanently regenerated (destroying the CI set).
**Why it happens:** Rendering depends on OS, browser build, fonts, and power source. Arabic font availability is the acute case.
**How to avoid:** Generate baselines inside the pinned `mcr.microsoft.com/playwright` image in CI; include `{projectName}` in `snapshotPathTemplate`; self-host fonts via `next/font` so no system font becomes part of the test contract.
**Warning signs:** Diffs concentrated in text glyphs.

### Pitfall 5: Token indirection and disappearing tokens
**What goes wrong:** `--font-sans: var(--font-latin)` without `@theme inline` resolves oddly; and without `@theme static`, an unused token emits no custom property, so a later phase reading `getComputedStyle(...).getPropertyValue('--shadow-raised')` gets an empty string.
**Why it happens:** `@theme` normally emits only variables that are actually used, and resolves values at definition site.
**How to avoid:** `@theme static` for the token layer, `@theme inline` for font tokens.
**Warning signs:** Empty string from `getPropertyValue`; fallback font rendering in one locale.

### Pitfall 6: Node floor set by Supabase, not Next
**What goes wrong:** Install/runtime warnings; `@supabase/supabase-js@2.117.2` declares `engines.node >= 22` while `next` only needs `>=20.9`.
**Why it happens:** Reading the Next requirement and stopping there.
**How to avoid:** Pin `>=24.21.0` (the only line satisfying every engine in the stack) and record it in `package.json` `engines` plus CI's Node version.
**Warning signs:** `EBADENGINE` warnings during `npm ci`.

### Pitfall 7: v4 Tailwind utility renames bite silently
**What goes wrong:** `shadow-sm` now means what v3's `shadow-xs` meant; `rounded-sm`, `blur-sm`, `outline-none`→`outline-hidden`, `ring`→`ring-3`. Copying a v3-era snippet produces subtly wrong visual weight, which matters when ref-A shadow depth and radius language are under owner approval.
**Why it happens:** v4 renamed scales for consistency while keeping bare names for back-compat.
**How to avoid:** Write tokens by explicit token name (`--shadow-module`), never by porting v3 utility classes into gallery code.
**Warning signs:** Gallery shadows/radii don't match ref-A and "look almost right".
</common_pitfalls>

<code_examples>
## Code Examples

Patterns verified against vendor docs on 2026-10-05.

### PostCSS adapter (Tailwind v4 has no JS config)
// postcss.config.mjs — Source: https://tailwindcss.com/docs/installation/framework-guides/nextjs
export default { plugins: { '@tailwindcss/postcss': {} } }
```

### Server-resolved locale + direction
```tsx
// src/app/[locale]/layout.tsx — "use client" NOT used here: this stays a Server Component
// dir must be resolved on the server so first paint is correct.
export default async function LocaleLayout({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const dir = locale === 'ar' ? 'rtl' : 'ltr';
  return <html lang={locale} dir={dir}>{/* …fonts, MotionProvider… */}</html>;
}
```
`[MEDIUM]` — exact `params` typing in Next 16 (async `params`) should be confirmed against the Next 16 docs during implementation.

### Root reduced-motion provider
```tsx
// src/components/motion/motion-provider.tsx
'use client';
import { MotionConfig } from 'motion/react';

export function MotionProvider({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
```
Source: https://motion.dev/docs/react-motion-config (default is `"never"`; `reducedMotion="user"` is the vendor-recommended site-wide policy).

### Supabase browser client (FND-09)
```ts
// src/lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}
```
Source: https://supabase.com/docs/guides/auth/server-side/creating-a-client. `createBrowserClient` is already a singleton — do not add a manual cache. Note the current env var name is `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`; `NEXT_PUBLIC_SUPABASE_ANON_KEY` is the legacy name.

### Playwright visual config
```ts
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/visual',
  expect: {
    toHaveScreenshot: { animations: 'disabled', scale: 'css', threshold: 0.2 },
  },
  use: { baseURL: 'http://localhost:3000', reducedMotion: 'reduce', locale: 'en-GB', timezoneId: 'Africa/Cairo' },
  projects: [
    { name: 'desktop-ltr', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
    { name: 'desktop-rtl', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 }, locale: 'ar-EG' } },
    { name: 'mobile-ltr',  use: { ...devices['Pixel 7'] } },
    { name: 'mobile-rtl',  use: { ...devices['Pixel 7'], locale: 'ar-EG' } },
  ],
  webServer: { command: 'npm run start', url: 'http://localhost:3000', reuseExistingServer: !process.env.CI },
  snapshotPathTemplate: '{testDir}/__screenshots__/{projectName}/{testFilePath}/{arg}{ext}',
});
```
Source: https://playwright.dev/docs/test-snapshots, https://playwright.dev/docs/test-configuration.
</code_examples>

<sota_updates>
## State of the Art (2026-10-05)

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `tailwind.config.js` + `theme.extend` | CSS-first `@theme` | Tailwind v4 | No JS config; tokens are also CSS custom properties (satisfies FND-02) |
| `import { motion } from 'framer-motion'` | `import { motion } from 'motion/react'` | Motion 12+ rename | Vendor docs now steer to `motion`; do not install both packages |
| `middleware.ts` | `proxy.ts` | Next 16 | Silent no-op if you keep the old filename |
| `next lint` / build-time lint | ESLint CLI in npm scripts | Next 16 | CI must invoke lint explicitly |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase new API keys | Legacy `anon`/`service_role` keys deprecated by end of 2026 |
| `supabase.auth.getSession()` in server code | `supabase.auth.getClaims()` | Supabase SSR guide | Do not write a `getSession` helper in Phase 1 that Phase 2 must delete |
| Playwright default `reducedMotion: 'no-preference'` | Explicit `'reduce'` in config | v1.50+ option | Prevents the CI OS from leaking into baselines |

**New tools/patterns worth considering:**
- `@theme static` — guarantees every token is emitted as a CSS custom property even when unused; the right choice for a design-system layer read programmatically by later phases.
- `@source inline(...)` — replaces v3's `safelist` if a token/util must always be generated.
- `@reference` — apply `@apply` from CSS modules against the theme without duplicating output.

**Deprecated/outdated:** Tailwind `theme()` function (use CSS variables); `@supabase/auth-helpers-nextjs` (superseded by `@supabase/ssr`); `setRequestLocale` in next-intl (labeled legacy; prefer `next/root-params` on 16.3+).
</sota_updates>

<open_questions>
## Open Questions

1. **Which TypeScript major should Phase 1 pin?**
   - What we know: `typescript@latest` is 7.0.2 (native Go port, released 2026-07-08). Next documents only `>=5.1.0`. ESLint runs a `ts70` compatibility lane; `@supabase/ssr` still builds with `typescript ~5.8`. MEDIUM risk.
   - What's unclear: whether the current Next 16 type-generation and ESLint type-aware rules are fully stable on TS 7 for this stack.
   - Recommendation: **pin the 5.x line for Phase 1** (read the exact patch from `https://registry.npmjs.org/-/package/typescript/dist-tags` before writing `package.json`) and treat TS 7 adoption as a separate, explicitly verified step. Do not leave it floating.

2. **Should Phase 1 add an i18n library (`next-intl@4.14.9`)?**
   - What we know: D1 requires locale routing and correct `dir` from the first component. `next-intl` supports `next ^16` but is NOT in the approved stack, and PROJECT.md forbids adding dependencies without a written reason.
   - What's unclear: whether hand-rolled `[locale]` routing plus a small locale map is sufficient for Phase 1's actual need (two locales, server-resolved `dir`, no message catalogs yet).
   - Recommendation: **do not add it in Phase 1.** Phase 1 needs only `src/i18n/routing.ts` (locales, default, locale→direction) and `[locale]` segment routing; message catalogs arrive with real strings in Phase 4. If Phase 2 needs locale negotiation in `proxy.ts` alongside Supabase, adding `next-intl` then is a cleaner decision point (composition of one proxy with two concerns). Record this reasoning as the written justification either way.

3. **Which Arabic companion typeface?**
   - What we know: FND-06 explicitly makes this an owner decision. Visual baselines depend on the choice, and a system fallback makes the container font set part of the test contract.
   - What's unclear: the owner's preferred family (and whether it must be licensed/embedded).
   - Recommendation: ship a neutral, widely available fallback stack for Phase 1 and surface the typeface as an explicit checkpoint decision before baselines are generated, because regenerating baselines after a font change invalidates the whole visual suite.

4. **Is the accent value from ref-A exactly `#F2FE46`?**
   - What we know: the pack records ref-A accent ≈ `#F2FE46`, canvas ≈ `#DCDCD4`, olive frame ≈ `#4C4C28`, and explicitly rejects B1's `#FCCC00` and B2's `#ECFC4C`.
   - What's unclear: the recorded values are approximate; actual sampling must be recorded with a method.
   - Recommendation: re-sample in Phase 1 and write the method into `docs/design/tokens.md`; every token comment in `tokens.css` cites ref-A or `OWNER DECISION`.

5. **CI provider is unstated.**
   - What we know: FND-01 requires CI. The visual-regression container guidance assumes a container-capable Linux runner.
   - What's unclear: GitHub Actions vs another provider.
   - Recommendation: default to GitHub Actions (matches the documented Playwright container recipe) and treat the provider as a trivially swappable detail; if the owner uses something else, only the job definition changes.
</open_questions>

<validation_architecture>
## Validation Architecture

| Requirement | Verification mechanism | Command | Type |
|-------------|----------------------|---------|------|
| FND-01 lint | ESLint CLI exits 0 | `npm run lint` | automated |
| FND-01 type-check | `tsc --noEmit` exits 0 | `npm run typecheck` | automated |
| FND-01 unit tests | Vitest exits 0 | `npm run test` | automated |
| FND-01 CI | CI workflow runs all four scripts | CI run | automated |
| FND-02 tokens as utilities AND custom properties | Unit test asserting both a generated utility class and `getPropertyValue` for a sampled token | `npm run test` | automated |
| FND-03 olive frame + notch header render | Vitest/jsdom render assertion + visual baseline | `npm run test`, `npm run test:visual` | automated |
| FND-04 gallery renders every listed primitive | Playwright locator assertions per primitive (not only screenshots) | `npm run test:visual` | automated |
| FND-05 line icons + reduced-motion primitives | Vitest assertion on rendered markup + a `reducedMotion: 'reduce'` visual project | `npm run test`, `npm run test:visual` | automated |
| FND-06 Arabic/English + RTL via logical properties | Playwright asserts `<html dir>` per locale and asserts no physical-property utilities exist in token/primitive sources | `npm run test:visual`, `npm run test` | automated |
| FND-07 gallery in every state × desktop/mobile × LTR/RTL | Playwright project matrix; count assertions equals 4 projects | `npm run test:visual` | automated |
| FND-08 Playwright harness captures the gallery | Baselines exist under `__screenshots__/<projectName>/…` for all 4 projects | `npm run test:visual` | automated |
| FND-09 no privileged credentials in client code | Build, then grep `.next/static` for `sb_secret_`/`service_role`; assert only the two `NEXT_PUBLIC_*` names are read | `npm run build && npm run test` | automated |
| FND-10 every token traceable to ref-A or flagged as owner decision | Parse `tokens.css`; assert every `--*` token has a provenance comment of `ref-A` or `OWNER DECISION` | `npm run test` | automated |
| Visual approval against ref-A | Owner compares gallery screenshots to `docs/design/ref-A-theme.png` | manual checkpoint | **manual-only — cannot be automated; the token layer cannot certify its own fidelity** |
</validation_architecture>

<sources>
## Sources

### Primary (HIGH confidence)
- `https://registry.npmjs.org/{next,react,react-dom,typescript,tailwindcss,@tailwindcss/postcss,motion,framer-motion,@supabase/ssr,@supabase/supabase-js,@playwright/test,@tanstack/react-query,eslint,eslint-config-next,vitest,jsdom,next-intl,d3,gsap}/latest` and `/-/package/<name>/dist-tags` — every version above, read 2026-10-05.
- `https://nextjs.org/docs/app/getting-started/installation` — Node >=20.9, Turbopack default, TypeScript >=5.1.0.
- `https://nextjs.org/docs/app/api-reference/cli/create-next-app` — scaffold flags.
- `https://nextjs.org/docs/app/api-reference/config/eslint` — `next lint` removal; `eslint-config-next` usage.
- `https://nextjs.org/docs/app/api-reference/file-conventions/proxy` — `proxy.ts` convention.
- `https://nextjs.org/docs/app/guides/environment-variables` — `NEXT_PUBLIC_` build-time inlining; root-dir requirement.
- `https://nextjs.org/docs/app/api-reference/directives/use-client` — client boundary.
- `https://tailwindcss.com/docs/theme` — `@theme`, namespaces, `@theme inline`/`static`, `initial` reset, `:root` guidance.
- `https://tailwindcss.com/docs/functions-and-directives` — `@source`, `@utility`, `@custom-variant`, `@reference`, `theme()` deprecation.
- `https://tailwindcss.com/docs/upgrade-guide` — v3→v4 breaking changes, utility renames, browser floor.
- `https://tailwindcss.com/docs/padding` — `ps-*`/`pe-*`/`pbs-*`/`pbe-*` logical properties.
- `https://tailwindcss.com/docs/hover-focus-and-other-states` — `motion-safe`/`motion-reduce` variants, RTL variants.
- `https://tailwindcss.com/docs/installation/framework-guides/nextjs` — `postcss.config.mjs` shape.
- `https://motion.dev/docs/react-motion-config` — `reducedMotion` values and default `"never"`.
- `https://motion.dev/docs/react-accessibility` — `reducedMotion="user"` as the site-wide policy; CSS vs JS independence.
- `https://motion.dev/docs/react-upgrade-guide` — `framer-motion` → `motion` migration; v14 has no React breaking changes.
- `https://motion.dev/docs/react-installation` — `motion/react` and `motion/react-client` import paths.
- `https://playwright.dev/docs/test-snapshots` — `toHaveScreenshot`, defaults, `snapshotPathTemplate`.
- `https://playwright.dev/docs/test-configuration` — `webServer`, `baseURL`, `projects`.
- `https://playwright.dev/docs/api/class-testoptions` — `reducedMotion` (v1.50+).
- `https://playwright.dev/docs/ci` — containerized visual-regression runs.
- `https://supabase.com/docs/guides/auth/server-side/creating-a-client` — env var names, `createBrowserClient` singleton, `proxy.ts`, `getClaims` vs `getSession`.
- `https://supabase.com/docs/guides/getting-started/migrating-to-new-api-keys` — publishable/secret keys.
- `https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-reduced-motion` — reduced-motion media feature.
- `https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/dir` — `dir` global attribute.
- `.planning/PROJECT.md`, `.planning/ROADMAP.md` (Phase 1), `.planning/REQUIREMENTS.md` (FND-01..FND-10) — read locally for scope and constraints.

### Tertiary (LOW confidence — needs validation during implementation)
- `next-intl` middleware composition guidance and its `dir`-attribute behavior (not independently re-fetched; noted MEDIUM).
- `Intl.NumberFormat` `numberingSystem: 'latn'` under `ar-EG` for clinical values (option not independently verified in this pass).
- Exact `params` typing shape for `src/app/[locale]/layout.tsx` on Next 16.
</sources>

<metadata>
## Metadata

**Research scope:**
- Core technology: Next.js 16 App Router + React 19 + Tailwind v4 foundation
- Ecosystem: npm registry versions, vendor docs for Next, Tailwind, Motion, Playwright, Supabase, next-intl
- Patterns: CSS-first `@theme` tokens, server-resolved `dir`, app-wide reduced-motion provider, direction-agnostic visual matrix
- Pitfalls: `proxy.ts` rename, removed build-time lint, `reducedMotion` default, environment-bound baselines, token emission/indirection, Node floor, v4 utility renames

**Confidence breakdown:**
- Standard stack: HIGH — every version read from the npm registry on 2026-10-05
- Architecture: HIGH for framework/CSS behavior; MEDIUM where marked `[INFERENCE]`/`[MEDIUM]`
- Pitfalls: HIGH — each maps to a documented vendor statement
- Code examples: HIGH where sourced verbatim in shape; MEDIUM where annotated

**Research date:** 2026-10-05
**Valid until:** 2026-11-04 (30 days — stack is stable enough for a foundation phase; re-verify versions at execution time because `typescript@latest` and Motion are both in flux)

**Research coverage gap:** one of four research passes (dedicated i18n/RTL depth) failed with a provider API-key error after 11 minutes. i18n/RTL coverage therefore rests on the two passes that included an i18n section. Arabic font selection, `Intl` numbering-system verification, and next-intl composition remain open questions rather than settled findings.
</metadata>

---

*Phase: 01-foundation-app-shell-design-system-infrastructure-i18n-rtl-b*
*Research completed: 2026-10-05*
*Ready for planning: yes — with Open Questions 1–3 surfaced as explicit decisions during planning*