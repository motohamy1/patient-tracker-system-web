-- Migration 0008: labs + imaging lifecycles, documents/media, provenance, RLS
-- (phase 09).
-- Binds PRODUCT-MASTER-SPEC.md §13 (Labs/Imaging/Documents in the relational
-- chain), §23 (provenance), §19 Ph009 ("lifecycles, provenance, document/media
-- relationships, and timeline projection"), and LAB-01..03.
--
-- Shape: an ORDER is the lifecycle (ordered → resulted | cancelled); a RESULT
-- is an immutable clinical fact (insert-only) that flips its order to
-- `resulted` in the same statement (trigger), so status can never drift from
-- the facts. Media lives in `documents` (metadata) with a private Storage
-- bucket; a result may link the document that carries its report/scan.
--
-- Patterns composed: 0003 audit; 0005 trigger-owned provenance /
-- private.user_org_role / column grants / no-delete / activity bump; 0006
-- authoring guard (CAN_AUTHOR_CLINICAL) + org integrity on every table.
--
-- `session_replication_role` is never set here (seed-only bypass).

-- ── documents (media metadata) ─────────────────────────────────────────────
create table public.documents (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  kind text not null check (kind in ('lab_report', 'imaging_report', 'prescription', 'referral', 'other')),
  storage_path text not null,
  filename text not null,
  mime_type text,
  size_bytes bigint check (size_bytes is null or size_bytes >= 0),
  source text not null default 'clinician' check (source in ('clinician', 'ai-extracted', 'imported')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create unique index documents_storage_path_uq on public.documents (storage_path);
create index documents_org_patient_idx on public.documents (org_id, patient_id, created_at desc);

-- ── lab_orders / lab_results ───────────────────────────────────────────────
create table public.lab_orders (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  name text not null,
  ordered_at timestamptz not null default now(),
  status text not null default 'ordered' check (status in ('ordered', 'resulted', 'cancelled')),
  notes text,
  document_id uuid references public.documents(id) on delete set null,
  source text not null default 'clinician' check (source in ('clinician', 'ai-extracted', 'imported')),
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index lab_orders_org_patient_idx on public.lab_orders (org_id, patient_id, ordered_at desc, id desc);
create index lab_orders_org_status_idx on public.lab_orders (org_id, status);

create table public.lab_results (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  order_id uuid not null references public.lab_orders(id) on delete cascade,
  -- Structured result (§13): a queryable analyte + numeric value + unit +
  -- reference range + a closed flag. Never prose.
  analyte text not null,
  value numeric(14, 4),
  unit text,
  reference_range text,
  flag text check (flag in ('normal', 'low', 'high', 'critical')),
  resulted_at timestamptz not null default now(),
  document_id uuid references public.documents(id) on delete set null,
  source text not null default 'clinician' check (source in ('clinician', 'ai-extracted', 'imported')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index lab_results_org_patient_idx on public.lab_results (org_id, patient_id, resulted_at desc, id desc);
create index lab_results_order_idx on public.lab_results (order_id, resulted_at);

-- ── imaging_orders / imaging_results ───────────────────────────────────────
create table public.imaging_orders (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  modality text not null,
  body_site text,
  ordered_at timestamptz not null default now(),
  status text not null default 'ordered' check (status in ('ordered', 'resulted', 'cancelled')),
  notes text,
  source text not null default 'clinician' check (source in ('clinician', 'ai-extracted', 'imported')),
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index imaging_orders_org_patient_idx on public.imaging_orders (org_id, patient_id, ordered_at desc, id desc);

create table public.imaging_results (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  order_id uuid not null references public.imaging_orders(id) on delete cascade,
  impression text not null,
  resulted_at timestamptz not null default now(),
  document_id uuid references public.documents(id) on delete set null,
  source text not null default 'clinician' check (source in ('clinician', 'ai-extracted', 'imported')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index imaging_results_org_patient_idx on public.imaging_results (org_id, patient_id, resulted_at desc, id desc);
create index imaging_results_order_idx on public.imaging_results (order_id, resulted_at);

-- ── provenance touch (orders + documents) ──────────────────────────────────
create function private.touch_order_provenance() returns trigger
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

create trigger touch_lab_order_provenance before insert or update on public.lab_orders
for each row execute function private.touch_order_provenance();
create trigger touch_imaging_order_provenance before insert or update on public.imaging_orders
for each row execute function private.touch_order_provenance();

-- ── org integrity + authoring guard on orders ──────────────────────────────
create function private.guard_order_content() returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_patient_org uuid;
begin
  select org_id into v_patient_org from public.patients where id = new.patient_id;
  if v_patient_org is null then
    raise exception 'order_patient_missing';
  end if;
  if v_patient_org <> new.org_id then
    raise exception 'order_patient_mismatch';
  end if;
  if coalesce(private.user_org_role(new.org_id), '') <> 'provider_doctor' then
    raise exception 'order_clinical_forbidden';
  end if;
  return new;
end;
$$;

create trigger guard_lab_order before insert or update on public.lab_orders
for each row execute function private.guard_order_content();
create trigger guard_imaging_order before insert or update on public.imaging_orders
for each row execute function private.guard_order_content();

-- ── result integrity + the lifecycle flip ─────────────────────────────────
-- A result must belong to an order of the SAME patient/org, must not attach to
-- a cancelled order, must reference a document of the same patient when one is
-- given, and — atomically — marks the order `resulted`.
create function private.guard_and_apply_lab_result() returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.lab_orders;
begin
  select * into v_order from public.lab_orders where id = new.order_id;
  if not found then raise exception 'lab_result_order_missing'; end if;
  if v_order.org_id <> new.org_id or v_order.patient_id <> new.patient_id then
    raise exception 'lab_result_order_mismatch';
  end if;
  if v_order.status = 'cancelled' then raise exception 'lab_result_order_cancelled'; end if;
  if new.document_id is not null then
    if not exists (select 1 from public.documents d
                   where d.id = new.document_id and d.org_id = new.org_id and d.patient_id = new.patient_id) then
      raise exception 'lab_result_document_mismatch';
    end if;
  end if;

  update public.lab_orders
  set status = 'resulted' -- touch_order_provenance owns updated_at
  where id = new.order_id and status <> 'resulted';

  return new;
end;
$$;

create trigger guard_lab_result before insert on public.lab_results
for each row execute function private.guard_and_apply_lab_result();

create function private.guard_and_apply_imaging_result() returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.imaging_orders;
begin
  select * into v_order from public.imaging_orders where id = new.order_id;
  if not found then raise exception 'imaging_result_order_missing'; end if;
  if v_order.org_id <> new.org_id or v_order.patient_id <> new.patient_id then
    raise exception 'imaging_result_order_mismatch';
  end if;
  if v_order.status = 'cancelled' then raise exception 'imaging_result_order_cancelled'; end if;
  if new.document_id is not null then
    if not exists (select 1 from public.documents d
                   where d.id = new.document_id and d.org_id = new.org_id and d.patient_id = new.patient_id) then
      raise exception 'imaging_result_document_mismatch';
    end if;
  end if;

  update public.imaging_orders
  set status = 'resulted'
  where id = new.order_id and status <> 'resulted';

  return new;
end;
$$;

create trigger guard_imaging_result before insert on public.imaging_results
for each row execute function private.guard_and_apply_imaging_result();

-- ── activity follows the patient ───────────────────────────────────────────
create function private.clinical_patient_activity() returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.patients set last_activity_at = now() where id = new.patient_id;
  return new;
end;
$$;

create trigger activity_lab_orders after insert or update on public.lab_orders
for each row execute function private.clinical_patient_activity();
create trigger activity_imaging_orders after insert or update on public.imaging_orders
for each row execute function private.clinical_patient_activity();
create trigger activity_lab_results after insert on public.lab_results
for each row execute function private.clinical_patient_activity();
create trigger activity_imaging_results after insert on public.imaging_results
for each row execute function private.clinical_patient_activity();
create trigger activity_documents after insert on public.documents
for each row execute function private.clinical_patient_activity();

-- ── RLS + grants ───────────────────────────────────────────────────────────
alter table public.documents enable row level security;
alter table public.lab_orders enable row level security;
alter table public.lab_results enable row level security;
alter table public.imaging_orders enable row level security;
alter table public.imaging_results enable row level security;

do $$
declare
  t text;
begin
  foreach t in array array['documents', 'lab_orders', 'lab_results', 'imaging_orders', 'imaging_results']
  loop
    execute format('revoke all on public.%I from anon, authenticated, service_role', t);
    execute format('grant select on public.%I to authenticated', t);
  end loop;
end;
$$;

grant insert (org_id, patient_id, kind, storage_path, filename, mime_type, size_bytes) on public.documents to authenticated;
grant insert (org_id, patient_id, name, ordered_at, notes) on public.lab_orders to authenticated;
grant update (name, ordered_at, status, notes, document_id) on public.lab_orders to authenticated;
grant insert (org_id, patient_id, order_id, analyte, value, unit, reference_range, flag, resulted_at, document_id) on public.lab_results to authenticated;
grant insert (org_id, patient_id, modality, body_site, ordered_at, notes) on public.imaging_orders to authenticated;
grant update (modality, body_site, ordered_at, status, notes) on public.imaging_orders to authenticated;
grant insert (org_id, patient_id, order_id, impression, resulted_at, document_id) on public.imaging_results to authenticated;
-- results are insert-only clinical facts: no update, no delete anywhere.

-- One policy shape per table, staff-scoped (private.user_org_role is the only
-- membership reader). Documents are staff-selectable (media follows its record).
do $$
declare
  t text;
begin
  foreach t in array array['documents', 'lab_orders', 'lab_results', 'imaging_orders', 'imaging_results']
  loop
    execute format($f$
      create policy "select %1$s as staff" on public.%1$I
      for select to authenticated
      using ((select private.user_org_role(org_id)) in ('provider_doctor', 'nurse', 'receptionist', 'admin_owner'))
    $f$, t);
    execute format($f$
      create policy "insert %1$s as staff" on public.%1$I
      for insert to authenticated
      with check ((select private.user_org_role(org_id)) in ('provider_doctor', 'nurse', 'receptionist', 'admin_owner'))
    $f$, t);
  end loop;
end;
$$;

create policy "update lab_orders as staff" on public.lab_orders
for update to authenticated
using ((select private.user_org_role(org_id)) in ('provider_doctor', 'nurse', 'receptionist', 'admin_owner'))
with check ((select private.user_org_role(org_id)) in ('provider_doctor', 'nurse', 'receptionist', 'admin_owner'));

create policy "update imaging_orders as staff" on public.imaging_orders
for update to authenticated
using ((select private.user_org_role(org_id)) in ('provider_doctor', 'nurse', 'receptionist', 'admin_owner'))
with check ((select private.user_org_role(org_id)) in ('provider_doctor', 'nurse', 'receptionist', 'admin_owner'));

-- ── Storage: a private bucket, org-scoped object policies ─────────────────
-- Object names follow `<org_id>/<patient_id>/<uuid>`; the policies read the
-- org from the path and reuse the SAME membership helper as the tables, so
-- media access and record access can never disagree. Upload UI is a later
-- phase; this makes the bucket safe the moment anything writes to it.
insert into storage.buckets (id, name, public)
values ('patient-documents', 'patient-documents', false)
on conflict (id) do nothing;

create policy "select patient-documents as staff"
on storage.objects for select to authenticated
using (
  bucket_id = 'patient-documents'
  and (select private.user_org_role((split_part(name, '/', 1))::uuid)) in ('provider_doctor', 'nurse', 'receptionist', 'admin_owner')
);

create policy "insert patient-documents as staff"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'patient-documents'
  and (select private.user_org_role((split_part(name, '/', 1))::uuid)) in ('provider_doctor', 'nurse', 'receptionist', 'admin_owner')
);

-- ── audit (0003 pattern) ───────────────────────────────────────────────────
do $$
declare
  t text;
  fn text;
begin
  foreach t in array array['documents', 'lab_orders', 'lab_results', 'imaging_orders', 'imaging_results']
  loop
    fn := format('audit_%s_change', t);
    execute format($f$
      create function private.%1$I() returns trigger
      language plpgsql security definer set search_path = ''
      as $body$
      begin
        if tg_op = 'INSERT' then
          insert into public.audit_log (actor, action, entity, entity_id, org_id, diff)
          values (coalesce(auth.uid(), new.created_by), tg_op, %2$L, new.id, new.org_id, null);
          return new;
        elsif tg_op = 'UPDATE' then
          insert into public.audit_log (actor, action, entity, entity_id, org_id, diff)
          values (coalesce(auth.uid(), new.updated_by), tg_op, %2$L, new.id, new.org_id,
                  jsonb_build_object('before', to_jsonb(old), 'after', to_jsonb(new)));
          return new;
        else
          insert into public.audit_log (actor, action, entity, entity_id, org_id, diff)
          values (coalesce(auth.uid(), old.created_by), tg_op, %2$L, old.id, old.org_id,
                  jsonb_build_object('before', to_jsonb(old)));
          return old;
        end if;
      end;
      $body$;
    $f$, fn, t);

    execute format(
      'create trigger audit_%1$s after insert or update or delete on public.%1$I for each row execute function private.%2$I()',
      t, fn
    );
  end loop;
end;
$$;
