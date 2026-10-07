-- Migration 0002: RLS policies + security-definer membership helper (phase 03, plan 02)
-- AUTH-02 explicit-membership access; AUTH-04 direct DB/API access without
-- membership context yields zero rows / rejected writes; AUTH-05 role-gated
-- mutations at the data layer; D-09/D-10/D-11 role vocabulary and capability
-- boundaries. The check-constraint role strings (migration 0001) are the shared
-- vocabulary mirroring src/lib/auth/roles.ts; the role->operation mapping here
-- mirrors the D-09 capability constants table authored in plan 03-03:
--   CAN_MANAGE_MEMBERSHIP  -> provider_doctor, admin_owner (members-list/invite surfaces)
--   CAN_RETRIEVE_AUDIT     -> admin_owner only (D-15, migration 0003)
-- supabase.com/docs/guides/database/postgres/row-level-security (Patterns 4):
-- definer helper wrapped (select ...) per policy (initPlan); every policy names
-- TO authenticated; auth.uid() guards written (select auth.uid()) IS NOT NULL
-- AND ...; grants revoked then re-granted in the same migration (Pitfall 6 —
-- policies never revoke grants); helper is the ONLY membership reader inside
-- policies (Pitfall 7 recursion rule).
--
-- NO memberships update/delete policy and NO update/delete grant exists: member
-- removal flows exclusively through the migration-0004 security-definer
-- function `remove_membership` (created + pushed in plan 03-05 Task 1, called
-- via RPC by that plan's removeMemberAction). Deleting a membership any other
-- way is impossible: no grant, no policy — the write is denied at the grant
-- level before RLS is even consulted.
--
-- No UPDATE policy anywhere in this migration: organizations name changes are
-- deferred (no update grant below), and memberships/invitations mutations are
-- handled via grant shape and the redeem/removal definer functions — a Phase-3
-- capability that is deliberately not expressible through row policies.
-- UPDATE policies, where ever added, must carry both using and with check
-- (Pitfall 9).

create schema if not exists private;

create function private.user_org_role(p_org_id uuid) returns text
language plpgsql
security definer
set search_path = ''
stable
as $$
  select role from public.memberships m
  where m.user_id = (select auth.uid())
    and m.org_id = p_org_id;
$$;

revoke execute on function private.user_org_role(uuid) from public;
revoke execute on function private.user_org_role(uuid) from anon;
revoke all on schema private from public;
grant usage on schema private to authenticated;

-- grants: revoke all, then re-grant only what each table needs (Pitfall 6)

revoke all on public.organizations from anon, authenticated, service_role;
grant select on public.organizations to authenticated;
grant insert on public.organizations to authenticated;

revoke all on public.memberships from anon, authenticated, service_role;
grant select on public.memberships to authenticated;

revoke all on public.invitations from anon, authenticated, service_role;
grant select on public.invitations to authenticated;
grant insert on public.invitations to authenticated;

alter table public.organizations enable row level security;
alter table public.memberships enable row level security;
alter table public.invitations enable row level security;

-- organizations: member sees own org via the definer helper
create policy "select own organization"
on public.organizations
for select to authenticated
using (
  (select private.user_org_role(id)) is not null
);

-- organizations insert: owner bootstrap only (D-01)
create policy "insert own organization"
on public.organizations
for insert to authenticated
with check (
  (select auth.uid()) is not null and
  created_by = (select auth.uid())
);

-- memberships select: Revision r2 decision — user_id = auth.uid() OR the
-- member-list surface reachable by CAN_MANAGE_MEMBERSHIP roles
-- (provider_doctor, admin_owner); unchanged across 03-02/03-03/03-05/03-06
create policy "select own or managed-membership"
on public.memberships
for select to authenticated
using (
  (select auth.uid()) is not null and
  (
    user_id = (select auth.uid()) or
    (select private.user_org_role(org_id)) in ('admin_owner', 'provider_doctor')
  )
);

-- invitations select: invite-creation surface roles in own org
create policy "select invitations as invite-managers"
on public.invitations
for select to authenticated
using (
  (select private.user_org_role(org_id)) in ('admin_owner', 'provider_doctor')
);

-- invitations insert: owner creates invites (D-01)
create policy "insert invitations as invite-managers"
on public.invitations
for insert to authenticated
with check (
  (select private.user_org_role(org_id)) in ('admin_owner', 'provider_doctor')
);
