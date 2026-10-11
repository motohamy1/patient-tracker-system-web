# Neon migration runbook

Neon (Lakebase Postgres) + Managed Neon Auth + Neon Object Storage. No Supabase
services remain.

## Architecture

| Concern | Service | Notes |
| --- | --- | --- |
| Database | Neon Postgres, branch `production` | `DATABASE_URL` (pooled, HTTP) for app reads; `DATABASE_URL_UNPOOLED` (direct) for migrations and any session-scoped write |
| Identity | Managed Neon Auth | Better Auth under the hood; users/sessions live in `neon_auth.*` on the same branch. Emails use Neon's shared SMTP — no Resend key needed |
| Files | Neon Object Storage, bucket `uploads` | S3-compatible, path-style; credentials arrive as `AWS_*` env vars |
| Compute (optional) | Neon Functions | `hello.ts` smoke function, `NEON_FUNCTION_API_BASE_URL` |

## Configuration

`neon.ts` is the infrastructure-as-code file. `neon deploy` is the alias for
`neon config apply` and reconciles the branch against it:

```bash
neon link --project-id <id> --branch production -y
neon config plan      # dry-run diff
neon deploy           # apply: auth, buckets, functions
neon neon-auth status # Auth URL + JWKS
```

`neon link` / `neon deploy` also pull the branch's env into `.env`.

## Env

```bash
DATABASE_URL=postgresql://…-pooler…?sslmode=require          # app reads
DATABASE_URL_UNPOOLED=postgresql://…?sslmode=require         # migrations / SET LOCAL
NEON_AUTH_BASE_URL=https://…neonauth…/<db>/auth
NEON_AUTH_JWKS_URL=https://…neonauth…/<db>/auth/.well-known/jwks.json
NEON_AUTH_COOKIE_SECRET=<openssl rand -base64 32>            # >= 32 chars; app config, not injected
AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY / AWS_ENDPOINT_URL_S3 / AWS_REGION
NEON_BRANCH / NEON_FUNCTION_API_BASE_URL
```

`DATABASE_URL_UNPOOLED` is required for `withAppUser`, which issues
`set_config('app.user_id', …)` inside a transaction; the PgBouncer transaction
mode behind `-pooler` discards session state.

## Schema

`neon/migrations/0000_baseline.sql` is generated from `supabase/migrations/*.sql`
by `neon/port-baseline.mjs`:

```bash
npm run db:port    # regenerate the baseline
npm run db:apply   # apply it to Neon (direct connection)
```

Port rules: `auth.users` → `neon_auth."user"` (uuid ids); `auth.uid()` →
`public.app_uid()` (reads `SET LOCAL app.user_id`); `extensions.digest(` →
`public.digest(`; `TO anon/authenticated/service_role` → `TO public`;
`storage.*` statements dropped (Neon Object Storage, enforced in app).

Managed Auth owns its own tables in `neon_auth`; do not create them by hand.
Managed Auth cannot be enabled on a project with IP Allow or Private Networking.

## Identity + enforcement posture

The app connects as the table owner, so the ported RLS policies are inert
documentation. Enforcement is:

1. **App-layer org scoping** — `resolveWorkspaceRole` picks the caller's org/role;
   every query carries an explicit `org_id = $1` predicate.
2. **Trigger guards** — provenance/audit (`created_by`/`updated_by` from
   `app_uid()`), patient-self guards, and clinical-authoring guards still
   `RAISE EXCEPTION` server-side and are preserved by the port.
3. **`withAppUser`** — writes run inside a transaction that sets `app.user_id`,
   so those triggers attribute the actor.

To restore DB-level RLS: introduce a restricted `app_user` role, transfer table
ownership, and `SET LOCAL ROLE app_user` per request.

## Dev users

Do NOT replay the Supabase-era `seed.sql` (GoTrue-only `auth.users` crypt
hashes; Managed Auth stores credentials in its own tables — the file was removed
with the rest of the Supabase CLI artifacts). Create users through the signup
flow, then insert `organizations` / `memberships` rows referencing the new uuid
ids.

## Compliance

No free tier (Neon, or any equivalent) is HIPAA/BAA-safe. `*.clinic.test`
fixtures only; real patient data needs a paid plan plus a BAA.
