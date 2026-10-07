-- pgTAP: memberships RLS allow/deny (phase 03, plan 02 Task 4)
-- Pitfall 10 idiom: set local role authenticated + request.jwt.claim.sub
-- fixtures; denials assert is_empty (select) and throws_ok('42501') (writes) —
-- never lives_ok for writes, where a deny matching zero rows would masquerade
-- as pass. Roadmap criterion 4 proofs live here.

create extension if not exists pgtap with schema extensions;

begin;

select plan(8);

-- role sanity gate: this db must be the supabase local stack
do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then
    raise exception 'authenticated role missing — is this the supabase local db?';
  end if;
end $$;

insert into auth.users (
  id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at
) values
  ('00000000-0000-0000-0000-0000000000a1', 'authenticated', 'authenticated', 'owner-a@example.com', 'x', now(), now(), now()),
  ('00000000-0000-0000-0000-0000000000a2', 'authenticated', 'authenticated', 'doctor-a@example.com', 'x', now(), now(), now()),
  ('00000000-0000-0000-0000-0000000000a3', 'authenticated', 'authenticated', 'patient-a@example.com', 'x', now(), now(), now()),
  ('00000000-0000-0000-0000-0000000000b1', 'authenticated', 'authenticated', 'owner-b@example.com', 'x', now(), now(), now());

-- org-wide fixtures for the cross-org cases
insert into public.organizations (id, name, created_by) values
  ('10000000-0000-0000-0000-000000000001', 'Org A', '00000000-0000-0000-0000-0000000000a1'),
  ('20000000-0000-0000-0000-000000000001', 'Org B', '00000000-0000-0000-0000-0000000000b1');

-- admin_owner rows are created by the bootstrap_org_membership trigger
-- (migration 0004); only the non-owner roles are inserted explicitly.
insert into public.memberships (org_id, user_id, role) values
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000a2', 'provider_doctor'),
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000a3', 'patient');

-- 1: membership-less authenticated principal sees zero memberships rows
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000000', true);
set local role authenticated;
select is_empty(
  'select * from public.memberships',
  'no-membership authenticated user reads zero memberships rows'
);

-- 2: patient of org A reads their own membership row
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000a3', true);
select results_eq(
  'select role from public.memberships where user_id = ''00000000-0000-0000-0000-0000000000a3''::uuid',
  ARRAY['patient'::text],
  'org-A patient reads their own membership row'
);

-- 3: provider_doctor of org A reads other org-A members (CAN_MANAGE_MEMBERSHIP surface)
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000a2', true);
select results_eq(
  'select role from public.memberships where user_id = ''00000000-0000-0000-0000-0000000000a1''::uuid',
  ARRAY['admin_owner'::text],
  'org-A provider_doctor reads co-members of the same org'
);

-- 4: path check — org-A doctor sees exactly the three org-A rows, never org B
select is(
  (select count(*) from public.memberships),
  3::bigint,
  'org-A provider_doctor sees exactly the three org-A membership rows'
);

-- 5: membership-less user INSERT is rejected at the grant/policy layer
select throws_ok(
  'insert into public.memberships (org_id, user_id, role) values (''10000000-0000-0000-0000-000000000001''::uuid, ''00000000-0000-0000-0000-000000000000''::uuid, ''patient'')',
  '42501',
    null,
  'membership-less authenticated write to memberships is rejected 42501'
);

-- 6: cross-org write denial — org-A patient cannot insert into org B
select throws_ok(
  'insert into public.memberships (org_id, user_id, role) values (''20000000-0000-0000-0000-000000000001''::uuid, ''00000000-0000-0000-0000-0000000000a3''::uuid, ''patient'')',
  '42501',
    null,
  'org-A patient cross-org memberships insert is rejected 42501'
);

-- 7: update denial — memberships updates carry no grant, no policy
select throws_ok(
  'update public.memberships set role = ''admin_owner'' where user_id = ''00000000-0000-0000-0000-0000000000a3''::uuid',
  '42501',
    null,
  'authenticated memberships update is rejected 42501 (definer-fn-only removal)'
);

-- 8: delete denial
select throws_ok(
  'delete from public.memberships where user_id = ''00000000-0000-0000-0000-0000000000a3''::uuid',
  '42501',
    null,
  'authenticated memberships delete is rejected 42501'
);

rollback;
