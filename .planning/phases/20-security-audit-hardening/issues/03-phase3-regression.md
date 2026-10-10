# 20-03: Phase-3 authorization regression verification

**What to build:** The regression leg: every Phase-3 authorization guarantee re-verified against the code as it now stands, in a table a reviewer can check line by line.

**Blocked by:** 20-01 (the audit)

**Status:** resolved

- [x] Server-side resolution is the only resolver; both layouts call it before render; no client gate exists
- [x] `redirectForRole` applies D-12 exactly once per layout, fail-closed on unknown roles
- [x] No role read from localStorage, browser state or URL parameters anywhere in `src/`
- [x] RLS is the enforcement layer; every capability is its documented UI mirror; the D-09 map is asserted exact by the capability test
- [x] Invite tokens hashed; redemption is one authorized action
- [x] `verifyOtp` exactly once; the unverified session read appears nowhere
- [x] The regression table recorded in `20-SECURITY-AUDIT.md` §2/SEC-03 with the code reference for each guarantee

**Gate evidence at close:** SEC-03 · §3.1/§12

## Notes

- The behavioural leg (the five-role acceptance pass after 0018) is the owner's; this ticket is the static regression.
