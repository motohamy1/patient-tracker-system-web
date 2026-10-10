<!-- GSD:project-start source:PROJECT.md -->

## Project

**Patient Clinical Workspace**

A premium, dual-sided healthcare platform for providers and patients. The provider experience serves **understand → decide → document → track** across a longitudinal clinical workspace; the patient experience serves **understand → follow → record → communicate** with lower density but identical design language. One coherent clinical workspace, not a collection of unrelated SaaS dashboards. (Source: PRODUCT-MASTER-SPEC.md §Purpose, §4.)

**Core Value:** > Understand the patient → act on what matters → track what happens next.

If everything else fails, the clinician must be able to understand a patient's longitudinal story and act on it inside one workspace.

### Constraints

- **Tech stack**: Next.js application shell (§19 Ph002); Supabase/PostgreSQL relational clinical data model (§13); D3.js mandatory for the timeline (§8.1) with React responsible for app UI/state composition.
- **Design tokens**: semantic tokens only, no scattered raw hex; exact values frozen after visual review against the reference (§2.2). Token categories include frame, frameForeground, canvas, surface, surfaceMuted, surfaceRaised, textPrimary, textSecondary, borderSubtle, accent, success, warning, critical, info.
- **Motion**: two-layer architecture — Framer Motion for component/layout/panel transitions, GSAP for complex SVG drawing and timeline choreography; all motion fast, smooth, subtle, interruptible, reduced-motion compatible (§9).
- **Security**: authorization determined server-side and enforced by database/API layer (RLS where applicable); frontend route guards supplementary only; never trust role info from localStorage, browser state, or URL parameters (§3.1, §12).
- **Navigation**: patient workspace primary nav is exactly the 8 tabs in §6; no Vital Signs primary tab (vitals belong inside Overview); Communication is a provider/profile communication surface, not a primary clinical tab (§3.4, §15).
- **Data**: relational domain model Organization → Membership → User → Patient → Encounter/Visit → Clinical Events → Medications/Labs/Imaging/Vitals/Allergies/Genetics/Documents/Care Tasks/Communications; no unstructured JSON blob; the timeline is a projection, never canonical storage (§13, §8.2).
- **Provenance**: every clinically meaningful record carries source, creator, created, updater, updated, verification state, AI-extraction state, and encounter/document relationship where applicable; AI-extracted data must not appear indistinguishable from clinician-verified data (§23, §10).
- **Error/empty/loading**: every major workspace has deliberate loading, empty, error, retry, permission-denied, and offline/sync states; no generic "Loading…" screens (§24).
- **Performance**: explicit attention to timeline rendering cost, event clustering, re-renders, network waterfalls, image/document loading, large patient collections, pagination/virtualization, animation cost, mobile performance (§25).
- **Responsive**: web and mobile share design language but not identical layouts; desktop gets horizontal timeline, dense folders, larger surfaces; mobile adapts for touch, compact navigation, reduced density (§26).
- **Accessibility**: baseline in Phase 002; keyboard/touch considerations for the timeline (§8.3); visual/interaction/accessibility QA gates in Phase 022 (§22).
- **Process**: planning is mandatory before implementation (§20.3); UI phases have an additional design gate with visual review against the reference (§20.4, §21); role-based acceptance testing across Doctor, Nurse, Receptionist, Patient, and unauthorized accounts (§22); no autonomous execution for the initial rebuild (§20.9); human review stop after initialization before Phase 001 begins (§29 Step 4).

<!-- GSD:project-end -->

<!-- GSD:stack-start source:research/STACK.md -->

## Technology Stack

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended | Confidence |
|------------|---------|---------|-----------------|------------|
| Next.js (App Router) | 16.x (latest stable 16.3.8; 15.x LTS line acceptable if team prefers maturity) | Application shell, React Server Components, server actions, file routing, caching model | App Router is the standard full-stack React architecture; RSC lets clinical data render server-side so PHI stays on the server, and server actions keep mutations inside a server-resolved authorization context. Note for spec compliance: aggressive default caching must be audited so cached/ISR responses never reuse one patient's data across sessions (anti-pattern for PHI) — prefer dynamic rendering per authenticated request. | High |
| TypeScript | 5.x (latest 5.9.x), `strict: true` | Type safety across the clinical domain model | A longitudinal clinical record is long-lived typed data; strict mode catches null/undefined on optional clinical fields (allergies, verification states). | High |
| Supabase (`@supabase/supabase-js`) | 2.x (latest ~2.117) | Postgres client, Auth, Realtime, Storage API | Postgres relational model fits normalizing clinical entities (patients, encounters, medications, labs, documents, provenance); Auth integrates with RLS via JWT `auth.uid()`/claims. | High |
| `@supabase/ssr` | 0.12.x (latest 0.12.7) | Cookie-based Supabase client for Server Components / server actions / middleware | The recommended (post-`@supabase/auth-helpers`) pattern for Next.js: `createServerClient` per request in RSC and middleware, session refresh in middleware, no client-role state — aligns with §3.1 (server-side role resolution). | High |
| PostgreSQL (Supabase) + RLS | Supabase managed (Postgres 15+/17) | Canonical clinical store; row-level security as the authorization backbone | RLS policies keyed to organization membership + role claims are the §12 requirement; the database is an enforcer, not a store the API polices client-side. | High |
| D3.js (module set) | 7.x modules: `d3-scale` 4.0.2, `d3-zoom` 3.0.0, `d3-selection` 3.0.0, `d3-axis` 3.0.0, `d3-time` 3.1.0, `d3-quadtree` 3.0.1, `d3-hierarchy` 3.1.2 | Clinical timeline scales, zoom, pan, axes, event clustering, branch layout | Spec §8.1 mandates D3 for the timeline. D3 modules give the projection math (time scales, semantic-zoom scale bands) and interaction primitives none of the chart libraries provide. | High |
| GSAP | 3.15.x | SVG path/shape/timeline choreography (brushed timeline scrubber, path morph, branch connector animation) | GSAP's SVG and timeline primitives are stronger than any chart library's for the §8 scrubber-driven interaction; two-layer motion pairing with Framer Motion per §9. | High |
| Framer Motion (`motion` package) | 14.x (`motion` is the rebranded Framer Motion line; `framer-motion` API-compatible) | Layout transitions, entrance/exit, surface choreography (folder grid → detail, workspace tab transitions) | Handles layout-aware transitions React can't (FLIP-style `layout` props) — the layout/entrance half of the two-layer motion system. | High |
| Zod | 4.x (latest 4.6.x) | Schema validation for all clinical mutations + OCR output shape | Runtime validation of untrusted input (patient-submitted records, OCR payloads, server-action args) before it reaches persistence; pairs with `zod-to-json-schema` for Supabase/Postgres check constraints if desired. | High |
| Tailwind CSS | 4.x (latest 4.3.3) | Styling surface, tokens as first-class CSS variables | Tailwind v4 is CSS-variable-native (`@theme`); semantic tokens (`frame`, `surface`, `accent`, `critical`...) are declared once in tokens.css and consumed via `bg-surface`/`text-accent` utilities — no scattered raw hex, no default blue/indigo theme. | High |
| Supabase Storage | (Supabase managed) | Document image objects (Rx images, scanned labs/imaging, PDFs) | Signed URLs + per-patient path policies keep PHI access server-gated alongside RLS; bucket policies should mirror patient/org row ownership. | High |

### Supporting Libraries

| Library | Version | Purpose | When to Use | Confidence |
|---------|---------|---------|-------------|------------|
| `d3-brush` | 3.0.0 | Rectangular brush selection over timeline time range | Filter/zoom to date range on the bottom scrubber (§8 scrubber). Only add when Phase 006 lands scrubber interactions. | High |
| `d3-quadtree` | 3.0.1 | Point-spaced collision query for event marker clustering / de-collision over dense time bands | Only inside the timeline component — overlap detection when rendering markers at a given zoom band. NOT for UI layout. | Medium |
| `d3-hierarchy` | 3.1.2 | Tree layout for branch/episode structures ("branching") in the timeline | Only if the clinical-event graph is shaped as a tree of episodes/branches; otherwise skip. Justify per spec §8.6. | Medium |
| Document Intelligence adapter (provider-agnostic interface) | Google Document AI REST/SDK; alternatives: Azure AI Document Intelligence, Tesseract.js (fallback, self-hosted) | Receipt/prescription image → structured fields | Wrap provider behind `OcrProvider` interface so Phase 012 can swap or A/B without UI changes; Google Document AI has strong receipt/medical-document processors; Azure is reliable for PDFs. | Medium |
| RxNorm vocabulary access | NIH RxNav REST API (free, maintained); `-ApiNorm` endpoints for drug-name normalization | Normalize medication names extracted by OCR to RxNorm concepts (RXCUI) | Server-side call at OCR ingestion time; store RXCUI + returned synonym as provenance metadata. | Medium |
| ICD-10 vocabulary access | WHO/NLM ICD-10-CM files or NLM Clinical Tables API (free, no key) | Diagnosis code lookup/normalization | Use Clinical Tables API for autocomplete during clinician documentation; store code + description. | Medium |
| `zod-to-json-schema` (or Zod 4 native JSON-schema) | latest | Bridge Zod schemas to JSON Schema | When DB constraints or OpenAPI-style documentation are needed from the same Zod source. | Low |
| Playwright visual regression (`@playwright/test` + `toHaveScreenshot`) | 1.63.x | Reference-fidelity gates (§21) | Baseline screenshots of key surfaces at fixed viewports; diff against `docs/reference/*.jpg`-derived baselines in CI. | High |
| Vitest | 5.x (latest 5.0.3) | Unit + integration tests for scales/projections/server actions | Vitest is the Next.js ecosystem standard-adjacent unit runner; use `vitest/globals` with jsdom or happy-dom for logic tests, node env for server tests. | High |
| ESLint (+ `eslint-plugin-security`) | 9.x | Catch PHI-leak patterns (console.log of clinical fields) and data-binding footguns | Security plugin helps not silently logging patient data; tune rules for your design. | Medium |
| Biome or Prettier | latest | Formatting | Pick one; Tailwind class sorting via plugin for token consistency. | Low |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| Supabase CLI + migrations | schema + seeded test data as versioned SQL | Migrations are the source of truth; use `supabase db diff` / `db remove` discipline; never apply schema via console in shared org. |
| Supabase Studio / pgTAP tests | RLS policy testing | pgTAP in CI to test policies as a real Postgres user list, not via supabase-js only. |
| Playwright MCP / Playwright CLI | E2E + visual baselines | `--update-snapshots` workflow for the first run; baselines committed (not gitignored). |
| GSAP Draggable / Motion CLI (n/a) | n/a | Not applicable; listed to confirm nothing extra is needed. |
| Vitest UI | Debugging unit tests | `vitest --ui` local only. |
| Storybook (optional) | Timeline/tokens isolation | Only if Phase 006 needs per-scale visual pruning; keep out of required stack. |

## Installation

# Core

# D3 (timeline — Phase 006, but list Day 1 so modules don't fragment)

# add only when justified (clustering / branch collisions):

# Motion

# UI

# Dev dependencies

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| Next.js 16 App Router | Remix/React Router 7 | If you need a non-React-server-first framework or tighter remix-idiomatic conventions; not better for this stack (no PWA/edge constraint here), and App Router matches the spec's mandate. |
| Supabase Auth | Auth0 / Clerk / NextAuth (Auth.js) | Only if you need non-Postgres-backed org/tenant semantics beyond what RLS + a `memberships` table offers. Supabase Auth + RLS is tighter; leaving it adds a sync burden. |
| D3 modules for the timeline | Recharts / Chart.js / ECharts / Nivo / Plotly | No acceptable alternative — spec §8 forbids replacing D3 for the timeline. Chart libraries are acceptable within other (non-timeline) surfaces if they obey the token system (e.g., Recharts inside AI Analytics trend cards), but never for the central timeline. |
| Framer Motion for layout/entrance | React Spring | Fine for spring-based choreography; Framer Motion's FLIP `layout` prop and React Server Component compatibility edge it out. |
| GSAP for SVG choreography | CSS/web animations | Fine for opacity/transform fades, but GSAP wins for scrubber-driven progressive SVG path rendering and timeline-based sequencing (§8 scrubber). |
| Google Document AI (OCR) | Azure AI Document Intelligence, Tesseract.js | Azure when volumized scans arrive as PDF bundles and Azure yields better layout extraction; Tesseract when a self-hosted/off-network provider is required for data-residency reasons. The interface wrapper makes this a per-workspace decision. |
| Supabase Storage | S3/R2 | Only if you need client-stamped direct uploads at massive scale; Supabase Storage keeps bucket policy + RLS in one auth context. |
| Zod | Valibot / Yup | Valibot if bundle-size on client becomes acute; Zod has the largest community patterns for server-action arg parsing. |
| Tailwind v4 | vanilla CSS / CSS-in-JS | Tailwind v4 is the standard utility-prescription approach for Next.js; vanilla CSS is viable if the team has a strict custom-token workflow, but the design-token contract (§2.2) can carry through any of them — Tailwind is the productivity pick. |
| Vitest | Jest | Vitest for ESM/TS-native config and speed; Jest acceptable if a plugin requires it. |
| Playwright | Cypress | Playwright ships the visual-diff primitive (`toHaveScreenshot`) Cypress lacks natively. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| Charting libraries for the clinical timeline (Recharts/Chart.js/ECharts/Nivo/Plotly) | §8 mandates D3-powered semantic zoom, drag-pan, event clustering, branches, bottom scrubber. Any of these libraries abstracts away scale/brush/zoom control and cannot express branching. Spec compliance gone. | D3 v7 modules (`d3-scale`, `d3-zoom`, `d3-selection`, `d3-axis`) composing the timeline directly. |
| Default shadcn/ui palette or generic Tailwind blue/indigo/purple "healthcare" theme | §2.2 forbids generic blue/indigo/purple healthcare look; weakens the premium olive/ivory/yellow identity and the resulting differentiation. | Semantic token set (`frame`, `frameForeground`, `canvas`, `surface`, `surfaceMuted`, `surfaceRaised`, `textPrimary`, `textSecondary`, `borderSubtle`, `accent`, `success`, `warning`, `critical`, `info`) in Tailwind v4 `@theme` + shadcn/ui replaced with bespoke components built on these tokens. |
| Any ORM/data layer that bypasses RLS (raw Prisma with service role in server actions, app-level "auth by table join" only) | §3.1/§12: authorization must resolve server-side and enforcement lives in Postgres RLS. A service-role bypass in application code makes client-state-only authorization possible and is a spec violation, now or later. | `@supabase/ssr` server client per request under the user's JWT; RLS as the enforcement layer; service role only in trusted server jobs (Edge Functions/croned document ingestion OCR workers) that pass their own explicit auth context, never through user-facing routes. |
| client-role / client-state-only authorization | Already covered above but emphasized: never deriving workspace from a client toggle, query param, hidden form, or client store. | Server-side identity + membership/role resolution per §3.1. |
| Raw `d3-rendered-on-mount` imperative React (no pattern) | Deleting/redrawing the whole SVG per interaction on a 500+ event timeline janks and conflicts with Framer Motion layout updates. | Scene-graph pattern: render SVG once (via React), let D3 own scale/zoom/axis mutations through refs, use `useRef` + `useCallback`/`useEffect` graph; driven by §19 Ph006. See pattern below. |
| `d3-quadtree`/`d3-hierarchy` for general UI layout | These are spatial/tree math tools; using them to place DOM/Glass UI elements leads to coupling and over-engineering. | Confine to timeline concerns (clustering overlap detection; branch layout). |
| Charting out for AI trend cards (Recharts replacement risk) | Only an anti-pattern when it becomes the "timeline replacement"; Recharts is acceptable for small inline sparklines but must be bounded and token-aligned so it never metastasizes into a timeline substitute. | Bounded usage inside AI Analytics trend cards (Ph 011); the clinical timeline remains D3 (spec-mandated). |
| Jest for the frontend test surface | Friction with Next.js 15+/Turbopack build-time ESM; duplicative against Vitest. | Vitest 5.x + @testing-library/react. |
| Local-only first-draft persistence claiming "saved" | §18 forbids showing a clinical mutation as saved while it exists only locally. Offline drafts must be explicitly labeled. | Serve every offline draft through the queue/audit states in Phase 019; never optimistic "saved" badges on unverified patient records. |
| Gamification / generic SaaS dashboard chrome / autonomous clinical AI / client-side specialty branching (e.g. hardcoded Cardiology paths) | All §27 hard prohibitions. | Follow the workspace grammar: premium, restrained, reference-aligned; validation/decision logic stays server-side and clinician-verified. |

## Stack Patterns by Variant

- React owns the SVG node tree (data → JSX) for structural elements that benefit from React reconciliation and DOM diffing (event group containers, labels, detail panes).
- D3 owns continuous scales, dynamic axes, zoom behavior, and per-frame imperative transform/statistic updates via refs (not state) — `useRef` to the SVG root, initialize `d3.zoom` in `useEffect` on a `<g>` wrapper, apply `transform` imperatively to avoid re-rendering hundreds of React nodes per drag frame.
- Concretely: attach `d3.zoom().scaleExtent([min,max]).on('zoom', cb)` inside `useEffect` with a `RefObject` on the zoom `<g>`; `zoomTransform(k, x, y)` re-derives `d3.scaleTime` ranges on the fly for semantic zoom (different event-density bands at different `k`). Avoid `useState` for scale/zoom values.
- Because D3 v7 is ESM, set `transpilePackages` or ensure the Next.js Turbopack/webpack resolver handles `d3-*`; do NOT bundle whole `d3` — import per-module.
- Receive file in server action → store in Supabase Storage → call OCR provider behind `OcrProvider` interface → normalize extracted fields via Zod schema + RxNorm/ICD-10 vocabulary calls → write provisional record with `extracted: true` provenance and low-confidence flags for clinician review UI (§11) — never persist as authoritative.
- Store code (`ICD-10-CM` raw string) + `display` copy; do not store only the local string. Use NLM/WHO sources at ingestion/documentation time, not client-side typeahead fetching per keystroke.
- Keep a small server-side normalize/translate table so offline patient records queue without breaking (Phase 019).
- Use `d3-scaleTime` (linear time → pixel range) as the single source of truth for any horizontal layout; reuse its intervals from `d3-time` (`timeDay`, `timeWeek`, `timeMonth`) for month/week/day grouping labels so axes and downstream UI never drift apart.
- All GSAP animations must use `gsap.matchMedia()` with `prefers-reduced-motion` regions (`gsap.matchMedia('(prefers-reduced-motion: reduce)')`) and Framer Motion must route through `useReducedMotion`, falling back to opacity-only transitions (§24 motion invariant).
- App Router + RSC works self-hosted; Supabase works as a hosted dependency. Keep the SSD caching behavior with `revalidate`/`dynamic` route options explicit on every consumption route — don't rely on default caching heuristics that could serve stale PHI across sessions.

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| Next.js 16 / 15.x | React 19.x | Next 16 targets React 19; both go together. React 18 with Next 15 is not recommended. |
| Next.js 15/16 | Turbopack dev + build | Stable in 15.4+/16; verify any custom webpack plugin has a Turbopack-compatible answer or gate it behind `experimental.webpack`. |
| `@supabase/ssr` 0.12.x | supabase-js 2.x, Next.js 15/16 App Router | `createServerClient({ cookies })` with `getAll`/`setAll` callbacks (0.12+ signature). Supabase CLI / GoTrue / Postgres versions from the hosted service are the constraint; pin local to a recent Postgres 17 image for migration parity. |
| supabase-js 2.x | TypeScript `Database['public']['Tables']` types generated by Supabase CLI after each migration | Regenerate types per migration; commit them (they're contracts, not build output). |
| d3-scale 4.0.2 / d3-zoom 3.0.0 / d3-selection 3.0.0 / d3-axis 3.0.0 / d3-brush 3.0.0 | Each other; D3 7.x ecosystem, ESM | d3-zoom depends on d3-selection/d3-drag; uninstalling the metapackage and importing per-module is supported and keeps the bundle clean. |
| motion 14.x | Next.js 15/16 App Router | Use `"use client"` on motion-consuming components; layout transitions on Server Components are not a thing — pass server-rendered data into client motion components as props. |
| gsap 3.13–3.15 | Any bundler | GSAP is framework-agnostic; load via `useEffect` to keep out of SSR bundle; use `gsap.context()` (or `@gsap/react` `useGSAP()` hook) to scope and auto-cleanup animations. |
| zod 4.x | Next.js server actions | Zod spin on `parse` inside server actions; note Zod 4 error shape difference from v3 if reusing community form-mapping libraries — prefer built-in `z.treeifyError`/`flattenError` or your own mapper. |
| Tailwind 4.x | Next.js 15/16 via `@tailwindcss/postcss` | v4 CSS-first config (`@theme`), no `tailwind.config.js` required; PostCSS plugin is the integration. `@tailwindcss/vite` is Vite-only, do not use with Next.js. |
| vitest 5.x | @playwright/test 1.63.x, Next.js 15/16 | Keep unit (Vitest, node/jsdom env) and E2E (Playwright) as separate configs; Playwright runs against `next build` output or dev server for visual baselines — prefer a production build for visual gates so CSS extraction matches production. |

## Sources

- Next.js App Router & 15.x/16 features (server actions, caching model): https://nextjs.org/docs, https://nextjs.org/blog (15.4/15.5 release notes) — verified App Router is current direction; HIGH confidence
- Next.js 15.5 release note (Turbopack builds, next 16 deprecation warnings; validate Next 16.3.8 as current stable): https://nextjs.org/blog/next-15-5 — MEDIUM confidence (16.x accreted post-release; latest registry pull confirms `next` 16.3.8)
- Supabase `@supabase/ssr` package + cookie pattern for Next.js App Router: https://supabase.com/docs/guides/auth/server-side/nextjs — HIGH confidence
- supabase-js 2.x latest version/changelog: https://github.com/supabase/supabase-js/releases, npm registry — HIGH confidence
- D3 v7 module versions (d3-scale 4.0.2, d3-zoom 3.0.0, d3-selection 3.0.0, d3-axis 3.0.0, d3-quadtree 3.0.1, d3-hierarchy 3.1.2, d3-brush 3.0.0, d3-time 3.1.0): npm registry pull, 2026-10-05 — HIGH confidence
- D3 + React shared control pattern (zoom/scale via refs, semantic zoom): https://d3js.org/getting-started#using-d3-from-react, https://d3js.org/d3-zoom — MEDIUM confidence (pattern is community-standard; verified via d3-zoom docs)
- Framer Motion rebrand to `motion` v14 and App Router compatibility: https://motion.dev docs / npm registry — HIGH confidence
- GSAP 3.15 / `useGSAP` hook / `gsap.matchMedia` for reduced motion: https://gsap.com/docs/v3/GSAP/gsap.matchMedia, https://gsap.com/docs/v3/GSAP/useGSAP/ — HIGH confidence
- Tailwind v4 CSS-first `@theme` config and PostCSS integration: https://tailwindcss.com/blog/tailwindcss-v4 — HIGH confidence
- Zod 4 release/error-shape notes: https://zod.dev/v4/changelog — MEDIUM confidence
- Vitest 5 / Playwright 1.63 current versions, `toHaveScreenshot` visual regression: https://vitest.dev, https://playwright.dev/docs/api/class-pageassertions#page-assertions-to-have-screenshot-1 — HIGH confidence
- Google Document AI (receipt/medical document OCR processors): https://cloud.google.com/document-ai/docs — MEDIUM confidence
- Azure AI Document Intelligence as alternative provider: https://learn.microsoft.com/en-us/azure/ai-services/document-intelligence/ — MEDIUM confidence
- RxNorm normalization via NIH RxNav API: https://lhncbc.nlm.nih.gov/RxNav/APIs/candidateDrugs.html, https://rxnav.nlm.nih.gov/ — MEDIUM confidence
- ICD-10-CM via NLM Clinical Tables: https://clinicaltables.nlm.nih.gov/ — MEDIUM confidence
- Registry version check (npm `view` on 2026-10-05): next@16.3.8, @supabase/ssr@0.12.7, @supabase/supabase-js@2.117.2, d3-* as above, motion@14.0.0, gsap@3.15.0 (note: GSAP 3.15.0 on registry vs docs 3.13 numbering — use registry as truth), zod@4.6.5, tailwindcss@4.3.3, vitest@5.0.3, @playwright/test@1.63.0, typescript@7.0.2 (TS major 7 is very new; pin 5.9.x for the project unless Next/Next plugins verify TS7 support) — HIGH confidence on registry versions

<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->

## Conventions

### Execution cadence (performance)

Phases 1–2 ran at ~52 min/plan because every plan executed serially (no worktree isolation on this runtime) and each plan re-ran a full production build and suite. Keep later phases practical:

- **Plan fat, not many.** Prefer 4–6 substantial plans per phase over 10+ thin ones — the per-plan fixed cost (subagent spin-up + full context reload) dominates.
- **Build once per phase.** Per-task verification is the focused `vitest` file(s) + `npm run lint` + `tsc --noEmit`. Run `npm run build` and `npm run test:visual` at the phase gate only, not inside every plan's `<verify>`.
- **Verify twice, not five times.** Executor self-check plus the one phase verifier. `code_review`, `nyquist_validation`, `security_enforcement` and `ui_review` are disabled in `.planning/config.json`.
- **No per-plan Playwright.** The full visual matrix (48 baselines) is a phase-close artifact.
- **Batch owner gates.** A blocking owner visual-review gate freezes its whole plan; schedule these at phase close where possible.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->

## Architecture

Architecture not yet mapped. Follow existing patterns found in the codebase.
<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->

## Project Skills

No project skills found. Add skills to any of: `.claude/skills/`, `.agents/skills/`, `.cursor/skills/`, `.github/skills/`, or `.codex/skills/` with a `SKILL.md` index file.
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->

## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:

- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->

<!-- GSD:profile-start -->

## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->

<!-- agent-skills: hand-written; GSD regeneration must preserve this block -->

## Agent skills

### Issue tracker

Local markdown under `.planning/phases/<phase>/issues/` — one file per ticket, never a combined file. See `docs/agents/issue-tracker.md`.

### Triage labels

Five canonical roles; each label string equals its role name. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context. See `docs/agents/domain.md`.
