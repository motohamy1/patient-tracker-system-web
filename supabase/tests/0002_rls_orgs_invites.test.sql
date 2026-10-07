-- pgTAP: organizations + invitations RLS allow/deny (phase 03, plan 02 Task 4)
-- Pitfall 10 idiom; roadmap criterion 4 cross-org denial cases asserted with
-- is_empty (silent selects) and throws_ok('42501') (denied writes).

create extension if not exists pgtap with schema extensions;

begin;

select plan(8);

insert into auth.users (
  id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at
) values
  ('00000000-0000-0000-0000-0000000000a1', 'authenticated', 'authenticated', 'owner-a@example.com', 'x', now(), now(), now()),
  ('00000000-0000-0000-0000-0000000000a2', 'authenticated', 'authenticated', 'doctor-a@example.com', 'x', now(), now(), now()),
  ('00000000-0000-0000-0000-0000000000b1', 'authenticated', 'authenticated', 'owner-b@example.com', 'x', now(), now(), now());

insert into public.organizations (id, name, created_by) values
  ('10000000-0000-0000-0000-000000000001', 'Org A', '00000000-0000-0000-0000-0000000000a1'),
  ('20000000-0000-0000-0000-000000000001', 'Org B', '00000000-0000-0000-0000-0000000000b1');

-- admin_owner rows are created by the bootstrap_org_membership trigger
-- (migration 0004); only the non-owner role is inserted explicitly.
insert into public.memberships (org_id, user_id, role) values
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000a2', 'provider_doctor');

-- 1: membership-less authenticated principal sees zero organizations rows
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000000', true);
set local role authenticated;
select is_empty(
  'select * from public.organizations',
  'no-membership authenticated user reads zero organizations rows'
);

-- 2: org-A provider_doctor reads org A by name
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000a2', true);
select results_eq(
  'select name from public.organizations where id = ''10000000-0000-0000-0000-000000000001''::uuid',
  ARRAY['Org A'::text],
  'org-A provider_doctor reads their own organization row'
);

-- 3: cross-org denial — org-A doctor cannot read org B
select is_empty(
  'select * from public.organizations where id = ''20000000-0000-0000-0000-000000000001''::uuid',
  'org-A provider_doctor reading org B yields zero rows'
);

-- 4: allowed write with returning proof — org-A doctor inserts an org-A invite
select results_eq(
  'insert into public.invitations (org_id, role, token_digest, created_by) values (''10000000-0000-0000-0000-000000000001''::uuid, ''patient'', ''d1'', ''00000000-0000-0000-0000-0000000000a2''::uuid) returning token_digest',
  ARRAY['d1'::text],
  'org-A provider_doctor creates an org-A invitation (returning-asserted)'
);

-- 5: no update grant anywhere — organizations update denied 42501
select throws_ok(
  'update public.organizations set name = ''Renamed'' where id = ''10000000-0000-0000-0000-000000000001''::uuid',
  '42501',
    null,
  'organizations update denied 42501 (no grant, name changes deferred)'
);

-- 6: cross-org write denial — org-A doctor cannot insert an org-B invitation
select throws_ok(
  'insert into public.invitations (org_id, role, token_digest, created_by) values (''20000000-0000-0000-0000-000000000001''::uuid, ''patient'', ''d2'', ''00000000-0000-0000-0000-0000000000a2''::uuid)',
  '42501',
    null,
  'org-A provider_doctor cross-org invitations insert rejected 42501'
);

-- 7: memberships-less user insert into any organization is rejected
select throws_ok(
  'insert into public.organizations (name, created_by) values (''X'', ''00000000-0000-0000-0000-000000000000''::uuid)',
  '42501',
    null,
  'organization insert with created_by != auth.uid() rejected 42501'
);

-- 8: membership-less user sees zero invitations rows
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000000', true);
select is_empty(
  'select * from public.invitations',
  'no-membership authenticated user reads zero invitations rows'
);

rollback;
