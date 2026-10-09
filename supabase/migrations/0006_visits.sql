-- Migration 0006: visits (the encounter table), org-scoped RLS, role-aware
-- clinical-content guard, trigger-owned provenance, patient activity bump,
-- audit (phase 07).
-- Binds PRODUCT-MASTER-SPEC.md §13 (Encounter/Visit in the relational chain),
-- §23 (provenance), §3.1/§12 (authorization enforced server-side), and the
-- VIS-01..03 requirements.
--
-- Composes the established patterns, copied not reinvented:
--   0003  audit trigger-per-table (before/after jsonb diff, entity name).
--   0005  trigger-owned provenance; private.user_org_role as the ONLY
--         membership reader; grants revoke-then-regrant; column-level grants
--         that keep org/patient/author columns out of app UPDATEs; no delete
--         policy and no delete grant (a clinical record is not a product
--         delete action); the activity-bump-on-change idiom.
--
-- ROLE LIMIT (VIS-03): Postgres grants are per DATABASE role, and every app
-- user is `authenticated`, so a column-level grant cannot distinguish a
-- receptionist from a doctor. The clinical-content limit is therefore enforced
-- by a role-aware BEFORE trigger (`private.guard_visit_content`): a principal
-- whose org role lacks clinical authoring may create a visit and edit its
-- scheduling fields, but may not write or change reason/documentation/
-- follow-up. The server action re-checks the same capability, and the UI hides
-- the fields — three layers, one rule (§3.1/§12).
--
-- Trigger-owned: created_by/updated_by (from auth.uid()), created_at/
-- updated_at. App code must never write them (0005 discipline).
--
-- `session_replication_role` is never set here — that bypass belongs to
-- supabase/seed.sql's deterministic fixtures only.

create table public.visits (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  -- The closed stage vocabulary, mirrored byte-for-byte by
  -- src/lib/visits/status.ts (0005's drift discipline).
  stage text not null default 'pre_visit'
    check (stage in ('pre_visit', 'during_visit', 'after_visit')),
  scheduled_at timestamptz not null,
  visit_type text,
  location text,
  -- Clinical content (CAN_AUTHOR_CLINICAL only, enforced by trigger below).
  reason text,
  documentation text,
  follow_up text,
  follow_up_at date,
  -- Provenance (§23): where the record came from and who touched it. A future
  -- AI-extracted visit must be distinguishable from a clinician one.
  source text not null default 'clinician'
    check (source in ('clinician', 'ai-extracted', 'imported')),
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index visits_org_scheduled_idx on public.visits (org_id, scheduled_at desc, id desc);
create index visits_patient_scheduled_idx on public.visits (patient_id, scheduled_at desc, id desc);
create index visits_org_stage_idx on public.visits (org_id, stage);

-- Provenance ownership: authors and timestamps are trigger-set from the
-- verified session; a client-supplied value can never survive.
create function private.touch_visit_provenance() returns trigger
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

create trigger touch_visit_provenance
before insert or update on public.visits
for each row
execute function private.touch_visit_provenance();

-- Org integrity (the patient must belong to the visit's org — defence on top
-- of the FK, 0005's invite-link pattern) plus the role-aware clinical guard.
create function private.guard_visit_content() returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_patient_org uuid;
  v_role text;
  v_authors_clinical boolean;
begin
  select org_id into v_patient_org from public.patients where id = new.patient_id;
  if v_patient_org is null then
    raise exception 'visit_patient_missing';
  end if;
  if v_patient_org <> new.org_id then
    raise exception 'visit_patient_mismatch';
  end if;

  v_role := private.user_org_role(new.org_id);
  -- CAN_AUTHOR_CLINICAL holders per src/lib/auth/capabilities.ts (D-09).
  v_authors_clinical := v_role = 'provider_doctor';

  if not v_authors_clinical then
    if tg_op = 'INSERT' then
      if new.reason is not null or new.documentation is not null
         or new.follow_up is not null or new.follow_up_at is not null then
        raise exception 'visit_clinical_forbidden';
      end if;
    else
      if new.reason is distinct from old.reason
         or new.documentation is distinct from old.documentation
         or new.follow_up is distinct from old.follow_up
         or new.follow_up_at is distinct from old.follow_up_at then
        raise exception 'visit_clinical_forbidden';
      end if;
    end if;
  end if;

  return new;
end;
$$;

create trigger guard_visit_content
before insert or update on public.visits
for each row
execute function private.guard_visit_content();

-- A visit IS activity on the patient's record (0005's D-22 idiom): creating or
-- changing one bumps last_activity_at so the folder workspace reflects it.
create function private.visit_patient_activity() returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.patients
  set last_activity_at = now() -- touch_patient_timestamps owns updated_at
  where id = new.patient_id;
  return new;
end;
$$;

create trigger visit_patient_activity
after insert or update on public.visits
for each row
execute function private.visit_patient_activity();

-- RLS + grants (0005 shape). Column-level lists keep org_id/patient_id/authors
-- out of app UPDATEs; a visit is never reparented.
alter table public.visits enable row level security;

revoke all on public.visits from anon, authenticated, service_role;
grant select on public.visits to authenticated;
grant insert (org_id, patient_id, stage, scheduled_at, visit_type, location, reason, documentation, follow_up, follow_up_at)
  on public.visits to authenticated;
grant update (stage, scheduled_at, visit_type, location, reason, documentation, follow_up, follow_up_at)
  on public.visits to authenticated;
-- no delete grant, no update grant on org_id/patient_id/source/created_by/…

create policy "select visits as staff"
on public.visits
for select to authenticated
using (
  (select private.user_org_role(org_id)) in ('provider_doctor', 'nurse', 'receptionist', 'admin_owner')
);

create policy "insert visits as staff"
on public.visits
for insert to authenticated
with check (
  (select private.user_org_role(org_id)) in ('provider_doctor', 'nurse', 'receptionist', 'admin_owner')
);

create policy "update visits as staff"
on public.visits
for update to authenticated
using (
  (select private.user_org_role(org_id)) in ('provider_doctor', 'nurse', 'receptionist', 'admin_owner')
)
with check (
  (select private.user_org_role(org_id)) in ('provider_doctor', 'nurse', 'receptionist', 'admin_owner')
);

-- Audit — 0003's trigger pattern, entity 'visits'.
create function private.audit_visits_change() returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.audit_log (actor, action, entity, entity_id, org_id, diff)
    values (coalesce(auth.uid(), new.created_by), tg_op, 'visits', new.id, new.org_id, null);
    return new;
  elsif tg_op = 'UPDATE' then
    insert into public.audit_log (actor, action, entity, entity_id, org_id, diff)
    values (coalesce(auth.uid(), new.updated_by), tg_op, 'visits', new.id, new.org_id,
            jsonb_build_object('before', to_jsonb(old), 'after', to_jsonb(new)));
    return new;
  else
    insert into public.audit_log (actor, action, entity, entity_id, org_id, diff)
    values (coalesce(auth.uid(), old.updated_by), tg_op, 'visits', old.id, old.org_id,
            jsonb_build_object('before', to_jsonb(old)));
    return old;
  end if;
end;
$$;

create trigger audit_visits after insert or update or delete
on public.visits for each row
execute function private.audit_visits_change();
