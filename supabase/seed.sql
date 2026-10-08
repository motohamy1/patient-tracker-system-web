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


-- ============================================================================
-- Phase 04 deterministic patient fixtures (plan 04-05 Task 1) — the visual
-- matrix's folder-grid content. CONTRACT (04-01/04-05 cross-plan):
--   * INSERTs run under `set session_replication_role = replica` so the FIXED
--     mrn_seq (1..6 -> MRN-0001..MRN-0006) and FIXED absolute timestamps
--     survive migration 0005's assign_patient_mrn / touch_patient_timestamps
--     triggers — that bypass belongs to THIS SEED ONLY, never to app code.
--   * every timestamp is a fixed past instant (never now()) so "Recent"
--     ordering and every rendered date are bit-identical on every reset.
--   * names cover the D-17 search fields (name/MRN/phone/DOB); statuses cover
--     all five D-09 values (stable x2, follow_up, needs_review, critical, new);
--     exactly one row is linked (to the org's patient account) and the rest
--     stay unlinked so the D-15 "Send invite" quick action is visible.
--   * re-runnable on a fresh database (`supabase db reset`).
set session_replication_role = replica;
insert into public.patients (id, org_id, user_id, first_name, last_name, dob, sex, phone, status, created_at, updated_at, last_activity_at, mrn_seq) values
  ('4f000000-0000-0000-0000-000000000001', '1f000000-0000-0000-0000-000000000001',
   '0f000000-0000-0000-0000-0000000000a5', 'Amina', 'Farid', '1990-05-12', 'F', '+201000000011', 'stable',
   '2026-09-01T09:00:00Z', '2026-09-28T10:30:00Z', '2026-09-28T10:30:00Z', 1),
  ('4f000000-0000-0000-0000-000000000002', '1f000000-0000-0000-0000-000000000001',
   null, 'Youssef', 'Saleh', '1985-03-02', 'M', '+201000000012', 'follow_up',
   '2026-09-04T11:15:00Z', '2026-10-02T08:45:00Z', '2026-10-02T08:45:00Z', 2),
  ('4f000000-0000-0000-0000-000000000003', '1f000000-0000-0000-0000-000000000001',
   null, 'Mariam', 'Adel', '1978-12-24', 'F', '+201000000013', 'needs_review',
   '2026-09-08T14:20:00Z', '2026-10-04T13:05:00Z', '2026-10-04T13:05:00Z', 3),
  ('4f000000-0000-0000-0000-000000000004', '1f000000-0000-0000-0000-000000000001',
   null, 'Omar', 'Hany', '1966-07-30', 'M', '+201000000014', 'critical',
   '2026-09-10T08:00:00Z', '2026-10-05T16:40:00Z', '2026-10-05T16:40:00Z', 4),
  ('4f000000-0000-0000-0000-000000000005', '1f000000-0000-0000-0000-000000000001',
   null, 'Nour', 'El-Sayed', '2001-02-03', 'F', '+201000000015', 'new',
   '2026-10-05T09:30:00Z', '2026-10-05T09:30:00Z', '2026-10-05T09:30:00Z', 5),
  ('4f000000-0000-0000-0000-000000000006', '1f000000-0000-0000-0000-000000000001',
   null, 'Kareem', 'Tarek', '1995-11-18', 'M', '+201000000016', 'stable',
   '2026-09-20T12:00:00Z', '2026-09-30T15:10:00Z', '2026-09-30T15:10:00Z', 6);
set session_replication_role = origin;
