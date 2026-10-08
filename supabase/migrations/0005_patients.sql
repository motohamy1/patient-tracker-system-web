-- Migration 0005: patients table, trigger-owned MRN/timestamps, trgm search,
-- org-scoped RLS, patient-linked invitations, patient audit (phase 04).
-- D-01 patient record without an account; D-03 optional user_id; D-04 invite
-- auto-link; D-07 MRN assigned by trigger, never typed; D-08 sex M/F; D-09 the
-- five status strings are the PERMANENT vocabulary mirrored by
-- src/lib/patients/status.ts; D-13 default 'new'; D-21 ONLY the patients table
-- (+ the invitations.patient_id column + redeem_invite extension D-04 needs);
-- D-22 last_activity_at maintained by trigger; D-23 column set; PROV-01/03/04,
-- AUTH-02/04/05, PRODUCT-MASTER-SPEC.md §13.
--
-- Composes 0001 (table discipline), 0002 (definer helper REUSE — every policy
-- below calls private.user_org_role, never a second membership reader
-- [Pitfall 7]; grants revoke-then-regrant [Pitfall 6]; UPDATE carries BOTH
-- using and with check [Pitfall 9]), 0003 (audit trigger-per-table — 03-CONTEXT
-- D-14: every later clinical phase extends the same trigger pattern), 0004
-- (redeem_invite replaced additively, no-leak discipline byte-identical).
--
-- Trigger-owned columns: mrn_seq (per-org advisory-locked sequence — no
-- client-supplied value survives [D-07]), updated_at/last_activity_at
-- (a missed action-layer call site can never mean a stale timestamp
-- [D-22, 04-RESEARCH Pitfall 7]). App code must never write them.
--
-- NO delete policy and NO delete grant: a clinical record is not a product
-- delete action in Phase 4 (0004's "no grant, no policy" doctrine).
--
-- Cross-plan contract (04-05): supabase/seed.sql inserts its deterministic
-- fixtures under `set session_replication_role = replica` so fixed mrn_seq /
-- timestamps survive these triggers. That bypass belongs to the SEED only,
-- never to app code; pgTAP below still proves every client path is overwritten.

create extension if not exists pg_trgm;

create table public.patients (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  -- D-03 optional link; the clinical record SURVIVES account deletion, hence
  -- set null (never cascade).
  user_id uuid references auth.users(id) on delete set null,
  first_name text not null,
  last_name text not null,
  dob date not null,
  sex text not null check (sex in ('M', 'F')),
  phone text not null,
  status text not null default 'new'
    check (status in ('stable', 'follow_up', 'needs_review', 'critical', 'new')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_activity_at timestamptz not null default now(),
  -- D-07: assigned by private.assign_patient_mrn() (BEFORE INSERT). The 0
  -- default only satisfies NOT NULL before the trigger overwrites it.
  mrn_seq integer not null default 0,
  -- Stored generated display MRN; computed after the BEFORE trigger has set
  -- mrn_seq (asserted by pgTAP 0005 cases c/d — if that ever fails, flip to a
  -- trigger-maintained plain column, never to app-side generation).
  mrn text generated always as ('MRN-' || lpad(mrn_seq::text, 4, '0')) stored not null
);

-- D-17: ONE indexed text projection of name + MRN + phone + DOB for the
-- server-side search (04-RESEARCH Pattern 2). Generated columns may not
-- reference generated columns (Pitfall 4), so the MRN expression is inlined.
-- Expression constraints proved against the live engine: to_char is not
-- immutable here and lower() cannot resolve a collation inside a generated
-- column, so the date is composed from extract() parts (immutable, verified)
-- and CASE IS HANDLED BY ILIKE at query time — ilike already folds case, so
-- no lower() is needed anywhere in this projection.
alter table public.patients add column search_text text
  generated always as (
    first_name || ' ' || last_name || ' ' ||
    'MRN-' || lpad(mrn_seq::text, 4, '0') || ' ' ||
    phone || ' ' ||
    lpad(extract(year from dob)::int::text, 4, '0') || '-' ||
    lpad(extract(month from dob)::int::text, 2, '0') || '-' ||
    lpad(extract(day from dob)::int::text, 2, '0')
  ) stored;

create unique index patients_org_mrn_seq_uq on public.patients (org_id, mrn_seq);
create unique index patients_user_id_uq on public.patients (user_id) where user_id is not null;
-- D-11/D-20 sort key (+ stable id tiebreak) and the filter-tab predicate index.
create index patients_org_last_activity_idx on public.patients (org_id, last_activity_at desc, id desc);
create index patients_org_status_idx on public.patients (org_id, status);
create index patients_search_text_trgm_idx on public.patients using gin (search_text gin_trgm_ops);

-- D-07: per-org sequential MRN under an advisory lock. The max()+1 read is
-- serialized per org by pg_advisory_xact_lock, and the unique backstop index
-- makes a race impossible to miss rather than to ship.
create function private.assign_patient_mrn() returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform pg_advisory_xact_lock(2004, hashtext(new.org_id::text));
  select coalesce(max(mrn_seq), 0) + 1
    into new.mrn_seq
  from public.patients
  where org_id = new.org_id;
  return new;
end;
$$;

create trigger assign_patient_mrn before insert on public.patients
for each row
execute function private.assign_patient_mrn();

-- D-22: any row change IS activity. Timestamps are trigger-owned; actions and
-- clients never write them (04-RESEARCH Pitfall 7).
create function private.touch_patient_timestamps() returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    new.updated_at := now();
    new.last_activity_at := now();
    return new;
  end if;
  new.updated_at := now();
  new.last_activity_at := now();
  return new;
end;
$$;

create trigger touch_patient_timestamps
before insert or update on public.patients
for each row
execute function private.touch_patient_timestamps();

-- D-04: an invite may carry a patient link. Integrity guard (an invite can
-- only ever link a patient OF ITS OWN ORG — defense on top of the FK) plus the
-- D-22 invite-sent bump, both in the same definer trigger.
alter table public.invitations
  add column patient_id uuid references public.patients(id);

create function private.invitation_patient_link() returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_org uuid;
begin
  if new.patient_id is null then
    return new; -- plain org invite — D-04's addition is strictly additive
  end if;

  select org_id into v_org from public.patients where id = new.patient_id;
  if v_org is null then
    raise exception 'invite_patient_missing';
  end if;
  if v_org <> new.org_id then
    raise exception 'invite_patient_mismatch';
  end if;

  update public.patients
  set last_activity_at = now() -- D-22 invite-sent bump (touch trigger owns updated_at)
  where id = new.patient_id;

  return new;
end;
$$;

create trigger invitation_patient_link after insert on public.invitations
for each row
execute function private.invitation_patient_link();

-- D-03/D-04: create or replace, SAME signature/no-leak discipline as 0004,
-- plus the first-link-wins patient connect and an additive patientLinked key
-- (existing consumers of the JSON keep working unchanged).
create or replace function public.redeem_invite(p_raw_token text)
returns json
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_digest text;
  v_invitation public.invitations%rowtype;
  v_org_name text;
begin
  if v_uid is null then
    raise exception 'invite_invalid';
  end if;

  v_digest := encode(extensions.digest(p_raw_token, 'sha256'), 'hex');

  select * into v_invitation
  from public.invitations
  where token_digest = v_digest
    and redeemed_at is null
    and (expires_at is null or expires_at > now());

  if not found then
    raise exception 'invite_invalid';
  end if;

  insert into public.memberships (org_id, user_id, role)
  values (v_invitation.org_id, v_uid, v_invitation.role);

  if v_invitation.patient_id is not null then
    -- First link wins — never steal an existing link (D-03/D-04).
    update public.patients
    set user_id = v_uid, last_activity_at = now()
    where id = v_invitation.patient_id
      and user_id is null;
  end if;

  update public.invitations
  set redeemed_at = now(), redeemed_by = v_uid
  where id = v_invitation.id;

  select name into v_org_name
  from public.organizations
  where id = v_invitation.org_id;

  return json_build_object(
    'organization', v_org_name,
    'orgId', v_invitation.org_id,
    'role', v_invitation.role,
    'patientLinked', (v_invitation.patient_id is not null)
  );
end;
$$;

-- RLS (D-23 org-scoped; AUTH-02/04). Grants first (Pitfall 6: policies never
-- revoke grants) — COLUMN-LEVEL lists are the hardening: user_id/org_id/mrn
-- columns are not updatable and (except the pgTAP overwrite proof) not
-- insertable by app clients; the link is minted only by redeem_invite.
alter table public.patients enable row level security;

revoke all on public.patients from anon, authenticated, service_role;
grant select on public.patients to authenticated;
-- mrn_seq is granted ONLY so the client-overwrite proof (pgTAP 0005 case d)
-- can attempt to supply it — the trigger discards the value (D-07).
grant insert (org_id, first_name, last_name, dob, sex, phone, status, mrn_seq)
  on public.patients to authenticated;
grant update (first_name, last_name, dob, sex, phone, status)
  on public.patients to authenticated;
-- no delete grant, no update grant on org_id/user_id/mrn/mrn_seq/…

create policy "select patients as staff-or-self"
on public.patients
for select to authenticated
using (
  (select private.user_org_role(org_id)) in ('provider_doctor', 'nurse', 'receptionist', 'admin_owner')
  or user_id = (select auth.uid())
);

create policy "insert patients as staff"
on public.patients
for insert to authenticated
with check (
  (select private.user_org_role(org_id)) in ('provider_doctor', 'nurse', 'receptionist', 'admin_owner')
  and user_id is null -- link only via redeem_invite (D-03/D-04)
);

-- with check here pins the NEW row's org to the actor's org (Pitfall 6);
-- user_id immutability on UPDATE comes from the column-level grant above.
create policy "update patients as staff"
on public.patients
for update to authenticated
using (
  (select private.user_org_role(org_id)) in ('provider_doctor', 'nurse', 'receptionist', 'admin_owner')
)
with check (
  (select private.user_org_role(org_id)) in ('provider_doctor', 'nurse', 'receptionist', 'admin_owner')
);

-- Audit — 03-CONTEXT D-14's trigger pattern extended to the phase's clinical
-- table, copy-structured from 0003's audit functions (same jsonb diff shape).
create function private.audit_patients_change() returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.audit_log (actor, action, entity, entity_id, org_id, diff)
    values (coalesce(auth.uid(), new.user_id), tg_op, 'patients', new.id, new.org_id, null);
    return new;
  elsif tg_op = 'UPDATE' then
    insert into public.audit_log (actor, action, entity, entity_id, org_id, diff)
    values (coalesce(auth.uid(), new.user_id), tg_op, 'patients', new.id, new.org_id,
            jsonb_build_object('before', to_jsonb(old), 'after', to_jsonb(new)));
    return new;
  else
    insert into public.audit_log (actor, action, entity, entity_id, org_id, diff)
    values (coalesce(auth.uid(), old.user_id), tg_op, 'patients', old.id, old.org_id,
            jsonb_build_object('before', to_jsonb(old)));
    return old;
  end if;
end;
$$;

create trigger audit_patients after insert or update or delete
on public.patients for each row
execute function private.audit_patients_change();
