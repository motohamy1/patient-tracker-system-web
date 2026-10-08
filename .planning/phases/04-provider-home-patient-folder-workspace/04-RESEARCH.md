# Phase 4: Provider Home + Patient Folder Workspace - Research

**Researched:** 2026-10-08
**Domain:** Postgres patient-record schema + RLS (Supabase), server-side search/filter/pagination (PostgREST/supabase-js), Next.js 16 async-searchParams page state, Phase-2 primitive composition for the folder grid
**Confidence:** HIGH — every pattern below is either verified in this repository's own Phase-2/3 code or grounded in established PostgREST/Postgres behavior; no new package is required (the entire phase runs on the installed stack).

<user_constraints>
## User Constraints (from 04-CONTEXT.md)

### Locked Decisions (verbatim, NON-NEGOTIABLE)

- **D-01** "Add New Patient" creates a **patient record only** — no user account; invite later.
- **D-02** Form collects **core identity only**: first name, last name, DOB, sex (M/F), phone; MRN auto-generated.
- **D-03** `patients.user_id` is an **optional FK**; linked at invite signup.
- **D-04** A **quick action to send an invite** (unlinked patients) reuses Phase 3 invite infra and **links the invite to the patient record so signup auto-connects**.
- **D-05** New-patient form is a **modal** reusing the Phase 2 Overlay (modal/sheet) primitive.
- **D-06** After create, the provider **stays on home**; the new folder card appears in the grid.
- **D-07** MRN is **auto-generated sequential, zero-padded** (e.g. MRN-0001); provider never types it.
- **D-08** Sex options are **M/F only**.
- **D-09** Folder status is a **stored enum on `patients`**: `stable | follow_up | needs_review | critical | new`.
- **D-10** Status → token: `stable`→`success`, `follow_up`→`warning`, `needs_review`→`info`, `critical`→`critical`, `new`→`info`.
- **D-11** Filter tabs: **Recent** (by `last_activity_at` desc), **Today** (created/updated today), **Needs Attention** (`follow_up` or `needs_review`), **Critical** (`critical`), **All** (default).
- **D-12** Filter tabs **replace the grid content** with matching patients; "All" resets.
- **D-13** New patients default to status `new`; manual status change via card quick action.
- **D-14** "Today" (Phase 4) = **created or updated today**; upgrades to appointments in Phase 7.
- **D-15** Card quick actions: **Open workspace** (primary click), **Change status**, **Send invite** (if unlinked), **Schedule appointment** (Phase-7 placeholder).
- **D-16** Home primary CTA is **"Add new patient"** in `accentSoft` gold.
- **D-17** Search covers **name (first/last), MRN, phone, DOB**.
- **D-18** Search is **server-side with 300ms debounce**; results replace the grid.
- **D-19** Search runs **within the active filter**.
- **D-20** **Server-side pagination** (20–30/page) with a "Load more" button; search+filters server-side.
- **D-21** This phase creates **only the `patients` table** (plus the `invitations.patient_id` link column and trigger/function extensions D-04 requires).
- **D-22** `last_activity_at` tracks recent activity, bumped on status change, invite sent, patient created.
- **D-23** Schema: `id, org_id, user_id (nullable), first_name, last_name, dob, sex, phone, mrn, status, created_at, updated_at, last_activity_at` + org-scoped RLS.

### Claude's Discretion

- MRN sequence format (zero-padded sufficient). Filter tab component shape (must use TabBar/Pill grammar). Modal form layout/field order. How the "Schedule appointment" placeholder manifests. Per-filter empty-state copy. "Load more" styling.

### Deferred Ideas (OUT OF SCOPE — do NOT research or plan)

- Appointments/scheduling data model (Phase 7) · extended demographics (email, address, emergency contact, insurance) · activity-log table · virtualized grid · auto-updating status rules.
</user_constraints>

<architectural_responsibility_map>
## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Patient identity record (D-01..D-03, D-23) | Database/Storage | — | Relational table + RLS; authorization is the DB's job (§12, STACK "What NOT to Use") |
| MRN generation (D-07) | Database/Storage | — | Must be race-proof at the write boundary — a BEFORE INSERT trigger, never app-side |
| `last_activity_at` maintenance (D-22) | Database/Storage | — | Same argument as Phase 3 D-14 audit triggers: a missed code path must not mean a missing bump |
| Invite → patient auto-link (D-04) | Database/Storage | Frontend Server | `redeem_invite` (security definer, migration 0004) gains the link; the action layer only passes `patient_id` |
| Search / filter / pagination (D-17..D-20) | Frontend Server | Database/Storage | Server Components + supabase-js queries under RLS; the client only carries URL state |
| Folder grid, cards, retrieval controls, modal (D-05, D-11, D-15..D-16) | Browser/Client + Frontend Server | — | Server Components own the render; client islands own debounce/overlay state only |
</architectural_responsibility_map>

<research_summary>
## Summary

Phase 4 is the first **clinical data surface** of the product: one new table (`patients`), the retrieval query layer over it, and the provider-home UI the reference binds. Three structural findings shape the plan set:

1. **The write boundary belongs to Postgres.** MRN sequencing (D-07), `updated_at`/`last_activity_at` maintenance (D-22), and audit rows (Phase 3 D-14 extension) are all trigger-owned. This matches the repo's own established doctrine — migration 0003's comment: *"Triggers (not server-action writes) so a missed code path can never mean a missing entry."*
2. **Search is one indexed text query, not four OR'd columns.** A stored generated column `search_text` (name + MRN + phone + DOB text) with a `pg_trgm` GIN index makes the single `ilike '%q%'` filter index-assisted — this is UX-07's performance answer and avoids the PostgREST `.or()` value-escaping pitfall entirely.
3. **The home page keeps PHI on the server.** `/provider` is a Server Component reading `searchParams` (Next 16: a Promise — the repo already awaits it in `src/app/(auth)/login/page.tsx:27`); search/filter/pagination state lives in the URL. Client islands carry only the debounce timer, the CTA modal, and the quick-actions overlay.

**Primary recommendation:** one migration (0005) for the full data substrate (table + triggers + RLS + `invitations.patient_id` + `redeem_invite` extension), one server-layer plan (schemas/queries/actions), two UI plans (grid surface; entry + quick actions), one phase-close plan (visual matrix + owner design gate) — 5 plans, exactly the repo's "plan fat, not many" convention.

</research_summary>

<standard_stack>
## Standard Stack

No new packages. Everything runs on what Phase 2/3 pinned:

### Core (already installed)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@supabase/supabase-js` + `@supabase/ssr` | 2.117.2 / 0.12.7 | Per-request server client (already at `src/lib/supabase/server.ts`) | The locked Phase-3 pattern; RLS evaluates every query |
| PostgreSQL (Supabase local, 127.0.0.1:54321) | — | `patients` table, triggers, RLS, `pg_trgm` | §13 relational model; migrations are source of truth |
| Zod | ^4.6.5 | Validation of all patient mutations | Locked STACK choice; schemas live outside `'use server'` files (03-PATTERNS) |
| Next.js App Router | 16.3.8 | `searchParams` Promise + server actions + `revalidatePath` | React 19.3.0 pair; async searchParams already used in this repo |

### Supporting

| Library | Purpose | When to Use |
|---------|---------|-------------|
| `pg_trgm` (Postgres extension) | GIN trigram index on `search_text` | Always for D-17/D-18 — this is the UX-07 mechanism |
| `pg_advisory_xact_lock` | Serialize per-org MRN assignment | Inside the MRN trigger only |
| `react-dom/server` + parsed DOM | Unit-test render idiom | All new UI tests (locked Phase-2 idiom, no `@testing-library/react`) |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Generated `search_text` + trgm GIN | `.or('first_name.ilike.%q%,last_name.ilike.…')` | OR'd per-column filters cannot use an index for `%q%`, cannot search DOB as text, and every user comma breaks PostgREST `.or()` parsing (injection into the filter grammar). Rejected. |
| Per-org MRN counter table | Global Postgres sequence | A global sequence leaks cross-org cardinality into MRNs (org B's first patient ≠ MRN-0001). Counter-in-trigger with advisory lock keeps MRN strictly per-org. Rejected the sequence. |
| Client-side filter of a full fetch | Server-side queries (D-18/D-20 locked) | Sends the whole org's patient list to the browser — a PHI minimization failure. Rejected. |
| Popover/menu primitive for quick actions | Reuse `Overlay` (modal/sheet) | A new popover primitive needs its own a11y contract (02-CONTEXT D-22 discipline); `Overlay` already ships the full contract. Rejected inventing a primitive. |

</standard_stack>

<architecture_patterns>
## Architecture Patterns

### Data flow (primary use case: "find a patient")

```
URL (?q=&filter=&d=&shown=)                     [client: debounce 300ms, tab clicks]
  └─> /provider page.tsx (RSC) await searchParams   [server]
        └─> resolveWorkspaceRole('provider')        [server — role + orgId, Phase 3]
              └─> listPatients({orgId, q, filter, day, limit})   [src/lib/patients/queries.ts]
                    └─> supabase.from('patients') … .ilike('search_text', …).range(…)   [RLS enforced]
                          └─> <FolderGrid> (RSC) → <FolderCard> (RSC) + client islands (kebab, search)
```

### Recommended project structure (new files)

```
src/lib/patients/
├── schemas.ts        # Zod: createPatientSchema, changePatientStatusSchema, listQuerySchema
├── queries.ts        # listPatients(...) — filter/search/pagination, limit+1 "has more"
└── actions.ts        # createPatientAction, changePatientStatusAction, sendPatientInviteAction ('use server')
src/components/patients/
├── FolderGrid.tsx            # grid + empty states + Load more (RSC shell)
├── FolderCard.tsx            # one folder (RSC; kebab slot filled by 04-04)
├── RetrievalControls.tsx     # SegmentedControl filter tabs + result count (client)
├── ProviderSearchControl.tsx # debounced search → router.replace (client)
├── NewPatientControl.tsx     # accentSoft CTA + Overlay form (client; 04-04)
└── QuickActionsOverlay.tsx   # status picker / invite / disabled schedule (client; 04-04)
supabase/migrations/0005_patients.sql
supabase/tests/0005_rls_patients.test.sql
```

### Pattern 1: Trigger-owned MRN (D-07)

**What:** `mrn_seq integer` is set by a BEFORE INSERT trigger under a per-org advisory lock; `mrn text` is a **stored generated column** built from it. Race-safe per-org, zero app involvement.
**When to use:** Any sequential identifier whose uniqueness scope is the organization.

```sql
-- supabase/migrations/0005_patients.sql (shape — the plan carries the full text)
alter table public.patients
  add column mrn_seq integer not null,
  add column mrn text generated always as ('MRN-' || lpad(mrn_seq::text, 4, '0')) stored;

create function private.assign_patient_mrn() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  perform pg_advisory_xact_lock(2004, hashtext(new.org_id::text));
  select coalesce(max(mrn_seq), 0) + 1 into new.mrn_seq
  from public.patients where org_id = new.org_id;
  return new;
end; $$;

create unique index patients_org_mrn_seq_uq on public.patients (org_id, mrn_seq);
```

The trigger **always** overwrites `mrn_seq` (clients never supply it — D-07: "the provider never types it").
Note: Postgres generated columns may not reference other generated columns, so `search_text` inlines the
`'MRN-' || lpad(mrn_seq::text, 4, '0')` expression rather than referencing `mrn`.

### Pattern 2: Generated `search_text` + trgm GIN (D-17, D-18, UX-07)

**What:** One stored generated column + one GIN index; the query is a single `ilike` with escaped wildcards.
**When to use:** Every multi-field free-text lookup over PostgREST.

```sql
create extension if not exists pg_trgm;

alter table public.patients add column search_text text
  generated always as (
    lower(
      first_name || ' ' || last_name || ' ' ||
      'MRN-' || lpad(mrn_seq::text, 4, '0') || ' ' ||
      coalesce(phone, '') || ' ' || dob::text
    )
  ) stored;

create index patients_search_text_trgm_idx
  on public.patients using gin (search_text gin_trgm_ops);
```

```ts
// src/lib/patients/queries.ts — the ONLY place user text meets PostgREST
function escapeLike(input: string): string {
  return input.replace(/[\\%_]/g, (m) => `\\${m}`);
}
// …supabase.from('patients').ilike('search_text', `%${escapeLike(q.toLowerCase())}%`)
```

DOB search works as text (`1990`, `1990-05-12`) because `dob::text` is ISO `YYYY-MM-DD` inside `search_text`.

### Pattern 3: Server page state via URL searchParams (D-11, D-18..D-20)

**What:** `/provider/page.tsx` is an async Server Component; `searchParams` is awaited (Next 15/16 Promise
shape — exact precedent `src/app/(auth)/login/page.tsx:27-31`). Client islands write state with
`router.replace(..., { scroll: false })`. The client also passes its **local calendar day** as `d=YYYY-MM-DD`
when `filter=today` so "Today" is the clinic's day, not UTC's (D-14).

### Pattern 4: Extend `redeem_invite` for the patient auto-link (D-04)

`invitations` gains nullable `patient_id uuid references public.patients(id)`;
`public.redeem_invite` (migration 0004, `create or replace`) gains — inside the same transaction it already runs:

```sql
  if v_invitation.patient_id is not null then
    update public.patients
    set user_id = v_uid, last_activity_at = now()
    where id = v_invitation.patient_id
      and user_id is null;          -- first link wins; never steal an existing link
  end if;
```

The function is `security definer`, so it can write `patients.user_id` regardless of the inviter's RLS —
the link is minted by the invite authority, not by a row policy. The return JSON extends additively
(`patientLinked: boolean`) so the existing `redeemSignupWithInviteAction` contract does not break.

### Anti-Patterns to Avoid

- **App-side MRN via `count(*)+1`** — two concurrent creates collide; the unique index then 500s a create.
  Use the trigger.
- **`updated_at` / `last_activity_at` written from server actions** — the invite-sent bump (D-22) would be
  one forgotten call site away from stale data. Trigger-owned (mirror migration 0003's doctrine).
- **Rebuilding the folder card as a client component** — the grid renders dozens of cards; client components
  for every card buy nothing. Cards are RSCs; only the kebab/menu island is client.
- **`getSession()` anywhere** — identity is `getClaims()` only (locked Phase-3 rule; `auth-capabilities`
  and the 03-01 acceptance grep enforce it).
- **Deleting the Phase-2 `EmptyState` copy from `/provider`** — it becomes the "All empty" filter state,
  not dead code (02-UI-SPEC §9.1's copy is already the exact empty string D-context expects).

</architecture_patterns>

<dont_hand_roll>
## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| New-patient form + quick-action dialogs | A popover/menu primitive | `Overlay` (02-CONTEXT D-22/D-23: one primitive, modal/sheet variant) | Full a11y contract already shipped and tested (`useFocusTrap`, `useScrollLock`) |
| Filter tabs | A custom pill row | `SegmentedControl` (label-only `TabBar`, `INSET_FILL` shared with search) | Locked pill-control grammar (§2.4); shares the D-27 gate-selected fill |
| Search input | A styled `<input>` | `CompactControl variant="search"` (`onValueChange` already exists) | Token-pure, 44px/32px contract, sr-only label already handled |
| Empty / error / loading states | Per-page markup | `EmptyState`, `StateVariant`, `LoadingSkeleton` (Phase 3 UX-01 baseline) | The phase baseline every later phase honors |
| Status pill | A colored badge | `Pill` + one recorded tone extension (`critical`, D-10) | Tone paints only the dot; label text carries meaning — the repo's color-accessibility rule |
| Server mutation plumbing | Ad-hoc fetch endpoints | `'use server'` actions with Zod-then-capability checks (03-PATTERNS `actions.membership.ts` shape) | The established RESULT-type pattern incl. `forbidden` |

</dont_hand_roll>

<common_pitfalls>
## Common Pitfalls

### Pitfall 1: PostgREST `.or()` grammar injection
**What goes wrong:** User search text containing `,` `(` `)` silently alters the filter grammar of `.or()`.
**Why:** PostgREST parses the `or=(...)` string as a query language, not as values.
**How to avoid:** Never build `.or()` from user input. Pattern 2's single `ilike` on `search_text` sidesteps it;
still escape `%`, `_`, `\` in the value.
**Warning signs:** Search results that ignore the typed text, or PostgREST 400s on odd queries.

### Pitfall 2: Next 15/16 `searchParams` is a Promise
**What goes wrong:** `const { q } = searchParams` yields `undefined`/type errors.
**Why:** App Router made `searchParams`/`params` async in 15+; this repo awaits it (login page precedent).
**How to avoid:** `const params = await searchParams;` and normalize `string | string[]` to `string`.
**Warning signs:** Filter state that never changes the grid.

### Pitfall 3: Offset pagination drift under inserts
**What goes wrong:** "Load more" skips or repeats rows when patients are created mid-browse.
**Why:** `.range(offset, …)` is positional.
**How to avoid:** Acceptable at 20–30/page for Phase 4 (ordered by `last_activity_at desc, id desc` with
`id` as tiebreak for stable order); document keyset pagination as the growth path. Do not build it now.
**Warning signs:** Duplicate folder cards after creating a patient in another tab.

### Pitfall 4: Generated columns may not reference generated columns
**What goes wrong:** `search_text generated always as (… mrn …)` fails to create.
**Why:** Postgres forbids generated→generated references.
**How to avoid:** Inline the `'MRN-' || lpad(mrn_seq::text, 4, '0')` expression (Pattern 2 does).
**Warning signs:** `ERROR: cannot use generated column "mrn" in column generation expression`.

### Pitfall 5: `ilike` case folding vs `lower()` column
**What goes wrong:** `ilike` on a non-lowercased column is fine, but mixing `lower(col)` in SQL with
un-lowered user input still matches (`ilike` is case-insensitive) — the real risk is *accent*/unicode names.
**How to avoid:** Store `search_text` lowered; pass `q.toLowerCase()`; accepted limitation: no
accent-folding/`unaccent` in Phase 4 (recorded as accepted debt in the plans).
**Warning signs:** "Élodie" not found via "elodie".

### Pitfall 6: RLS UPDATE policies need `with check` as well as `using`
**What goes wrong:** A status change lets a row's `org_id` be rewritten into another org.
**Why:** `using` filters which rows update; only `with check` constrains the new row.
**How to avoid:** Both clauses on every UPDATE policy (migration 0002's own comment warns: "Pitfall 9").
**Warning signs:** pgTAP cross-org tests must cover UPDATE, not only SELECT/INSERT.

### Pitfall 7: Bumping `last_activity_at` from the action layer
**What goes wrong:** The invite-sent bump (D-22) is skipped by one call path.
**How to avoid:** Triggers own all timestamp maintenance (Pattern in 04-CONTEXT D-22 + migration 0003 doctrine);
actions never write `updated_at`/`last_activity_at`/`mrn` columns.

### Pitfall 8: Hydration mismatch on relative dates
**What goes wrong:** "3 days ago" renders differently server vs client, or flips daily — flaky visual baselines.
**How to avoid:** Absolute dates (`12 Mar 2026`, `tabular-nums`) everywhere on cards; any `now()`-derived
region gets Playwright `mask` in the visual plan (Phase 3 03-08 precedent).

</common_pitfalls>

<code_examples>
## Code Examples

Verified shapes from THIS repository (authoritative over web docs for this codebase):

### Zod schema outside the `'use server'` module (03-PATTERNS, `src/lib/auth/invite.ts:60-88`)
```ts
// schemas live here (not inside the 'use server' actions file) because a
// 'use server' module may only export async functions.
export const createPatientSchema = z.object({ /* … */ });
```

### Server action shape (`src/lib/auth/actions.membership.ts:83-113`)
```ts
export async function createPatientAction(input: unknown): Promise<PatientActionResult> {
  const parsed = createPatientSchema.safeParse(input);
  if (!parsed.success) return { ok: false, kind: 'invalid' };
  const actor = await resolveOrgRole(parsed.data.orgId ?? await currentOrgId());
  if (!actor || !runsCapability(actor.role, CAN_MANAGE_PATIENTS)) return { ok: false, kind: 'forbidden' };
  // insert … then revalidatePath('/provider')
}
```

### Overlay usage (`src/app/(provider)/provider/members/remove-member-overlay.tsx`)
```tsx
'use client';
const [open, setOpen] = useState(false);
// …
<Overlay open={open} onClose={() => setOpen(false)} title={heading} description={consequence} footer={<Button …/>}>
  {children}
</Overlay>
```

### Awaited searchParams (`src/app/(auth)/login/page.tsx:27-31`)
```tsx
export default async function Page({ searchParams }: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
```

### Unit-test idiom (`tests/unit/membership-surface.test.tsx`)
```ts
vi.mock('server-only', () => ({}));
vi.mock('@/lib/supabase/server', () => ({ createClient: async () => ({ /* harness */ }) }));
// renderToStaticMarkup + parse5-style DOM assertions on exact strings
```

</code_examples>

<sota_updates>
## State of the Art

Nothing in this phase's blast radius has changed recently; the pinned stack (Next 16.3.8, supabase-js
2.117.2, Zod 4.6.x) is current. No SOTA deltas to plan around.

| Old Approach | Current Approach | Impact |
|--------------|------------------|--------|
| `middleware.ts` for auth | `src/proxy.ts` (Next 16 convention) | Already landed Phase 3 — this phase never touches it |
| Route-handler CRUD APIs | Server actions + `revalidatePath` | Already the Phase-3 pattern; reuse |
| JSON blob patient records | Relational `patients` + RLS (§13) | Locked |

</sota_updates>

<open_questions>
## Open Questions

**Resolution status (plan-checker D11):** Q1/Q2 → RESOLVED-AT-GATE (adjudicated by the 04-05 Task 3 owner design gate; the plans carry the brief, never a fabricated verdict). Q3 → RESOLVED (client-local `d=YYYY-MM-DD` day window, 04-02/04-03). Q4 → RESOLVED (CAN_MANAGE_MEMBERSHIP not widened; invite row hidden, not disabled — 04-02/04-04).

1. **INV-04 wording vs D-10 `critical` mapping (design-gate item)**
   - What we know: D-10 (locked, this phase) maps `critical` status → the frozen `critical` token; `ui-invariants.md` INV-04's objective check says status encoding is a subset of `success`/`info`/`warning`.
   - What's unclear: whether the frozen governance wording was written before the 5-status model existed (Phase 1 knew only Normal/Pending/Follow-up from the reference image).
   - Recommendation: implement D-10 (user decision is specific, later and clinically necessary — a critical patient must not wear the follow-up amber), extend `Pill` with a `critical` tone citing D-10 as the recorded decision its comment demands, and **flag the letter-violation of INV-04's objective check at the §20.4 owner design gate** in 04-UI-SPEC's Reviewer Items. Do not silently "fix" either document.

2. **INV-11 letter vs the 2px status line**
   - What we know: §4 binds "subtle semantic pills riding thin progress lines"; the reference bar renders a few px; INV-11 caps *rules, dividers and axis lines* at 1px.
   - Recommendation: render the status line at 2px (`h-0.5`, rounded) and declare it a **status indicator, not a rule/divider** in the UI-SPEC; flag at the same design gate.

3. **"Today" timezone (D-14)**
   - Resolved in-pattern: the retrieval control passes the client's local calendar day `d=YYYY-MM-DD` in the URL; the query window is that local day. No org-timezone table in Phase 4.

4. **`sendPatientInviteAction` capability for nurse/receptionist**
   - What we know: Phase 3 gated invite creation behind `CAN_MANAGE_MEMBERSHIP` (provider_doctor + admin_owner).
   - Recommendation: the "Send invite" quick action renders only when the resolved role holds `CAN_MANAGE_MEMBERSHIP` (server-known); hidden, not disabled, for other roles. No capability is widened.

</open_questions>

<sources>
## Sources

### Primary (HIGH confidence — repository-verified)
- `supabase/migrations/0001..0004` — schema, RLS, audit triggers, definer functions: the SQL idioms this phase extends verbatim
- `src/lib/auth/actions.membership.ts`, `src/lib/auth/invite.ts`, `src/lib/auth/workspace.ts`, `src/lib/auth/capabilities.ts` — action/schema/resolution/capability patterns
- `src/components/primitives/*`, `src/components/overlays/Overlay.tsx`, `src/components/state/*` — the complete UI kit this phase composes
- `docs/governance/reference-ui-specification.md` §4 + `docs/reference/provider-home-primary.jpg` — binding folder-grid grammar (inspected)

### Secondary (MEDIUM confidence — established Postgres/PostgREST behavior)
- Postgres `GENERATED … STORED` column rules (no generated→generated references) — stable since PG12
- `pg_trgm` GIN + `ilike '%q%'` index-assisted matching — Supabase-supported extension
- supabase-js `.range()`/`.ilike()` semantics — long-stable v2 API

</sources>

<metadata>
## Metadata

**Research scope:** patients schema/RLS/triggers, search+filter+pagination layer, invite auto-link, folder-grid UI composition
**Confidence breakdown:** Data model: HIGH (repo idioms) · Query layer: HIGH · UI: HIGH (all primitives exist) · Visual grammar: HIGH (binding reference inspected this session)
**Research date:** 2026-10-08 · **Valid until:** 2026-11-08
</metadata>

---

*Phase: 04-provider-home-patient-folder-workspace*
*Research completed: 2026-10-08*
*Ready for planning: yes*
