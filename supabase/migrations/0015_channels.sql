-- Migration 0015: channel endpoints, adapters' record and delivery log
-- (phase 16). Binds PRODUCT-MASTER-SPEC.md §15 (channel adapters), §12, and
-- CHAN-01..03.
--
-- The channel layer sits UNDER the unified conversation (0014): a notification
-- is never free-floating — every delivery row points at the conversation
-- message that caused it, so a WhatsApp or Telegram message can only exist
-- because a message in the thread exists (CHAN-03: the attribution is
-- structural, not a convention).
--
-- `channel_endpoints` holds the patient's reachable handles, managed by staff
-- (contact data, not a patient write surface). `notification_deliveries` is
-- append-only: the delivery log is the truth about what left the building,
-- including the honest `not_configured` state — a simulated success is
-- forbidden (§27).
--
-- Patterns composed: 0003 audit; 0005 org/patient integrity; 0012 session
-- self-scoping; 0014 conversation FK. `session_replication_role` is never set.

create table public.channel_endpoints (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  channel text not null check (channel in ('in_app', 'whatsapp', 'telegram')),
  -- The external handle: an E.164 phone number for WhatsApp, a chat id for
  -- Telegram. Recorded by staff; the adapter never guesses a destination.
  handle text not null check (length(btrim(handle)) > 0),
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index channel_endpoints_unique
  on public.channel_endpoints (patient_id, channel, handle);
create index channel_endpoints_org_patient_idx
  on public.channel_endpoints (org_id, patient_id, status);

create table public.notification_deliveries (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  message_id uuid not null references public.conversation_messages(id) on delete cascade,
  org_id uuid not null references public.organizations(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  channel text not null check (channel in ('whatsapp', 'telegram')),
  handle text not null,
  -- delivered | not_configured | failed — the honest state, never a fake one.
  status text not null check (status in ('delivered', 'not_configured', 'failed')),
  -- The provider's own reference for a delivered message (auditability).
  provider_reference text,
  reason text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index notification_deliveries_message_idx
  on public.notification_deliveries (message_id, created_at, id);
create index notification_deliveries_org_patient_idx
  on public.notification_deliveries (org_id, patient_id, created_at desc, id desc);

-- Provenance ownership (0009 touch pattern); endpoints update, deliveries
-- never do.
create trigger touch_channel_endpoints_provenance before insert or update on public.channel_endpoints
for each row execute function private.touch_clinical_provenance();

create function private.touch_notification_delivery() returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.created_by := coalesce(auth.uid(), new.created_by);
  new.created_at := now();
  return new;
end;
$$;

create trigger touch_notification_deliveries_provenance before insert on public.notification_deliveries
for each row execute function private.touch_notification_delivery();

-- Endpoints guard: patient/org integrity; staff (doctor + nurse) only.
create function private.guard_channel_endpoint() returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_patient_org uuid;
begin
  select org_id into v_patient_org from public.patients where id = new.patient_id;
  if v_patient_org is null then raise exception 'endpoint_patient_missing'; end if;
  if v_patient_org <> new.org_id then raise exception 'endpoint_patient_mismatch'; end if;
  if coalesce(private.user_org_role(new.org_id), '') not in ('provider_doctor', 'nurse') then
    raise exception 'endpoint_manage_forbidden';
  end if;
  return new;
end;
$$;

create trigger guard_channel_endpoint before insert or update on public.channel_endpoints
for each row execute function private.guard_channel_endpoint();

-- Deliveries guard: append-only and attributed. The message must belong to the
-- same patient/org (no cross-patient sends), and the row is inserted only by
-- the server-side workflow — a patient can never write one.
create function private.guard_notification_delivery() returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_message record;
begin
  if coalesce(private.user_org_role(new.org_id), '') not in ('provider_doctor', 'nurse') then
    raise exception 'delivery_write_forbidden';
  end if;

  select conversation_id, org_id, patient_id into v_message
  from public.conversation_messages where id = new.message_id;
  if v_message.conversation_id is null then
    raise exception 'delivery_message_missing';
  end if;
  if v_message.org_id <> new.org_id
    or v_message.patient_id <> new.patient_id
    or v_message.conversation_id <> new.conversation_id
  then
    raise exception 'delivery_message_mismatch';
  end if;

  -- The status vocabulary is enforced by the check; a delivered row must
  -- carry no failure reason, and a not_configured row must say why.
  if new.status = 'delivered' and new.reason is not null then
    raise exception 'delivery_delivered_has_reason';
  end if;
  if new.status in ('not_configured', 'failed') and coalesce(new.reason, '') = '' then
    raise exception 'delivery_reason_required';
  end if;
  return new;
end;
$$;

create trigger guard_notification_delivery before insert on public.notification_deliveries
for each row execute function private.guard_notification_delivery();

-- RLS + grants.
alter table public.channel_endpoints enable row level security;
alter table public.notification_deliveries enable row level security;

revoke all on public.channel_endpoints from anon, authenticated, service_role;
grant select on public.channel_endpoints to authenticated;
grant insert (org_id, patient_id, channel, handle) on public.channel_endpoints to authenticated;
grant update (handle, status) on public.channel_endpoints to authenticated;
-- no delete grant.

revoke all on public.notification_deliveries from anon, authenticated, service_role;
grant select on public.notification_deliveries to authenticated;
grant insert (conversation_id, message_id, org_id, patient_id, channel, handle, status, provider_reference, reason)
  on public.notification_deliveries to authenticated;
-- NO update, NO delete: the delivery log is append-only.

-- SELECT: the org's staff (endpoints and deliveries are operational records).
create policy "select channel endpoints as staff"
on public.channel_endpoints for select to authenticated
using ((select private.user_org_role(org_id)) in ('provider_doctor', 'nurse', 'receptionist', 'admin_owner'));

create policy "select notification deliveries as staff"
on public.notification_deliveries for select to authenticated
using ((select private.user_org_role(org_id)) in ('provider_doctor', 'nurse', 'receptionist', 'admin_owner'));

-- WRITE: doctor + nurse (the guard narrows further), policy + guard.
create policy "insert channel endpoints as care team"
on public.channel_endpoints for insert to authenticated
with check ((select private.user_org_role(org_id)) in ('provider_doctor', 'nurse'));

create policy "update channel endpoints as care team"
on public.channel_endpoints for update to authenticated
using ((select private.user_org_role(org_id)) in ('provider_doctor', 'nurse'))
with check ((select private.user_org_role(org_id)) in ('provider_doctor', 'nurse'));

create policy "insert notification deliveries as care team"
on public.notification_deliveries for insert to authenticated
with check ((select private.user_org_role(org_id)) in ('provider_doctor', 'nurse'));

-- Audit (0003 pattern).
create function private.audit_channel_endpoints_change() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.audit_log (actor, action, entity, entity_id, org_id, diff)
    values (coalesce(auth.uid(), new.created_by), tg_op, 'channel_endpoints', new.id, new.org_id,
            jsonb_build_object('channel', new.channel, 'status', new.status));
    return new;
  elsif tg_op = 'UPDATE' then
    insert into public.audit_log (actor, action, entity, entity_id, org_id, diff)
    values (coalesce(auth.uid(), new.updated_by), tg_op, 'channel_endpoints', new.id, new.org_id,
            jsonb_build_object('status', jsonb_build_object('before', old.status, 'after', new.status)));
    return new;
  else
    insert into public.audit_log (actor, action, entity, entity_id, org_id, diff)
    values (coalesce(auth.uid(), old.updated_by), tg_op, 'channel_endpoints', old.id, old.org_id,
            jsonb_build_object('channel', old.channel));
    return old;
  end if;
end;
$$;

create trigger audit_channel_endpoints after insert or update or delete on public.channel_endpoints
for each row execute function private.audit_channel_endpoints_change();

create function private.audit_notification_deliveries_change() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.audit_log (actor, action, entity, entity_id, org_id, diff)
  values (coalesce(auth.uid(), new.created_by), 'INSERT', 'notification_deliveries', new.id, new.org_id,
          jsonb_build_object('channel', new.channel, 'status', new.status, 'message_id', new.message_id));
  return new;
end;
$$;

create trigger audit_notification_deliveries after insert on public.notification_deliveries
for each row execute function private.audit_notification_deliveries_change();
