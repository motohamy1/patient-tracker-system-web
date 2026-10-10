# 20-01: The security audit sweep

**What to build:** The documented audit: auth, RLS coverage, organization isolation, sensitive data, documents, auditability, sessions, API exposure and privacy failure modes — every finding recorded with its severity, evidence and resolution.

**Blocked by:** None

**Status:** resolved

- [x] RLS coverage proven 1:1 per migration (every `create table public.` has `enable row level security`)
- [x] Organization isolation: the single membership helper in every policy/guard; the cross-parent guards (visit/session/delivery/invoice/payment/endpoint) re-derive org+patient
- [x] Sensitive data: genetics and AI/OCR gating verified at the data layer with their UI mirrors
- [x] Documents: private bucket, org-scoped object policies, signed-URL-only OCR path audited
- [x] Auditability: audit triggers verified per table; append-only tables proven write-only
- [x] Sessions/API/privacy: proxy-only refresh, `getClaims` identity reads, the server-action authorization surface, zero console logging, no analytics, no service_role in app code, `force-dynamic` on every authenticated data route
- [x] `20-SECURITY-AUDIT.md` written: seven findings (F-1 open-redirect, F-2 storage self-read, F-3..F-7 recorded), each with severity, evidence and resolution

**Gate evidence at close:** SEC-01 · SEC-02 · §3.1/§12

## Notes

- Method: static review (grep + full reads), no test suites this session — every finding is code-verifiable.
