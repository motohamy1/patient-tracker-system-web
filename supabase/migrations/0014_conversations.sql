-- Migration 0014: the unified conversation model (phase 15).
-- Binds PRODUCT-MASTER-SPEC.md §15 (communication), §12, and COMM-01..03.
--
-- ONE abstraction for every channel (COMM-01): a conversation per patient per
-- organization, and an append-only message log whose `channel` column is the
-- Phase-16 seam — a WhatsApp or Telegram adapter writes the SAME rows with a
-- different channel and no UI change.
--
-- COMM-02 is structural, not copy: the model has NO clinical fields. A
-- message is a body between a care team and a patient; there is nowhere to put
-- a diagnosis, a dose or a result, so messaging cannot become a shadow medical
-- record. Messages are never projected onto the clinical timeline (§8.2).
--
-- The sender is ALWAYS re-derived from the session inside the guards: a staff
-- message requires sender_user_id = auth.uid(), a patient message requires the
-- conversation's patient to belong to the authenticated user. A payload can
-- never claim a different sender.
--
-- Patterns composed: 0003 audit; 0005 org/patient integrity; 0012 session
-- self-scoping. `session_replication_role` is never set here.

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  status text not null default 'open' check (status in ('open', 'closed')),
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- One open conversation per patient: a closed thread can be superseded, but a
-- patient never has two live threads (the race-safe invariant the find-or-
-- create path depends on).
create unique index conversations_one_open_per_patient
  on public.conversations (patient_id) where status = 'open';
create index conversations_org_idx on public.conversations (org_id, updated_at desc, id desc);

create table public.conversation_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  -- org_id/patient_id are DENORMALISED COPIES of the conversation's, owned by
  -- the guard trigger: the app writes neither, and the guard refuses the row
  -- when the conversation cannot supply them (so they are always present on
  -- any successfully-inserted message).
  org_id uuid references public.organizations(id) on delete cascade,
  patient_id uuid references public.patients(id) on delete cascade,
  -- Re-derived from the session by the guard (never the payload).
  sender_kind text not null check (sender_kind in ('staff', 'patient', 'system')),
  sender_user_id uuid references auth.users(id) on delete set null,
  -- The Phase-16 seam: today's UI is in_app only.
  channel text not null default 'in_app' check (channel in ('in_app', 'whatsapp', 'telegram')),
  body text not null check (length(btrim(body)) > 0),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index conversation_messages_conv_idx
  on public.conversation_messages (conversation_id, created_at, id);
create index conversation_messages_org_patient_idx
  on public.conversation_messages (org_id, patient_id, created_at desc, id desc);

-- Provenance ownership (0009 touch pattern).
create trigger touch_conversations_provenance before insert or update on public.conversations
for each row execute function private.touch_clinical_provenance();

-- Conversation guard: patient/org integrity; a NEW conversation is staff's
-- to open (CAN_MESSAGE: provider_doctor + nurse); the status transition table
-- is the only mutable surface.
create function private.guard_conversation() returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_patient_org uuid;
begin
  select org_id into v_patient_org from public.patients where id = new.patient_id;
  if v_patient_org is null then raise exception 'conversation_patient_missing'; end if;
  if v_patient_org <> new.org_id then raise exception 'conversation_patient_mismatch'; end if;

  if tg_op = 'INSERT' then
    if coalesce(private.user_org_role(new.org_id), '') not in ('provider_doctor', 'nurse') then
      raise exception 'conversation_create_forbidden';
    end if;
    new.status := 'open';
  else
    -- Only the status is mutable; identity is fixed at creation.
    if new.patient_id <> old.patient_id or new.org_id <> old.org_id then
      raise exception 'conversation_target_immutable';
    end if;
    if coalesce(private.user_org_role(new.org_id), '') not in ('provider_doctor', 'nurse') then
      raise exception 'conversation_close_forbidden';
    end if;
    if old.status = 'closed' then
      raise exception 'conversation_closed_final';
    end if;
    if new.status <> 'closed' then
      raise exception 'conversation_bad_transition';
    end if;
  end if;
  return new;
end;
$$;

create trigger guard_conversation before insert or update on public.conversations
for each row execute function private.guard_conversation();

-- Message guard: the sender is re-derived from the session, the message's
-- org/patient must match its conversation, and nobody may edit or delete a
-- message (append-only: no UPDATE trigger is installed at all).
create function private.guard_conversation_message() returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_conversation record;
  v_patient record;
begin
  select org_id, patient_id, status into v_conversation
  from public.conversations where id = new.conversation_id;
  if v_conversation.org_id is null then
    raise exception 'message_conversation_missing';
  end if;
  new.org_id := v_conversation.org_id;
  new.patient_id := v_conversation.patient_id;
  if v_conversation.status <> 'open' then
    raise exception 'message_conversation_closed';
  end if;

  new.body := btrim(new.body);
  new.created_by := auth.uid();

  if coalesce(private.user_org_role(new.org_id), '') in ('provider_doctor', 'nurse') then
    -- Staff sender: identity from the session, never the payload.
    new.sender_kind := 'staff';
    new.sender_user_id := auth.uid();
  else
    -- Patient sender: the conversation's patient must belong to this user.
    select user_id into v_patient from public.patients where id = new.patient_id;
    if coalesce(private.user_org_role(new.org_id), '') <> 'patient'
      or v_patient.user_id is null
      or v_patient.user_id <> auth.uid()
    then
      raise exception 'message_sender_forbidden';
    end if;
    new.sender_kind := 'patient';
    new.sender_user_id := auth.uid();
  end if;
  return new;
end;
$$;

create trigger guard_conversation_message before insert on public.conversation_messages
for each row execute function private.guard_conversation_message();

-- The conversation's updated_at follows its messages (the log is the activity).
create function private.touch_conversation_on_message() returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.conversations set updated_at = now()
  where id = new.conversation_id;
  return new;
end;
$$;

create trigger touch_conversation_on_message after insert on public.conversation_messages
for each row execute function private.touch_conversation_on_message();

-- RLS + grants.
alter table public.conversations enable row level security;
alter table public.conversation_messages enable row level security;

revoke all on public.conversations from anon, authenticated, service_role;
grant select on public.conversations to authenticated;
grant insert (org_id, patient_id) on public.conversations to authenticated;
grant update (status) on public.conversations to authenticated;
-- no delete grant.

revoke all on public.conversation_messages from anon, authenticated, service_role;
grant select on public.conversation_messages to authenticated;
grant insert (conversation_id, body, channel) on public.conversation_messages to authenticated;
-- NO update, NO delete: the log is append-only.
-- SELECT: the org's staff, or the conversation's own patient.
create policy "select conversations as self-or-staff"
on public.conversations for select to authenticated
using (
  (select private.user_org_role(org_id)) in ('provider_doctor', 'nurse', 'receptionist', 'admin_owner')
  or private.can_read_own_patient_row(patient_id)
);

create policy "select conversation messages as self-or-staff"
on public.conversation_messages for select to authenticated
using (
  (select private.user_org_role(org_id)) in ('provider_doctor', 'nurse', 'receptionist', 'admin_owner')
  or private.can_read_own_patient_row(patient_id)
);

-- WRITE: doctor + nurse (the guard narrows further), policy + guard.
create policy "insert conversations as care team"
on public.conversations for insert to authenticated
with check ((select private.user_org_role(org_id)) in ('provider_doctor', 'nurse'));

create policy "update conversations as care team"
on public.conversations for update to authenticated
using ((select private.user_org_role(org_id)) in ('provider_doctor', 'nurse'))
with check ((select private.user_org_role(org_id)) in ('provider_doctor', 'nurse'));

create policy "insert conversation messages as participant"
on public.conversation_messages for insert to authenticated
with check (
  (select private.user_org_role(org_id)) in ('provider_doctor', 'nurse')
  or private.can_read_own_patient_row(patient_id)
);

-- Audit (0003 pattern): opening, closing and every message.
create function private.audit_conversations_change() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.audit_log (actor, action, entity, entity_id, org_id, diff)
    values (coalesce(auth.uid(), new.created_by), tg_op, 'conversations', new.id, new.org_id,
            jsonb_build_object('patient_id', new.patient_id, 'status', new.status));
    return new;
  elsif tg_op = 'UPDATE' then
    insert into public.audit_log (actor, action, entity, entity_id, org_id, diff)
    values (coalesce(auth.uid(), new.updated_by), tg_op, 'conversations', new.id, new.org_id,
            jsonb_build_object('status', jsonb_build_object('before', old.status, 'after', new.status)));
    return new;
  else
    insert into public.audit_log (actor, action, entity, entity_id, org_id, diff)
    values (coalesce(auth.uid(), old.updated_by), tg_op, 'conversations', old.id, old.org_id, null);
    return old;
  end if;
end;
$$;

create trigger audit_conversations after insert or update or delete on public.conversations
for each row execute function private.audit_conversations_change();

create function private.audit_conversation_messages_change() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.audit_log (actor, action, entity, entity_id, org_id, diff)
  values (coalesce(auth.uid(), new.created_by), 'INSERT', 'conversation_messages', new.id, new.org_id,
          jsonb_build_object('conversation_id', new.conversation_id, 'sender_kind', new.sender_kind,
                             'channel', new.channel));
  return new;
end;
$$;

create trigger audit_conversation_messages after insert on public.conversation_messages
for each row execute function private.audit_conversation_messages_change();
