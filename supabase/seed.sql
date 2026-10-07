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

-- GOTRUE v2.197.0 ROW-SHAPE CONTRACT (why this insert looks pedantic):
-- rows written behind GoTrue's back must look exactly like rows GoTrue itself
-- writes, or the password grant dies before reaching the password check:
--   * instance_id must be the zero UUID (GoTrue's single-tenant lookup filters
--     `instance_id = '00000000-...'`; NULL rows are never found and every
--     login returns invalid_credentials).
--   * every token/text column GoTrue scans into a Go `string` must be '' not
--     NULL (NULL makes FindUserByEmailAndAudience fail with
--     "converting NULL to string is unsupported").
--   * raw_app_meta_data carries the provider bookkeeping GoTrue sets on signup.
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, phone, confirmation_token, recovery_token,
  email_change_token_new, email_change_token_current, email_change,
  phone_change, phone_change_token, reauthentication_token,
  raw_app_meta_data, raw_user_meta_data,
  email_change_confirm_status, is_sso_user, is_anonymous, created_at, updated_at
)
select
  '00000000-0000-0000-0000-000000000000', v.id, 'authenticated', 'authenticated', v.email,
  extensions.crypt('Phase3Dev!pass', extensions.gen_salt('bf')),
  now(), NULL, '', '', '', '', '', '', '', '',
  '{"provider":"email","providers":["email"]}'::jsonb,
  jsonb_build_object('sub', v.id::text, 'email', v.email, 'email_verified', true, 'phone_verified', false),
  0, false, false, now(), now()
from (values
  ('0f000000-0000-0000-0000-0000000000a1'::uuid, 'owner@clinic.test'),
  ('0f000000-0000-0000-0000-0000000000a2'::uuid, 'doctor@clinic.test'),
  ('0f000000-0000-0000-0000-0000000000a3'::uuid, 'nurse@clinic.test'),
  ('0f000000-0000-0000-0000-0000000000a4'::uuid, 'reception@clinic.test'),
  ('0f000000-0000-0000-0000-0000000000a5'::uuid, 'patient@clinic.test'),
  ('0f000000-0000-0000-0000-0000000000b1'::uuid, 'owner.b@clinic.test'),
  ('0f000000-0000-0000-0000-0000000000c1'::uuid, 'unaffiliated@clinic.test')
) as v(id, email);

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
