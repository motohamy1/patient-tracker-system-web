# 10-05: Phase proof — verify allergies + genetics and record it

**What to build:** `10-VERIFICATION.md` recording the ALG-01..03 trace, the QA/INV sweep, the role-visibility matrix (which role sees what, and where it is enforced), added invariants (closed severity/significance vocabularies), and the deferral list.

**Blocked by:** 10-01, 10-02, 10-03, 10-04

**Status:** ready-for-human

- [ ] `10-VERIFICATION.md` written: ALG-01..03 trace, 12-row QA gate, INV-01…17 sweep
- [ ] Role-visibility matrix: for each of the four staff roles + patient, which records are readable, and the exact enforcement point (RLS policy + capability mirror + page denial)
- [ ] Provenance statement: source/verification/creator/timestamps present; AI-extracted distinguishable
- [ ] Out-of-scope recorded: timeline projection not requested by ALG (decision, not omission)
- [ ] Deferrals listed: migration 0009 apply + RLS/pgTAP on cloud Supabase, `database.types.ts` regeneration, owner test pass, visual baselines
- [ ] A passing build is not acceptance (§20.7)

**Gate evidence at close:** all ALG rows · 12 QA rows · INV sweep · role matrix · deferral list
