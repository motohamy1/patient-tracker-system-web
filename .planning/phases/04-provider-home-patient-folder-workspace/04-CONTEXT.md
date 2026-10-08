# Phase 4: Provider Home + Patient Folder Workspace - Context

**Gathered:** 2026-10-08
**Status:** Ready for planning

<domain>
## Phase Boundary

This phase builds the provider home — the primary patient-discovery surface. The hero
interaction is the visual patient-folder collection: a 3-column grid of premium digital
clinical folders with compact search, retrieval controls (Recent, Today, Needs Attention,
Critical), a new-patient entry point, and contextual quick actions. No specialty labels appear
anywhere in the shell.

In scope:
- The `patients` table (Postgres, via Supabase migration) with core identity fields.
- The provider home page at `/provider` replacing the empty shell.
- Patient folder cards in a responsive grid (3 columns at desktop).
- Folder status model (stored enum: Stable, Follow-up, Needs Review, Critical, New).
- Retrieval filter tabs (All, Recent, Today, Needs Attention, Critical) above the grid.
- Server-side search across name, MRN, phone, DOB with debounced input.
- New-patient modal form (reuses Phase 2 Modal/Sheet primitive).
- Contextual quick actions on folder cards (change status, send invite, schedule).
- Server-side pagination for large patient collections.
- RLS policies on the `patients` table (org-scoped).

Out of scope:
- Clinical tables (encounters, medications, labs, vitals, allergies, genetics) — their own phases.
- Appointments / scheduling data model — Phase 7.
- Patient workspace / overview body — Phase 5.
- D3 timeline — Phase 6.
- Patient Home (patient-side) — Phase 13.
- Any specialty labeling, gamification, or client-side role toggles (§27).

</domain>

<decisions>
## Implementation Decisions

### Patient record & new-patient entry

- **D-01:** Clicking "Add New Patient" creates a **patient record only** — no user account.
  The provider fills a modal form; the patient can be invited to sign up later. This matches
  the real clinic workflow where walk-ins get a chart first.
- **D-02:** The new-patient form collects **core identity only**: full name (first + last),
  date of birth, sex (M/F), phone number, and an auto-generated MRN. No email, address, or
  extended demographics in Phase 4.
- **D-03:** The `patients` table carries an **optional `user_id` foreign key**. A patient
  record exists without a user account. When the patient later signs up via a Phase 3 invite,
  the link is made.
- **D-04:** A **quick action to send an invite** exists on the folder card (for unlinked
  patients). It reuses the Phase 3 invite infrastructure and links the invite to the patient
  record so signup auto-connects.
- **D-05:** The new-patient form is a **modal** (reuses Phase 2 `Modal`/`Sheet` primitive).
  The provider fills it inline without leaving the home page.
- **D-06:** After creating a patient, the provider **stays on the home page** and the new
  folder card appears in the grid. No navigation away.
- **D-07:** The MRN is **auto-generated as a sequential ID** (e.g. MRN-0001, MRN-0002).
  The provider never types it.
- **D-08:** Sex field options are **M/F only**.

### Folder status & retrieval semantics

- **D-09:** Folder statuses are a **stored enum on the `patients` table** with five values:
  `stable`, `follow_up`, `needs_review`, `critical`, `new`. The provider sets them manually
  or they get updated by later clinical events (in future phases).
- **D-10:** Status colors map to semantic tokens: `stable` → `success`, `follow_up` →
  `warning`, `needs_review` → `info`, `critical` → `critical`, `new` → `info`. This is the
  concrete enforcement of "never every folder a different saturated color" (Phase 1 D-04).
- **D-11:** Retrieval controls are **activity-based filter tabs** above the folder grid:
  - **Recent** — sorted by `last_activity_at` (most recent first).
  - **Today** — patients created or updated today (upgrades to appointments in Phase 7).
  - **Needs Attention** — status is `follow_up` or `needs_review`.
  - **Critical** — status is `critical`.
  - **All** — shows everything (default).
- **D-12:** The filter tabs **replace the folder grid content** with matching patients.
  Selecting a tab filters the grid; "All" resets to the full list.
- **D-13:** Newly created patients default to status `new`. Providers can manually change
  status via a quick action on the folder card.
- **D-14:** "Today" in Phase 4 means **patients created or updated today** (since no
  appointments table exists yet). Phase 7 upgrades this to scheduled appointments.

### Quick actions & search

- **D-15:** Folder card quick actions: **Open workspace** (primary click), **Change status**,
  **Send invite** (if unlinked), **Schedule appointment** (placeholder for Phase 7).
- **D-16:** The home screen primary CTA is **"Add New Patient"** in `accentSoft` gold
  (Phase 1 D-08).
- **D-17:** Search covers **name (first/last), MRN, phone, and date of birth**.
- **D-18:** Search is **server-side with 300ms debounce**. Results replace the folder grid.
- **D-19:** Search works **within the active filter** — e.g. if "Critical" is selected,
  search only returns critical patients.

### Performance & data model scope

- **D-20:** The folder grid uses **server-side pagination** (20–30 folders per page) with a
  "Load more" button. Search and filters operate server-side.
- **D-21:** Phase 4 creates **only the `patients` table**. No clinical tables (encounters,
  medications, labs, vitals, allergies, genetics). Those come in their own phases.
- **D-22:** A `last_activity_at` timestamp on the patient row tracks recent activity.
  Updated when any related event happens (status change, invite sent, patient created).
- **D-23:** The `patients` table schema: `id`, `org_id`, `user_id` (nullable), `first_name`,
  `last_name`, `dob`, `sex`, `phone`, `mrn`, `status`, `created_at`, `updated_at`,
  `last_activity_at`. Plus RLS policies scoped to `org_id`.

### Claude's Discretion

- Exact MRN sequence format (e.g. `MRN-0001` vs `P-0001` vs numeric-only) — auto-generated
  and zero-padded is sufficient.
- The exact filter tab component shape (pill tabs vs. segmented control) — must use the
  `TabBar` or `Pill` primitive from Phase 2 and follow the pill-control grammar (§2.4).
- Modal form layout and field ordering — follows the reference grammar and copywriting
  contract (§7).
- How "Schedule appointment" quick action manifests (disabled state with tooltip vs. hidden
  until Phase 7) — it must not look like a working feature if it does nothing.
- The empty state for each filter (e.g. "No critical patients" vs. generic empty state).
- The "Load more" button styling and placement.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Product control pack — normative requirements
- `PRODUCT-MASTER-SPEC.md` §5 (Patient Folder Principle — folder grid, status model, retrieval
  controls, the "never every folder a different saturated color" rule), §19 Phase 004 (this
  phase's mandate), §3.3 (no specialty labels in the shell), §27 (hard prohibitions).
- `PRODUCT-MASTER-SPEC.md` §2.1–§2.4 (visual character, color language, geometry, depth).

### Project planning artifacts
- `.planning/REQUIREMENTS.md` — PROV-01, PROV-02, PROV-03, PROV-04, UX-07 (this phase's
  requirements) and the §27 out-of-scope prohibitions.
- `.planning/ROADMAP.md` §Phase 4 — goal, mode, dependencies, four success criteria.
- `.planning/phases/03-authentication-organizations-rbac-and-rls/03-CONTEXT.md` — Phase 3
  decisions (invite infrastructure, capability model, RLS patterns) this phase reuses.
- `.planning/phases/02-foundation-and-app-shell/02-CONTEXT.md` — Phase 2 decisions (route map,
  primitives, token layer, Modal/Sheet) this phase builds on.
- `.planning/research/STACK.md` — Supabase + `@supabase/ssr` pattern, RLS as enforcement layer.

### Governance package — applies to every UI surface this phase renders
- `docs/governance/reference-ui-specification.md` §4 (Provider Home grammar — folder grid,
  status encoding, Critical Alerts, density, pop-out filter panel) and §2 (design-system core).
- `docs/governance/tokens.json` — frozen token values; all new surfaces compose from generated
  token utilities only.
- `docs/governance/ui-invariants.md` — the INV registry governs every new surface.
- `docs/governance/visual-qa-rules.md` — the 12-row visual gate applies to this phase's UI.
- `docs/governance/project-constitution.md` §7 (anti-generic/anti-gamification) and §8 (the
  three machine checks).
- `docs/governance/reference-ui-specification.md` §7 — copywriting contract for form labels,
  empty states, and CTA text.
- `docs/governance/responsive-rules.md` and `docs/governance/motion-rules.md` — band edges,
  44px targets, and the Framer/GSAP split.

### Binding visual reference — design grammar only
- `docs/reference/provider-home-primary.jpg` — provider folder grid, left rail, CTA in
  `accentSoft`, Critical Alerts panel, filter toggles. Layout, geometry, density, and color
  relationships bind. Sample clinical content never binds (§9).

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/components/primitives/` — `Surface` (4 variants), `Button` (4 variants, `accentSoft` primary), `Pill`, `EmptyState`, `CompactControl`, `TabBar` — all compose the folder grid, filter tabs, and modal form.
- `src/components/primitives/Modal` / `Sheet` — the new-patient form and quick-action dialogs.
- `src/app/(provider)/provider/page.tsx` — currently an empty shell; Phase 4 replaces its body.
- `src/app/(provider)/layout.tsx` — already has server-side role resolution; no changes needed.

### Established Patterns
- Server Components own layout-level work; role reads live server-side (Phase 3).
- Token/lint discipline: three machine checks run at lint and prebuild; every file cites token names, never hex.
- Tests are vitest (`tests/unit/**`) rendering with `react-dom/server` + parsed DOM.
- Playwright (`tests/visual/`) guards visuals; new surfaces need baselines.

### Integration Points
- `supabase/migrations/` — new migration for the `patients` table + RLS.
- `src/lib/supabase/database.types.ts` — regenerate after migration.
- `src/app/(provider)/provider/page.tsx` — replace empty shell with the folder grid.
- `src/lib/auth/capabilities.ts` — may need `CAN_MANAGE_PATIENTS` or similar capability.
- `tests/visual/baselines/` — new `provider-home` baselines.

</code_context>

<specifics>
## Specific Ideas

- The folder grid is the **hero interaction** — it must feel premium and tactile, not like a
  generic table or card grid. The reference shows folders floating on `canvas` with `surface`
  lighter than the background, separated by shadow (not border).
- Status encoding is deliberately restrained: thin progress lines, subtle semantic pills.
  The provider should scan patients at a glance without the screen turning into a rainbow.
- The "Add New Patient" CTA uses `accentSoft` gold — this is the provider-home primary CTA
  that the D-08 gate specifically reserved `accentSoft` for.
- Search and filter must **coexist** with the folder grid — they are retrieval controls, not
  a separate page or view.

</specifics>

<deferred>
## Deferred Ideas

- **Appointments / scheduling data model** — Phase 7. The "Today" filter and "Schedule"
  quick action are placeholders until then.
- **Extended patient demographics** (email, address, emergency contact, insurance) — future
  phase or feature expansion.
- **Activity log table** — the `last_activity_at` timestamp is denormalized; a full audit
  trail of patient activity is deferred.
- **Virtualized grid** — server-side pagination is sufficient for Phase 4; virtualization
  can be added if collections grow beyond thousands.
- **Auto-updating status rules** (e.g. overdue follow-up auto-sets `needs_review`) — Phase 4
  uses manual status only; rules-based updates are future work.

</deferred>

---

*Phase: 4-provider-home-patient-folder-workspace*
*Context gathered: 2026-10-08*
