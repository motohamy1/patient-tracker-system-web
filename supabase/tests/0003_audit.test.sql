-- pgTAP: audit_log RLS + trigger enforcement (phase 03, plan 02 Task 4)
-- Pitfall 10 idiom; D-14 trigger-based audit; D-15 admin_owner-only retrieval;
-- roadmap criterion 4 cross-org denial cases.

create extension if not exists pgtap with schema extensions;

begin;

select plan(8);

insert into auth.users (
  id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at
) values
  ('00000000-0000-0000-0000-0000000000a1', 'authenticated', 'authenticated', 'owner-a@example.com', 'x', now(), now(), now()),
  ('00000000-0000-0000-0000-0000000000a2', 'authenticated', 'authenticated', 'doctor-a@example.com', 'x', now(), now(), now()),
  ('00000000-0000-0000-0000-0000000000a3', 'authenticated', 'authenticated', 'patient-a@example.com', 'x', now(), now(), now()),
  ('00000000-0000-0000-0000-0000000000b1', 'authenticated', 'authenticated', 'owner-b@example.com', 'x', now(), now(), now());

insert into public.organizations (id, name, created_by) values
  ('10000000-0000-0000-0000-000000000001', 'Org A', '00000000-0000-0000-0000-0000000000a1'),
  ('20000000-0000-0000-0000-000000000001', 'Org B', '00000000-0000-0000-0000-0000000000b1');

-- admin_owner rows are created by the bootstrap_org_membership trigger
-- (migration 0004); only the non-owner roles are inserted explicitly.
insert into public.memberships (org_id, user_id, role) values
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000a2', 'provider_doctor'),
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000a3', 'patient');

-- 1: trigger-fired audit rows exist for membership changes (D-14: DB triggers,
--    not app writes) — audited here as superuser, outside any product role
select is(
  (select entity from public.audit_log where entity = 'memberships' limit 1),
  'memberships'::text,
  'membership inserts produced audit_log rows via DB triggers'
);

-- 2: an audit row exists with no actor (definer/system context preserves
--    coalesce(auth.uid(), user_id) shape) — org-B owner's org insert
select is(
  (select entity from public.audit_log where entity = 'organizations' limit 1),
  'organizations'::text,
  'organization inserts produced audit_log rows via DB triggers'
);

-- 3: org-A provider_doctor sees ZERO audit_log rows even for their own org (D-15)
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000a2', true);
set local role authenticated;
select is_empty(
  'select * from public.audit_log',
  'non-admin authenticated user reads zero audit_log rows'
);

-- 4: org-A admin_owner sees the org-A audit rows
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000a1', true);
select is(
  (select count(*) from public.audit_log where org_id = '10000000-0000-0000-0000-000000000001'::uuid),
  4::bigint,
  'org-A admin_owner reads the org-A audit rows'
);

-- 5: cross-org audit denial — org-A admin_owner sees zero org-B audit rows
select is_empty(
  'select * from public.audit_log where org_id = ''20000000-0000-0000-0000-000000000001''::uuid',
  'org-A admin_owner reading org-B audit rows yields zero rows'
);

-- 6: no insert grant — authenticated audit_log write denied 42501
select throws_ok(
  'insert into public.audit_log (action, entity) values (''INSERT'', ''memberships'')',
  '42501',
    null,
  'authenticated audit_log insert rejected 42501 (trigger-context writes only)'
);

-- 7: no update grant — authenticated audit_log update denied 42501
select throws_ok(
  'update public.audit_log set diff = null',
  '42501',
    null,
  'authenticated audit_log update rejected 42501'
);

-- 8: no delete grant — authenticated audit_log delete denied 42501
select throws_ok(
  'delete from public.audit_log',
  '42501',
    null,
  'authenticated audit_log delete rejected 42501'
);

rollback;
