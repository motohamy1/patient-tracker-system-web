# Phase 4: Provider Home + Patient Folder Workspace - Pattern Map

**Mapped:** 2026-10-08
**Files analyzed:** 24 (Phase-2 primitives + shell, Phase-3 auth/RLS/actions, migrations 0001–0004, tests idioms, visual harness)
**Analog coverage:** 10/10 categories — this phase is almost entirely *patterned* work (unlike Phase 3's greenfield half). The only no-analog files are the SQL migration (extends 0001–0004 idioms, so "role-match") and `queries.ts` (first query-builder module).

**Critical finding for the planner:** every UI file composes existing primitives; every server file copies an established 03-PATTERNS shape; the SQL extends migration 0001–0004 verbatim idioms (definer helper, grants-revoke-then-grant, `security set search_path = ''`, trigger-per-table audit). Do not let any new file invent conventions — the header-comment discipline (every file opens with a `//`/`--` block citing decision IDs and governance source) applies to ALL new files.

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `supabase/migrations/0005_patients.sql` | migration | CRUD | `0001_org_membership.sql` (table+index), `0002_rls.sql` (helper/grants/policies), `0003_audit.sql` (trigger-per-table) | role-match (compose the three) |
| `supabase/tests/0005_rls_patients.test.sql` | test | CRUD | `0004_rls_cross_org_acceptance.test.sql` | exact |
| `src/lib/supabase/database.types.ts` (REGEN) | generated contract | — | itself (03-02 flow: `supabase gen types typescript`) | exact |
| `src/lib/patients/schemas.ts` | model | transform | `src/lib/auth/invite.ts` (Zod outside `'use server'`) | exact |
| `src/lib/patients/queries.ts` | service | request-response (DB query) | `src/lib/auth/workspace.ts` (server query module) | role-match |
| `src/lib/patients/actions.ts` | service | CRUD | `src/lib/auth/actions.membership.ts` | exact |
| `src/lib/auth/actions.membership.ts` (MODIFY — patient-linked invite) | service | CRUD | itself (`createInviteAction`) | exact |
| `src/lib/auth/capabilities.ts` (MODIFY) | model/config | transform | itself (tuple + map + predicate) | exact |
| `src/app/(provider)/provider/page.tsx` (REWRITE body) | component | request-response | itself (RSC shell) + `src/app/(auth)/login/page.tsx` (searchParams Promise) | role-match |
| `src/components/patients/FolderCard.tsx` | component | request-response | `src/components/primitives/Surface.tsx` + `Pill.tsx` composition | role-match |
| `src/components/patients/FolderGrid.tsx` | component | request-response | `src/components/state/StateVariant.tsx` / `LoadingSkeleton.tsx` usage in 03 surfaces | role-match |
| `src/components/patients/RetrievalControls.tsx` | component | event-driven | `src/components/primitives/TabBar.tsx` `SegmentedControl` | exact |
| `src/components/patients/ProviderSearchControl.tsx` | component | event-driven | `src/components/primitives/CompactControl.tsx` `SearchControl` (`onValueChange` exists) | exact |
| `src/components/patients/NewPatientControl.tsx` | component | CRUD | `src/app/(provider)/provider/members/invite-creator.tsx` (client form + action + result) + `remove-member-overlay.tsx` (Overlay host) | exact |
| `src/components/patients/QuickActionsOverlay.tsx` | component | CRUD | `src/app/(provider)/provider/members/remove-member-overlay.tsx` | exact |
| `src/components/primitives/Pill.tsx` (MODIFY — `critical` tone) | primitive | — | itself (TONE_DOT map; D-10 is the recorded decision its comment demands) | exact |
| `tests/unit/patient-*.test.ts(x)` | test | transform/UI | `tests/unit/membership-surface.test.tsx`, `tests/unit/auth-capabilities.test.ts` | exact |
| `tests/visual/*` (surface additions) | test | request-response | `tests/visual/surfaces.spec.ts` + `auth.ts` storageState fixture | exact |

---

## Pattern Assignments

### SQL: migration 0005 composition (0001 + 0002 + 0003 idioms)

Copy these verbatim shapes:

```sql
-- header comment citing D-xx + AUTH + §13 (0001 lines 1-16 style)
create table public.patients ( … );                       -- 0001's column discipline
create index … on public.patients using btree (…);        -- Pitfall-8 style (policy-filter column gets its index)

-- definer helper is NEVER re-invented: reuse private.user_org_role(uuid) from 0002
create policy "select patients as staff-or-self" on public.patients
for select to authenticated
using (
  (select private.user_org_role(org_id)) in ('provider_doctor','nurse','receptionist','admin_owner')
  or user_id = (select auth.uid())
);

-- grants: revoke all, re-grant only what is needed (0002 Pitfall 6)
revoke all on public.patients from anon, authenticated, service_role;
grant select, insert, update on public.patients to authenticated;
-- NO delete grant/policy: patient deletion is not a product action in Phase 4 (audit-safety)

-- UPDATE policies carry BOTH using and with check (0002 Pitfall 9)
-- audit trigger mirrors 0003's private.audit_*_change + trigger pair, extended to patients
-- (03-CONTEXT D-14: "Every later clinical phase extends the same trigger pattern to its tables")
```

MRN + timestamp triggers follow `04-RESEARCH.md` Pattern 1 (advisory lock + generated column;
**generated columns may not reference generated columns** — inline the MRN expression in
`search_text`). `updated_at`/`last_activity_at` are trigger-owned (0003's doctrine: a missed code
path must not mean a missing entry).

### Server action shape — `src/lib/patients/actions.ts`

Copy `src/lib/auth/actions.membership.ts` structure exactly:

```ts
'use server';
// header comment citing D-01/D-06/D-13/D-22 + PROV-04
export type PatientActionResult = …; // union incl. 'forbidden' | 'invalid' | 'error'

export async function createPatientAction(input: unknown): Promise<PatientActionResult> {
  const parsed = createPatientSchema.safeParse(input);       // Zod FIRST (STACK)
  if (!parsed.success) return { ok: false, kind: 'invalid' };
  const actor = await resolveOrgRole(orgId);
  if (!actor || !runsCapability(actor.role, CAN_MANAGE_PATIENTS)) return { ok: false, kind: 'forbidden' };
  // supabase.from('patients').insert({ … }) — never touch mrn/mrn_seq/updated_at/last_activity_at
  revalidatePath('/provider');
  return { ok: true, … };
}
```

`sendPatientInviteAction` reuses `createInviteToken()`/`digestOf()` from `src/lib/auth/invite.ts`
and inserts into `invitations` **with `patient_id`** (D-04); capability gate stays
`CAN_MANAGE_MEMBERSHIP` (04-RESEARCH Open Question 4 — do not widen). The redeem-side link is
migration-side (`redeem_invite` `create or replace`, 0004's function extended additively).

### Capability map extension — `src/lib/auth/capabilities.ts`

The file's contract: one tuple `CAN_CERTIFIED`, constants, `ROLE_CAPABILITIES`, one predicate.
Add `CAN_MANAGE_PATIENTS` to the tuple + a constant + the four staff roles' sets (patient's set
stays observation-only — the file's AUTH-07 comment must remain true). The audit test
`tests/unit/auth-capabilities.test.ts` diffs literals against migrations — extend both sides
together or the test fails.

### Page composition — `/provider`

```tsx
// RSC. searchParams awaited (login page precedent):
export default async function ProviderHomePage({ searchParams }: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;            // normalize string | string[] → string
  const resolution = await resolveWorkspaceRole('provider'); // { orgId, role } (workspace.ts)
  const rows = await listPatients({ orgId, q, filter, day, limit }); // queries.ts
  // render: RetrievalControls (client island) + FolderGrid (RSC) + NewPatientControl island
}
```

`revalidatePath('/provider')` after every mutation refreshes the grid (D-06: the provider stays on
the page; the card simply appears).

### Client islands — the ONLY client files

| File | Why client |
|------|-----------|
| `ProviderSearchControl.tsx` | debounce timer + `router.replace` |
| `RetrievalControls.tsx` | `onValueChange` → URL |
| `NewPatientControl.tsx` | overlay open state + form state + action call |
| `QuickActionsOverlay.tsx` | overlay open state + action calls |

Everything else — cards, grid, page — is a Server Component. Do **not** mark a card client for a
hover effect; use CSS.

### Overlay grammar — copy `remove-member-overlay.tsx`

`'use client'`, `useState` open/pending/error, `<Overlay open onClose title description footer>`,
confirm button labeled with the clinical verb (§7), `router.refresh()` on success. The quick-actions
surface is the same skeleton with rows instead of a confirm pair.

### Test idioms

- Unit: `renderToStaticMarkup` + DOM assertions, `vi.mock('server-only')`, `vi.mock('@/lib/supabase/server')` harness (membership-surface.test.tsx's hoisted harness object), `vi.mock('motion/react')` no-op.
- Capability/SQL drift: `tests/unit/auth-capabilities.test.ts` reads the migration file with `node:fs` and diffs literals — extend its table for `CAN_MANAGE_PATIENTS` and the `patients` status values.
- pgTAP: `supabase/tests/0005_rls_patients.test.sql` mirrors 0004's cross-org acceptance (anon blocked, cross-org zero rows, staff-visible, patient-self-only).
- Visual: `surfaces.spec.ts` block pattern + `AUTH_STATE.owner` storageState; regenerate `provider-home` baselines; new modal surface block per 04-UI-SPEC §Visual Baseline Additions.

---

## Shared Patterns (apply to every new file)

1. **Header comment discipline** — every new file opens with a block citing its D-xx IDs, the requirement IDs it serves, and the governance source (this repo's one sanctioned comment usage).
2. **Token-only styling** — `npm run lint` (check-design-tokens) must stay at 0 violations; cite token names in prose, never hex.
3. **Zod before trust** — every mutation parses with a schema that lives outside the `'use server'` module.
4. **RESULT-type actions** — never throw for expected failures; return `{ ok: false, kind }`.
5. **No `getSession()`** — identity is `getClaims()` only (enforced by existing grep gates).
6. **No delete grants** — destructive paths go through named security-definer functions (0004 doctrine).
7. **Absolute dates** on rendered surfaces (`tabular-nums`), never relative "N days ago" (visual determinism + clinical clarity).
