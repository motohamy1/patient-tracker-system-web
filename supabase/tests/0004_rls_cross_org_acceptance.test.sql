-- pgTAP: Phase 03 cross-org RLS acceptance + migration-0004 definer guards
-- (plan 03-06 Task 3). AUTH-04/05/06/07/08 DB half; roadmap criteria 2-4.
--
-- Pitfall 10 idiom: set local role authenticated + request.jwt.claim.sub.
-- Denials assert is_empty (select) and throws_ok (writes) — never lives_ok.
--
-- Revision r2 decision (identical across 03-02/03-03/03-05/03-06): migration
-- 0002's memberships SELECT policy is
--   user_id = auth.uid() OR (select private.user_org_role(org_id)) IN ('admin_owner', 'provider_doctor')
-- so provider_doctor reads ALL same-org membership rows; nurse/receptionist/
-- patient read only their own; audit retrieval stays admin_owner-only (D-15).
--
-- Fixtures are created by the bootstrap_org_membership trigger (migration
-- 0004), so the admin_owner rows are deliberately NOT inserted explicitly.

create extension if not exists pgtap with schema extensions;

begin;

select plan(15);

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
  ('00000000-0000-0000-0000-0000000000a1', 'authenticated', 'authenticated', 'owner-a@example.com',   'x', now(), now(), now()),
  ('00000000-0000-0000-0000-0000000000a2', 'authenticated', 'authenticated', 'doctor-a@example.com',  'x', now(), now(), now()),
  ('00000000-0000-0000-0000-0000000000a3', 'authenticated', 'authenticated', 'nurse-a@example.com',   'x', now(), now(), now()),
  ('00000000-0000-0000-0000-0000000000a4', 'authenticated', 'authenticated', 'recept-a@example.com',  'x', now(), now(), now()),
  ('00000000-0000-0000-0000-0000000000a5', 'authenticated', 'authenticated', 'patient-a@example.com', 'x', now(), now(), now()),
  ('00000000-0000-0000-0000-0000000000b1', 'authenticated', 'authenticated', 'owner-b@example.com',   'x', now(), now(), now()),
  ('00000000-0000-0000-0000-0000000000c1', 'authenticated', 'authenticated', 'no-member@example.com', 'x', now(), now(), now());

insert into public.organizations (id, name, created_by) values
  ('10000000-0000-0000-0000-000000000001', 'Org A', '00000000-0000-0000-0000-0000000000a1'),
  ('20000000-0000-0000-0000-000000000001', 'Org B', '00000000-0000-0000-0000-0000000000b1');

-- admin_owner rows materialize via the bootstrap trigger; add the other roles.
insert into public.memberships (org_id, user_id, role) values
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000a2', 'provider_doctor'),
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000a3', 'nurse'),
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000a4', 'receptionist'),
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000a5', 'patient');

-- Capture the org-B admin membership id for the cross-org definer probe while
-- superuser context can still read it (RLS hides it once we act as owner A).
select set_config(
  'test.orgb_membership_id',
  (select id::text from public.memberships
    where org_id = '20000000-0000-0000-0000-000000000001'::uuid
      and user_id = '00000000-0000-0000-0000-0000000000b1'::uuid),
  false
);

-- 1: unaffiliated authenticated principal reads zero memberships
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000c1', true);
set local role authenticated;
select is_empty(
  'select * from public.memberships',
  'unaffiliated account reads zero memberships rows'
);

-- 2: provider_doctor reads ALL five org-A rows (r2 extended policy)
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000a2', true);
select is(
  (select count(*) from public.memberships where org_id = '10000000-0000-0000-0000-000000000001'::uuid),
  5::bigint,
  'org-A provider_doctor reads all five org-A membership rows'
);

-- 3: nurse reads only their own row
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000a3', true);
select is(
  (select count(*) from public.memberships),
  1::bigint,
  'org-A nurse reads only their own membership row'
);

-- 4: receptionist reads only their own row
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000a4', true);
select is(
  (select count(*) from public.memberships),
  1::bigint,
  'org-A receptionist reads only their own membership row'
);

-- 5: patient reads only their own row
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000a5', true);
select is(
  (select count(*) from public.memberships),
  1::bigint,
  'org-A patient reads only their own membership row'
);

-- 6: cross-org read — owner A sees zero org-B memberships
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000a1', true);
select is_empty(
  'select * from public.memberships where org_id = ''20000000-0000-0000-0000-000000000001''::uuid',
  'org-A owner reads zero org-B membership rows'
);

-- 7: cross-org write — org-A patient inserting into org B is denied 42501
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000a5', true);
select throws_ok(
  'insert into public.memberships (org_id, user_id, role) values (''20000000-0000-0000-0000-000000000001''::uuid, ''00000000-0000-0000-0000-0000000000a5''::uuid, ''patient'')',
  '42501',
  null,
  'org-A patient cross-org memberships insert is rejected 42501'
);

-- 8: capability-violating mutation — nurse insert into own org denied 42501
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000a3', true);
select throws_ok(
  'insert into public.memberships (org_id, user_id, role) values (''10000000-0000-0000-0000-000000000001''::uuid, ''00000000-0000-0000-0000-0000000000c1''::uuid, ''patient'')',
  '42501',
  null,
  'nurse membership insert (no CAN_MANAGE_MEMBERSHIP write path) is rejected 42501'
);

-- 9: audit_log — provider_doctor sees zero rows even in own org (D-15)
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000a2', true);
select is_empty(
  'select * from public.audit_log',
  'provider_doctor reads zero audit_log rows (D-15)'
);

-- 10: audit_log — owner reads the org-A audit rows
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000a1', true);
select ok(
  (select count(*) from public.audit_log where org_id = '10000000-0000-0000-0000-000000000001'::uuid) > 0,
  'org-A owner reads the org-A audit rows'
);

-- 11: remove_membership — owner removes a same-org member successfully
select lives_ok(
  'select public.remove_membership((select id from public.memberships where org_id = ''10000000-0000-0000-0000-000000000001''::uuid and user_id = ''00000000-0000-0000-0000-0000000000a5''::uuid))',
  'org-A owner removes a same-org member via remove_membership'
);

-- 12: the removal left a DELETE audit row (D-14 definer-path trigger proof)
select ok(
  (select count(*) from public.audit_log where entity = 'memberships' and action = 'DELETE') >= 1,
  'member removal produced a DELETE audit row via the definer path'
);

-- 13: remove_membership — non-owner (provider_doctor) same-org removal throws
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000a2', true);
select throws_ok(
  'select public.remove_membership((select id from public.memberships where org_id = ''10000000-0000-0000-0000-000000000001''::uuid and user_id = ''00000000-0000-0000-0000-0000000000a4''::uuid))',
  'P0001', 'membership_forbidden',
  'provider_doctor same-org removal is rejected (owner-only delete authority)'
);

-- 14: remove_membership — owner A targeting an org-B membership throws (cross-org)
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000a1', true);
select throws_ok(
  'select public.remove_membership(current_setting(''test.orgb_membership_id'')::uuid)',
  'P0001', 'membership_operation_failed',
  'cross-org remove_membership is rejected with the neutral failure constant'
);

-- 15: remove_membership — last-admin guard blocks removing the sole owner
select throws_ok(
  'select public.remove_membership((select id from public.memberships where org_id = ''10000000-0000-0000-0000-000000000001''::uuid and user_id = ''00000000-0000-0000-0000-0000000000a1''::uuid))',
  'P0001', 'membership_last_admin',
  'removing the last admin_owner is rejected by the last-admin guard'
);

rollback;
