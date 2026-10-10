-- Migration 0017: invoices and payments (phase 18). Binds
-- PRODUCT-MASTER-SPEC.md §13 (the relational chain), §12 (authorization
-- enforced server-side), §23 (provenance), §27 (nothing simulated), and the
-- PAY-01..04 requirements.
--
-- The payment layer is deliberately OUTSIDE the clinical chain: the timeline
-- projection (0014-era) reads clinical events only, so no financial row can
-- ever surface on it (PAY-04). Amounts are integer MINOR UNITS — a float
-- money column is a bug farm, and cents are the only honest unit for a
-- ledger.
--
-- Patterns composed, copied not reinvented:
--   0003  audit trigger-per-table.
--   0005  trigger-owned provenance; private.user_org_role as the ONLY
--         membership reader; revoke-then-regrant; column-level grants; the
--         org/patient integrity guard; no delete grant on a ledger row.
--   0014  self-or-staff SELECT via private.can_read_own_patient_row.
--   0015/0016  the honest-status vocabulary discipline (a payment records
--         what actually happened, including "nothing was captured").
--
-- The payment PROVIDER sits behind the abstraction in
-- src/lib/payments/provider.ts (0016's adapter precedent): with no provider
-- connected, an attempt records `not_configured` and its reason — a simulated
-- settlement is forbidden (§27).
--
-- Trigger-owned: created_by/updated_by/created_at/updated_at.
-- `session_replication_role` is never set.

create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  -- The consultation fee's appointment, when the invoice is for one.
  visit_id uuid references public.visits(id) on delete set null,
  -- Money: integer minor units + an ISO-4217 code. Never a float.
  amount_minor bigint not null check (amount_minor > 0),
  currency text not null default 'USD' check (currency ~ '^[A-Z]{3}$'),
  status text not null default 'draft'
    check (status in ('draft', 'issued', 'paid', 'void')),
  description text not null default '' check (length(btrim(description)) > 0),
  issued_at timestamptz,
  voided_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index invoices_org_status_idx on public.invoices (org_id, status, created_at desc, id desc);
create index invoices_patient_idx on public.invoices (patient_id, created_at desc, id desc);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  amount_minor bigint not null check (amount_minor > 0),
  currency text not null check (currency ~ '^[A-Z]{3}$'),
  -- settled | not_configured | failed — what actually happened (§27).
  status text not null check (status in ('settled', 'not_configured', 'failed')),
  provider_reference text,
  reason text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index payments_invoice_idx on public.payments (invoice_id, created_at, id);
create index payments_org_idx on public.payments (org_id, created_at desc, id desc);

create trigger touch_invoices_provenance
before insert or update on public.invoices
for each row execute function private.touch_clinical_provenance();

create trigger touch_payments_provenance
before insert on public.payments
for each row execute function private.touch_clinical_provenance();

-- INVARIANT (004 pattern): the derived `paid` status. An invoice reads paid
-- when its settled payments cover the amount; issued_at/voided_at follow the
-- status transition and are never hand-edited. Enforced on write so no client
-- claim can survive.
create function private.guard_invoice() returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_patient_org uuid;
  v_settled bigint;
begin
  select org_id into v_patient_org from public.patients where id = new.patient_id;
  if v_patient_org is null then
    raise exception 'invoice_patient_missing';
  end if;
  if v_patient_org <> new.org_id then
    raise exception 'invoice_patient_mismatch';
  end if;

  -- The optional visit must belong to the same org/patient (a consultation
  -- fee can never point at another patient's appointment).
  if new.visit_id is not null then
    if not exists (
      select 1 from public.visits
      where id = new.visit_id and org_id = new.org_id and patient_id = new.patient_id
    ) then
      raise exception 'invoice_visit_mismatch';
    end if;
  end if;

  if coalesce(private.user_org_role(new.org_id), '') not in ('provider_doctor', 'receptionist', 'admin_owner') then
    raise exception 'invoice_write_forbidden';
  end if;

  if tg_op = 'INSERT' then
    if new.status <> 'draft' then
      raise exception 'invoice_bad_open_status';
    end if;
    if new.issued_at is not null or new.voided_at is not null then
      raise exception 'invoice_bad_timestamps';
    end if;
    return new;
  end if;

  -- UPDATE: transitions only, and the timestamps follow them.
  if new.status is distinct from old.status then
    if old.status = 'draft' and new.status = 'issued' then
      new.issued_at := now();
    elsif old.status = 'issued' and new.status = 'void' then
      new.voided_at := now();
    elsif old.status = 'issued' and new.status = 'paid' then
      -- paid is DERIVED: it is set only when the settled balance covers it.
      select coalesce(sum(amount_minor), 0) into v_settled
      from public.payments
      where invoice_id = new.id and status = 'settled';
      if v_settled < new.amount_minor then
        raise exception 'invoice_paid_not_covered';
      end if;
    else
      raise exception 'invoice_bad_transition';
    end if;
  else
    if new.issued_at is distinct from old.issued_at
       or new.voided_at is distinct from old.voided_at then
      raise exception 'invoice_bad_timestamps';
    end if;
  end if;

  return new;
end;
$$;

create trigger guard_invoice before insert or update on public.invoices
for each row execute function private.guard_invoice();

-- PAYMENT guard: append-only rows attributed to a LIVE (issued) invoice of
-- the same org/patient, the settled sum can never exceed the amount, and a
-- not_configured/failed row MUST say why.
create function private.guard_payment() returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_invoice record;
  v_settled bigint;
begin
  select org_id, patient_id, status, amount_minor into v_invoice
  from public.invoices where id = new.invoice_id;
  if v_invoice.org_id is null then
    raise exception 'payment_invoice_missing';
  end if;
  if v_invoice.org_id <> new.org_id or v_invoice.patient_id <> new.patient_id then
    raise exception 'payment_invoice_mismatch';
  end if;
  if v_invoice.status <> 'issued' then
    raise exception 'payment_invoice_not_live';
  end if;

  if coalesce(private.user_org_role(new.org_id), '') not in ('provider_doctor', 'receptionist', 'admin_owner') then
    raise exception 'payment_write_forbidden';
  end if;

  if new.status = 'settled' then
    if new.reason is not null then
      raise exception 'payment_settled_has_reason';
    end if;
    select coalesce(sum(amount_minor), 0) into v_settled
    from public.payments where invoice_id = new.invoice_id and status = 'settled';
    if v_settled + new.amount_minor > v_invoice.amount_minor then
      raise exception 'payment_overpay';
    end if;
  else
    if coalesce(btrim(new.reason), '') = '' then
      raise exception 'payment_reason_required';
    end if;
  end if;

  return new;
end;
$$;

create trigger guard_payment before insert on public.payments
for each row execute function private.guard_payment();

-- RLS + grants.
alter table public.invoices enable row level security;
alter table public.payments enable row level security;

revoke all on public.invoices from anon, authenticated, service_role;
grant select on public.invoices to authenticated;
grant insert (org_id, patient_id, visit_id, amount_minor, currency, description)
  on public.invoices to authenticated;
grant update (status, description) on public.invoices to authenticated;
-- no delete grant.

revoke all on public.payments from anon, authenticated, service_role;
grant select on public.payments to authenticated;
grant insert (org_id, patient_id, invoice_id, amount_minor, currency, status, provider_reference, reason)
  on public.payments to authenticated;
-- NO update, NO delete: the payment log is append-only.

create policy "select invoices as self-or-staff"
on public.invoices for select to authenticated
using (
  (select private.user_org_role(org_id)) in ('provider_doctor', 'nurse', 'receptionist', 'admin_owner')
  or private.can_read_own_patient_row(patient_id)
);

create policy "insert invoices as billing staff"
on public.invoices for insert to authenticated
with check ((select private.user_org_role(org_id)) in ('provider_doctor', 'receptionist', 'admin_owner'));

create policy "update invoices as billing staff"
on public.invoices for update to authenticated
using ((select private.user_org_role(org_id)) in ('provider_doctor', 'receptionist', 'admin_owner'))
with check ((select private.user_org_role(org_id)) in ('provider_doctor', 'receptionist', 'admin_owner'));

create policy "select payments as self-or-staff"
on public.payments for select to authenticated
using (
  (select private.user_org_role(org_id)) in ('provider_doctor', 'nurse', 'receptionist', 'admin_owner')
  or private.can_read_own_patient_row(patient_id)
);

create policy "insert payments as billing staff"
on public.payments for insert to authenticated
with check ((select private.user_org_role(org_id)) in ('provider_doctor', 'receptionist', 'admin_owner'));

-- Audit (0003 pattern).
create function private.audit_invoices_change() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.audit_log (actor, action, entity, entity_id, org_id, diff)
    values (coalesce(auth.uid(), new.created_by), tg_op, 'invoices', new.id, new.org_id,
            jsonb_build_object('patient_id', new.patient_id, 'amount_minor', new.amount_minor,
                               'currency', new.currency, 'status', new.status));
    return new;
  elsif tg_op = 'UPDATE' then
    insert into public.audit_log (actor, action, entity, entity_id, org_id, diff)
    values (coalesce(auth.uid(), new.updated_by), tg_op, 'invoices', new.id, new.org_id,
            jsonb_build_object('before', jsonb_build_object('status', old.status),
                               'after', jsonb_build_object('status', new.status)));
    return new;
  else
    insert into public.audit_log (actor, action, entity, entity_id, org_id, diff)
    values (coalesce(auth.uid(), old.updated_by), tg_op, 'invoices', old.id, new.org_id,
            jsonb_build_object('before', jsonb_build_object('status', old.status)));
    return old;
  end if;
end;
$$;

create trigger audit_invoices after insert or update or delete
on public.invoices for each row execute function private.audit_invoices_change();

create function private.audit_payments_change() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.audit_log (actor, action, entity, entity_id, org_id, diff)
    values (coalesce(auth.uid(), new.created_by), tg_op, 'payments', new.id, new.org_id,
            jsonb_build_object('invoice_id', new.invoice_id, 'amount_minor', new.amount_minor,
                               'status', new.status));
    return new;
  else
    insert into public.audit_log (actor, action, entity, entity_id, org_id, diff)
    values (coalesce(auth.uid(), new.created_by), tg_op, 'payments', new.id, old.org_id,
            jsonb_build_object('before', jsonb_build_object('status', old.status)));
    return old;
  end if;
end;
$$;

create trigger audit_payments after insert or delete
on public.payments for each row execute function private.audit_payments_change();
