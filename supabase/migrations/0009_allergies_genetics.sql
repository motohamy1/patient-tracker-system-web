-- Migration 0009: allergies + genetics with strong provenance and DATA-LAYER
-- role visibility for sensitive categories (phase 10).
-- Binds PRODUCT-MASTER-SPEC.md §13/§23, §12 (authorization enforced by the
-- database, not the UI), and ALG-01..03.
--
-- VISIBILITY (the phase's core requirement, ALG-03):
--   allergies  → all four staff roles. Allergy safety is a bedside fact; a
--                receptionist must never be able to hide it from a clinician.
--   genetics   → `provider_doctor` + `admin_owner` ONLY. A sensitive category;
--                the restriction lives in the SELECT policy, mirrored by
--                `CAN_VIEW_GENETICS` in src/lib/auth/capabilities.ts so the
--                UI shows a truthful denial instead of an empty list.
-- Writes (insert/update) on BOTH tables require `provider_doctor`
-- (CAN_AUTHOR_CLINICAL), enforced in the policy AND a definer guard trigger.
--
-- `verification` is a real column (`clinician-verified` | `ai-extracted`) so an
-- AI-extracted allergy/finding can never render as clinician-verified (§23);
-- manual entry defaults to clinician-verified, and Phase 12's OCR sets the
-- other value explicitly.
--
-- Patterns composed: 0003 audit; 0005 provenance/private.user_org_role/
-- column grants/no-delete/activity bump; 0006/0008 authoring guard + org
-- integrity. `session_replication_role` is never set here.

create table public.allergies (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  allergen text not null,
  reaction text,
  severity text check (severity in ('mild', 'moderate', 'severe', 'anaphylaxis')),
  status text not null default 'active' check (status in ('active', 'resolved')),
  noted_at timestamptz not null default now(),
  notes text,
  source text not null default 'clinician' check (source in ('clinician', 'ai-extracted', 'imported')),
  verification text not null default 'clinician-verified'
    check (verification in ('clinician-verified', 'ai-extracted')),
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index allergies_org_patient_idx on public.allergies (org_id, patient_id, noted_at desc, id desc);
create index allergies_org_status_idx on public.allergies (org_id, status);

create table public.genetics (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  kind text not null check (kind in ('variant', 'pharmacogenomic', 'hereditary-condition', 'other')),
  gene text,
  variant text,
  interpretation text,
  significance text check (significance in ('pathogenic', 'likely_pathogenic', 'uncertain', 'likely_benign', 'benign')),
  reported_at timestamptz not null default now(),
  -- The report document (0008 documents table); optional.
  document_id uuid references public.documents(id) on delete set null,
  source text not null default 'clinician' check (source in ('clinician', 'ai-extracted', 'imported')),
  verification text not null default 'clinician-verified'
    check (verification in ('clinician-verified', 'ai-extracted')),
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index genetics_org_patient_idx on public.genetics (org_id, patient_id, reported_at desc, id desc);

-- Provenance ownership (both tables).
create function private.touch_clinical_provenance() returns trigger
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

create trigger touch_allergies_provenance before insert or update on public.allergies
for each row execute function private.touch_clinical_provenance();
create trigger touch_genetics_provenance before insert or update on public.genetics
for each row execute function private.touch_clinical_provenance();

-- Org integrity + authoring guard. A genetics row's optional document must
-- belong to the same patient/org (the 0008 relationship, integrity-checked).
create function private.guard_allergy_content() returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_patient_org uuid;
begin
  select org_id into v_patient_org from public.patients where id = new.patient_id;
  if v_patient_org is null then raise exception 'allergy_patient_missing'; end if;
  if v_patient_org <> new.org_id then raise exception 'allergy_patient_mismatch'; end if;
  if coalesce(private.user_org_role(new.org_id), '') <> 'provider_doctor' then
    raise exception 'allergy_clinical_forbidden';
  end if;
  return new;
end;
$$;

create trigger guard_allergy_content before insert or update on public.allergies
for each row execute function private.guard_allergy_content();

create function private.guard_genetic_content() returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_patient_org uuid;
begin
  select org_id into v_patient_org from public.patients where id = new.patient_id;
  if v_patient_org is null then raise exception 'genetic_patient_missing'; end if;
  if v_patient_org <> new.org_id then raise exception 'genetic_patient_mismatch'; end if;
  if coalesce(private.user_org_role(new.org_id), '') <> 'provider_doctor' then
    raise exception 'genetic_clinical_forbidden';
  end if;
  if new.document_id is not null then
    if not exists (select 1 from public.documents d
                   where d.id = new.document_id and d.org_id = new.org_id and d.patient_id = new.patient_id) then
      raise exception 'genetic_document_mismatch';
    end if;
  end if;
  return new;
end;
$$;

create trigger guard_genetic_content before insert or update on public.genetics
for each row execute function private.guard_genetic_content();

-- Activity follows the patient.
create trigger activity_allergies after insert or update on public.allergies
for each row execute function private.clinical_patient_activity();
create trigger activity_genetics after insert or update on public.genetics
for each row execute function private.clinical_patient_activity();

-- RLS + grants.
alter table public.allergies enable row level security;
alter table public.genetics enable row level security;

revoke all on public.allergies from anon, authenticated, service_role;
grant select on public.allergies to authenticated;
grant insert (org_id, patient_id, allergen, reaction, severity, status, noted_at, notes) on public.allergies to authenticated;
grant update (allergen, reaction, severity, status, noted_at, notes) on public.allergies to authenticated;

revoke all on public.genetics from anon, authenticated, service_role;
grant select on public.genetics to authenticated;
grant insert (org_id, patient_id, kind, gene, variant, interpretation, significance, reported_at, document_id) on public.genetics to authenticated;
grant update (kind, gene, variant, interpretation, significance, reported_at, document_id) on public.genetics to authenticated;

-- SELECT: allergies to all staff…
create policy "select allergies as staff"
on public.allergies for select to authenticated
using ((select private.user_org_role(org_id)) in ('provider_doctor', 'nurse', 'receptionist', 'admin_owner'));

-- …genetics ONLY to the authorized sensitive-category roles (ALG-03).
create policy "select genetics as authorized clinicians"
on public.genetics for select to authenticated
using ((select private.user_org_role(org_id)) in ('provider_doctor', 'admin_owner'));

-- Writes: provider_doctor only, in both policies and the guards above.
create policy "insert allergies as author"
on public.allergies for insert to authenticated
with check ((select private.user_org_role(org_id)) = 'provider_doctor');
create policy "update allergies as author"
on public.allergies for update to authenticated
using ((select private.user_org_role(org_id)) = 'provider_doctor')
with check ((select private.user_org_role(org_id)) = 'provider_doctor');

create policy "insert genetics as author"
on public.genetics for insert to authenticated
with check ((select private.user_org_role(org_id)) = 'provider_doctor');
create policy "update genetics as author"
on public.genetics for update to authenticated
using ((select private.user_org_role(org_id)) = 'provider_doctor')
with check ((select private.user_org_role(org_id)) = 'provider_doctor');

-- Audit (0003 pattern) for both tables.
create function private.audit_allergies_change() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.audit_log (actor, action, entity, entity_id, org_id, diff)
    values (coalesce(auth.uid(), new.created_by), tg_op, 'allergies', new.id, new.org_id, null);
    return new;
  elsif tg_op = 'UPDATE' then
    insert into public.audit_log (actor, action, entity, entity_id, org_id, diff)
    values (coalesce(auth.uid(), new.updated_by), tg_op, 'allergies', new.id, new.org_id,
            jsonb_build_object('before', to_jsonb(old), 'after', to_jsonb(new)));
    return new;
  else
    insert into public.audit_log (actor, action, entity, entity_id, org_id, diff)
    values (coalesce(auth.uid(), old.updated_by), tg_op, 'allergies', old.id, old.org_id,
            jsonb_build_object('before', to_jsonb(old)));
    return old;
  end if;
end;
$$;

create trigger audit_allergies after insert or update or delete on public.allergies
for each row execute function private.audit_allergies_change();

create function private.audit_genetics_change() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.audit_log (actor, action, entity, entity_id, org_id, diff)
    values (coalesce(auth.uid(), new.created_by), tg_op, 'genetics', new.id, new.org_id, null);
    return new;
  elsif tg_op = 'UPDATE' then
    insert into public.audit_log (actor, action, entity, entity_id, org_id, diff)
    values (coalesce(auth.uid(), new.updated_by), tg_op, 'genetics', new.id, new.org_id,
            jsonb_build_object('before', to_jsonb(old), 'after', to_jsonb(new)));
    return new;
  else
    insert into public.audit_log (actor, action, entity, entity_id, org_id, diff)
    values (coalesce(auth.uid(), old.updated_by), tg_op, 'genetics', old.id, old.org_id,
            jsonb_build_object('before', to_jsonb(old)));
    return old;
  end if;
end;
$$;

create trigger audit_genetics after insert or update or delete on public.genetics
for each row execute function private.audit_genetics_change();
