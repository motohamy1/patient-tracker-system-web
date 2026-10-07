-- Migration 0004: redeem_invite + remove_membership security-definer functions
-- (phase 03, plan 05). AUTH-02 instant invite redemption; D-01..D-04 invite
-- onboarding; D-15-consistent owner-only delete authority.
--
-- digest() comes from pgcrypto (pre-installed in the extensions schema on the
-- local stack — extensions.digest qualified explicitly because both functions
-- run with set search_path = '').
--
-- redeem_invite is the ONLY membership-insert path for invitees (no direct
-- memberships insert grant exists since 03-02) and remove_membership is the
-- ONLY memberships delete path (no delete grant/policy). The 0003 audit
-- triggers fire inside both function bodies, producing the AUTH-06/D-14 audit
-- rows with no app write path.
--
-- No-leak discipline: an invalid, expired, redeemed, or deleted invitation
-- raises the SAME constant 'invite_invalid'; a caller whose own membership row
-- is missing in the target org and a cross-org target both raise the SAME
-- 'membership_operation_failed' — neither function reveals whether the org,
-- target row, or token existed.

create or replace function public.redeem_invite(p_raw_token text)
returns json
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_digest text;
  v_invitation public.invitations%rowtype;
  v_org_name text;
begin
  if v_uid is null then
    raise exception 'invite_invalid';
  end if;

  v_digest := encode(extensions.digest(p_raw_token, 'sha256'), 'hex');

  select * into v_invitation
  from public.invitations
  where token_digest = v_digest
    and redeemed_at is null
    and (expires_at is null or expires_at > now());

  if not found then
    raise exception 'invite_invalid';
  end if;

  insert into public.memberships (org_id, user_id, role)
  values (v_invitation.org_id, v_uid, v_invitation.role);

  update public.invitations
  set redeemed_at = now(), redeemed_by = v_uid
  where id = v_invitation.id;

  select name into v_org_name
  from public.organizations
  where id = v_invitation.org_id;

  return json_build_object(
    'organization', v_org_name,
    'orgId', v_invitation.org_id,
    'role', v_invitation.role
  );
end;
$$;

create or replace function public.remove_membership(p_membership_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_target public.memberships%rowtype;
  v_actor_role text;
  v_admin_count int;
begin
  select * into v_target
  from public.memberships
  where id = p_membership_id;

  if not found then
    raise exception 'membership_operation_failed';
  end if;

  select role into v_actor_role
  from public.memberships
  where org_id = v_target.org_id and user_id = v_uid;

  if not found then
    raise exception 'membership_operation_failed';
  end if;

  if v_actor_role <> 'admin_owner' then
    raise exception 'membership_forbidden';
  end if;

  if v_target.role = 'admin_owner' then
    select count(*) into v_admin_count
    from public.memberships
    where org_id = v_target.org_id and role = 'admin_owner';

    if v_admin_count <= 1 then
      raise exception 'membership_last_admin';
    end if;
  end if;

  delete from public.memberships where id = p_membership_id;
end;
$$;

revoke execute on function public.redeem_invite(text) from public, anon;
revoke execute on function public.remove_membership(uuid) from public, anon;
grant execute on function public.redeem_invite(text) to authenticated;
grant execute on function public.remove_membership(uuid) to authenticated;
