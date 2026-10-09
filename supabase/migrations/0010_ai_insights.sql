-- Migration 0010: AI insights substrate with provenance and human review
-- (phase 11). Binds PRODUCT-MASTER-SPEC.md §10 (AI principles), §23
-- (provenance), §12 (authorization enforced by the database), and
-- AI-01/02/03.
--
-- The phase's core requirement (AI-02): a stored insight can never render as
-- clinical truth. It carries `provenance` (system-derived | ai-generated),
-- defaults to `verification = 'ai-extracted'` so it is distinguishable from
-- clinician-verified data (§23), and exposes a `review_state` lifecycle
-- (pending | dismissed | accepted) with an attributed reviewer. Accepting an
-- insight is a clinician's decision ABOUT an observation — it flips
-- `verification` to clinician-verified and records who did it; dismissing is
-- also a decision and is kept, audited, never deleted.
--
-- AI-03: the table stores observations only. There is no column that could
-- hold a diagnosis or a prescribing decision, and no policy lets anything but
-- an in-session provider_doctor write content.
--
-- Writes: INSERT provider_doctor only (the in-session generator); UPDATE
-- provider_doctor + nurse, restricted by trigger to the review columns —
-- content is immutable after insert. No DELETE: the audit trail is the point.
-- SELECT: all four staff roles (assistive surface, org-scoped). Patients never
-- see insights.
--
-- Patterns composed: 0003 audit; 0005 provenance/user_org_role/column
-- grants/no-delete; 0009 role checks + audit trigger shape.
-- `session_replication_role` is never set here.

create table public.ai_insights (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  -- Closed vocabulary (mirror: src/lib/ai/status.ts).
  kind text not null check (kind in ('change', 'summary', 'attention', 'trend', 'documentation-gap')),
  title text not null,
  body text not null,
  -- Structured references to the REAL source rows this insight was derived
  -- from ({table, id, label} objects). An insight without evidence is not
  -- allowed to exist: the check requires at least one entry.
  evidence jsonb not null check (jsonb_typeof(evidence) = 'array' and jsonb_array_length(evidence) > 0),
  -- The period the insight covers ({from, to} ISO strings); null for
  -- point-in-time findings.
  window jsonb check (window is null or (jsonb_typeof(window) = 'object'
    and window ? 'from' and window ? 'to')),
  provenance text not null default 'system-derived'
    check (provenance in ('system-derived', 'ai-generated')),
  -- §23: AI output defaults to ai-extracted so it can never render
  -- indistinguishable from clinician-verified data.
  verification text not null default 'ai-extracted'
    check (verification in ('ai-extracted', 'clinician-verified')),
  review_state text not null default 'pending'
    check (review_state in ('pending', 'dismissed', 'accepted')),
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index ai_insights_org_patient_idx
  on public.ai_insights (org_id, patient_id, created_at desc, id desc);
create index ai_insights_org_review_idx
  on public.ai_insights (org_id, patient_id, review_state);

-- Provenance ownership (0009 touch pattern).
create trigger touch_ai_insights_provenance before insert or update on public.ai_insights
for each row execute function private.touch_clinical_provenance();

-- Insert guard: same org as the patient, and only provider_doctor writes
-- insight content (the in-session generator).
create function private.guard_ai_insight_insert() returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_patient_org uuid;
begin
  select org_id into v_patient_org from public.patients where id = new.patient_id;
  if v_patient_org is null then raise exception 'ai_insight_patient_missing'; end if;
  if v_patient_org <> new.org_id then raise exception 'ai_insight_patient_mismatch'; end if;
  if coalesce(private.user_org_role(new.org_id), '') <> 'provider_doctor' then
    raise exception 'ai_insight_generate_forbidden';
  end if;
  -- A freshly generated insight starts life unreviewed, AI-extracted.
  new.verification := 'ai-extracted';
  new.review_state := 'pending';
  new.reviewed_by := null;
  new.reviewed_at := null;
  return new;
end;
$$;

create trigger guard_ai_insight_insert before insert on public.ai_insights
for each row execute function private.guard_ai_insight_insert();

-- Review guard: the ONLY mutable surface is the review lifecycle. Content
-- columns are immutable after insert, a reviewed insight is final (no
-- re-review), and the reviewer identity + timestamp are taken from the
-- authenticated session — never from the client payload.
create function private.guard_ai_insight_review() returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_role text := coalesce(private.user_org_role(new.org_id), '');
begin
  if v_role not in ('provider_doctor', 'nurse') then
    raise exception 'ai_insight_review_forbidden';
  end if;

  -- Content immutability (§10: never silently transform AI output).
  if new.kind <> old.kind
    or new.title <> old.title
    or new.body <> old.body
    or new.evidence is distinct from old.evidence
    or new.window is distinct from old.window
    or new.provenance <> old.provenance
    or new.patient_id <> old.patient_id
    or new.org_id <> old.org_id
  then
    raise exception 'ai_insight_content_immutable';
  end if;

  -- Review is a one-way transition out of pending.
  if old.review_state <> 'pending' then
    raise exception 'ai_insight_review_final';
  end if;
  if new.review_state not in ('dismissed', 'accepted') then
    raise exception 'ai_insight_review_invalid';
  end if;

  -- Server-side attribution.
  new.reviewed_by := auth.uid();
  new.reviewed_at := now();
  -- Accepting means a clinician verified the observation; a dismissal does not.
  if new.review_state = 'accepted' then
    new.verification := 'clinician-verified';
  else
    new.verification := 'ai-extracted';
  end if;
  return new;
end;
$$;

create trigger guard_ai_insight_review before update on public.ai_insights
for each row execute function private.guard_ai_insight_review();

-- RLS + grants.
alter table public.ai_insights enable row level security;

revoke all on public.ai_insights from anon, authenticated, service_role;
grant select on public.ai_insights to authenticated;
grant insert (org_id, patient_id, kind, title, body, evidence, window, provenance)
  on public.ai_insights to authenticated;
grant update (review_state, verification, reviewed_by, reviewed_at)
  on public.ai_insights to authenticated;
-- No DELETE grant, no DELETE policy: reviews are never erased.

-- SELECT: all four staff roles in the org (assistive surface).
create policy "select ai insights as staff"
on public.ai_insights for select to authenticated
using ((select private.user_org_role(org_id)) in ('provider_doctor', 'nurse', 'receptionist', 'admin_owner'));

-- INSERT: provider_doctor only (the generator runs in-session).
create policy "insert ai insights as author"
on public.ai_insights for insert to authenticated
with check ((select private.user_org_role(org_id)) = 'provider_doctor');

-- UPDATE: doctor + nurse, and the trigger narrows it to the review columns.
create policy "review ai insights as clinician"
on public.ai_insights for update to authenticated
using ((select private.user_org_role(org_id)) in ('provider_doctor', 'nurse'))
with check ((select private.user_org_role(org_id)) in ('provider_doctor', 'nurse'));

-- Audit (0003 pattern): generation, review decisions AND the housekeeping
-- supersede are attributable. A superseded row is always an unreviewed
-- generated observation — a review decision is never erased (no DELETE grant
-- exists; the RPC below deletes pending rows only).
create function private.audit_ai_insights_change() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.audit_log (actor, action, entity, entity_id, org_id, diff)
    values (coalesce(auth.uid(), new.created_by), tg_op, 'ai_insights', new.id, new.org_id,
            jsonb_build_object('kind', new.kind, 'title', new.title));
    return new;
  elsif tg_op = 'UPDATE' then
    insert into public.audit_log (actor, action, entity, entity_id, org_id, diff)
    values (coalesce(auth.uid(), new.updated_by), tg_op, 'ai_insights', new.id, new.org_id,
            jsonb_build_object(
              'review_state', jsonb_build_object('before', old.review_state, 'after', new.review_state),
              'reviewed_by', new.reviewed_by));
    return new;
  else
    insert into public.audit_log (actor, action, entity, entity_id, org_id, diff)
    values (coalesce(auth.uid(), old.updated_by), tg_op, 'ai_insights', old.id, old.org_id,
            jsonb_build_object('kind', old.kind, 'title', old.title, 'review_state', old.review_state));
    return old;
  end if;
end;
$$;

create trigger audit_ai_insights after insert or update or delete on public.ai_insights
for each row execute function private.audit_ai_insights_change();

-- Regeneration housekeeping: drop the patient's still-PENDING insights (never
-- the reviewed ones) so a regenerate replaces rather than accumulates. The
-- definer path re-checks the caller is provider_doctor in the patient's org —
-- the database still decides, the RPC only narrows the delete to pending rows.
create function public.supersede_pending_ai_insights(p_patient_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_org uuid;
begin
  select org_id into v_org from public.patients where id = p_patient_id;
  if v_org is null then raise exception 'ai_insight_patient_missing'; end if;
  if coalesce(private.user_org_role(v_org), '') <> 'provider_doctor' then
    raise exception 'ai_insight_supersede_forbidden';
  end if;
  delete from public.ai_insights
  where patient_id = p_patient_id and org_id = v_org and review_state = 'pending';
end;
$$;

revoke all on function public.supersede_pending_ai_insights(uuid) from anon;
grant execute on function public.supersede_pending_ai_insights(uuid) to authenticated;
