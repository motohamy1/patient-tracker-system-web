# Architecture Research

**Domain:** Dual-sided clinical workspace (EHR-style longitudinal patient record) on Next.js App Router + Supabase/PostgreSQL, with a mandatory D3.js clinical timeline
**Researched:** 2026-10-05
**Confidence:** HIGH (stack and database patterns) / MEDIUM (extraction-adapter boundaries — vendor choice is open by design)

## Standard Architecture

### System Overview

```
┌────────────────────────────────────────────────────────────────────┐
│                       CLIENT LAYER (thin)                          │
│  ┌──────────────┐  ┌──────────────────┐  ┌──────────────────────┐  │
│  │ Provider Home │  │ Patient Workspace │  │ D3 Timeline Surface  │  │
│  │ (folders,     │  │ (8 tabs, Overview │  │ (pan/zoom/scrubber;  │  │
│  │  lists)       │  │  + timeline region)│  │  reads pre-projected │  │
│  │               │  │                   │  │  event rows)         │  │
│  └──────┬───────┘  └────────┬──────────┘  └──────────┬───────────┘  │
│         │   no business logic, no role state, no local auth       │
├─────────┴───────────────────┴────────────────────────┴─────────────┤
│                  NEXT.JS APP ROUTER (server-first)                 │
│  ┌────────────────┐ ┌────────────────┐ ┌────────────────────────┐  │
│  │ RSC data reads │ │ Server Actions │ │ Route Handlers / Edge  │  │
│  │ via Supabase   │ │ (mutations +   │ │ (OCR webhooks,         │  │
│  │ user client    │ │ authz re-check)│ │  provider callbacks)   │  │
│  └───────┬────────┘ └───────┬────────┘ └──────────┬─────────────┘  │
│  ┌───────┴──────────────────┴─────────────────────┴─────────────┐  │
│  │ Authorization resolution (identity → membership → role →     │  │
│  │ workspace) — cached per-request, ALWAYS re-derived server-side│  │
│  └──────────────────────────────────────────────────────────────┘  │
├────────────────────────────────────────────────────────────────────┤
│                      SUPABASE / POSTGRESQL                         │
│  ┌───────────┐ ┌───────────┐ ┌────────────────────────────────┐   │
│  │ Auth      │ │ Canonical │ │ clinical_events PROJECTION     │   │
│  │ (identities│ │ clinical  │ │ (timeline view-store; derived, │   │
│  │  + sessions)│ │ tables +  │ │  never canonical; rebuilt-able)│   │
│  └───────────┘ │ RLS on    │ └────────────────────────────────┘   │
│                │ every row │ ┌────────────────────────────────┐   │
│  ┌───────────┐ │           │ │ audit_log (append-only,        │   │
│  │ Storage   │ └───────────┘ │ trigger-written, PHI-minimal)  │   │
│  │ (documents)│ ┌───────────┐ └────────────────────────────────┘   │
│  └───────────┘ │ Ingestion │ ┌────────────────────────────────┐   │
│                │ stages    │ │ OCR extraction queue + entities │   │
│                └───────────┘ └────────────────────────────────┘   │
└────────────────────────────────────────────────────────────────────┘
```

The single most important structural decision, from spec §12 and §13: **authorization and data access are enforced in the database (RLS), not in React.** The Next.js layer's job is rendering and orchestration; the Postgres layer's job is policy. Every client request — RSC read, server action, or realtime subscription — flows through the same user-scoped Supabase client whose Postgres role (`authenticated`) is subject to RLS. A service-role client exists only in trusted server contexts (document processing, admin tooling), never reachable from browser code (STACK.md cross-reference; HIGH).

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| RSC pages/layouts | Fetch server-side through user-scoped Supabase client; render provider/patient surfaces | App Router server components + `@supabase/ssr` `createServerClient` with cookies |
| Server Actions | All clinical mutations; re-validate with Zod; re-check authorization; write provenance | `"use server"` modules, one action domain module per aggregate (visits, medications, labs…) |
| Auth identity provider | Human identity, sessions, MFA | Supabase Auth (`auth.users`), sessions in httpOnly cookies |
| Membership/role resolver | Map identity → org membership → role → permitted workspace surfaces | `organization_members` table + SQL `SECURITY DEFINER` helper functions usable inside RLS policies |
| RLS policies | Enforce every read/write per row, per role, per org | Postgres `CREATE POLICY ... USING (...)/WITH CHECK (...)` on 100% of tables incl. `clinical_events` |
| Canonical clinical tables | Source of truth: visits, medications (+ orders/administrations), labs, imaging, vitals, allergies, genetics, documents, care tasks, communications | Normalized relational schema, FKs, enums/status lifecycles, provenance columns |
| `clinical_events` projection | Unified read model feeding the D3 timeline; one row per timeline-visible event | Postgres trigger-maintained projection table (or SQL view over typed columns) with JSONB detail payload |
| Timeline engine | Pan, semantic zoom, clustering, branches, scrubber, selection | D3 v7 (`d3-scale`, `d3-zoom`, `d3-selection`, `d3-axis`) rendering into a React-managed SVG surface |
| Document ingestion pipeline | Prescription/document image → verified structured data → record + projection | Storage + Supabase Edge Functions/Queue + vendor-agnostic OCR adapter + human verification UI |
| Audit log | Append-only record of sensitive mutations and reads | Postgres trigger into `audit_log` (pg-audit-json style), never editable from the app |
| Payments abstraction | Fee/invoice/receipt flows behind a provider-agnostic interface | Internal `payments` domain + adapter per PSP; no clinical-table coupling (spec §17) |
| Channel adapters | In-app/WhatsApp/Telegram messaging against a unified conversation model | `conversations`/`messages` tables + adapter modules; clinical truth stays in clinical tables (spec §15) |

## Recommended Project Structure

```
src/
├── app/
│   ├── (auth)/                     # sign-in etc.; no clinical data
│   ├── (provider)/                 # provider surfaces, RSC-first
│   │   ├── layout.tsx              #   workspace shell (server component)
│   │   ├── page.tsx                #   Provider Home: folder grid, Recent, Today…
│   │   └── patients/[patientId]/   #   per-patient provider workspace
│   │       ├── overview/           #     timeline region + summary
│   │       ├── visits/ medications/ labs/ imaging/ allergies/ genetics/
│   ├── (patient)/                  # patient surfaces — same design language,
│   │   └── ...                     #   lower density (spec §14); separate tree so
│   │                               #   no route is shared across workspaces
│   └── api/                        # only webhooks/callbacks (OCR provider, PSP);
│                                   #   NOT a general data API — RSC + actions are
├── lib/
│   ├── supabase/
│   │   ├── server.ts               # createServerClient (cookies; user-scoped)
│   │   ├── browser.ts              # client for the few client components that need it
│   │   ├── admin.ts                # service-role client — server-only, guarded by import
│   │   └── middleware.ts           # session refresh proxy pattern
│   ├── auth/
│   │   ├── resolve.ts              # identity → membership → role → workspace (cached per request)
│   │   └── guards.ts               # supplementary route guards (defense in depth ONLY)
│   ├── events/                     # clinical_events read-side helpers (queries, filters)
│   └── validation/                 # Zod schemas shared by actions and forms
├── server/                         # domain logic invoked by server actions
│   ├── visits/ medications/ labs/ imaging/ allergies/ genetics/
│   ├── documents/                  # OCR pipeline orchestration
│   ├── payments/                   # PSP-agnostic service + adapters/
│   ├── communications/             # conversation model + channel adapters/
│   └── audit/                      # audit write paths (mostly DB triggers instead)
├── components/
│   ├── ui/                         # primitives built on semantic tokens (Phase 002)
│   ├── timeline/                   # D3 timeline: scale, zoom, clusters, branches, scrubber
│   │   ├── TimelineSurface.tsx     #   React boundary; D3 renders into a managed <svg>
│   │   └── d3/                     #   framework-free D3 modules (testable in isolation)
│   ├── provider/ patient/          # surface-specific composition
│   └── documents/                  # verification UI: original image ↔ extracted fields
├── design/                         # tokens.ts, motion rules (Framer Motion + GSAP usage map)
└── tests/                          # Vitest units + Playwright e2e/visual (fidelity gates §21)
supabase/
├── migrations/                     # schema + RLS policies + projection triggers, in order
├── functions/                      # Edge Functions: OCR jobs, channel webhooks
└── tests/rls/                      # pgTAP-style RLS tests per role/org (Phase 003, 020)
```

### Structure Rationale

- **`(provider)` vs `(patient)` route groups are physically separate trees:** it makes "one authenticated user must not reach the other workspace" a *routing + server-guard + RLS* property instead of component-level convention. Cross-workspace access requires the identity to genuinely hold both roles at the DB level (spec §12). HIGH confidence this split pays off; it is the concrete countermeasure to the old implementation's failure (spec §3.1).
- **`server/` domain modules separate from `lib/supabase`:** mutations get an explicit place where Zod parsing, authorization re-check, provenance stamping, and audit expectations live together. Server Actions stay thin I/O adapters over these modules. MEDIUM — a simple pattern that prevents action-layer sprawl.
- **`supabase/migrations/` owns schema + RLS + projection triggers together:** the projection and its policies ship in the same migration as the canonical table they derive from, so no phase can add a table that silently bypasses RLS or the timeline projection. HIGH.
- **`components/timeline/d3/` framework-free:** D3 code that owns scale/zoom/layout lives outside React components so it can be unit-tested with Vitest and reused across zoom levels; React owns mount/update lifecycle and state boundaries only. HIGH — standard React+D3 integration practice.

## Architectural Patterns

### Pattern 1: Membership-Based Multi-Tenant RLS with a Role-Resolution Function

**What:** Every clinical table carries `organization_id` (and usually `patient_id`); RLS policies call a `SECURITY DEFINER` helper that resolves the caller's membership and role from `auth.uid()`, so policies avoid recursive self-references and stay one place to audit. This is the documented membership-isolation pattern for Supabase multi-tenancy: policies express *both* `USING` (read) and `WITH CHECK` (write), per operation, per role.

**When to use:** Always — from Phase 003 onward, before any clinical table exists. Never enable RLS-less tables even during development fixtures.

**Trade-offs:** Helper functions centralize logic (one bug fixed everywhere; easy to test) at the cost of one more indirection and requiring care that the helper itself is `STABLE`, `SECURITY DEFINER`, and cannot be replaced by users. Policies become slightly verbose but mechanically uniform.

**Example:**

```sql
-- one trusted resolver, used by every policy
create or replace function auth_role(p_org uuid)
returns text language sql stable security definer set search_path = public as $$
  select m.role from organization_members m
  where m.user_id = auth.uid() and m.organization_id = p_org
$$;

create policy provider_reads_visits on visits
  for select using (
    organization_id = auth_org()
    and auth_role(organization_id) in ('doctor','nurse','receptionist')
  );
create policy doctor_writes_visits on visits
  for update using (organization_id = auth_org() and auth_role(organization_id) = 'doctor')
  with check (organization_id = auth_org() and auth_role(organization_id) = 'doctor');
```

Patient-role policies additionally constrain by `patient.user_id = auth.uid()` so patients read only their own record. Sources: Supabase RLS docs (USING vs WITH CHECK, per-command policies); membership-isolation reference repos show the four-operation coverage and the test-suite discipline (GitHub: `gastonlopezl/supabase-rls-multi-tenant`, `point-source/supabase-tenant-rbac`). Confidence HIGH.

### Pattern 2: `clinical_events` as a Trigger-Maintained Projection (CQRS-lite)

**What:** Canonical tables remain the source of truth (spec §8.2, §13). A `clinical_events` table — or a parameterized SQL view — is maintained by Postgres triggers (or a small sync function per domain) whenever clinical records change. The timeline reads *only* this projection, so visualization logic never couples to individual tables. This is deliberately **CQRS-lite, not event sourcing**: there is no event log to replay; the projection is derived, disposable, and rebuildable from canonical data.

**When to use:** Timeline (Phase 006) and any cross-domain "what happened to this patient" surface. Do **not** let the projection become canonical storage (explicit spec prohibition, §13: "Avoid making the timeline itself the canonical storage model").

**Trade-offs:** Triggers add write latency and a second schema surface to maintain; in exchange, reads are one indexed table (fast clustering, filtering, pagination at any zoom) and no application code can forget to project an event. Alternative — a plain SQL view over canonical tables — is simpler but makes cross-table event shape and clustering indexes harder; choose the view only if event counts are small. For this product (longitudinal records, hundreds of events per patient, §8.4), the maintained table with JSONB detail is the better default. Confidence MEDIUM-HIGH (well-established pattern; exact trigger-vs-app-layer choice is per-domain).

**Example:**

```sql
create table clinical_events (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id),
  organization_id uuid not null,
  occurred_at timestamptz not null,          -- clinical time, not row time
  event_type text not null,                  -- 'visit','medication-started','lab-result',…
  title text not null,
  category text not null,                    -- visit|medication|lab|imaging|vital|document|care
  severity text,                             -- drives Critical/Needs Attention signals
  source_kind text not null,                 -- staff|patient|imported|ai-extracted|system
  source_record_id uuid not null,            -- FK to canonical row (provenance anchor)
  detail jsonb not null default '{}',        -- type-specific payload for event cards
  created_at timestamptz not null default now()
);
create index on clinical_events (patient_id, occurred_at desc);
create index on clinical_events (patient_id, event_type, occurred_at desc);
-- trigger example: after insert/update on lab_results → upsert a 'lab-result' event
```

Event types map 1:1 to spec §8.2: visit, diagnosis, symptom, medication-started/changed/stopped, lab-ordered/result, imaging-ordered/result, vital-measurement, procedure, hospitalization, document, follow-up, care-plan-change, patient-reported-event. Status-changing records (medication lifecycle §19 Ph008) emit *new* events per transition rather than mutating one event, preserving chronology.

### Pattern 3: Request-Scoped Authorization Resolution (never client role state)

**What:** A single server-side `resolveAccess()` runs per request (RSC render or server action): `auth.uid()` → trusted identity (Supabase Auth) → org membership rows → role(s) → permitted workspace + route allowances. Result is cached for the request only (React `cache()`), never persisted to client state, localStorage, or URL. Frontend route guards are a UX convenience only; the actual gates are RLS policies plus action-level re-checks.

**When to use:** Every server render and mutation. Chain per spec §3.1/§12: *auth → trusted identity → org membership → role resolution → authorization → permitted workspace.*

**Trade-offs:** One function to keep fast (indexed membership lookup; request-level memoization) versus the catastrophic alternative — trusting client-supplied role, which is the diagnosed failure of the old implementation. HIGH.

**Example:**

```typescript
// lib/auth/resolve.ts — server-only
import { cache } from "react";
export const resolveAccess = cache(async () => {
  const supabase = createServerClient();            // user-scoped, cookie-based
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { kind: "anonymous" } as const;
  const { data: memberships } = await supabase      // RLS limits rows to own memberships
    .from("organization_members").select("organization_id, role");
  if (!memberships?.length) return { kind: "unprovisioned" } as const;
  const role = pickPrimaryRole(memberships);        // multi-role identities supported explicitly
  return { kind: "resolved", userId: user.id, role, orgId: memberships[0].organization_id } as const;
});
```

Every server action begins with `resolveAccess()` + explicit role assertion; every query still passes through RLS, so even a buggy action cannot read across orgs. Confidence HIGH.

### Pattern 4: Human-in-the-Loop Document Ingestion Pipeline

**What:** The §11 pipeline maps to distinct stages with persisted state, so the clinician verification step is a first-class workflow, not a spinner:

```
image upload (Storage, private bucket, signed URLs)
  → preprocessing (normalize/rotate/threshold; Edge Function)
  → OCR/vision extraction (vendor-agnostic adapter)
  → structured extraction (field schema: medication, dose, route, frequency, duration, diagnosis)
  → entity normalization (RxNorm/ICD-10 mapping; candidate lists, not guesses)
  → confidence analysis (per-field score; low-confidence flags)
  → clinician verification UI (original image beside fields; ambiguous fields highlighted;
     clinician confirms/edits/rejects — §11 verbatim behaviors)
  → persistence (canonical row + provenance = document link, extractor id, confidence, verifier)
  → projection (clinical_events row)
```

**When to use:** Phase 012 for prescriptions; the same stage machine later absorbs lab reports, discharge summaries, referrals, external imaging reports, prior prescriptions (§11). 

**Trade-offs:** Persisting intermediate stages costs storage and state-machine code, but buys exactly what the spec demands: unverified extraction is never authoritative (never silently saved), verification is resumable, provenance is complete (§23). An ephemeral "extract → save" shortcut is architecturally forbidden here. Confidence HIGH on the pipeline shape; MEDIUM on specific OCR vendor (adapter keeps it swappable — see STACK.md).

### Pattern 5: D3 Timeline as a React-Hosted Visualization Module

**What:** React owns lifecycle and application state; D3 owns scale/zoom/layout/render inside a mounted SVG. State flow: server-projected events (RSC) → typed props → D3 bound to the SVG; user interactions (pan/zoom/scrub/select) translate to React state or URL params; detail fetches for a selected event go back through RSC/route handlers. GSAP handles SVG path/branch choreography; Framer Motion handles card/panel layout motion (spec §9 two-layer split).

**When to use:** Phase 006. D3 is mandated (§8.1); the only real choice is host integration, and the host-managed (not D3-app-managed) pattern is the standard low-friction option for React.

**Trade-offs:** Requires explicit enter/update/exit discipline in D3 code and a clean prop contract; avoids the two classic failure modes — React re-rendering over D3's DOM, or D3 owning React state. Keeping D3 modules framework-free makes the zoom/clustering logic independently testable. HIGH.

## Data Flow

### Request Flow (read path)

```
User opens provider patient page
    ↓
RSC render → resolveAccess() (per-request cache) → permitted workspace confirmed
    ↓
Supabase user client (cookie session) → Postgres with RLS enforced on every table
    ↓
Canonical tables + clinical_events projection (indexed by patient_id, occurred_at)
    ↓
Typed DTOs (Zod-validated at the boundary) → Server Component tree
    ↓
Streamed HTML; D3 timeline hydrates from projected event rows
```

### Mutation Flow (write path)

```
User action (e.g., stop medication)
    ↓
Server Action → Zod parse → resolveAccess() role assertion (doctor/nurse, own org)
    ↓
server/medications domain logic → Supabase user client INSERT/UPDATE
    ↓
Postgres: RLS WITH CHECK re-evaluates role + org at the row level
    ↓
Canonical row committed → AFTER trigger appends medication-stopped event to clinical_events
                 → AFTER trigger appends audit_log entry (actor, action, record, before/after hash)
    ↓
Response returns; UI revalidates; timeline re-reads projection (Realtime optional per phase)
```

### Document Ingestion Flow

```
Upload (provider) → Storage private bucket → ingestion_jobs row (status state machine)
  → Edge Function: preprocess → OCR adapter → structured fields (+confidence per field)
  → normalization (RxNorm/ICD-10 candidates; never auto-accept ambiguous values)
  → verification task assigned to clinician → verification UI (image ↔ fields side-by-side)
  → clinician confirms/edits → canonical row written with full provenance
  → clinical_events projection appended → original image retained, linked (§23)
```

### State Management

```
Server state (clinical truth): Postgres via RLS — no client mirror of record data
    ↓ (RSC props / revalidate)
Client interaction state: React state in surface components (selected event, zoom level,
    open panels, form state) —ephemeral, never used for authorization
Offline drafts (Phase 019): explicit local outbox with states local-draft → queued →
    syncing → synchronized / failed / conflict — UI may never label a local draft "saved" (§18)
```

### Key Data Flows

1. **Timeline projection flow:** every domain mutation triggers a projection write in the same transaction (trigger), so the timeline can never show an event whose canonical record doesn't exist — or vice versa after a rebuild. Event rows carry `source_kind` + provenance columns so AI-extracted and clinician-verified data remain distinguishable on the timeline (§23).
2. **Authorization resolution flow:** identity → membership → role → workspace happens server-side per request; the client never receives a "role" it could tamper with, and a frontend toggle can only ever *request* a surface the DB has already permitted (Phase 003 acceptance condition).
3. **Verification-gated ingestion flow:** OCR output exists in `extraction_drafts` until a clinician confirms; persistence into canonical tables happens only at verification, with provenance linking document, extraction, verifier, and confidence.

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 0–1k users (single/few practices) | Monolithic Next.js + Supabase as-is. RLS + triggers fine. One Postgres, pgBouncer via Supabase pooler. |
| 1k–100k users | First real work: projection-table indexes and clustering queries; document pipeline moves to queued background jobs with retries; consider partitioning `clinical_events`/`audit_log` by time; read-heavy provider pages get targeted `revalidate` caching with PHI-safe keys (never shared caches). |
| 100k+ users | Time-partition projection/audit tables; move OCR batch stages to dedicated workers; consider read replicas for analytics/AI summarization; per-region Supabase projects for data residency. |

### Scaling Priorities

1. **First bottleneck:** timeline queries over years of events (hundreds of events per patient, clustering at broad zoom, §8.4). Fix: the projection table with compound indexes `(patient_id, occurred_at)`, event-type filtering pushed to SQL, cluster aggregation done in the query (date-bucketing), not in D3. D3 renders a bounded window — never all events at once.
2. **Second bottleneck:** document ingestion latency (OCR is seconds-to-minutes). Fix: job queue with state machine + async verification tasks; the pipeline is already asynchronous by design, so this is operational hardening rather than redesign.

## Anti-Patterns

### Anti-Pattern 1: Client-Side Role Switching / Client-State Authorization

**What people do:** Store "role: doctor" in localStorage/context, guard routes in a layout, swap workspaces from a UI toggle.
**Why it's wrong:** The diagnosed failure of the previous implementation (§3.1); anyone can edit client state; also violates Phase 003's acceptance condition verbatim ("A frontend toggle must NOT grant access to another workspace").
**Do this instead:** Server-side `resolveAccess()` + RLS as the only enforcement points; route groups per workspace; guards only for redirect UX; identity must genuinely hold roles in DB tables.

### Anti-Pattern 2: Timeline as Canonical Store / Static Timeline

**What people do:** Draw a static SVG timeline with events hardcoded or fetched from ad-hoc per-table queries; or worse, store timeline nodes as the primary data.
**Why it's wrong:** Static SVG fails §8.3–8.6 interaction requirements and repeats the old implementation's §3.5 failure; canonical-store coupling makes every new domain a timeline refactor and breaks FHIR-mapping compatibility (§13).
**Do this instead:** `clinical_events` projection + D3 v7 interactive engine (pan, semantic zoom, clustering, branches, scrubber). Database stays source of truth.

### Anti-Pattern 3: Service-Role Key in Reach of the Client / RLS Bypass Layer

**What people do:** Use the service-role key "for convenience" in shared code, or add an ORM/data layer whose client embeds elevated credentials.
**Why it's wrong:** Silently voids the entire RLS architecture; a leaked service key reads every org's PHI. STACK.md explicitly excludes any ORM layer that bypasses RLS.
**Do this instead:** User-scoped clients everywhere except trusted server contexts (Edge Functions, document workers); `admin.ts` marked server-only; service key never in `NEXT_PUBLIC_*`; CI greps for misuse.

### Anti-Pattern 4: Silently Persisting Low-Confidence OCR

**What people do:** Extract → write to medications/diagnoses directly, treating OCR output as truth.
**Why it's wrong:** §11 forbids guessing unclear medication names/doses/durations/diagnoses; unverified AI data must never become authoritative clinical truth (§23 provenance collapse).
**Do this instead:** Drafts + confidence flags + mandatory clinician verification before canonical persistence; provenance columns record extraction state and verifier.

### Anti-Pattern 5: Over-Densified Screens & Generic SaaS Drift

**What people do:** Add generic dashboards, extra navbar categories, saturated multi-color themes, heavy glassmorphism/neumorphism, gamified progress fireworks.
**Why it's wrong:** Directly violates the §27 prohibition set and the reference-image grammar (compact density, olive/ivory/yellow palette, folder-first collection); the old implementation drifted on exactly these axes (§3.3–3.8).
**Do this instead:** Semantic tokens only; per-surface reference primaries (`docs/reference/`) govern layout/geometry/interaction grammar; restrained motion respecting reduced-motion; density from typography and spacing discipline, not more boxes.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| Supabase (Auth/DB/Storage) | `@supabase/ssr` server + browser clients; middleware session refresh; RLS everywhere | Server Components can't write cookies — use the Proxy/middleware pattern for token refresh (Supabase docs) |
| OCR/vision provider | Vendor-agnostic adapter behind `server/documents/ocr-adapter` (Document AI or equivalent) | Contract-first: image → structured fields + per-field confidence; swap without touching pipeline stages |
| Terminology/normalization (RxNorm, ICD-10) | Normalization stage inside pipeline; local mapping tables + reference lookups | Candidates shown to clinician, never auto-applied |
| Payment providers | `server/payments/` abstraction + per-PSP adapters; webhooks via route handlers | Financial data never pollutes the clinical timeline (§17) |
| WhatsApp / Telegram | Channel adapters behind unified conversation model; webhook receivers in `api/` | Clinical truth remains in clinical tables; messaging must not become a shadow record (§15) |
| Telehealth session provider | Embedded video surface inside consultation workflow with patient context visible | Not a standalone video app (§16) |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| Canonical tables ↔ `clinical_events` | Postgres triggers (same transaction) | Projection is derived; rebuild scripts exist; both sides RLS-covered |
| Next.js ↔ Postgres | User-scoped Supabase clients only | Service-role confined to Edge Functions/workers |
| Domain modules ↔ Server Actions | Direct function calls, server-only imports | Actions thin: parse → authorize → delegate → revalidate |
| Timeline engine ↔ React | Typed props in; interaction callbacks out | D3 modules framework-free; no D3 access to data layer |
| Ingestion pipeline ↔ Verification UI | `ingestion_jobs` + `extraction_drafts` state machine | Verification is blocking for persistence; image always retrievable beside fields |
| Clinical domain ↔ Payments/Communications | Foreign keys by reference only; no clinical-field denormalization | Keeps §15/§17 separation and future FHIR mapping clean (§13) |

## Build Order & Risk Flags (phase-sequenced architecture)

Build order follows the spec's phase sequence exactly — architecture is delivered in the same order the roadmap prescribes (constitution → shell → auth/RBAC → provider home → workspace → timeline → feature phases → hardening → interop → QA):

| Phase | Architectural deliverable | Risk |
|-------|---------------------------|------|
| 001 Constitution/UI spec | Token architecture, reference primacy registry | Low |
| 002 Foundation/shell | Route groups, primitives, motion foundation, a11y baseline | Low |
| **003 Auth/Org/RBAC/RLS** | Membership model, resolver, RLS policies on every table, audit foundation | **HIGH** — the security foundation; everything later assumes correct policies; acceptance condition is the toggle test |
| 004 Provider Home | Folder-grid collection over RLS-scoped queries | Medium (visual fidelity) |
| 005 Patient Workspace | 8-tab shell, Overview composition | Medium (visual fidelity) |
| **006 D3 Timeline** | `clinical_events` projection + D3 engine (pan/zoom/cluster/branch/scrubber) | **HIGH** — performance and interaction complexity; depends on projection being right; large-dataset behavior is an explicit requirement |
| 007–010 Visits/Medications/Labs+Imaging/Allergies+Genetics | Canonical domains + lifecycles + provenance + projections | Medium |
| 011 AI Patient Intelligence | Assistive signals over projection; provenance-tagged outputs | Medium (provenance discipline) |
| 012 OCR/Document Intelligence | Full pipeline + verification UI | Medium-High (state machine + UX) |
| 013–018 Patient Home → Payments | Patient-facing flows, channels, telehealth, payments abstraction | Medium |
| 019 Offline/Sync | Outbox state machine (draft/queued/syncing/synced/failed/conflict) | Medium-High (semantics, §18) |
| 020 Security/Audit hardening | RLS audit, org isolation, session/API/privacy review | High stakes, established codebase |
| 021 Interoperability | FHIR mapping over canonical model (projection untouched) | Medium |
| 022 Final QA | Playwright visual/interaction/authorization regression | Low |

**Why Phase 003 is high-risk:** every subsequent phase inherits its authorization posture; a policy written casually in Phase 003 (e.g., a missing `WITH CHECK`, a recursive policy, an over-broad helper) becomes a systemic PHI exposure discovered only in Phase 020. Mitigation: pgTAP-style RLS tests per role/org shipped *with* the migration, and a rule that no table ships without policies in the same migration.

**Why Phase 006 is high-risk:** the timeline is the product's hero surface and its only place where visualization engineering meets data engineering. Getting the projection shape wrong forces rework across every domain phase that projects into it. Mitigation: freeze the event-type taxonomy (§8.2) and projection schema in Phase 006; require performance acceptance at high event counts (semantic zoom collapsing hundreds of events while chronology stays legible).

## Sources

- Supabase — Row Level Security (roles, per-command policies, USING/WITH CHECK): https://supabase.com/docs/guides/database/postgres/row-level-security
- Supabase — Postgres Roles / RBAC on top of RLS: https://supabase.com/docs/guides/database/postgres/roles
- Supabase — Creating a Supabase client for SSR (Next.js App Router, cookies, middleware token-refresh Proxy): https://supabase.com/docs/guides/auth/server-side/nextjs and https://supabase.com/docs/guides/auth/server-side/creating-a-client
- Membership-based multi-tenant RLS reference implementation (all four operations, isolation test suite): https://github.com/gastonlopezl/supabase-rls-multi-tenant
- Tenant RBAC template (orgs/groups + member roles over RLS): https://github.com/point-source/supabase-tenant-rbac
- Multi-tenant Postgres patterns (shared table + tenant_id vs schema-per-tenant trade-offs): https://www.suparbase.com/blog/multi-tenant-saas-postgres
- PostgreSQL — PL/pgSQL Trigger Functions (data-change triggers powering projections/audit): https://www.postgresql.org/docs/current/plpgsql-trigger.html
- Trigger-based JSONB audit logging pattern (pg-audit-json): https://github.com/m-martinez/pg-audit-json
- Event-sourcing/CQRS projection overview (projections as derived, rebuildable read models): https://github.com/claude-dev-suite/knowledge_base/blob/main/knowledge/event-sourcing-cqrs/projections.md
- Product constraints: `PRODUCT-MASTER-SPEC.md` §3.1–3.8 (diagnostics), §8 (timeline), §10 (AI/provenance), §11 (OCR pipeline), §12 (authorization), §13 (data architecture), §15–18 (channels/telehealth/payments/offline), §19 (phase order), §23 (provenance), §27 (prohibitions)

---
*Architecture research for: dual-sided clinical workspace (EHR-style longitudinal record) on Next.js + Supabase with D3 timeline*
*Researched: 2026-10-05*
