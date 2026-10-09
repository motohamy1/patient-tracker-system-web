-- Migration 0011: prescription extraction substrate (phase 12).
-- Binds PRODUCT-MASTER-SPEC.md §11 (prescription OCR / document
-- intelligence), §13 (relational model), §23 (provenance) and OCR-01..04.
--
-- The pipeline (§11): image → preprocessing → extraction → structured
-- extraction → normalization → confidence analysis → CLINICIAN VERIFICATION →
-- persistence → timeline projection. This table is the work item that carries
-- the job through that pipeline. It is NOT clinical truth: a row in
-- `awaiting_extraction`/`extracted` has produced nothing authoritative, and
-- `verification` defaults to `ai-extracted` so no pipeline output can ever
-- render as clinician-verified data (§23). The medication row 12-03 persists
-- from a CONFIRMED set of fields is the only authoritative output, and it
-- carries source='ai-extracted' so its origin stays visible.
--
-- Writes: provider_doctor only (the ingestion clinician). SELECT: the four
-- staff roles — an extraction in flight is team work, like a lab order. No
-- DELETE: a rejected extraction is a recorded decision, not an erased one.
--
-- Patterns composed: 0003 audit; 0005 provenance/user_org_role/column
-- grants/no-delete; 0008 documents FK + integrity pattern; 0010 session
-- attribution. `session_replication_role` is never set here.

create table public.ocr_extractions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  -- The uploaded prescription image (0008 documents, kind='prescription').
  document_id uuid not null references public.documents(id) on delete restrict,
  -- The pipeline's position: awaiting_extraction → extracted → verified,
  -- or rejected (a recorded decision, kept).
  status text not null default 'awaiting_extraction'
    check (status in ('awaiting_extraction', 'extracted', 'verified', 'rejected')),
  -- The extraction result: { provider, fields: [{key, value, confidence,
  -- candidates[]}] }. Zod-validated at the app boundary (12-02) before any
  -- write; the check here guarantees the envelope shape at the data layer.
  payload jsonb check (payload is null or (jsonb_typeof(payload) = 'object'
    and payload ? 'fields' and jsonb_typeof(payload -> 'fields') = 'array')),
  provider text,
  -- Rejection reason (why this extraction was not usable).
  rejection_reason text,
  -- Provenance (§23) + verification attribution.
  source text not null default 'ai-extracted'
    check (source in ('clinician', 'ai-extracted', 'imported')),
  verification text not null default 'ai-extracted'
    check (verification in ('clinician-verified', 'ai-extracted')),
  verified_by uuid references auth.users(id) on delete set null,
  verified_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index ocr_extractions_org_patient_idx
  on public.ocr_extractions (org_id, patient_id, created_at desc, id desc);
create index ocr_extractions_org_status_idx
  on public.ocr_extractions (org_id, patient_id, status);

-- Provenance ownership (0009 touch pattern).
create trigger touch_ocr_extractions_provenance before insert or update on public.ocr_extractions
for each row execute function private.touch_clinical_provenance();

-- Integrity + authoring guard: the document must belong to the same
-- patient/org, and only provider_doctor runs the pipeline. Status transitions
-- are validated here too, so a client cannot skip a stage or self-verify.
create function private.guard_ocr_extraction() returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_role text := coalesce(private.user_org_role(new.org_id), '');
  v_document record;
  v_patient_org uuid;
begin
  if v_role <> 'provider_doctor' then
    raise exception 'ocr_extraction_forbidden';
  end if;

  if tg_op = 'INSERT' then
    new.status := 'awaiting_extraction';
    new.verification := 'ai-extracted';
    new.verified_by := null;
    new.verified_at := null;
    new.rejection_reason := null;
  else
    -- Content immutability: which image a job reads never changes after
    -- creation — a different prescription is a different job.
    if new.document_id <> old.document_id
      or new.patient_id <> old.patient_id
      or new.org_id <> old.org_id
    then
      raise exception 'ocr_extraction_target_immutable';
    end if;

    -- Status transition table.
    if old.status = 'rejected' then
      raise exception 'ocr_extraction_rejected_final';
    elsif old.status = 'verified' then
      raise exception 'ocr_extraction_verified_final';
    elsif old.status = 'awaiting_extraction' and new.status not in ('extracted', 'rejected') then
      raise exception 'ocr_extraction_bad_transition';
    elsif old.status = 'extracted' and new.status not in ('verified', 'rejected') then
      raise exception 'ocr_extraction_bad_transition';
    end if;

    -- A verified/rejected row is attributable to the session, never the
    -- client payload; a verified extraction carries a payload.
    if new.status in ('verified', 'rejected') then
      new.verified_by := auth.uid();
      new.verified_at := now();
      new.verification := case when new.status = 'verified' then 'clinician-verified' else 'ai-extracted' end;
    else
      new.verified_by := null;
      new.verified_at := null;
    end if;
    if new.status = 'rejected' and coalesce(new.rejection_reason, '') = '' then
      raise exception 'ocr_extraction_reason_required';
    end if;
  end if;

  -- The document must exist in the same patient/org scope (the 0008
  -- relationship, integrity-checked).
  select id, org_id, patient_id into v_document
  from public.documents where id = new.document_id;
  if v_document.id is null then
    raise exception 'ocr_extraction_document_missing';
  end if;
  if v_document.org_id <> new.org_id or v_document.patient_id <> new.patient_id then
    raise exception 'ocr_extraction_document_mismatch';
  end if;

  -- Patient/org integrity (0005 pattern).
  select org_id into v_patient_org from public.patients where id = new.patient_id;
  if v_patient_org is null then
    raise exception 'ocr_extraction_patient_missing';
  end if;
  if v_patient_org <> new.org_id then
    raise exception 'ocr_extraction_patient_mismatch';
  end if;

  return new;
end;
$$;

create trigger guard_ocr_extraction before insert or update on public.ocr_extractions
for each row execute function private.guard_ocr_extraction();

-- ── The §23 provenance pair on medications (Phase 12) ─────────────────────
-- 0007 gave medications a `source` column but no `verification` half of the
-- §10 pair ("AI-extracted" vs "verified by clinician"), so a confirmed
-- extraction could not record that a clinician checked it. Phase 12 adds the
-- missing half: existing rows are clinician-authored and take the default;
-- the only app path that writes `source='ai-extracted'` is the definer
-- function below, which always pairs it with 'clinician-verified' because the
-- values it persists were confirmed by the clinician (§11, §23).
alter table public.medications
  add column if not exists verification text
  check (verification in ('clinician-verified', 'ai-extracted'));

update public.medications set verification = 'clinician-verified' where verification is null;

alter table public.medications
  alter column verification set default 'clinician-verified',
  alter column verification set not null;

-- The one DB-owned write for extracted medications (the grant stays
-- doctor-only for ordinary authoring; `source`/`verification` are never
-- app-writable columns). The caller must be provider_doctor in the patient's
-- org — the database decides, exactly as everywhere else (§12). The 0007
-- BEFORE INSERT history trigger still fires on this path, so the `started`
-- lifecycle event and the timeline projection are unchanged.
create function public.record_extracted_medication(
  p_org_id uuid,
  p_patient_id uuid,
  p_name text,
  p_dose_amount numeric,
  p_dose_unit text,
  p_frequency text,
  p_route text,
  p_started_at timestamptz
) returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_medication_id uuid;
begin
  if coalesce(private.user_org_role(p_org_id), '') <> 'provider_doctor' then
    raise exception 'extracted_medication_forbidden';
  end if;
  if not exists (select 1 from public.patients p where p.id = p_patient_id and p.org_id = p_org_id) then
    raise exception 'extracted_medication_patient_mismatch';
  end if;

  insert into public.medications (
    org_id, patient_id, name, dose_amount, dose_unit, frequency, route, started_at,
    source, verification
  )
  values (
    p_org_id, p_patient_id, p_name, p_dose_amount, p_dose_unit, p_frequency, p_route,
    coalesce(p_started_at, now()),
    'ai-extracted', 'clinician-verified'
  )
  returning id into v_medication_id;

  return v_medication_id;
end;
$$;

revoke all on function public.record_extracted_medication(uuid, uuid, text, numeric, text, text, text, timestamptz) from anon;
grant execute on function public.record_extracted_medication(uuid, uuid, text, numeric, text, text, text, timestamptz) to authenticated;

-- ── RLS + grants. ─────────────────────────────────────────────────────────
alter table public.ocr_extractions enable row level security;

revoke all on public.ocr_extractions from anon, authenticated, service_role;
grant select on public.ocr_extractions to authenticated;
grant insert (org_id, patient_id, document_id) on public.ocr_extractions to authenticated;
grant update (status, payload, provider, rejection_reason) on public.ocr_extractions to authenticated;
-- No DELETE grant, no DELETE policy.

-- SELECT: all four staff roles (an extraction in flight is team work).
create policy "select ocr extractions as staff"
on public.ocr_extractions for select to authenticated
using ((select private.user_org_role(org_id)) in ('provider_doctor', 'nurse', 'receptionist', 'admin_owner'));

-- Writes: provider_doctor only (the ingestion clinician), in policy AND guard.
create policy "insert ocr extractions as author"
on public.ocr_extractions for insert to authenticated
with check ((select private.user_org_role(org_id)) = 'provider_doctor');

create policy "update ocr extractions as author"
on public.ocr_extractions for update to authenticated
using ((select private.user_org_role(org_id)) = 'provider_doctor')
with check ((select private.user_org_role(org_id)) = 'provider_doctor');

-- Audit (0003 pattern): upload, extraction, verification and rejection are
-- all attributable.
create function private.audit_ocr_extractions_change() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.audit_log (actor, action, entity, entity_id, org_id, diff)
    values (coalesce(auth.uid(), new.created_by), tg_op, 'ocr_extractions', new.id, new.org_id,
            jsonb_build_object('document_id', new.document_id, 'status', new.status));
    return new;
  elsif tg_op = 'UPDATE' then
    insert into public.audit_log (actor, action, entity, entity_id, org_id, diff)
    values (coalesce(auth.uid(), new.updated_by), tg_op, 'ocr_extractions', new.id, new.org_id,
            jsonb_build_object(
              'status', jsonb_build_object('before', old.status, 'after', new.status),
              'verified_by', new.verified_by,
              'rejection_reason', new.rejection_reason));
    return new;
  else
    insert into public.audit_log (actor, action, entity, entity_id, org_id, diff)
    values (coalesce(auth.uid(), old.updated_by), tg_op, 'ocr_extractions', old.id, old.org_id,
            jsonb_build_object('status', old.status));
    return old;
  end if;
end;
$$;

create trigger audit_ocr_extractions after insert or update or delete on public.ocr_extractions
for each row execute function private.audit_ocr_extractions_change();
