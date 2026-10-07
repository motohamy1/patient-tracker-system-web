-- Migration 0003: audit_log + DB triggers (phase 03, plan 02)
-- D-14 audit is DB-trigger-based; D-15 retrieval is admin_owner-only;
-- AUTH-06 sensitive mutations produce audit entries. Later phases extend this
-- trigger pattern to their tables (03-RESEARCH.md Pattern 7).
--
-- Provenance survives in `diff`: UPDATEs record to_jsonb(old)/to_jsonb(new)
-- before/after, so created_at/created_by/redeemed_at are never lost (D-14/Claude
-- discretion clause). One security-definer trigger function per audited table;
-- the per-op branch keeps OLD/NEW referenced only where each row trigger
-- assigns them (OLD is unassigned on INSERT, NEW unassigned on DELETE).
-- audit_log grants: revoke all from anon/authenticated/service_role, grant
-- select to authenticated only — writes happen ONLY inside the definer trigger
-- functions; there is no insert/update/delete grant and no policy admitting
-- product-user writes.

create table public.audit_log (
  id uuid primary key default gen_random_uuid(),
  actor uuid,
  action text not null,
  entity text not null,
  entity_id uuid,
  org_id uuid,
  diff jsonb,
  created_at timestamptz not null default now()
);

create index audit_log_org_created_idx on public.audit_log using btree (org_id, created_at);

create function private.audit_membership_change() returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.audit_log (actor, action, entity, entity_id, org_id, diff)
    values (coalesce(auth.uid(), new.user_id), tg_op, 'memberships', new.id, new.org_id, null);
    return new;
  elsif tg_op = 'UPDATE' then
    insert into public.audit_log (actor, action, entity, entity_id, org_id, diff)
    values (coalesce(auth.uid(), new.user_id), tg_op, 'memberships', new.id, new.org_id,
            jsonb_build_object('before', to_jsonb(old), 'after', to_jsonb(new)));
    return new;
  else
    insert into public.audit_log (actor, action, entity, entity_id, org_id, diff)
    values (coalesce(auth.uid(), old.user_id), tg_op, 'memberships', old.id, old.org_id,
            jsonb_build_object('before', to_jsonb(old)));
    return old;
  end if;
end;
$$;

create function private.audit_organizations_change() returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.audit_log (actor, action, entity, entity_id, org_id, diff)
    values (coalesce(auth.uid(), new.created_by), tg_op, 'organizations', new.id, new.id, null);
    return new;
  elsif tg_op = 'UPDATE' then
    insert into public.audit_log (actor, action, entity, entity_id, org_id, diff)
    values (coalesce(auth.uid()), tg_op, 'organizations', new.id, new.id,
            jsonb_build_object('before', to_jsonb(old), 'after', to_jsonb(new)));
    return new;
  else
    insert into public.audit_log (actor, action, entity, entity_id, org_id, diff)
    values (coalesce(auth.uid(), old.created_by), tg_op, 'organizations', old.id, old.id,
            jsonb_build_object('before', to_jsonb(old)));
    return old;
  end if;
end;
$$;

create function private.audit_invitations_change() returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.audit_log (actor, action, entity, entity_id, org_id, diff)
    values (coalesce(auth.uid(), new.created_by), tg_op, 'invitations', new.id, new.org_id, null);
    return new;
  elsif tg_op = 'UPDATE' then
    insert into public.audit_log (actor, action, entity, entity_id, org_id, diff)
    values (coalesce(auth.uid(), new.created_by), tg_op, 'invitations', new.id, new.org_id,
            jsonb_build_object('before', to_jsonb(old), 'after', to_jsonb(new)));
    return new;
  else
    insert into public.audit_log (actor, action, entity, entity_id, org_id, diff)
    values (coalesce(auth.uid(), old.created_by), tg_op, 'invitations', old.id, old.org_id,
            jsonb_build_object('before', to_jsonb(old)));
    return old;
  end if;
end;
$$;

create trigger audit_membership after insert or update or delete
on public.memberships for each row
execute function private.audit_membership_change();

create trigger audit_organizations after insert or update or delete
on public.organizations for each row
execute function private.audit_organizations_change();

create trigger audit_invitations after insert or update or delete
on public.invitations for each row
execute function private.audit_invitations_change();

revoke all on public.audit_log from anon, authenticated, service_role;
grant select on public.audit_log to authenticated;

alter table public.audit_log enable row level security;

create policy "select audit_log as admin_owner"
on public.audit_log
for select to authenticated
using (
  (select private.user_org_role(org_id)) = 'admin_owner'
);
