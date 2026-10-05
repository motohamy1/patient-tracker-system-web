# Pitfalls Research

**Domain:** Dual-sided clinical workspace (EHR-style longitudinal patient record) on Next.js App Router + Supabase + D3 v7
**Researched:** 2026-10-05
**Confidence:** HIGH (grounded in documented incidents for the exact stack components, plus the project's own diagnostic history in PRODUCT-MASTER-SPEC.md §3)

Every pitfall below is either (a) a documented, recurring failure mode for this stack, or (b) a failure the previous implementation already committed (spec §3, evidenced by `docs/reference/diagnostic-current-implementation.png`). Phase numbers refer to the 22-phase roadmap (Phase 1 = spec Phase 001 Project Constitution … Phase 22 = spec Phase 022 Final QA).

---

## Critical Pitfalls

### Pitfall 1: Client-state privilege escalation (role from localStorage, URL, or browser state)

**What goes wrong:**
The same authenticated user can switch into a provider workspace (or gain clinical authoring rights) by flipping a client-side toggle, editing a route, changing a query parameter, setting a localStorage value, or submitting a hidden form. Because Supabase auto-generates REST APIs over every table, the injected role is only cosmetic — the *data* boundary is enforced (or not) entirely by RLS. If RLS policies don't independently resolve the caller's role server-side, "role switching" is indistinguishable from a full data breach: an anon key reading another user's records produces no error message at all.

**Why it happens:**
Developers naturally model roles as UI state: a `role` variable, a route guard, a nav conditional. The failure documented in the CTF writeup and DEV community postmortems is precisely this: "I had RLS enabled on a Supabase project and data still leaked. A single anon API key read another user's entire notes table" — policies were written against a client-controlled column (e.g., a `role` or `user_id` value supplied by the request) instead of `auth.uid()` and server-owned membership tables.

**How to avoid:**
- Role resolution chain lives entirely server-side: authenticated principal → `auth.uid()` → `organization_members` table → `role` column owned by the DB, never by the client (spec §3.1).
- Every RLS policy references `auth.uid()` or a security-definer helper function (`has_org_role(org_id, min_role)`), never a client-supplied column value. Set `search_path` and mark helpers `STABLE` (Supabase lint `function_search_path_mutable`).
- Frontend guards (nav hiding, route redirects) are treated as UX, never security — this is an explicit spec requirement (§3.1: "hiding controls is NOT considered security").
- Acceptance test in the phase: a forged request (patched client, curl with anon key + another user's context) must fail with 0 rows returned, verified via Playwright API-level tests, not just UI tests.

**Warning signs:**
- Any RLS policy containing a column reference to the `public` (client-writable) side of the table in its `USING` clause.
- A `role` field accepted in any client mutation payload.
- Tests only exercise the happy path through the UI; no test hits the API directly with an adversarial JWT.
- Next.js middleware is the *only* thing between a route and patient data (see Pitfall 9 — middleware alone has been bypassable, CVE-2025-29927).

**Phase to address:** Phase 3 (Authentication, Organizations, RBAC and RLS) — this is the phase's core gate; regression-checked in Phase 20 (Security/Audit Hardening) and Phase 22 (authorization QA).

**Confidence:** HIGH — documented failure class with public postmortems.

---

### Pitfall 2: Service-role key bypassing RLS

**What goes wrong:**
The Supabase `service_role` key (new key scheme: `secret` key) skips Row Level Security by design. When server code (route handlers, server actions, OCR ingestion workers) uses the service-role client "just to get the query to work," one refactor later that client is reachable from a request path, an Edge Function, or — worst case — bundled into client code, and the entire tenant isolation model is gone. Public scanning of exposed-Supabase projects found misconfigured APIs leaking sensitive data "across thousands of organizations" largely through keys that should never have left the server (Medium/ctrl_cipher, Nov 2025).

**Why it happens:**
The RLS policy is subtly wrong, the query throws, and the fastest fix is the admin client. The workaround then silently becomes the pattern and propagates through copy-paste.

**How to avoid:**
- Lint rule (ESLint `no-restricted-imports`) forbidding the service-role client import in anything but a single allowlisted server module (e.g., `lib/supabase/admin.ts`), which is used only for: background jobs, webhook processing, and bootstrap migrations.
- Server components and route handlers always create a per-request client from cookies via `@supabase/ssr` (`createServerClient`), so RLS runs with the real user's JWT.
- `service_role`/`secret` keys never appear in `.env` files used by client builds; `NEXT_PUBLIC_*` naming is forbidden for them (Next.js only exposes `NEXT_PUBLIC_*` to the bundle — anything else in a client component import graph still risks accidental exposure via bundling mistakes).
- Where a legitimate privileged query exists, wrap it in a `security definer` Postgres function with a narrow signature — the privilege stays in the DB, not in the JS layer.

**Warning signs:**
- `createClient(url, SERVICE_KEY)` appearing anywhere outside the allowlisted admin module.
- A server route that works for logged-out users or returns data the logged-in user shouldn't see.
- Supabase Advisors (security linter) reporting policies as disabled/absent on any table — a table with no RLS is world-readable through PostgREST.

**Phase to address:** Phase 3 (introduce the client-creation convention + lint rule), Phase 12 (OCR ingestion is the most likely place to reach for the admin client), Phase 20 (audit).

**Confidence:** HIGH — documented incidents at scale.

---

### Pitfall 3: Timeline jank at high event counts (thousands of D3 events)

**What goes wrong:**
The D3 clinical timeline is the product's core engine (spec §3.5). A naive implementation appends one SVG node per event. Longitudinal records accumulate thousands of events (labs over years, medication changes, task completions projected from Phase 14). At roughly 1,000–5,000+ SVG elements, `d3-zoom` pan/drag handlers that re-enter selection/join on every `zoom` event drop frames; scroll and scrubber interaction becomes visibly janky or hangs the main thread. The Observable forum and Stack Overflow threads document exactly this: scaling D3 with large data volumes causes multi-second lag on zoom.

**Why it happens:**
D3's enter/update/exit pattern is per-element; DOM cost scales linearly with node count, and zoom handlers that recompute the full join on every event multiply that cost. Developers also bind heavy per-node data (full event objects) and re-run `d3.scaleTime` domain recalcs inside the zoom loop.

**How to avoid:**
- Render in layers with a strict element budget: pre-cluster events at each semantic-zoom level (spec §8.4) using `d3-quadtree` for spatial collision; a zoom level renders at most a few hundred visible marks, replacing clusters with individual events only when zoomed in.
- Separate interaction transforms from re-layout: on `d3-zoom` events, apply transforms via a root `<g>` and `transform` updates only; never re-run data joins inside the zoom handler. Debounce expensive re-layout (e.g., `requestAnimationFrame` or trailing-edge debounce).
- Use `d3.bin`/precomputed positions cached per zoom level; avoid layout recomputation per frame.
- Keyed joins (`selection.join` with keys) so pan doesn't recreate nodes.
- Performance gate in the phase: synthetic fixture with 5,000 events must sustain ≥30fps drag-pan and <100ms scrubber response on a mid-range laptop (Playwright + performance trace), matching spec §8.3 interaction requirements.
- Canvas is a fallback for the dot layer only if SVG with clustering still exceeds budget — but switching renderers must not become a pretext to abandon D3 (D3 is mandatory per spec §8.1; D3 works with canvas via the same scales/quadtree modules).

**Warning signs:**
- Any `zoom` handler containing `.data(...)` joins or `d3.nest`/grouping computations.
- DevTools performance profile showing >16ms frame times during drag with the test fixture.
- Element count in the SVG growing linearly with event count instead of staying bounded per zoom level.

**Phase to address:** Phase 6 (D3 Clinical Timeline) — with the 5,000-event fixture defined in that phase's success criteria; re-verified in Phase 22 performance QA.

**Confidence:** HIGH — long-documented D3 failure mode; thresholds from community benchmarks.

---

### Pitfall 4: OCR silently persisting low-confidence fields

**What goes wrong:**
The prescription scanner pipeline (spec §11) extracts medication names, doses, durations, diagnoses. When extraction confidence is low or entities are ambiguous, an unattended persistence step writes the guess into the patient record as if it were clinician-entered truth. In a clinical product a wrong dose persisted as authoritative is a patient-safety defect, not a UX bug — and it's an explicit spec prohibition (§27: silently saving uncertain OCR output).

**Why it happens:**
The pipeline diagram shows "clinician verification" as a stage, but the implementation wires persistence directly after extraction because the verification UI is a separate phase task, or because "the model is usually right." Confidence thresholds set by the OCR vendor don't map to clinical risk (a 0.9-confidence misread of "0.5mg" vs "5mg" is worse than a 0.3-confidence flag).

**How to avoid:**
- Structural guarantee, not behavioral: extracted fields persist only into a staging/quarantine state (e.g., `extraction_state: 'pending_verification'`), and the projection into the patient record (`clinical_events`) happens only on clinician confirmation. RLS/DB layer refuses writes to authoritative tables from the extraction path (defense in depth — the DB, not just the UI, blocks it).
- Every field carries `confidence` + `source_document_id`; fields below threshold are visually highlighted and block confirmation of their group (spec §11: highlight low-confidence fields, never guess unclear medication names/doses).
- The verification UI shows the original image beside extracted fields (spec §11) — make this a hard requirement of the verification screen, not a nice-to-have.
- Candidate-match lists (RxNorm/ICD-10 normalization) offer options; the clinician's click, not the matcher's top hit, is the persisted value.

**Warning signs:**
- Any code path from extraction output to `medications`/`visits`/`labs` tables without a `verified_by`/`verified_at` set.
- Confidence scores logged but never rendered in the verification UI.
- Tests asserting extraction output lands in the patient record without a confirmation step in between.

**Phase to address:** Phase 12 (Prescription OCR + Document Intelligence); the staging-schema and provenance columns are prepared in Phase 3/8 (medications lifecycle).

**Confidence:** HIGH — spec-mandated control; failure mode is the inverse of a documented OCR automation risk.

---

### Pitfall 5: Provenance collapse — AI-extracted data indistinguishable from clinician-verified

**What goes wrong:**
Spec §10 requires distinguishing patient-entered, staff-entered, doctor-entered, imported, AI-extracted, AI-generated, clinician-verified, and system-derived data. The collapse happens gradually: the provenance column exists but the UI doesn't render it, or AI summaries get persisted into the same fields as clinician notes, or an export merges them. Within months, no one can tell which lab interpretation was a physician's judgment and which was a model suggestion — and downstream AI features ("what changed?") train on their own outputs. Spec §10 is explicit: "Never silently transform AI output into authoritative clinical truth."

**Why it happens:**
Provenance is invisible when it works. Each feature phase adds "just one more field" without the provenance columns; rendering a source badge feels optional; AI-generated documentation assistance writes into the same text field the doctor would have.

**How to avoid:**
- Provenance is a required column set on every clinically meaningful table from the start (Phase 3/8 schema): `source_type`, `created_by`, `created_at`, `updated_by`, `updated_at`, `verification_state`, `ai_extraction_state`, `encounter_id`/`document_id` link (spec §23 fields). Enforce via `NOT NULL` + a DB-level check, not convention.
- Visual grammar for provenance defined in Phase 1 (design contract): distinct badge/style for AI-extracted vs clinician-verified, applied consistently across all record views.
- AI outputs (analytics narratives, summaries, documentation drafts) are stored as AI-generated artifacts with their own table/type, never merged into clinician text fields.
- Phase 11 acceptance: an AI summary and a physician's note on the same patient are structurally and visually distinct entities.

**Warning signs:**
- A clinical table missing any of the provenance columns.
- Screens showing clinical data without any source indication.
- An AI feature writing to a table whose rows clinicians also author.

**Phase to address:** Schema in Phase 3 (audit/provenance baseline), enforced feature-by-feature in Phases 7–12, verified in Phase 20 and the provenance QA in Phase 22.

**Confidence:** HIGH — spec-mandated; the failure mode is the well-documented "AI output laundering" pattern in clinical AI deployments.

---

### Pitfall 6: Generic-SaaS visual drift away from the olive/ivory/yellow reference

**What goes wrong:**
The reference images define a restrained olive/ivory palette with a single yellow accent (spec §2.1–2.2). Drift starts invisibly: a shadcn default lands in one component, Tailwind's `blue-500` in a link, a gradient in a card. Six months in, the app looks like every other dashboard — which spec §27 prohibits outright ("dashboard design unrelated to the reference," "saturated multi-color redesign"), and the diagnostic screenshot (`docs/reference/diagnostic-current-implementation.png`) proves the previous build already failed this way (§3.7: "current colors are incorrect").

**Why it happens:**
Default component libraries ship with their own palette; developers grab the nearest familiar color under deadline; nothing mechanically forbids raw hex or Tailwind default colors.

**How to avoid:**
- Semantic design tokens only (spec §2.2: `frame`, `surface`, `surfaceRaised`, `textPrimary`, `accent`, `critical`, etc.) defined in Phase 1 and consumed by Tailwind theme configuration — components reference tokens, never raw values.
- Lint enforcement: a stylelint/ESLint rule (or grep-based CI check) rejecting raw hex values and Tailwind default palette classes (`bg-blue-*`, `text-indigo-*`, `bg-purple-*`) in application code.
- Playwright visual-regression snapshots against the reference geometry per surface, run per UI phase (spec §21 reference-fidelity gates).
- Phase 1 produces the written design contract binding the reference primaries (`provider-home-primary.jpg`, `patient-home-primary.jpg`, `patient-workspace-timeline-primary.jpg`) as layout/grammar sources.

**Warning signs:**
- Any component importing a styling preset with its own palette.
- Screenshot diffs showing hues outside the approved token set.
- Design tokens defined but individual components hardcoding `#` colors.

**Phase to address:** Phase 1 (constitution/tokens), enforced continuously, audited in Phase 22 (visual QA).

**Confidence:** HIGH — directly evidenced by the project's own diagnostic history.

---

### Pitfall 7: Over-densification / dashboard clutter

**What goes wrong:**
The previous implementation's failure list (spec §3.8: "current layout is too heavy and inconsistent," §3.4: duplicated filter rows) is the canonical example: adding one more card, filter row, or nav item per stakeholder request until the workspace is a wall of boxes. The product's stated goal is a coherent workspace, not "a collection of dashboards" (spec §4). Clutter directly damages the core loop — understand → decide — because signal drowns in chrome.

**Why it happens:**
Empty states look unfinished, so each phase fills them; stakeholders equate visible features with progress; there's no density budget to push back with.

**How to avoid:**
- Each surface has a fixed information hierarchy from its reference primary (e.g., Provider Home: folder grid, Today's Schedule, Critical Alerts — nothing else on first load). New content must displace something or live behind drill-down.
- Write density invariants into the Phase 1 design contract (maximum concurrent cards/rows per surface region; primary nav counts are fixed: 8 patient tabs, folder-first provider collection).
- Deliberate empty/loading/error states (spec §24) are first-class deliverables — an empty state is a designed state, not a gap to fill.

**Warning signs:**
- PR diffs that only add components to a screen, never remove or subordinate.
- A second navigation/filter row appearing on any surface (§3.4 regression).
- Horizontal scrolling or below-the-fold critical alerts on the provider home.

**Phase to address:** Phase 1 (invariants), Phases 4–5 (the surfaces where it happens first), audited in Phase 22 (visual + interaction QA).

**Confidence:** HIGH — evidenced by the diagnostic screenshot and spec §3.8.

---

### Pitfall 8: Next.js App Router caching leaking PHI between users/sessions

**What goes wrong:**
The App Router has four overlapping caches (Request Memoization, Data Cache, Full Route Cache, Router Cache). Under defaults, cached data and rendered RSC payloads are shared across requests — correct for public marketing pages, dangerous for clinical data. Documented failure shapes: fetching with `force-cache`/revalidation defaults in a patient-specific page (Data Cache serving user A's record to user B), caching `fetch` calls keyed by URL only (cookies/headers not part of the key), and misusing `generateStaticParams`/static rendering for authenticated routes. Next.js itself reworked these defaults after community failures ("Our Journey with Caching," Next.js blog). Beyond framework caches, browser bfcache and shared-machine sessions add a clinical-specific layer: the back button showing the previous patient's record.

**Why it happens:**
The caching model is genuinely hard (the Next.js team acknowledges this in the blog post above); `fetch` memoization and per-request semantics changed across Next 13→14→15, and AI-generated or boilerplate code carries stale patterns from older versions.

**How to avoid:**
- Treat every authenticated route as dynamic: no `force-cache`, no route-level static generation, no `revalidate` on patient-data routes; server components read through Supabase with the per-request cookie client so each render is tied to the caller's JWT.
- Never cache at the application layer by URL alone — include the user/org identity in any cache key (or don't cache clinical payloads at all; Supabase + Postgres is fast enough for the expected scale).
- Add explicit `Cache-Control: no-store` (and correct `Vary`) headers on route handlers returning clinical data.
- Router Cache (client-side RSC payload caching) is session-scoped by default but short — verify bfcache behavior and sign-out: on logout, clear client state and redirect; never rely on the back button failing open.
- Playwright test: two browser contexts, user A views a patient, sign out, user B logs in and navigates — B must never see A's payload (also covers Pitfall 9's back-button shape).

**Warning signs:**
- `force-cache`, `revalidate`, `unstable_cache`, or `use cache` appearing anywhere in a file that touches patient data.
- `fetch` to Supabase REST in a server component without the request-scoped client.
- Static prerendering logs listing an authenticated route.

**Phase to address:** Phase 2 (Foundation/App Shell — establish the data-fetching convention), Phase 20 (Security hardening: session/cache audit), Phase 22 (authorization QA).

**Confidence:** HIGH — documented framework footgun with official acknowledgment.

---

### Pitfall 9: Authorization living in Next.js middleware only

**What goes wrong:**
Next.js middleware is a natural-looking place for "is this user a doctor?" checks. CVE-2025-29927 (March 2025, GHSA-7gfc-8cq8-jh5f) showed the middleware itself could be skipped entirely via a header, yielding a full authorization bypass for every app that put its auth checks there. The UK NCSC issued an urgent advisory. Even patched, middleware runs at the edge without DB access — any role decision there is based on JWT claims, which cannot see org membership changes made after token issuance.

**Why it happens:**
Middleware sits at the top of the request pipeline, so it *feels* like the security boundary. The fix (Vercel's own guidance) is that middleware must never be the sole enforcement layer.

**How to avoid:**
- Defense in depth: middleware (if used at all) does cheap redirects/UX only. Real enforcement: RLS on every table (DB layer) + server-component/route-handler checks against the resolved membership role. A request that reaches the data layer with a forged or stale role still returns zero rows.
- Keep middleware logic free of authorization decisions; re-verify this on every Next.js upgrade (track security advisories; pin and update promptly — the CVE was patched in 14.2.25/15.2.3).
- The Phase 3 acceptance test must include an adversarial path (direct API access, forged header, stale token) proving the data layer rejects, not the route guard.

**Warning signs:**
- `NextResponse` redirects in middleware containing role logic.
- Any comment like "middleware protects these routes."
- Supabase tables where RLS is the *second* line of defense rather than the first.

**Phase to address:** Phase 3 (architecture decision), Phase 20 (audit).

**Confidence:** HIGH — CVE with national CERT advisories.

---

### Pitfall 10: PHI in logs, analytics, and error reporting

**What goes wrong:**
Clinical text flows into logs through the least glamorous paths: an unhandled exception whose stack/locals include a patient's note, `console.log` debugging in a server action, error-reporting SDKs (Sentry/Datadog) capturing request bodies, analytics events embedding names or IDs in URLs, network-layer loggers dumping Supabase query payloads. Once PHI reaches a third-party log store without a BAA, it's a reportable disclosure. HIPAA-aligned hardening guides treat "PHI written to application logs" as a critical-severity finding. Datadog's HIPAA offering exists precisely because this is a default-behavior problem.

**Why it happens:**
Logs are written early (debugging) and forgotten; error SDKs default to capturing everything; no one audits what the telemetry pipeline actually receives until after an incident.

**How to avoid:**
- Structured logger with allowlist fields — never pass whole request/response objects; redact by default, include by exception.
- Error-reporting SDKs configured with `beforeSend` scrubbers (Sentry) / log-processing rules (Datadog) from Phase 2 onward, before there's real data to leak; deny-list of clinical table/field names.
- Analytics events carry opaque IDs only (and only after org/patient linkage is server-side); URLs contain no patient names or free text — use surrogate keys in routes.
- Environments: dev/staging use synthetic patient data exclusively (never production dumps), so a logging mistake in dev can't leak real PHI.
- Audit note in Phase 20: enumerate every telemetry sink (logs, errors, analytics, RUM, Supabase realtime/edge function logs) and verify scrubbing on each.

**Warning signs:**
- `console.log` in server actions or route handlers (grep in CI).
- Error reports in the vendor dashboard containing clinical field values.
- Analytics URL paths like `/patients/John Smith/...`.

**Phase to address:** Phase 2 (logger + scrubber baseline), Phase 20 (Security/Audit Hardening — privacy failure modes audit).

**Confidence:** HIGH — compliance-requirement-driven with vendor-documented mitigations.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| RLS policy referencing a client-supplied role/user column | Policy written in one line | Cross-tenant leak invisible in all happy-path tests; rewrite of policy layer | Never |
| Skipping the provenance columns on early clinical tables ("add later") | Faster Phase 7–9 schemas | Retro-filling provenance across tables, migrations, and UI in Phase 20; indistinguishable records in the meantime | Never — provenance is a Phase 3 schema requirement |
| Persisting OCR output without staging state | Demo works on day one of Phase 12 | Unverified doses presented as clinical truth; data cleanup with clinician review of every record | Never |
| Raw hex / Tailwind default colors in a component | One pixel-perfect fix now | Color drift compounds; Phase 22 visual QA fails wholesale; reference fidelity unreachable | Never — token system exists for this |
| Server-side role helper duplicated per route instead of one resolver | Feature ships faster | Divergent role semantics between routes; Phase 20 audit finds inconsistent authorization | Only inside a single phase with a follow-up ticket in the same phase |
| Re-rendering the entire D3 timeline on zoom instead of transform layers | Simple first implementation | Rewrite of the interaction layer in Phase 6 itself; jank at realistic event counts | Never — the 5,000-event fixture must pass in Phase 6 |
| Free-text search over clinical tables implemented client-side | Instant search | Ships full patient index to the browser | Never |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Supabase Auth | Treating JWT claims as the role source and trusting them between refreshes; role changes not reflected until token expiry | Resolve role from `organization_members` at request time via a security-definer helper; JWT only identifies the principal |
| Supabase PostgREST | Creating a table without RLS because "the UI never queries it directly" — PostgREST exposes it anyway | Enable RLS on every table in exposed schemas at creation time; run Supabase Advisors lint in CI |
| Supabase Storage | Bucket policies mirroring table RLS forgotten — document/image URLs accessible via signed-URL guesswork or public buckets | Per-object owner/org policies on storage buckets; PHI documents in private buckets only, access via short-lived signed URLs after authorization |
| Supabase Realtime | Subscribing client-side to tables with permissive RLS — row payloads broadcast to any subscribed client | Same RLS applies to Realtime, but verify policies cover realtime (they do when written correctly — test it explicitly); never stream clinical rows to broad channels |
| Next.js server actions | Assuming server actions are private API endpoints; calling them with elevated clients; trusting their inputs | Validate all inputs with Zod; resolve authorization inside the action against the DB role; never use the admin client for user-invoked actions |
| OCR/vision provider (Document AI or equivalent) | Sending raw documents with PHI to a provider without a BAA; storing vendor response verbatim | Execute a BAA or strip identifiers pre-upload where the pipeline allows; persist vendor output only into the staging/provenance model |
| WhatsApp/Telegram Business APIs (Phase 16) | Logging message bodies; treating inbound webhook payloads as trusted | Scrub message content from logs; verify webhook signatures; apply the same no-PHI-in-telemetry rules to channel integrations |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| One SVG node per timeline event | Drag/zoom frame drops; timeline "heavy" feel | Clustered rendering with `d3-quadtree`, transform-based pan, element budget per zoom level | ~1,000–5,000 SVG elements; a 5-year longitudinal record crosses this |
| N+1 Supabase queries in server components (per-folder patient counts) | Provider home loads in seconds; Postgres connection spikes | Batch queries / Postgres views / `select` with embedded relations; per-page query budget | ~50–200 patients per org view |
| Unbounded document/image loads on patient record pages | Record pages load tens of MB; Storage egress spikes | Lazy-load signed URLs, thumbnails, paginate documents | Any patient with >10 scanned documents |
| Refetching the full event projection on every timeline interaction | Visible latency after pan/zoom; server load | Client-side projection window + incremental fetch by time range | >500 events per visible window |
| Optimistic UI for clinical mutations without sync-state tracking | User believes a medication change is saved; it isn't (spec §18 violation) | Explicit six-state sync model (draft/queued/syncing/synchronized/failed/conflict) before any optimistic rendering of clinical data | Immediately with any offline/weak-network usage — Phase 19 scope |

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Authorization decided in Next.js middleware or client route guards only | Full bypass (CVE-2025-29927 class) or trivially patched client | RLS + server-side role resolution as the only enforcement; guards are UX (Pitfall 9) |
| `service_role`/`secret` key in client-reachable code or shared `.env` | Complete tenant isolation loss; bulk PHI exfiltration via PostgREST | Single allowlisted admin module + ESLint restriction (Pitfall 2) |
| Storing AI-extracted data as clinician-verified | Clinical misinformation presented as authoritative; no audit trail of what the model asserted | Mandatory provenance columns + staging state for extraction (Pitfalls 4–5) |
| PHI in telemetry (logs, error reports, analytics, RUM) | HIPAA disclosure without BAA; breach notification obligations | Scrubbing pipelines + allowlist logging + synthetic staging data (Pitfall 10) |
| Broad RLS policies like `auth.role() = 'authenticated'` on clinical tables | Any authenticated user of any org reads all patients | Policies must scope by org membership and role; test cross-org denial explicitly |
| Long-lived sessions on shared clinic machines | Next user of the workstation sees prior patient's record | Enforced session timeout/inactivity lock (Phase 20), no-store headers, sign-out clears client state (Pitfall 8) |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Offline draft shown as "Saved ✓" (spec §18) | Clinician trusts a mutation that never reached the server; clinical decisions on missing data | Explicit six-state sync indicator; "saved locally — will sync" wording, never claim server persistence (Phase 19) |
| Dense wall-of-cards workspaces | Clinician can't find the critical alert among twelve widgets | Fixed information hierarchy per reference primaries; critical alerts pinned; everything else behind drill-down (Phase 4–5) |
| AI suggestions rendered in the same visual style as clinician notes | Doctor mistakes model output for peer review; over-trust | Distinct provenance badges and styling; AI output always carries "assistive" framing (spec §10) (Phase 11–12) |
| Timeline that looks interactive but only scrolls | Users can't explore history; the core value loop breaks | Full D3 interaction model: drag-pan, semantic zoom, clustering, branches, scrubber (spec §8.3–8.6) (Phase 6) |
| Verification UI hiding the original document | Clinician confirms OCR fields without the source image; errors propagate | Side-by-side image + extracted fields, low-confidence highlighting, per spec §11 (Phase 12) |

## "Looks Done But Isn't" Checklist

- [ ] **RBAC/RLS (Phase 3):** Often missing adversarial tests — verify a request with anon key + foreign context returns zero rows, cross-org access denied, no table in exposed schemas lacks RLS (Supabase Advisors clean).
- [ ] **Timeline (Phase 6):** Often missing the 5,000-event performance fixture — verify ≥30fps drag-pan and <100ms scrubber response; clusters collapse/expand correctly at semantic zoom levels.
- [ ] **Timeline (Phase 6):** Often missing branch and scrubber interaction — verify branches render (spec §8.5) and the bottom scrubber navigates time (spec §8.6), not just pan/zoom.
- [ ] **OCR (Phase 12):** Often missing the unverified-output quarantine — verify no extraction reaches authoritative tables without `verified_by`/`verified_at`, and the original image renders beside fields during confirmation.
- [ ] **Provenance (Phases 7–12):** Often missing provenance display — verify every clinically meaningful record view shows source/verification state, AI-extracted visually distinct.
- [ ] **Caching/session (Phases 2/20):** Often missing cross-user isolation test — verify two contexts never share clinical payloads; sign-out + back button shows no PHI.
- [ ] **Telemetry (Phases 2/20):** Often missing sink audit — verify every log/error/analytics sink has scrubbing configured and tested with a sentinel PHI string.
- [ ] **Offline (Phase 19):** Often missing conflict semantics — verify failed/conflict states render, retries are visible, and no mutation shows "saved" while only local.
- [ ] **Visual fidelity (Phases 1/22):** Often missing visual-regression baselines — verify Playwright snapshot diffs against reference geometry pass on every UI surface; token lint shows zero raw hex/default-palette classes.

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Client-state privilege escalation discovered in prod | HIGH | Rotate all auth-related secrets; audit access logs for anomalous cross-role reads; fix policies; notify affected orgs per breach obligations; add adversarial test suite before re-enabling |
| Service-role key exposed | HIGH | Rotate key immediately (Supabase dashboard), purge from git history, audit all data access logs for the exposure window, re-run Advisors lint |
| PHI found in logs/analytics | HIGH | Purge from vendor stores, invoke BAA/DSA terms, assess reportability, fix scrubbing, re-audit all sinks |
| Timeline jank at scale | MEDIUM | Introduce clustering + transform layers behind the existing D3 scale/zoom API — data model unchanged, so fix is contained to the rendering layer |
| Low-confidence OCR persisted as authoritative | HIGH | Identify all affected records via provenance columns (`ai_extraction_state`), queue clinician re-verification, correct source-document linkage; provenance model makes the blast radius queryable |
| Provenance collapse | HIGH | Backfill provenance from audit logs where possible; mark legacy rows with `verification_state: 'unverified_migration'`; rebuild affected views — prevention (Phase 3 schema) is dramatically cheaper |
| Generic-SaaS visual drift | MEDIUM | Token lint sweep + component-by-component re-skin; visual-regression baselines re-established against reference primaries |
| PHI cache leak between users | HIGH | Audit Data Cache/Full Route Cache usage app-wide, purge caches, force dynamic rendering on all clinical routes, add the two-context regression test |
| Offline drafts falsely shown as saved | MEDIUM | Introduce the sync-state model on the affected mutations; audit which queued operations failed server-side; reconcile with users if clinical data was acted upon |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Client-state privilege escalation | Phase 3 | Adversarial API tests (forged role/context) return zero rows; Phase 22 authorization QA re-runs them |
| Service-role key bypassing RLS | Phase 3, Phase 12, Phase 20 | ESLint restriction passes; Supabase Advisors clean; all RLS-enabled tables verified |
| Timeline jank at high event counts | Phase 6 | 5,000-event fixture: ≥30fps drag-pan, <100ms scrubber; re-verified Phase 22 performance QA |
| OCR low-confidence persistence | Phase 12 (staging schema from Phase 3/8) | No path from extraction to authoritative tables without verification fields set; image-side-by-side UI verified |
| Provenance collapse | Phase 3 (schema), Phases 7–12 (features), Phase 20 (audit) | Provenance columns `NOT NULL` on all clinical tables; AI-vs-verified visual distinction verified in Phase 22 |
| Generic-SaaS visual drift | Phase 1 (tokens/contract), Phase 22 | Token lint zero violations; Playwright visual snapshots pass against reference geometry |
| Over-densification | Phase 1 (invariants), Phases 4–5, Phase 22 | Density invariants in design contract; Phase 22 visual/interaction QA against reference layout |
| Next.js caching PHI leak | Phase 2 (convention), Phase 20 | No `force-cache`/`revalidate` on clinical routes (grep gate); two-context Playwright test passes |
| Middleware-only authorization | Phase 3, Phase 20 | Phase 3 acceptance: frontend toggle/middleware bypass does NOT grant cross-workspace access (spec §3.1 verbatim condition) |
| PHI in logs/analytics | Phase 2 (scrubbers), Phase 20 | Sentinel-PHI test across every telemetry sink returns no hits |

## Sources

- [ImaginaryCTF 2025 writeup — misconfigured Supabase + leaked anon key exposing user tables via PostgREST](https://ctftime.org/writeup/40428)
- [Why Your Supabase Data Is Exposed (And You Don't Know It) — four RLS mistakes that silently leak production data](https://dev.to/jordan_sterchele/why-your-supabase-data-is-exposed-and-you-dont-know-it-25fh)
- [Supabase RLS — 5 Common Mistakes (anon key reading another user's rows, no error)](https://dev.to/lazydev_oh/supabase-rls-5-common-mistakes-i-broke-and-fixed-myself-38bl)
- [How misconfigured Supabase APIs exposed sensitive data across thousands of organizations](https://medium.com/@ctrl_cipher/how-misconfigured-supabase-apis-exposed-sensitive-data-across-thousands-of-organizations-162e24363c22)
- [Supabase Docs — Performance and Security Advisors (RLS-disabled lint, sensitive columns exposed)](https://supabase.com/docs/guides/database/database-advisors?lint=0023_sensitive_columns_exposed)
- [Supabase Docs — Securing your data (publishable keys, RLS, Edge Functions)](https://supabase.com/docs/guides/database/secure-data)
- [Next.js Docs — Caching (Request Memoization, Data Cache, Full Route Cache, Router Cache)](https://nextjs.org/docs/app/building-your-application/caching)
- [Next.js Blog — Our Journey with Caching (official acknowledgment of cache default problems)](https://nextjs.org/blog/our-journey-with-caching)
- [GHSA-7gfc-8cq8-jh5f — Next.js middleware authorization bypass (CVE-2025-29927)](https://github.com/vercel/next.js/security/advisories/GHSA-7gfc-8cq8-jh5f)
- [NVD — CVE-2025-29927 detail (bypass prior to 14.2.25 / 15.2.3)](http://nvd.nist.gov/vuln/detail/CVE-2025-29927)
- [UK NCSC advisory — Next.js middleware vulnerability](https://www.ncsc.gov.uk/sites/default/files/pdfs/news/vulnerability-affecting-nextjs-web-development-framework.pdf)
- [Stack Overflow — D3 large datasets: speed of zoom/pan in SVG plotted charts](https://stackoverflow.com/questions/62624925/javascript-d3-js-draw-large-data-set-improve-the-speed-of-zoom-and-pan-in)
- [Observable Forum — D3 scaling with large data volumes causing lag on zoom](https://talk.observablehq.com/t/d3-scaling-when-there-is-a-large-amount-of-data-can-cause-lag/8526)
- [GitHub d3/d3#1936 — force layout performance with thousands of nodes](https://github.com/d3/d3/issues/1936)
- [Visual Cinnamon — Learnings from a D3.js addict on starting with canvas (SVG element-count thresholds)](https://www.visualcinnamon.com/2015/11/learnings-from-a-d3-js-addict-on-starting-with-canvas)
- [Datadog Docs — Log Management Data Security (log filtering/redaction rules)](https://docs.datadoghq.com/data_security/logs.md)
- [Datadog Docs — HIPAA Compliance for log management](https://docs.datadoghq.com/data_security/hipaa_compliance)
- [Sentrik HIPAA standards pack — PHI must not be written to application logs (critical severity)](https://docs.sentrik.dev/standards-packs/hipaa)
- PRODUCT-MASTER-SPEC.md §3 (diagnostic failures: cross-role switching, Cardiology shell, duplicated filter row, static timeline, incorrect colors, heavy layout), §8 (timeline interaction/zoom/branches), §10 (AI principles/provenance), §11 (OCR pipeline/verification), §13 (data model), §18 (offline/sync states), §20 (phases), §27 (hard prohibitions)

---
*Pitfalls research for: dual-sided clinical workspace (EHR-style longitudinal record) on Next.js App Router + Supabase + D3 v7*
*Researched: 2026-10-05*
