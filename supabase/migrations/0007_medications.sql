-- Migration 0007: medications + medication_events (the lifecycle history),
-- org-scoped RLS, trigger-owned provenance and status history, audit
-- (phase 08).
-- Binds PRODUCT-MASTER-SPEC.md §13 (Medications in the relational chain),
-- §23 (provenance), §19 Ph008 (start → active → change → pause/stop →
-- historical), and MED-01..03.
--
-- TWO TABLES, ONE STORY:
--   medications        the CURRENT state (structured dose/frequency/route,
--                      status, dates, provenance) — never a JSON blob.
--   medication_events  the HISTORY: one row per lifecycle transition, written
--                      by a trigger so state and trail can never drift
--                      (MED-02 projects this table; the current row is never
--                      the timeline source).
--
-- CDSS-READY, DECISION-FREE (MED-03/§27): dose is numeric + unit, frequency
-- and route are closed vocabularies mirrored in src/lib/medications/status.ts,
-- and `rxnorm_code` reserves the normalisation slot a later phase fills. There
-- is NO interaction, contraindication or dosing-decision logic anywhere.
--
-- Patterns composed (copied, not reinvented): 0003 audit triggers; 0005
-- trigger-owned provenance / private.user_org_role / grant discipline /
-- no-delete / activity bump; 0006 role-aware guard (CAN_AUTHOR_CLINICAL).
--
-- `session_replication_role` is never set here — that bypass stays in
-- supabase/seed.sql.

-- ── medications ────────────────────────────────────────────────────────────
create table public.medications (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  name text not null,
  -- Structured dose (§13/MED-03): amount + unit are separate, queryable facts.
  dose_amount numeric(10, 3),
  dose_unit text,
  -- Closed vocabularies, mirrored in TypeScript (drift-checked like 0005).
  frequency text check (frequency in ('once_daily', 'twice_daily', 'three_times_daily', 'four_times_daily', 'weekly', 'as_needed')),
  route text check (route in ('oral', 'topical', 'inhaled', 'injection', 'sublingual', 'rectal', 'ophthalmic', 'otic', 'nasal', 'other')),
  status text not null default 'active' check (status in ('active', 'paused', 'stopped')),
  started_at timestamptz not null default now(),
  paused_at timestamptz,
  stopped_at timestamptz,
  -- Normalisation slot for a later vocabulary phase; never guessed here.
  rxnorm_code text,
  source text not null default 'clinician'
    check (source in ('clinician', 'ai-extracted', 'imported')),
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index medications_org_patient_idx on public.medications (org_id, patient_id, started_at desc, id desc);
create index medications_org_status_idx on public.medications (org_id, status);

-- ── medication_events (the history) ────────────────────────────────────────
create table public.medication_events (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  medication_id uuid not null references public.medications(id) on delete cascade,
  kind text not null check (kind in ('started', 'changed', 'paused', 'resumed', 'stopped')),
  at timestamptz not null default now(),
  -- Structured before/after snapshot (the 0003 diff shape) — never prose.
  detail jsonb,
  actor uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index medication_events_org_at_idx on public.medication_events (org_id, at desc, id desc);
create index medication_events_patient_at_idx on public.medication_events (patient_id, at desc, id desc);
create index medication_events_medication_idx on public.medication_events (medication_id, at);

-- Provenance ownership on the current row (0005 idiom).
create function private.touch_medication_provenance() returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    new.created_by := coalesce(auth.uid(), new.created_by);
    new.updated_by := coalesce(auth.uid(), new.updated_by, new.created_by);
    new.created_at := now();
  else
    new.updated_by := coalesce(auth.uid(), new.updated_by);
  end if;
  new.updated_at := now();
  return new;
end;
$$;

create trigger touch_medication_provenance
before insert or update on public.medications
for each row
execute function private.touch_medication_provenance();

-- The history is DB-owned: an insert writes `started`; an update writes exactly
-- one event for what actually changed (`changed`, `paused`, `resumed`,
-- `stopped`). Because this fires in the SAME statement as the row write, the
-- current state and the trail are atomic by construction (MED-01/MED-02).
create function private.record_medication_event() returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_kind text;
  v_detail jsonb;
begin
  if tg_op = 'INSERT' then
    insert into public.medication_events (org_id, patient_id, medication_id, kind, at, detail, actor)
    values (new.org_id, new.patient_id, new.id, 'started', new.started_at,
            jsonb_build_object('after', to_jsonb(new)), coalesce(auth.uid(), new.created_by));
    return new;
  end if;

  if new.status is distinct from old.status then
    v_kind := case new.status
      when 'paused' then 'paused'
      when 'stopped' then 'stopped'
      when 'active' then 'resumed'
      else 'changed'
    end;
  elsif new.dose_amount is distinct from old.dose_amount
     or new.dose_unit is distinct from old.dose_unit
     or new.frequency is distinct from old.frequency
     or new.route is distinct from old.route
     or new.name is distinct from old.name
     or new.rxnorm_code is distinct from old.rxnorm_code then
    v_kind := 'changed';
  else
    return new; -- a provenance-only touch is not a clinical event
  end if;

  v_detail := jsonb_build_object('before',
    jsonb_build_object('name', old.name, 'dose_amount', old.dose_amount, 'dose_unit', old.dose_unit,
                       'frequency', old.frequency, 'route', old.route, 'status', old.status),
    'after',
    jsonb_build_object('name', new.name, 'dose_amount', new.dose_amount, 'dose_unit', new.dose_unit,
                       'frequency', new.frequency, 'route', new.route, 'status', new.status));

  insert into public.medication_events (org_id, patient_id, medication_id, kind, at, detail, actor)
  values (new.org_id, new.patient_id, new.id, v_kind, now(), v_detail,
          coalesce(auth.uid(), new.updated_by));
  return new;
end;
$$;

create trigger record_medication_event
after insert or update on public.medications
for each row
execute function private.record_medication_event();

-- Org integrity + clinical-authoring guard (0006's pattern, shared rule).
create function private.guard_medication_content() returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_patient_org uuid;
begin
  select org_id into v_patient_org from public.patients where id = new.patient_id;
  if v_patient_org is null then
    raise exception 'medication_patient_missing';
  end if;
  if v_patient_org <> new.org_id then
    raise exception 'medication_patient_mismatch';
  end if;

  -- Only CAN_AUTHOR_CLINICAL holders (D-09: provider_doctor) may author.
  if coalesce(private.user_org_role(new.org_id), '') <> 'provider_doctor' then
    raise exception 'medication_clinical_forbidden';
  end if;

  return new;
end;
$$;

create trigger guard_medication_content
before insert or update on public.medications
for each row
execute function private.guard_medication_content();

-- Activity follows the patient (0005 D-22 idiom).
create function private.medication_patient_activity() returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.patients set last_activity_at = now() where id = new.patient_id;
  return new;
end;
$$;

create trigger medication_patient_activity
after insert or update on public.medications
for each row
execute function private.medication_patient_activity();

-- ── RLS + grants ───────────────────────────────────────────────────────────
alter table public.medications enable row level security;

revoke all on public.medications from anon, authenticated, service_role;
grant select on public.medications to authenticated;
grant insert (org_id, patient_id, name, dose_amount, dose_unit, frequency, route, started_at, rxnorm_code)
  on public.medications to authenticated;
grant update (name, dose_amount, dose_unit, frequency, route, status, paused_at, stopped_at, rxnorm_code)
  on public.medications to authenticated;
-- no delete grant; org_id/patient_id/source/created_by/… are never app-writable

create policy "select medications as staff"
on public.medications
for select to authenticated
using (
  (select private.user_org_role(org_id)) in ('provider_doctor', 'nurse', 'receptionist', 'admin_owner')
);

create policy "insert medications as staff"
on public.medications
for insert to authenticated
with check (
  (select private.user_org_role(org_id)) in ('provider_doctor', 'nurse', 'receptionist', 'admin_owner')
);

create policy "update medications as staff"
on public.medications
for update to authenticated
using (
  (select private.user_org_role(org_id)) in ('provider_doctor', 'nurse', 'receptionist', 'admin_owner')
)
with check (
  (select private.user_org_role(org_id)) in ('provider_doctor', 'nurse', 'receptionist', 'admin_owner')
);

alter table public.medication_events enable row level security;

revoke all on public.medication_events from anon, authenticated, service_role;
-- SELECT only: the history is written EXCLUSIVELY by the definer trigger above.
grant select on public.medication_events to authenticated;

create policy "select medication events as staff"
on public.medication_events
for select to authenticated
using (
  (select private.user_org_role(org_id)) in ('provider_doctor', 'nurse', 'receptionist', 'admin_owner')
);

-- ── audit (0003 pattern) ───────────────────────────────────────────────────
create function private.audit_medications_change() returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.audit_log (actor, action, entity, entity_id, org_id, diff)
    values (coalesce(auth.uid(), new.created_by), tg_op, 'medications', new.id, new.org_id, null);
    return new;
  elsif tg_op = 'UPDATE' then
    insert into public.audit_log (actor, action, entity, entity_id, org_id, diff)
    values (coalesce(auth.uid(), new.updated_by), tg_op, 'medications', new.id, new.org_id,
            jsonb_build_object('before', to_jsonb(old), 'after', to_jsonb(new)));
    return new;
  else
    insert into public.audit_log (actor, action, entity, entity_id, org_id, diff)
    values (coalesce(auth.uid(), old.updated_by), tg_op, 'medications', old.id, old.org_id,
            jsonb_build_object('before', to_jsonb(old)));
    return old;
  end if;
end;
$$;

create trigger audit_medications after insert or update or delete
on public.medications for each row
execute function private.audit_medications_change();

create function private.audit_medication_events_change() returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.audit_log (actor, action, entity, entity_id, org_id, diff)
    values (new.actor, tg_op, 'medication_events', new.id, new.org_id, null);
    return new;
  else
    insert into public.audit_log (actor, action, entity, entity_id, org_id, diff)
    values (coalesce(auth.uid(), old.actor), tg_op, 'medication_events', old.id, old.org_id,
            jsonb_build_object('before', to_jsonb(old)));
    return old;
  end if;
end;
$$;

create trigger audit_medication_events after insert or delete
on public.medication_events for each row
execute function private.audit_medication_events_change();
