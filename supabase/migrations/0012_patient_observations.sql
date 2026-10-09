-- Migration 0012: patient-generated observations (phase 13).
-- Binds PRODUCT-MASTER-SPEC.md §14 (patient experience), §12, and PTH-01..03.
--
-- The patient's ONLY authoring surface in the whole product (PTH-02): a
-- closed vocabulary of measurements (weight, blood_pressure, glucose,
-- temperature, pulse) plus a note. A logged observation is append-only — no
-- UPDATE or DELETE grant exists — and the INSERT path re-derives the patient
-- from the VERIFIED SESSION, so a patient can only ever write their own row
-- and a client can never point `patient_id` at someone else (AUTH-07).
--
-- SELECT: the patient themself plus the four staff roles (a logged glucose
-- reading is clinically relevant to the care team). The provider-workspace
-- surfacing rides Phase 14 (TASK-02); the read path is safe today.
--
-- Patterns composed: 0003 audit; 0005 org/patient integrity + activity bump;
-- 0009 session attribution. `session_replication_role` is never set here.

create table public.patient_observations (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  -- The recorder, taken from auth.uid() by the guard (never the payload).
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('weight', 'blood_pressure', 'glucose', 'temperature', 'pulse', 'note')),
  -- The measured value; blood_pressure uses value_numeric (systolic) +
  -- value_secondary (diastolic). A note carries neither.
  value_numeric numeric(10, 3),
  value_secondary numeric(10, 3),
  unit text check (unit is null or unit in ('kg', 'g', 'lb', 'mmol/L', 'mg/dL', 'celsius', 'fahrenheit', 'bpm')),
  note text,
  -- When the PATIENT says it was taken, separate from created_at.
  observed_at timestamptz not null default now(),
  source text not null default 'patient'
    check (source in ('patient', 'staff', 'ai-extracted', 'imported')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index patient_observations_org_patient_idx
  on public.patient_observations (org_id, patient_id, observed_at desc, id desc);

-- Provenance ownership on insert (0009 touch pattern's INSERT half).
create function private.touch_observation_provenance() returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.created_by := coalesce(auth.uid(), new.created_by);
  new.user_id := coalesce(auth.uid(), new.user_id);
  new.created_at := now();
  return new;
end;
$$;

create trigger touch_patient_observations_provenance before insert on public.patient_observations
for each row execute function private.touch_observation_provenance();

-- The self-scoping guard: the patient row must exist in this org AND belong to
-- the authenticated user, the caller's role must be `patient`, and a
-- measurement kind must carry a value while a note may carry only text.
create function private.guard_patient_observation() returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_patient record;
begin
  select id, org_id, user_id into v_patient from public.patients where id = new.patient_id;
  if v_patient.id is null then
    raise exception 'observation_patient_missing';
  end if;
  if v_patient.org_id <> new.org_id then
    raise exception 'observation_patient_mismatch';
  end if;
  -- The record's own user link is the authority, never the payload.
  if v_patient.user_id is null or v_patient.user_id <> auth.uid() then
    raise exception 'observation_not_your_record';
  end if;
  if coalesce(private.user_org_role(new.org_id), '') <> 'patient' then
    raise exception 'observation_patient_role_required';
  end if;
  new.source := 'patient';

  if new.kind = 'note' then
    if new.value_numeric is not null or new.value_secondary is not null then
      raise exception 'observation_note_has_no_value';
    end if;
    if coalesce(new.note, '') = '' then
      raise exception 'observation_note_empty';
    end if;
  else
    if new.kind = 'blood_pressure' then
      if new.value_numeric is null or new.value_secondary is null then
        raise exception 'observation_blood_pressure_incomplete';
      end if;
    elsif new.value_numeric is null then
      raise exception 'observation_value_required';
    end if;
  end if;

  return new;
end;
$$;

create trigger guard_patient_observation before insert on public.patient_observations
for each row execute function private.guard_patient_observation();

-- Activity follows the patient (a logged reading is care activity).
create trigger activity_patient_observations after insert on public.patient_observations
for each row execute function private.clinical_patient_activity();

-- RLS + grants.
alter table public.patient_observations enable row level security;

revoke all on public.patient_observations from anon, authenticated, service_role;
grant select on public.patient_observations to authenticated;
grant insert (org_id, patient_id, kind, value_numeric, value_secondary, unit, note, observed_at)
  on public.patient_observations to authenticated;
-- No UPDATE, no DELETE: a logged observation is a record, not a draft.

-- SELECT: the patient themself, or staff in the org.
create policy "select observations as self-or-staff"
on public.patient_observations for select to authenticated
using (
  user_id = (select auth.uid())
  or (select private.user_org_role(org_id)) in ('provider_doctor', 'nurse', 'receptionist', 'admin_owner')
);

-- INSERT: the patient themself, with their role — enforced again by the guard.
create policy "insert observations as the patient"
on public.patient_observations for insert to authenticated
with check (
  user_id = (select auth.uid())
  and (select private.user_org_role(org_id)) = 'patient'
);

-- ── Patient self-read on their own clinical rows (PTH-01) ──────────────────
-- The Patient Home shows the same clinical facts the provider workspace shows
-- for this patient (medications, appointments, recent results, documents), so
-- the SELECT policies gain the SAME self-or-staff shape 0005 already uses on
-- `patients`: staff by org role, or the patient themself via the record's
-- `user_id` link. The write side is untouched — a patient never gains INSERT
-- or UPDATE on a clinical table; observations (above) remain their only
-- authoring surface (PTH-02, AUTH-07).
--
-- The join is through `patients` so the record's own user link is the
-- authority; `user_id` is never read from the request payload.
create or replace function private.can_read_own_patient_row(p_patient_id uuid)
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select exists (
    select 1 from public.patients p
    where p.id = p_patient_id and p.user_id = auth.uid()
  );
$$;

revoke all on function private.can_read_own_patient_row(uuid) from anon, authenticated;

do $$
declare
  t text;
begin
  foreach t in array array['medications', 'visits', 'lab_results', 'documents']
  loop
    execute format($f$
      create policy "select %1$s as self-or-staff" on public.%1$I
      for select to authenticated
      using (
        (select private.user_org_role(org_id)) in ('provider_doctor', 'nurse', 'receptionist', 'admin_owner')
        or private.can_read_own_patient_row(patient_id)
      )
    $f$, t);
  end loop;
end;
$$;

-- ── Audit (0003 pattern): a patient-generated clinical-adjacent record is
-- attributable.
create function private.audit_patient_observations_change() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.audit_log (actor, action, entity, entity_id, org_id, diff)
    values (coalesce(auth.uid(), new.created_by), tg_op, 'patient_observations', new.id, new.org_id,
            jsonb_build_object('kind', new.kind, 'value', new.value_numeric));
    return new;
  end if;
  return null;
end;
$$;

create trigger audit_patient_observations after insert on public.patient_observations
for each row execute function private.audit_patient_observations_change();
