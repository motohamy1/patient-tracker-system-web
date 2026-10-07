---
phase: 03-authentication-organizations-rbac-and-rls
plan: 05
subsystem: auth-memberships
tags: [invite-token, redeem, definer-functions, rls, members-surface, create-org, server-actions, no-leak]
requires:
  - 03-01 (local Supabase stack, config.toml redirect allowlist, Mailpit)
  - 03-02 (migrations 0001-0003, memberships SELECT r2 policy, audit triggers)
  - 03-03 (RBAC vocabulary, resolveWorkspaceRole/redirectForRole, denial grammar)
  - 03-04 (Zod credential actions, PKCE confirm, Mailpit flows)
  - Phase 02 (primitives: Surface, Button, Pill, EmptyState, Overlay, CompactControl, INSET_FILL)
provides:
  - src/lib/auth/invite.ts (createInviteToken/assertValidInviteToken/digestOf/lastAdminGuard + membership Zod tables)
  - src/lib/auth/actions.membership.ts (createOrgAction, createInviteAction, redeemSignupWithInviteAction, removeMemberAction)
  - supabase/migrations/0004_invite_redeem.sql (redeem_invite, remove_membership, preview_invite, list_org_members definers + bootstrap_org_membership trigger)
  - src/app/(auth)/invite/[token] (public signup-then-join surface)
  - src/app/(provider)/provider/onboarding/create-org, /provider/members (members-list, invite-creator, remove-member-overlay)
  - tests/unit/auth-invite.test.ts, tests/unit/membership-surface.test.tsx
affects:
  - 03-06 (pgTAP acceptance suite diffs against 0004 definers + pgTAP proves guard behavior)
tech-stack:
  added: []
  patterns: [Zod-first server actions, security-definer definer functions with SQL-side guards, one-action signup+redeem, public-preview definer for RLS-gated invitations, organizations-insert definer trigger for the owner bootstrap row, constant-copy denial surfaces]
key-files:
  created:
    - src/lib/auth/invite.ts
    - src/lib/auth/actions.membership.ts
    - supabase/migrations/0004_invite_redeem.sql
    - src/app/(auth)/invite/[token]/page.tsx
    - src/app/(auth)/invite/[token]/invite-signup-form.tsx
    - src/app/(provider)/provider/onboarding/create-org/page.tsx
    - src/app/(provider)/provider/members/page.tsx
    - src/app/(provider)/provider/members/members-list.tsx
    - src/app/(provider)/provider/members/invite-creator.tsx
    - src/app/(provider)/provider/members/remove-member-overlay.tsx
    - tests/unit/auth-invite.test.ts
    - tests/unit/membership-surface.test.tsx
    - tests/unit/stubs/server-only.ts
  modified:
    - src/lib/supabase/database.types.ts (regenerated after each 0004 landing — redeem_invite/remove_membership/preview_invite/list_org_members in the Functions map)
    - vitest.config.ts (server-only alias to the tests stub)
decisions:
  - redeemSignupWithInviteAction runs signup → signInWithPassword → redeem_invite RPC in one server action, so a session exists on the redeem call and a failed/expired token collapses to the same neutral 'invite' kind (no half-complete signup can join an org; 03-04 email-confirm templates already point the confirm endpoint back at /invite/[token])
  - preview_invite returns null for every invalid/expired/used/unknown token with no org identity beyond the valid-sentence fields, so the public page cannot leak token existence
  - lastAdminGuard ships as the advisory TS predicate only; remove_membership(uuid) re-verifies same-org + admin_owner + last-admin inside SQL (the only legal delete path — 0002 granted no memberships delete)
  - the owner bootstrap row is created by a security-definer trigger on organizations INSERT rather than a second app-write, and the 0003 audit trigger picks up the row (AUTH-06 at the data layer)
metrics:
  duration: ~29 min
  completed: 2026-10-07
  tasks: 3
  files: 15
status: complete
---

# Phase 03 Plan 05: Invite Token Engine + Membership Onboarding Summary

**One-paragraph description:** Invite tokens minted as 32-byte base64url raw strings with SHA-256 digests stored, a public `/invite/[token]` signup-then-join surface that redeems atomically in ONE server action via security-definer SQL, an owner org-creation bootstrap guarded unaffiliated-only, and a members surface with invite creation + the removal overlay — all capability-gated and audit-triggered.

## Completed Tasks

| Task | Name | Type | Commit | Files |
| ---- | ---- | ---- | ------ | ----- |
| 1 | Invite token engine + membership server actions + 0004 redeem migration | auto | `330c925` | invite.ts, actions.membership.ts, 0004 sql, database.types.ts, auth-invite.test.ts |
| 1b | preview_invite definer (public lookup) | auto | `6c71378` | 0004 sql, database.types.ts |
| 1c | list_org_members definer (email surface) | auto | `9f2eb66` | 0004 sql, database.types.ts |
| 1d | bootstrap_org_membership trigger | auto | `bc5d880` | 0004 sql |
| 2 | Public invite redeem route (signup-then-join) | auto | `29fb988` | invite page + form, membership-surface.test.tsx |
| 3 | Owner org-creation + members surface + removal overlay | auto | `5692b94` | create-org page, members page/list/invite-creator/overlay, vitest.config.ts, stubs, tests |

## Key results

- **Token engine:** `createInviteToken()` returns raw (base64url, 43 chars) + digest (sha256 hex); raw token appears only in the invite URL and the owner's one-time result panel; same raw → same digest asserted; hostile strings (`../../etc/passwd`) rejected by the Zod tables BEFORE any DB call.
- **Atomic redeem:** `redeemSignupWithInviteAction` = Zod parse → `auth.signUp` → `auth.signInWithPassword` (establishes the authenticated context the definer function needs) → `supabase.rpc('redeem_invite')`; every failure path collapses to the same neutral `'invite'` kind. The `redeem_invite` body inserts the membership AND stamps `redeemed_at`/`redeemed_by` in one implicit transaction.
- **No-leak public surface:** `/invite/[token]` is `force-dynamic` and sessionless: format check → `preview_invite` RPC (anon-granted, definer) → exact-valid sentence `'You have been invited to join {organization} as {role}.'` OR the constant-denial `EmptyState` (title 'This invite is no longer valid.' + body 'Ask your organization owner to send a new one.'). Format miss, empty preview, DB failure, expired/used/unknown token all render identically.
- **Owner-only delete authority:** `removeMemberAction` resolves claims → membership → role (admin_owner + CAN_MANAGE_MEMBERSHIP required), advisory lastAdminGuard pre-check, then `supabase.rpc('remove_membership')`. The SQL function re-verifies same-org, admin_owner, and the last-admin guard, and is the ONLY delete path (0002 granted no memberships delete). The 0003 DELETE trigger audits it.
- **Owner bootstrap:** `createOrgAction(name)` inserts the organization (RLS with-check enforces `created_by = auth.uid()`); the security-definer `bootstrap_org_membership` trigger immediately writes the `admin_owner` membership row and the 0003 audit trigger records it; smoke-proven against the live local stack (insert org → memberships row appears) and the DB was reset clean afterwards.
- **Members surface:** page-level `CAN_MANAGE_MEMBERSHIP` gate (redirect to own workspace otherwise), `list_org_members` definer RPC returning email+role rows, `MembersList` rows = email text + role `Pill` chip + Remove control (no avatars/initials/gradients), `InviteCreator` with the five canonical role labels as a CompactControl rangeToggle strip, copyable result panel (`aria-label="Copy invite link"`, success-dot pip + `aria-live="polite"` announce, short code, optional `'This link expires on {date}.'` line), and the contract-exact removal Overlay (`'Remove {name}'`, `'They will lose access to this workspace immediately.'`, confirm labeled `'Remove'`).
- **Migration pushed:** `supabase db reset` applied 0001→0004 cleanly three times (after each 0004 iteration); both primary functions exist with `security definer` + `set search_path = ''` verified via `pg_proc` query; types regenerated into `database.types.ts` each time.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Auto-add] `preview_invite` security-definer function**
- **Found during:** Task 2 build
- **Issue:** The public page reads `invitations` for the valid sentence, but RLS grants invitations SELECT only to org managers — an unauthenticated device can never resolve a valid invite via a direct table read.
- **Fix:** Added `preview_invite(text)` (definer, search_path='', returns only org name + role or null), granted to anon + authenticated, in migration 0004; `6c71378`.

**2. [Rule 2 - Auto-add] `list_org_members` security-definer function**
- **Found during:** Task 3 build
- **Issue:** The members surface needs co-member emails, but `auth.users` is not readable through RLS — the direct table cannot supply email rows.
- **Fix:** Added `list_org_members(uuid)` (definer; caller must hold admin_owner/provider_doctor in the target org; anon/public EXECUTE revoked), in migration 0004; `9f2eb66`.

**3. [Rule 2 - Auto-add] `bootstrap_org_membership` trigger**
- **Found during:** Task 3 build (create-org flow trace)
- **Issue:** `createOrgAction` inserts the organizations row only; with no memberships INSERT grant/policy (0002), the org creator could never receive their own admin_owner row — the D-01 owner journey dead-ended unless bootstrap happened elsewhere.
- **Fix:** Security-definer AFTER INSERT trigger on organizations writes the admin_owner row for `created_by`; the 0003 audit trigger captures it; smoke-proven in-DB; `bc5d880`.

**4. [Rule 3 - Blocking] `server-only` package unresolved in the jsdom test project**
- **Found during:** Task 3 test run
- **Issue:** `tests/unit/membership-surface.test.tsx` imports a page that pulls in `workspace.ts`, which imports the uninstalled `server-only` package; the jsdom vite transform fails even with `vi.mock` (node project was unaffected).
- **Fix:** Added `resolve.alias['server-only']` → `tests/unit/stubs/server-only.ts` in vitest.config.ts (same recurring include-gap pattern as 02-09/03-03); `5692b94`.

**5. [Rule 1 - Copy collision] Overlay contract source assertion dodge**
- **Found during:** Task 3 test iteration
- **Issue:** The test asserts the overlay file contains no 'OK'/'Cancel' strings, and my own header comment carried "never OK/Cancel", tripping the assertion.
- **Fix:** Reworded the header comment ("never the generic confirm word"); `5692b94`.

## Authentication Gates

None — every Supabase interaction ran against the local 127.0.0.1:54321 stack; no hosted-target credentials or human auth step were required.

## Known Stubs

None — every delivered control is wired: invite creation produces a real raw token + digest write, removal calls the RPC, org creation inserts the row (trigger-completed), the invite page's redeem action runs the definer function.

## Threat Flags

None beyond the plan's `<threat_model>` — the three definer additions (`preview_invite`, `list_org_members`, bootstrap trigger) are RLS-consistent: preview returns only org name + role for valid invites, list gates to CAN_MANAGE_MEMBERSHIP roles, and the trigger writes only the creator's own admin_owner row. `redeem_invite`/`remove_membership` are the plan-sanctioned mutations. No new trust boundaries.

## Verification

- `npx vitest run tests/unit/auth-invite.test.ts` → 14 passed
- `npx vitest run tests/unit/membership-surface.test.tsx` → 18 passed
- Full unit suite `npx vitest run` → 23 files, 256 tests passed
- `npm run lint` → exit 0; `npx tsc --noEmit` → exit 0
- `supabase db reset` → 0001–0004 applied cleanly (three runs)
- `supabase db query` → pg_proc shows both primary definers `prosecdef=true`, `proconfig=[search_path=""]`; bootstrap trigger smoke row proves admin_owner membership materialization on org insert
- Node assert: migration 0004 contains `redeem_invite`, `remove_membership`, `security definer`, `set search_path`, `auth.uid()`, `audit`

## Self-Check: PASSED

## Decisions Made

- Four migration additions beyond the plan's literal artifact list, each Rule 2-auto-added and documented above.
- Server-action result unions keep redeem failures on ONE neutral kind so the invite flow never probes token existence in UI copy.
