-- Migration 0001: organizations, memberships, invitations (phase 03, plan 02)
-- D-01 owner-creates-org bootstrap; D-02 app-generates/human-sends invitations
-- (distinct org invites: no patient-specific columns); D-10 exactly one role per
-- (user, org) via unique(org_id, user_id); AUTH-02 access only via explicit
-- membership records; PRODUCT-MASTER-SPEC.md §13 relational model
-- Organization -> Membership -> User and the invitation object.
--
-- The five role strings in the check constraints are the PERMANENT canonical
-- vocabulary; src/lib/auth/roles.ts (plan 03-03) mirrors them verbatim. Do not
-- clip, rename or reorder without reading plan 03-03.
--
-- memberships(user_id) gets a standalone btree: the unique(org_id, user_id)
-- composite does not serve a user_id-leading filter and the RLS policy on
-- memberships filters by user_id (Pitfall 8).
-- invitations stores ONLY the SHA-256 digest of the invite token; the raw token
-- is never persisted, so a database read cannot mint redeemable invites.

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

create table public.memberships (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (
    role in ('provider_doctor', 'nurse', 'receptionist', 'patient', 'admin_owner')
  ),
  created_at timestamptz not null default now(),
  unique (org_id, user_id)
);

create index memberships_user_id_idx on public.memberships using btree (user_id);

create table public.invitations (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  role text not null check (
    role in ('provider_doctor', 'nurse', 'receptionist', 'patient', 'admin_owner')
  ),
  token_digest text not null unique,
  short_code text unique,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  expires_at timestamptz,
  redeemed_at timestamptz,
  redeemed_by uuid references auth.users(id)
);
