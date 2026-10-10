# Phase 20: Security / Audit Hardening — Verification

**Date:** 2026-10-10 · **Executed via:** GSD tickets 20-01…20-04 under
`.planning/phases/20-security-audit-hardening/issues/`.
**Session constraints (owner-directed):** **no test suites run**, **no commits** — the
owner runs the test pass and commits per phase. Verification here is tsc + the
token/lint gate; the security findings are code-verifiable and were resolved in
code/migration this session.

---

## 1. Evidence

| Gate | Command | Result |
|---|---|---|
| Types | `npx tsc --noEmit` | **0 errors** (after the F-1 fix) |
| Lint / tokens | `npm run lint` | **exit 0** |
| RLS coverage | per-migration `create table` vs `enable row level security` | **1:1 in all 18 files** |
| PHI in logs | `console.*` across `src/` | **zero** |
| service_role in app code | grep | **zero** |
| Test suite / build | — | **not run (owner-directed)** |
| Migration | `supabase/migrations/0018_security_hardening.sql` | written (F-2); **apply + pgTAP deferred** |

## 2. The findings (from `20-SECURITY-AUDIT.md`)

| # | Sev | Finding | Resolution |
|---|---|---|---|
| F-1 | Medium | `/auth/confirm` redirected to the raw `next` after `verifyOtp` (a crafted link carries its own `next`) | **Fixed** — re-validated with `isSafeNextPath`, fallback `/` |
| F-2 | Medium | `patient-documents` bucket was staff-only; a patient could not read their own objects | **Fixed** — 0018's self-read policy, path-segment match, malformed names fail closed |
| F-3 | Low | The object name's third segment is convention, not constraint | Accepted + recorded |
| F-4..F-7 | Info | Zero PHI logging · no service_role · proxy-only sessions · the full action surface authorized | Recorded as standing baselines |

## 3. Requirement traceability (SEC-01…03)

| Req | Tickets | Evidence |
|---|---|---|
| **SEC-01** a documented security audit covering auth, RLS, org isolation, sensitive data, documents, and auditability with findings resolved | 20-01, 20-02 | `20-SECURITY-AUDIT.md`: coverage per area with the verification method stated; seven findings recorded, two fixed this session (F-1 in code, F-2 in migration), one accepted with a rationale, four baselines recorded. RLS coverage proven 1:1 across all 18 migrations; org isolation verified through the single membership helper and the cross-parent guards. |
| **SEC-02** session behavior, API exposure, and privacy failure modes audited (including no PHI in logs/analytics) | 20-01, 20-02 | Proxy-only refresh (no route gating, no role reads); `auth.getClaims()` identity reads with `getSession` absent from server code; the server-action surface authorized per module; zero console logging, zero analytics/third-party scripts, no service_role; `force-dynamic` on every authenticated data route (the two exceptions verified as a pure redirect and a static empty shell). |
| **SEC-03** all Phase-3 authorization guarantees still hold (regression-verified) | 20-03 | The regression table in the audit: server-side-only resolution, D-12's exactly-once fail-closed redirect, no client role trust, RLS-as-enforcement with capabilities as documented UI mirrors, hashed invite tokens, single `verifyOtp`. |

## 4. Decisions reported

- **A hardening pass changes only what it must.** One migration and one route
  guarded; four findings recorded as baselines rather than "fixed" into churn.
- **The storage self-read compares TEXT, not UUID** — a malformed object name
  fails the policy instead of raising a cast error inside RLS.
- **Over-restriction is a finding too.** Denying a patient their own document
  object is not a leak, but it is a silent authorization defect; it is recorded
  and fixed as one.
- **No test suites this session (owner-directed).** The audit's method is
  static review; the enforcement proof (pgTAP) and the behavioural passes are
  the owner's, listed in §5.

## 5. Deferred (owner constraints)

- Migration 0018 apply + pgTAP (the self-read policy reads only the patient's
  own; foreign and malformed names fail closed).
- The five-role acceptance re-run after 0018 (patient self-read is newly legal;
  staff behaviour unchanged).
- The unit suite and production build (owner-directed: no tests this session);
  last full green was Phase 15.

## 6. Gate status

**Implementation: GREEN** for the gates run (tsc 0, token/lint exit 0, SEC-01…03
traced, F-1/F-2 resolved in code/migration). **Phase acceptance: PENDING** the §5
deferrals (§20.7).
