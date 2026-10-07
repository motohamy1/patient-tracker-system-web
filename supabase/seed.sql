-- supabase/seed.sql — Phase 03 5-role acceptance accounts (plan 03-06 Task 3)
--
-- Materializes the AUTH-08 gate accounts: one org (Org A / "Northwind Clinic")
-- with all five roles, a second org (Org B / "Riverside Clinic") with its own
-- owner for cross-org probes, and one unaffiliated account with NO membership.
-- Every account shares the documented local-only password below; these are
-- fixed dev addresses and never resemble real accounts.
--
-- The bootstrap_org_membership trigger (migration 0004) auto-creates the
-- admin_owner membership for each organization's creator, so the owner rows are
-- deliberately NOT inserted here (doing so would violate unique(org_id,user_id)).
--
-- DEV PASSWORD (all six accounts): Phase3Dev!pass
-- Re-runnable on a fresh database (`supabase db reset`).

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at
) values
  (null, '0f000000-0000-0000-0000-0000000000a1', 'authenticated', 'authenticated', 'owner@clinic.test',       extensions.crypt('Phase3Dev!pass', extensions.gen_salt('bf')), now(), now(), now()),
  (null, '0f000000-0000-0000-0000-0000000000a2', 'authenticated', 'authenticated', 'doctor@clinic.test',      extensions.crypt('Phase3Dev!pass', extensions.gen_salt('bf')), now(), now(), now()),
  (null, '0f000000-0000-0000-0000-0000000000a3', 'authenticated', 'authenticated', 'nurse@clinic.test',       extensions.crypt('Phase3Dev!pass', extensions.gen_salt('bf')), now(), now(), now()),
  (null, '0f000000-0000-0000-0000-0000000000a4', 'authenticated', 'authenticated', 'reception@clinic.test',   extensions.crypt('Phase3Dev!pass', extensions.gen_salt('bf')), now(), now(), now()),
  (null, '0f000000-0000-0000-0000-0000000000a5', 'authenticated', 'authenticated', 'patient@clinic.test',     extensions.crypt('Phase3Dev!pass', extensions.gen_salt('bf')), now(), now(), now()),
  (null, '0f000000-0000-0000-0000-0000000000b1', 'authenticated', 'authenticated', 'owner.b@clinic.test',     extensions.crypt('Phase3Dev!pass', extensions.gen_salt('bf')), now(), now(), now()),
  (null, '0f000000-0000-0000-0000-0000000000c1', 'authenticated', 'authenticated', 'unaffiliated@clinic.test', extensions.crypt('Phase3Dev!pass', extensions.gen_salt('bf')), now(), now(), now());

insert into auth.identities (
  id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
)
select
  gen_random_uuid(),
  u.id,
  jsonb_build_object('sub', u.id::text, 'email', u.email)::jsonb,
  'email',
  u.id::text,
  now(), now(), now()
from auth.users u
where u.id in (
  '0f000000-0000-0000-0000-0000000000a1',
  '0f000000-0000-0000-0000-0000000000a2',
  '0f000000-0000-0000-0000-0000000000a3',
  '0f000000-0000-0000-0000-0000000000a4',
  '0f000000-0000-0000-0000-0000000000a5',
  '0f000000-0000-0000-0000-0000000000b1',
  '0f000000-0000-0000-0000-0000000000c1'
);

insert into public.organizations (id, name, created_by) values
  ('1f000000-0000-0000-0000-000000000001', 'Northwind Clinic', '0f000000-0000-0000-0000-0000000000a1'),
  ('2f000000-0000-0000-0000-000000000001', 'Riverside Clinic', '0f000000-0000-0000-0000-0000000000b1');

-- Owners are created by the bootstrap_org_membership trigger (migration 0004).
-- The remaining org-A roles are explicit membership rows.
insert into public.memberships (org_id, user_id, role) values
  ('1f000000-0000-0000-0000-000000000001', '0f000000-0000-0000-0000-0000000000a2', 'provider_doctor'),
  ('1f000000-0000-0000-0000-000000000001', '0f000000-0000-0000-0000-0000000000a3', 'nurse'),
  ('1f000000-0000-0000-0000-000000000001', '0f000000-0000-0000-0000-0000000000a4', 'receptionist'),
  ('1f000000-0000-0000-0000-000000000001', '0f000000-0000-0000-0000-0000000000a5', 'patient');
-- The unaffiliated account (…c1) intentionally has NO membership row.

-- Fixture invitation for the Phase-3 visual baseline of the valid invite
-- surface. Only the digest is stored (D-02); the raw fixture token is
-- 'phase3-fixture-invite', which the harness navigates to as /invite/<token>.
insert into public.invitations (org_id, role, token_digest, short_code, created_by) values
  ('1f000000-0000-0000-0000-000000000001', 'provider_doctor',
   encode(extensions.digest('phase3-fixture-invite', 'sha256'), 'hex'),
   'PHASE3', '0f000000-0000-0000-0000-0000000000a1');
