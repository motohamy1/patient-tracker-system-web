-- Migration 0016: telehealth sessions (phase 17). Binds
-- PRODUCT-MASTER-SPEC.md §13 (the Encounter/Visit chain), §3.1/§12
-- (authorization enforced server-side), §27 (nothing simulated), and the
-- TH-01..03 requirements.
--
-- A telehealth session is the consultation ROOM for a visit that already is
-- the appointment: the row points at the visit (never re-declaring the
-- patient/org), carries the rejoin reference, and records the transport
-- honestly — `not_configured` until the owner connects a provider (§27: a
-- simulated connection is forbidden, the Phase-12 no-provider precedent and
-- Phase-16's adapter discipline).
--
-- Patterns composed, copied not reinvented:
--   0003  audit trigger-per-table.
--   0005  trigger-owned provenance; private.user_org_role as the ONLY
--         membership reader; revoke-then-regrant; column-level grants; no
--         delete policy and no delete grant.
--   0006  the visit's clinical guard role list (provider_doctor) and the
--         org/patient integrity check.
--   0014  self-or-staff SELECT via private.can_read_own_patient_row.
--
-- Trigger-owned: created_by/updated_by/created_at/updated_at. `session_replication_role`
-- is never set.

create table public.telehealth_sessions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  -- The appointment: a session cannot exist without its visit, and the
  -- visit's own model stays the encounter of record (TH-03).
  visit_id uuid not null references public.visits(id) on delete cascade,
  -- The closed status vocabulary, mirrored byte-for-byte by
  -- src/lib/telehealth/status.ts.
  status text not null default 'scheduled'
    check (status in ('scheduled', 'in_progress', 'completed', 'cancelled')),
  -- The opaque rejoin reference. The join surface shows this and nothing else
  -- about the session's identity.
  join_token text not null unique default encode(gen_random_bytes(24), 'hex'),
  -- The transport: honest until a provider is connected (no video SDK ships
  -- simulated, §27).
  transport text not null default 'not_configured'
    check (transport in ('not_configured', 'connected')),
  transport_reference text,
  cancellation_reason text,
  started_at timestamptz,
  ended_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- One ACTIVE session per visit: a second consultation on the same
-- appointment is refused by the index, not queued.
create unique index telehealth_sessions_active_visit_uq
  on public.telehealth_sessions (visit_id)
  where status in ('scheduled', 'in_progress');
create index telehealth_sessions_org_status_idx
  on public.telehealth_sessions (org_id, status, created_at desc, id desc);
create index telehealth_sessions_patient_idx
  on public.telehealth_sessions (patient_id, created_at desc, id desc);

create trigger touch_telehealth_sessions_provenance
before insert or update on public.telehealth_sessions
for each row execute function private.touch_clinical_provenance();

-- The session guard: the visit must exist and carry the same org/patient
-- (no cross-patient consultation), only clinical authors write, and the
-- closed status vocabulary can only move forward — a skip, a repeat or a
-- backward move is refused, and the timestamps follow the transition.
create function private.guard_telehealth_session() returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_visit record;
begin
  select org_id, patient_id into v_visit from public.visits where id = new.visit_id;
  if v_visit.org_id is null then
    raise exception 'session_visit_missing';
  end if;
  if v_visit.org_id <> new.org_id or v_visit.patient_id <> new.patient_id then
    raise exception 'session_visit_mismatch';
  end if;

  if coalesce(private.user_org_role(new.org_id), '') <> 'provider_doctor' then
    raise exception 'session_write_forbidden';
  end if;

  if tg_op = 'INSERT' then
    -- A session is born scheduled; the transport starts unconfigured.
    if new.status <> 'scheduled' then
      raise exception 'session_bad_open_status';
    end if;
    if new.started_at is not null or new.ended_at is not null then
      raise exception 'session_bad_timestamps';
    end if;
    return new;
  end if;

  -- UPDATE: the transition discipline.
  if new.status is distinct from old.status then
    if old.status = 'scheduled' and new.status = 'in_progress' then
      new.started_at := now();
      new.ended_at := null;
    elsif old.status = 'in_progress' and new.status = 'completed' then
      if new.started_at is null then new.started_at := now(); end if;
      new.ended_at := now();
    elsif old.status in ('scheduled', 'in_progress') and new.status = 'cancelled' then
      new.ended_at := now();
      if coalesce(btrim(new.cancellation_reason), '') = '' then
        raise exception 'session_cancel_reason_required';
      end if;
    else
      raise exception 'session_bad_transition';
    end if;
  else
    -- No status change: the timestamps are never hand-edited.
    if new.started_at is distinct from old.started_at
       or new.ended_at is distinct from old.ended_at then
      raise exception 'session_bad_timestamps';
    end if;
  end if;

  return new;
end;
$$;

create trigger guard_telehealth_session
before insert or update on public.telehealth_sessions
for each row execute function private.guard_telehealth_session();

-- RLS + grants.
alter table public.telehealth_sessions enable row level security;

revoke all on public.telehealth_sessions from anon, authenticated, service_role;
grant select on public.telehealth_sessions to authenticated;
grant insert (org_id, patient_id, visit_id, status, transport, transport_reference, cancellation_reason)
  on public.telehealth_sessions to authenticated;
grant update (status, transport, transport_reference, cancellation_reason)
  on public.telehealth_sessions to authenticated;
-- no delete grant: a consultation is not a product delete action. started_at/
-- ended_at/join_token are trigger/constraint-owned and never app-written.

-- SELECT: the org's staff, or the patient themself (0014's self-or-staff).
create policy "select telehealth sessions as self-or-staff"
on public.telehealth_sessions for select to authenticated
using (
  (select private.user_org_role(org_id)) in ('provider_doctor', 'nurse', 'receptionist', 'admin_owner')
  or private.can_read_own_patient_row(patient_id)
);

-- WRITE: doctor only (policy + guard, 0006's clinical-author shape).
create policy "insert telehealth sessions as doctor"
on public.telehealth_sessions for insert to authenticated
with check ((select private.user_org_role(org_id)) = 'provider_doctor');

create policy "update telehealth sessions as doctor"
on public.telehealth_sessions for update to authenticated
using ((select private.user_org_role(org_id)) = 'provider_doctor')
with check ((select private.user_org_role(org_id)) = 'provider_doctor');

-- Audit (0003 pattern).
create function private.audit_telehealth_sessions_change() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.audit_log (actor, action, entity, entity_id, org_id, diff)
    values (coalesce(auth.uid(), new.created_by), tg_op, 'telehealth_sessions', new.id, new.org_id,
            jsonb_build_object('visit_id', new.visit_id, 'status', new.status));
    return new;
  elsif tg_op = 'UPDATE' then
    insert into public.audit_log (actor, action, entity, entity_id, org_id, diff)
    values (coalesce(auth.uid(), new.updated_by), tg_op, 'telehealth_sessions', new.id, new.org_id,
            jsonb_build_object('before', jsonb_build_object('status', old.status),
                               'after', jsonb_build_object('status', new.status)));
    return new;
  else
    insert into public.audit_log (actor, action, entity, entity_id, org_id, diff)
    values (coalesce(auth.uid(), old.updated_by), tg_op, 'telehealth_sessions', old.id, old.org_id,
            jsonb_build_object('before', jsonb_build_object('status', old.status)));
    return old;
  end if;
end;
$$;

create trigger audit_telehealth_sessions after insert or update or delete
on public.telehealth_sessions for each row
execute function private.audit_telehealth_sessions_change();
