# 20-02: Finding resolutions

**What to build:** The fixes the audit produced — nothing is recorded without being resolved or explicitly accepted.

**Blocked by:** 20-01 (the audit)

**Status:** resolved

- [x] **F-1 (Medium, open-redirect):** `/auth/confirm` re-validates `next` with the existing `isSafeNextPath` guard and falls back to `/` — a crafted link can no longer steer the post-verification redirect
- [x] **F-2 (Medium, documents):** migration `0018_security_hardening.sql` adds the patient self-read policy on `patient-documents`, matching the second path segment to the patient row whose `user_id` is `auth.uid()` (TEXT compare; malformed names fail closed)
- [x] **F-3 (Low, accepted):** the third path segment stays convention, not constraint — recorded so a later upload surface does not widen it silently
- [x] **F-4..F-7 (Info):** the privacy/session/secret/authorization baselines recorded as standing invariants, each with its verification

**Gate evidence at close:** SEC-01 (findings resolved) · §12

## Notes

- One migration, two code-verifiable guarantees, four recorded baselines: a hardening pass that changes only what it must.
