-- Migration 0013: care tasks + the append-only completion log (phase 14).
-- Binds PRODUCT-MASTER-SPEC.md §14 (subtle care-task tracking + adherence),
-- §12, and TASK-01..03.
--
-- The honest shape for adherence: a task is ASSIGNABLE (provider_doctor only),
-- and a completion is an APPEND-ONLY EVENT with an actor and a timestamp —
-- never a mutable checkbox someone can flip without a trace. No UPDATE or
-- DELETE grant exists on the completion table; the log IS the adherence
-- story ("Logged 3 times · last on 12 Oct"), and nothing stores a score.
--
-- The completion INSERT path mirrors 0012 exactly: patient-self-only, with the
-- row's patient re-derived from `auth.uid()` by the guard — the payload can
-- never name another patient (AUTH-07).
--
-- Patterns composed: 0003 audit; 0005 org/patient integrity + activity bump;
-- 0012 session-derived self-scoping. `session_replication_role` is never set.

create table public.care_tasks (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  title text not null,
  detail text,
  kind text not null default 'other'
    check (kind in ('measurement', 'medication', 'appointment', 'follow-up', 'other')),
  due_at timestamptz,
  status text not null default 'active' check (status in ('active', 'archived')),
  source text not null default 'clinician'
    check (source in ('clinician', 'ai-extracted', 'imported')),
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index care_tasks_org_patient_idx on public.care_tasks (org_id, patient_id, due_at, id desc);
create index care_tasks_org_status_idx on public.care_tasks (org_id, patient_id, status);

create table public.care_task_completions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  task_id uuid not null references public.care_tasks(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  note text,
  -- When the PATIENT says it happened, separate from created_at.
  completed_at timestamptz not null default now(),
  source text not null default 'patient' check (source in ('patient', 'staff', 'ai-extracted', 'imported')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index care_task_completions_org_task_idx
  on public.care_task_completions (org_id, task_id, completed_at desc, id desc);
create index care_task_completions_org_patient_idx
  on public.care_task_completions (org_id, patient_id, completed_at desc, id desc);

-- Provenance ownership (0012's touch pattern; tasks also update).
create function private.touch_clinical_provenance_013() returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_table_name = 'care_tasks' then
    if tg_op = 'INSERT' then
      new.created_by := coalesce(auth.uid(), new.created_by);
      new.updated_by := coalesce(auth.uid(), new.updated_by, new.created_by);
      new.created_at := now();
    else
      new.updated_by := coalesce(auth.uid(), new.updated_by);
    end if;
    new.updated_at := now();
  else
    -- care_task_completions is append-only: no updated_at exists.
    new.created_by := coalesce(auth.uid(), new.created_by);
    new.user_id := coalesce(auth.uid(), new.user_id);
    new.created_at := now();
  end if;
  return new;
end;
$$;

create trigger touch_care_tasks_provenance before insert or update on public.care_tasks
for each row execute function private.touch_clinical_provenance_013();

create trigger touch_care_task_completions_provenance before insert on public.care_task_completions
for each row execute function private.touch_clinical_provenance_013();

-- Authoring guard: doctor-only writes on the task; org/patient integrity.
create function private.guard_care_task() returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_patient_org uuid;
begin
  select org_id into v_patient_org from public.patients where id = new.patient_id;
  if v_patient_org is null then raise exception 'care_task_patient_missing'; end if;
  if v_patient_org <> new.org_id then raise exception 'care_task_patient_mismatch'; end if;
  if coalesce(private.user_org_role(new.org_id), '') <> 'provider_doctor' then
    raise exception 'care_task_clinical_forbidden';
  end if;
  return new;
end;
$$;

create trigger guard_care_task before insert or update on public.care_tasks
for each row execute function private.guard_care_task();

-- Completion guard: the patient themself, their own task, same org, and the
-- task must still be active. Staff INSERT is refused (a documented Phase-14
-- decision: completions are the patient's own record).
create function private.guard_care_task_completion() returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_patient record;
  v_task record;
begin
  select org_id, user_id into v_patient from public.patients where id = new.patient_id;
  if v_patient.org_id is null then
    raise exception 'completion_patient_missing';
  end if;
  if v_patient.org_id <> new.org_id then
    raise exception 'completion_patient_mismatch';
  end if;
  if v_patient.user_id is null or v_patient.user_id <> auth.uid() then
    raise exception 'completion_not_your_record';
  end if;
  if coalesce(private.user_org_role(new.org_id), '') <> 'patient' then
    raise exception 'completion_patient_role_required';
  end if;

  select org_id, patient_id, status into v_task from public.care_tasks where id = new.task_id;
  if v_task.org_id is null then
    raise exception 'completion_task_missing';
  end if;
  if v_task.org_id <> new.org_id or v_task.patient_id <> new.patient_id then
    raise exception 'completion_task_mismatch';
  end if;
  if v_task.status <> 'active' then
    raise exception 'completion_task_not_active';
  end if;

  new.source := 'patient';
  return new;
end;
$$;

create trigger guard_care_task_completion before insert on public.care_task_completions
for each row execute function private.guard_care_task_completion();

-- Activity follows the patient for both tables (a task assigned or completed
-- is care activity, and the folder's "last activity" should say so).
create trigger activity_care_tasks after insert or update on public.care_tasks
for each row execute function private.clinical_patient_activity();
create trigger activity_care_task_completions after insert on public.care_task_completions
for each row execute function private.clinical_patient_activity();

-- RLS + grants.
alter table public.care_tasks enable row level security;
alter table public.care_task_completions enable row level security;

revoke all on public.care_tasks from anon, authenticated, service_role;
grant select on public.care_tasks to authenticated;
grant insert (org_id, patient_id, title, detail, kind, due_at, status) on public.care_tasks to authenticated;
grant update (title, detail, kind, due_at, status) on public.care_tasks to authenticated;
-- no delete grant: an archived task keeps its history.

revoke all on public.care_task_completions from anon, authenticated, service_role;
grant select on public.care_task_completions to authenticated;
grant insert (org_id, patient_id, task_id, note, completed_at) on public.care_task_completions to authenticated;
-- NO update, NO delete: the log is append-only.

-- SELECT: staff in the org, or the patient themself (both tables).
create policy "select care tasks as self-or-staff"
on public.care_tasks for select to authenticated
using (
  (select private.user_org_role(org_id)) in ('provider_doctor', 'nurse', 'receptionist', 'admin_owner')
  or private.can_read_own_patient_row(patient_id)
);

create policy "select care task completions as self-or-staff"
on public.care_task_completions for select to authenticated
using (
  (select private.user_org_role(org_id)) in ('provider_doctor', 'nurse', 'receptionist', 'admin_owner')
  or user_id = (select auth.uid())
);

-- INSERT/UPDATE on tasks: provider_doctor only (policy + guard).
create policy "insert care tasks as author"
on public.care_tasks for insert to authenticated
with check ((select private.user_org_role(org_id)) = 'provider_doctor');

create policy "update care tasks as author"
on public.care_tasks for update to authenticated
using ((select private.user_org_role(org_id)) = 'provider_doctor')
with check ((select private.user_org_role(org_id)) = 'provider_doctor');

-- INSERT on completions: the patient themself (policy + guard).
create policy "insert completions as the patient"
on public.care_task_completions for insert to authenticated
with check (
  user_id = (select auth.uid())
  and (select private.user_org_role(org_id)) = 'patient'
);

-- Audit (0003 pattern): assignment, archive and every completion.
create function private.audit_care_tasks_change() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.audit_log (actor, action, entity, entity_id, org_id, diff)
    values (coalesce(auth.uid(), new.created_by), tg_op, 'care_tasks', new.id, new.org_id,
            jsonb_build_object('title', new.title, 'kind', new.kind, 'due_at', new.due_at));
    return new;
  elsif tg_op = 'UPDATE' then
    insert into public.audit_log (actor, action, entity, entity_id, org_id, diff)
    values (coalesce(auth.uid(), new.updated_by), tg_op, 'care_tasks', new.id, new.org_id,
            jsonb_build_object(
              'status', jsonb_build_object('before', old.status, 'after', new.status),
              'title', jsonb_build_object('before', old.title, 'after', new.title)));
    return new;
  else
    insert into public.audit_log (actor, action, entity, entity_id, org_id, diff)
    values (coalesce(auth.uid(), old.updated_by), tg_op, 'care_tasks', old.id, old.org_id,
            jsonb_build_object('title', old.title));
    return old;
  end if;
end;
$$;

create trigger audit_care_tasks after insert or update or delete on public.care_tasks
for each row execute function private.audit_care_tasks_change();

create function private.audit_care_task_completions_change() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.audit_log (actor, action, entity, entity_id, org_id, diff)
    values (coalesce(auth.uid(), new.created_by), tg_op, 'care_task_completions', new.id, new.org_id,
            jsonb_build_object('task_id', new.task_id, 'completed_at', new.completed_at));
    return new;
  end if;
  return null;
end;
$$;

create trigger audit_care_task_completions after insert on public.care_task_completions
for each row execute function private.audit_care_task_completions_change();
