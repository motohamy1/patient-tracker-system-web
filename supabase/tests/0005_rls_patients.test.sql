-- pgTAP: Phase 04 patients RLS + trigger-owned MRN/timestamps + patient-linked
-- invite auto-connect (plan 04-01 Task 3). PROV-01/03/04 DB half, D-03/D-04/
-- D-07/D-08/D-09/D-13/D-21/D-22/D-23, AUTH-02/04/05.
--
-- Pitfall 10 idiom (identical to 0004): set local role + request.jwt.claim.sub;
-- denials assert throws_ok (writes/privileges) or is_empty/is 0 (RLS filters),
-- never lives_ok. Single transaction; superuser phases `reset role` in between.
--
-- MRN sequencing narrative: org A's FIRST patients are created by staff inside
-- this transaction so the D-07 assertions see MRN-0001/0002 from a clean org;
-- the deterministic fixture patients (replica mode — the 04-05 seed contract)
-- arrive AFTER those assertions with explicit mrn_seq 50/51/52.
--
-- The touch trigger uses now() (transaction-frozen), so bump assertions use
-- fixture rows whose last_activity_at is pinned to 2020 — a bump is then
-- observable inside the same transaction.

create extension if not exists pgtap with schema extensions;

begin;

select plan(18);

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
  ('00000000-0000-0000-0000-0000000000a1', 'authenticated', 'authenticated', 'owner-p4@example.com',   'x', now(), now(), now()),
  ('00000000-0000-0000-0000-0000000000a2', 'authenticated', 'authenticated', 'doctor-p4@example.com',  'x', now(), now(), now()),
  ('00000000-0000-0000-0000-0000000000a3', 'authenticated', 'authenticated', 'nurse-p4@example.com',   'x', now(), now(), now()),
  ('00000000-0000-0000-0000-0000000000a4', 'authenticated', 'authenticated', 'recept-p4@example.com',  'x', now(), now(), now()),
  ('00000000-0000-0000-0000-0000000000a5', 'authenticated', 'authenticated', 'patient-p4@example.com', 'x', now(), now(), now()),
  ('00000000-0000-0000-0000-0000000000b1', 'authenticated', 'authenticated', 'owner-b-p4@example.com', 'x', now(), now(), now()),
  ('00000000-0000-0000-0000-0000000000c1', 'authenticated', 'authenticated', 'none-p4@example.com',    'x', now(), now(), now()),
  ('00000000-0000-0000-0000-0000000000d1', 'authenticated', 'authenticated', 'link-p4@example.com',    'x', now(), now(), now());

insert into public.organizations (id, name, created_by) values
  ('10000000-0000-0000-0000-000000000001', 'Org P4-A', '00000000-0000-0000-0000-0000000000a1'),
  ('20000000-0000-0000-0000-000000000001', 'Org P4-B', '00000000-0000-0000-0000-0000000000b1');

-- admin_owner rows materialize via the bootstrap trigger (0004); add the rest.
insert into public.memberships (org_id, user_id, role) values
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000a2', 'provider_doctor'),
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000a3', 'nurse'),
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000a4', 'receptionist'),
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000a5', 'patient');

-- Org-B patient fixture (replica mode: the 04-05 seed contract — triggers off,
-- explicit values survive). Org B's FIRST patient is MRN-0001 while org A is
-- still empty: per-org numbering proven by construction.
set session_replication_role = replica;
insert into public.patients (id, org_id, first_name, last_name, dob, sex, phone, status, mrn_seq)
values ('50000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001',
        'Borg', 'Patient', '1977-11-05', 'M', '+201000000090', 'stable', 1);
set session_replication_role = origin;

-- Probe token digest computed HERE (superuser) so the authenticated insert
-- below never needs schema-extensions privileges itself.
select set_config(
  'test.probe_digest',
  encode(extensions.digest('phase4-probe-token', 'sha256'), 'hex'),
  false
);

-- 1: anon holds NO grant on patients (revoked, never re-granted — Pitfall 6)
set local role anon;
select throws_ok(
  'select * from public.patients',
  '42501',
  null,
  'anon has no select grant on patients'
);
reset role;

set local role authenticated;

-- 2: org-A staff cannot see org B's patient (AUTH-04 cross-org zero rows)
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000a2', true);
select is(
  (select count(*) from public.patients
    where org_id = '20000000-0000-0000-0000-000000000001'::uuid),
  0::bigint,
  'org-A staff reads zero org-B patient rows'
);

-- 3: staff insert succeeds and D-07 assigns the org's FIRST MRN
insert into public.patients (org_id, first_name, last_name, dob, sex, phone)
values ('10000000-0000-0000-0000-000000000001', 'Amina', 'Farid', '1990-05-12', 'F', '+201000000011');
select is(
  (select mrn from public.patients where first_name = 'Amina'),
  'MRN-0001',
  'first patient of the org gets MRN-0001 (D-07)'
);

-- 4+5: a CLIENT-SUPPLIED mrn_seq is discarded by the trigger (D-07)
insert into public.patients (org_id, first_name, last_name, dob, sex, phone, mrn_seq)
values ('10000000-0000-0000-0000-000000000001', 'Youssef', 'Saleh', '1985-03-02', 'M', '+201000000012', 999);
select is(
  (select mrn from public.patients where first_name = 'Youssef'),
  'MRN-0002',
  'client-supplied mrn_seq 999 is overwritten — sequencing continues (D-07)'
);
select is(
  (select mrn_seq from public.patients where first_name = 'Youssef'),
  2,
  'stored sequence is 2, not the injected 999'
);

-- 6: org B's first patient is MRN-0001 (numbering is per-org)
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000b1', true);
select is(
  (select mrn from public.patients
    where org_id = '20000000-0000-0000-0000-000000000001'::uuid),
  'MRN-0001',
  'MRN numbering restarts per organization'
);

-- 7: the D-09 status check constraint rejects an unknown status
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000a2', true);
select throws_ok(
  $$insert into public.patients (org_id, first_name, last_name, dob, sex, phone, status)
    values ('10000000-0000-0000-0000-000000000001', 'Nope', 'Unknown', '1990-01-01', 'M', '+201000000013', 'unknown')$$,
  '23514',
  null,
  'status check constraint rejects values outside the five D-09 strings'
);

-- 8: user_id is NOT insertable — the link is minted only by redeem_invite
select throws_ok(
  $$insert into public.patients (org_id, first_name, last_name, dob, sex, phone, user_id)
    values ('10000000-0000-0000-0000-000000000001', 'Sneaky', 'Link', '1990-01-01', 'M', '+201000000014', '00000000-0000-0000-0000-0000000000d1')$$,
  '42501',
  null,
  'user_id column is not in the insert grant — link only via redeem_invite (D-03/D-04)'
);

-- 9: org_id is NOT updatable — the with-check org pin is doubled by the grant
select throws_ok(
  $$update public.patients set org_id = '20000000-0000-0000-0000-000000000001' where first_name = 'Amina'$$,
  '42501',
  null,
  'org_id column is not in the update grant — cross-org rewrite impossible (Pitfall 6)'
);

-- Deterministic fixture patients (replica mode = the 04-05 seed contract):
-- P1 linked to the patient principal, P2/P3 pinned to 2020 so bumps show.
reset role;
set session_replication_role = replica;
insert into public.patients (id, org_id, user_id, first_name, last_name, dob, sex, phone, status, last_activity_at, mrn_seq) values
  ('40000000-0000-0000-0000-000000000101', '10000000-0000-0000-0000-000000000001',
   '00000000-0000-0000-0000-0000000000a5', 'Linked', 'Self', '1995-07-04', 'F', '+201000000021', 'stable', now(), 50),
  ('40000000-0000-0000-0000-000000000102', '10000000-0000-0000-0000-000000000001',
   null, 'Bump', 'Status', '1988-09-19', 'M', '+201000000022', 'stable', '2020-01-01T00:00:00Z', 51),
  ('40000000-0000-0000-0000-000000000103', '10000000-0000-0000-0000-000000000001',
   null, 'Invite', 'Link', '2001-02-03', 'F', '+201000000023', 'new', '2020-01-01T00:00:00Z', 52);
set session_replication_role = origin;

set local role authenticated;

-- 10: an unaffiliated authenticated principal reads zero patients
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000c1', true);
select is(
  (select count(*) from public.patients),
  0::bigint,
  'unaffiliated account reads zero patient rows'
);

-- 11+12: a patient principal reads ONLY their own linked row (D-03/RLS self)
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000a5', true);
select is(
  (select count(*) from public.patients),
  1::bigint,
  'patient principal reads exactly their own linked patient row'
);
update public.patients set status = 'critical'
  where id = '40000000-0000-0000-0000-000000000102'::uuid; -- 0 rows, no error
select is(
  (select status from public.patients where id = '40000000-0000-0000-0000-000000000102'::uuid),
  null::text,
  'patient principal cannot see another patient row'
);

-- 13 (superuser): the update above touched nothing
reset role;
select is(
  (select status from public.patients where id = '40000000-0000-0000-0000-000000000102'::uuid),
  'stable',
  'patient role update attempt left the row untouched'
);

set local role authenticated;

-- 14+15: staff CAN change folder status, and the touch trigger bumps
-- last_activity_at (D-13 manual change, D-22 activity)
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000a2', true);
update public.patients set status = 'follow_up'
  where id = '40000000-0000-0000-0000-000000000102'::uuid;
select is(
  (select status from public.patients where id = '40000000-0000-0000-0000-000000000102'::uuid),
  'follow_up',
  'staff status change persists'
);
select is(
  (select last_activity_at > '2020-02-01T00:00:00Z'::timestamptz
     from public.patients where id = '40000000-0000-0000-0000-000000000102'::uuid),
  true,
  'status change bumps last_activity_at via trigger (D-22)'
);

-- 16: sending a patient-linked invite bumps the patient (D-22 invite-sent)
insert into public.invitations (org_id, role, token_digest, short_code, created_by, patient_id)
values ('10000000-0000-0000-0000-000000000001', 'patient',
        current_setting('test.probe_digest'), 'P4TAP1',
        '00000000-0000-0000-0000-0000000000a2',
        '40000000-0000-0000-0000-000000000103'::uuid);
select is(
  (select last_activity_at > '2020-02-01T00:00:00Z'::timestamptz
     from public.patients where id = '40000000-0000-0000-0000-000000000103'::uuid),
  true,
  'patient-linked invite insert bumps the patient (D-22, D-04)'
);

-- 17+18: signup-then-redeem AUTO-CONNECTS the patient record (D-03/D-04)
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000d1', true);
select is(
  (public.redeem_invite('phase4-probe-token') ->> 'patientLinked')::boolean,
  true,
  'redeem_invite reports the patient link additively (patientLinked)'
);
select is(
  (select user_id from public.patients where id = '40000000-0000-0000-0000-000000000103'::uuid),
  '00000000-0000-0000-0000-0000000000d1'::uuid,
  'patient.user_id is connected at redemption — first link wins (D-04)'
);

select * from finish();

rollback;
