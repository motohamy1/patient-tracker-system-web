# Phase 20 Security Audit — findings and resolutions

**Date:** 2026-10-10 · **Phase:** 20 (Security / Audit Hardening) · **Scope:** SEC-01
(documented audit: auth, RLS, org isolation, sensitive data, documents,
auditability), SEC-02 (sessions, API exposure, privacy failure modes), SEC-03
(Phase-3 authorization guarantees regression-verified).
**Method:** static review of every migration, every `'use server'` module, every
route, the proxy/session path, storage policies, caching directives and env
exposure. No test suites were run this session (owner-directed); every finding
below is resolvable by reading the code, and each resolution is verifiable the
same way.

---

## 1. Findings

| # | Severity | Area | Finding | Resolution |
|---|---|---|---|---|
| **F-1** | **Medium** | Auth / API exposure | `/auth/confirm` redirected to the raw `next` query parameter after a successful `verifyOtp`. The mint side validated `next` (03-RESEARCH Pitfall 3), but the confirm hop is a separate trust surface — a crafted link carries its own `next`, and verification succeeds before anything redirects. | **Fixed** — `src/app/auth/confirm/route.ts` re-validates `next` with the existing `isSafeNextPath` guard (the same open-redirect rule the mint side uses) and falls back to `/`. Defence in depth: the crafted input can never steer the redirect. |
| **F-2** | **Medium** | Documents / authorization | The `patient-documents` storage bucket (0008) granted SELECT to STAFF only. A patient could not retrieve their own document objects — over-restriction, not a leak, but it silently denies a patient their own record. | **Fixed** — migration `0018_security_hardening.sql` adds `select patient-documents as self`, matching the second path segment to the patient row whose `user_id` is `auth.uid()` (TEXT compare; a malformed name fails closed). |
| **F-3** | Low | Documents / integrity | `storage_path` uniqueness is enforced (`documents_storage_path_uq`) and the upload action prefix-checks `<org>/<patient>/…`, but nothing constrains the object name's third segment. | **Accepted (documented, not a defect).** The org-scoped storage policy is the enforcement; a random third segment is the convention and the POST is authorized staff-only. Recorded so a later upload surface does not widen it silently. |
| **F-4** | Info | Privacy / PHI in logs | Zero `console.*` calls in `src/` (verified by grep across all `.ts`/`.tsx`, excluding tests). No analytics, no third-party scripts in any layout. | **No action.** Recorded as the privacy baseline; the ESLint security-plugin recommendation from the stack research remains a future option. |
| **F-5** | Info | Secrets | No `service_role` reference anywhere in application code; the only client-visible env vars are `NEXT_PUBLIC_SUPABASE_URL` and the publishable key (both are publishable by design). | **No action.** Recorded. |
| **F-6** | Info | Sessions | `src/proxy.ts` (Next 16 convention) delegates every request to `updateSession` — refresh only, no route gating, no role reads (D-06/AUTH-03). Identity is read with `auth.getClaims()` (the JWT-validating call); `getSession` appears nowhere in server code. | **No action.** Recorded. |
| **F-7** | Info | Authorization surface | Every `'use server'` module resolving a workspace calls `resolveWorkspaceRole` + a capability check (verified per file). The two auth-flow modules (`auth/actions.ts`, `auth/invite.ts`) authorize through Supabase Auth itself; `channels/workflow.ts` is deliberately not `'use server'` and is only reachable from authorized actions. | **No action.** Recorded. |

## 2. Coverage by SEC requirement

### SEC-01 — auth, RLS, organization isolation, sensitive data, documents, auditability

- **RLS coverage:** every table in `0001…0017` has row-level security enabled
  (0001's three tables in 0002). Verified by counting `create table public.` vs
  `enable row level security` per migration: 1:1 for every file.
- **Organization isolation:** the membership reader is the single private helper
  `private.user_org_role(org_id)`; every policy and every guard composes it.
  Cross-patient writes are refused structurally by the guards (visit / session /
  delivery / invoice / payment / endpoint ownership checks all re-derive the
  parent and compare org+patient).
- **Sensitive data:** genetics read is gated by `CAN_VIEW_GENETICS` mirrored
  byte-for-byte at the role level (0009); AI-extracted content carries
  provenance (0010) and OCR payloads are verification-gated (0011).
- **Documents:** private bucket with org-scoped object policies (0008), the
  patient self-read added in 0018 (F-2), signed URLs only for the OCR path.
- **Auditability:** every clinical/operational table from 0003 on has an audit
  trigger writing actor/action/entity/diff; the append-only tables
  (payments, deliveries, observations) have no update/delete grants at all.

### SEC-02 — sessions, API exposure, privacy failure modes

- **Sessions:** proxy-only refresh (F-6); no middleware gating; role resolution is
  server-side per request (`resolveWorkspaceRole`, typed RESULT — never a
  redirect), and route guards are supplementary only.
- **API exposure:** the API surface is the server-action set. Each action parses
  Zod first, then checks the capability, then writes under the caller's RLS
  scope, then revalidates. One route handler exists (`/auth/confirm`) — F-1 is
  its only finding.
- **Privacy failure modes:** no PHI in logs or analytics (F-4); no PHI in
  client state (the only localStorage use is the Phase-19 sync outbox, which
  holds a patient's own queued measurement and is labeled as device-local);
  error surfaces are the fixed no-leak copy (the §7 contract); `force-dynamic`
  on every authenticated data route so no principal's resolution is cached for
  another (the two non-dynamic pages are a pure redirect and a static empty
  shell — verified).
- **PHI in URLs:** identifiers only (UUIDs); no clinical content is ever a path
  or query value.

### SEC-03 — Phase-3 authorization guarantees, regression-verified

| Phase-3 guarantee | Verification (this audit) |
|---|---|
| Authorization resolves server-side; route guards supplementary (§3.1/§12) | `resolveWorkspaceRole` is the only resolver; every provider/patient layout calls it before render; no client gate exists (D-03 — a fake gate is worse than none). |
| `redirectForRole` applies the D-12 redirect exactly once per layout, fail-closed on unknown roles | `src/lib/auth/redirect.ts` — single `redirect()` per invocation, fail-closed on unknown role strings; both layouts call it once per request. |
| Role info is never trusted from localStorage, browser state or URL parameters | No role read from any client store anywhere in `src/` (verified by grep); capabilities derive from the server resolution only. |
| RLS is the enforcement layer, not the UI mirror | Every capability in `capabilities.ts` is documented as a UI mirror of a specific migration policy; the D-09 map is asserted exact by `tests/unit/auth-capabilities.test.ts` (owner's run). |
| Invite tokens are hashed, never stored raw; redemption is a single server action | SHA-256 digests per 0004; `redeemSignupWithInviteAction` runs signup → sign-in → RPC in one authorized action. |
| Confirmation/recovery uses `verifyOtp` exactly once; the unverified session read appears nowhere | `src/app/auth/confirm/route.ts` (F-1 hardened); `auth.getClaims()` is the identity read throughout. |

## 3. Deferred to the owner

- The pgTAP/RLS test pass against the cloud project (the enforcement proof for
  0001…0018) and the interactive role-based acceptance pass (SEC-03's
  behavioural leg) — the same split as Phases 07–19.
- `tests/unit` suite run (owner-directed: no tests this session).
- The role-based acceptance re-run across the five roles after 0018's storage
  policy changes (a patient reading their own document object is now legal).
